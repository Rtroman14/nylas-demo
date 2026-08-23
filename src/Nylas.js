/**
 * Every Nylas v3 email operation this app needs, in one module.
 *
 *   import Nylas from "./Nylas.js";
 *   await Nylas.messages.send({ to: "a@b.com", subject: "Hi", body: "Hello" });
 *
 * Built on the official `nylas` SDK, which is what Nylas tells coding agents to
 * use. A few endpoints have no SDK resource (signatures, most notably), so
 * `request()` drops to the SDK's HTTP client for those rather than pulling in a
 * second way of talking to the API.
 *
 * Every function takes an optional `grantId`. It falls back to the grant stored
 * by the connect flow, then to NYLAS_GRANT_ID. Pass it explicitly once you're
 * acting for a specific user's mailbox.
 *
 * IMPORTANT — casing: the SDK converts responses to camelCase, so a message
 * comes back with `threadId`, not `thread_id`. Webhook notifications do NOT go
 * through the SDK, so they arrive as raw snake_case. Read the field that
 * matches where the object came from.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import NylasSDK from "nylas";
import config from "./config.js";

class NylasDemoError extends Error {
    constructor(message, { status, body, path: reqPath } = {}) {
        super(message);
        this.name = "NylasDemoError";
        this.status = status;
        this.body = body;
        this.path = reqPath;
    }
}

let client = null;

/** One shared client. Built lazily so importing this module never throws. */
const sdk = () => {
    if (!config.apiKey) {
        throw new NylasDemoError("No API key. Set NYLAS_API_KEY in .env.", { status: 401 });
    }
    if (!client) {
        client = new NylasSDK({ apiKey: config.apiKey, apiUri: config.apiUri });
    }
    return client;
};

// Set by the connect flow so callers don't have to thread a grant ID through
// every call. store.js owns the persisted copy; this is just the cached value.
let activeGrantId = "";

const setActiveGrant = (grantId) => {
    activeGrantId = grantId || "";
};

const currentGrantId = () => activeGrantId || config.fallbackGrantId || "";

const requireGrant = (grantId) => {
    const id = grantId || currentGrantId();
    if (!id) {
        throw new NylasDemoError(
            "No grant. Connect a mailbox at / first, or set NYLAS_GRANT_ID in .env.",
            { status: 400 }
        );
    }
    return id;
};

/**
 * Escape hatch for endpoints with no SDK resource. Same auth, base URL, and
 * error handling as every other call.
 *
 * Note this still camelCases the response, exactly like the typed resources.
 */
const request = async ({ method, path: reqPath, body, queryParams, headers }) => {
    try {
        return await sdk().apiClient.request({
            method,
            path: reqPath,
            body,
            queryParams,
            headers,
        });
    } catch (err) {
        // The SDK throws NylasApiError with the useful part nested; surface it
        // so callers see "Invalid signature ID" instead of "Request failed".
        const detail = err?.message || String(err);
        throw new NylasDemoError(`${method} ${reqPath} failed: ${detail}`, {
            status: err?.statusCode ?? err?.status,
            body: err?.body ?? err,
            path: reqPath,
        });
    }
};

/**
 * Accepts "a@b.com", { name, email }, or an array of either, and returns the
 * [{ name, email }] shape the API wants. Lets callers stay casual.
 */
const toAddresses = (input) => {
    if (!input) return undefined;
    const list = Array.isArray(input) ? input : [input];
    const out = list
        .map((entry) => {
            if (typeof entry === "string") return { email: entry.trim() };
            if (entry?.email) {
                return { email: entry.email.trim(), ...(entry.name ? { name: entry.name } : {}) };
            }
            return null;
        })
        .filter(Boolean);
    return out.length ? out : undefined;
};

/* ------------------------------------------------------------------ auth --- */

const auth = {
    /**
     * The URL to send a user to so they can connect their mailbox.
     *
     * `redirectUri` must match a callback URI registered on the application in
     * the Nylas dashboard, character for character, or Nylas rejects the request.
     */
    urlFor({ provider, loginHint, state } = {}) {
        if (!config.clientId) {
            throw new NylasDemoError("No client ID. Set NYLAS_CLIENT_ID in .env.", { status: 400 });
        }

        const chosen = provider ?? config.authProvider;

        return sdk().auth.urlForOAuth2({
            clientId: config.clientId,
            redirectUri: config.callbackUri,
            // Omitted entirely when blank so Nylas shows its own provider picker.
            ...(chosen ? { provider: chosen } : {}),
            ...(loginHint ? { loginHint } : {}),
            ...(state ? { state } : {}),
        });
    },

    /**
     * Trade the one-time `code` from the callback for a grant.
     *
     * The code burns on use: if this call fails, restart the flow rather than
     * retrying with the same code.
     */
    async exchangeCode(code) {
        if (!code) throw new NylasDemoError("No authorization code.", { status: 400 });

        const res = await sdk().auth.exchangeCodeForToken({
            clientId: config.clientId,
            redirectUri: config.callbackUri,
            code,
        });

        return { grantId: res.grantId, email: res.email, provider: res.provider };
    },
};

/* ---------------------------------------------------------------- grants --- */

const grants = {
    async get(grantId) {
        const res = await sdk().grants.find({ grantId: requireGrant(grantId) });
        return res.data;
    },

    async list({ limit = 20, ...queryParams } = {}) {
        const res = await sdk().grants.list({ queryParams: { limit, ...queryParams } });
        return res.data ?? [];
    },

    /**
     * Permanently delete a grant and everything Nylas synced for it.
     *
     * This is the right call for a user-initiated "disconnect". It is the wrong
     * way to fix an auth error — re-run the OAuth flow for that, which refreshes
     * the existing grant and keeps its data.
     */
    async remove(grantId) {
        await sdk().grants.destroy({ grantId: requireGrant(grantId) });
        if (!grantId || grantId === activeGrantId) setActiveGrant("");
        return { deleted: true };
    },

    /** The mailbox's own address. Used to tell our sends apart from real replies. */
    async email(grantId) {
        const grant = await grants.get(grantId);
        return grant?.email;
    },
};

/* -------------------------------------------------------------- messages --- */

const messages = {
    /**
     * Send an email.
     *
     * The interesting optional arguments:
     *   attachments      [{ filename, contentType, content }] — see `attachments.fromFile`.
     *                    The SDK base64-encodes them, and switches to multipart
     *                    automatically once the payload passes 3MB.
     *   signatureId      Nylas appends the stored signature server-side. HTML bodies
     *                    only; a plaintext body gets no signature.
     *   replyToMessageId Threads this message under an existing one.
     *   idempotencyKey   Dedupes retries for 1 hour. Max 256 chars.
     *   trackingOptions  { opens, links, threadReplies, label }
     *
     * @returns the sent message, including `id` and `threadId`.
     */
    async send({
        to,
        subject,
        body,
        cc,
        bcc,
        replyTo,
        replyToMessageId,
        signatureId,
        attachments: files,
        trackingOptions,
        sendAt,
        idempotencyKey,
        grantId,
    } = {}) {
        const recipients = toAddresses(to);
        if (!recipients) throw new NylasDemoError("`to` is required.", { status: 400 });
        if (body === undefined) throw new NylasDemoError("`body` is required.", { status: 400 });

        const requestBody = {
            to: recipients,
            subject: subject ?? "",
            body,
            ...(toAddresses(cc) ? { cc: toAddresses(cc) } : {}),
            ...(toAddresses(bcc) ? { bcc: toAddresses(bcc) } : {}),
            ...(toAddresses(replyTo) ? { replyTo: toAddresses(replyTo) } : {}),
            ...(replyToMessageId ? { replyToMessageId } : {}),
            ...(signatureId ? { signatureId } : {}),
            ...(files?.length ? { attachments: files } : {}),
            ...(trackingOptions ? { trackingOptions } : {}),
            ...(sendAt ? { sendAt } : {}),
        };

        if (idempotencyKey && idempotencyKey.length > 256) {
            throw new NylasDemoError("`idempotencyKey` must be 256 characters or fewer.", {
                status: 400,
            });
        }

        const res = await sdk().messages.send({
            identifier: requireGrant(grantId),
            requestBody,
            ...(idempotencyKey
                ? { overrides: { headers: { "Idempotency-Key": idempotencyKey } } }
                : {}),
        });

        return res.data;
    },

    /**
     * Reply inside an existing thread.
     *
     * `replyToMessageId` is what actually threads it — Nylas derives the
     * In-Reply-To and References headers from that message. Subject defaults to
     * "Re: <original>" when you don't pass one.
     *
     * Pass `to` explicitly when replying to a message you sent: its `from` is
     * your own mailbox, so resolving recipients from it would mail you back.
     */
    async reply({ messageId, body, subject, to, grantId, ...rest } = {}) {
        if (!messageId) {
            throw new NylasDemoError("`messageId` is required to reply.", { status: 400 });
        }

        let resolvedTo = toAddresses(to);
        let resolvedSubject = subject;

        if (!resolvedTo || !resolvedSubject) {
            const original = await messages.get(messageId, { grantId });

            if (!resolvedTo) {
                const ourEmail = (await grants.email(grantId))?.toLowerCase();
                const everyone = [...(original.from ?? []), ...(original.to ?? [])];

                const seen = new Set();
                resolvedTo = everyone.filter((addr) => {
                    const key = addr.email?.toLowerCase();
                    if (!key || key === ourEmail || seen.has(key)) return false;
                    seen.add(key);
                    return true;
                });

                // If we filtered everyone out, the thread is with ourselves.
                if (!resolvedTo.length) resolvedTo = original.from;
            }

            if (!resolvedSubject) {
                const original_subject = original.subject ?? "";
                resolvedSubject = /^re:/i.test(original_subject)
                    ? original_subject
                    : `Re: ${original_subject}`;
            }
        }

        return messages.send({
            to: resolvedTo,
            subject: resolvedSubject,
            body,
            replyToMessageId: messageId,
            grantId,
            ...rest,
        });
    },

    /**
     * List messages.
     *
     * Useful filters: `threadId`, `unread`, `starred`, `from`, `to`, `subject`
     * (case-sensitive, partial), `hasAttachment`, `in` (folder ID, not a name),
     * `receivedAfter`, `receivedBefore`, `searchQueryNative`.
     *
     * Shrink the payload with `select` (comma-separated fields) or
     * `fields: "include_basic_headers"` when you only need threading headers.
     *
     * @returns { data, nextCursor } — pass nextCursor back as `pageToken`.
     */
    async list({ limit = 20, grantId, ...queryParams } = {}) {
        const res = await sdk().messages.list({
            identifier: requireGrant(grantId),
            queryParams: { limit, ...queryParams },
        });
        return { data: res.data ?? [], nextCursor: res.nextCursor };
    },

    async get(messageId, { grantId, ...queryParams } = {}) {
        const res = await sdk().messages.find({
            identifier: requireGrant(grantId),
            messageId,
            ...(Object.keys(queryParams).length ? { queryParams } : {}),
        });
        return res.data;
    },

    /**
     * Strip quoted replies, forwards, and signatures from message bodies.
     *
     * Takes up to 20 IDs at a time. The cleaned text comes back on a
     * `conversation` field alongside the original message.
     */
    async clean(messageIds, { grantId, ...options } = {}) {
        const ids = Array.isArray(messageIds) ? messageIds : [messageIds];
        if (!ids.length) throw new NylasDemoError("At least one message ID.", { status: 400 });
        if (ids.length > 20) {
            throw new NylasDemoError("Clean accepts at most 20 message IDs.", { status: 400 });
        }

        const res = await sdk().messages.cleanMessages({
            identifier: requireGrant(grantId),
            requestBody: { messageId: ids, ...options },
        });
        return res.data ?? [];
    },

    async update(messageId, changes = {}, { grantId } = {}) {
        const res = await sdk().messages.update({
            identifier: requireGrant(grantId),
            messageId,
            requestBody: changes,
        });
        return res.data;
    },

    markRead(messageId, opts) {
        return messages.update(messageId, { unread: false }, opts);
    },

    markUnread(messageId, opts) {
        return messages.update(messageId, { unread: true }, opts);
    },

    async remove(messageId, { grantId } = {}) {
        await sdk().messages.destroy({ identifier: requireGrant(grantId), messageId });
        return { deleted: true };
    },
};

/* --------------------------------------------------------------- threads --- */

const threads = {
    async list({ limit = 20, grantId, ...queryParams } = {}) {
        const res = await sdk().threads.list({
            identifier: requireGrant(grantId),
            queryParams: { limit, ...queryParams },
        });
        return { data: res.data ?? [], nextCursor: res.nextCursor };
    },

    async get(threadId, { grantId } = {}) {
        const res = await sdk().threads.find({ identifier: requireGrant(grantId), threadId });
        return res.data;
    },

    /**
     * Every message in a thread, bodies included.
     *
     * The threads endpoint returns `messageIds` and metadata but not bodies, so
     * reading a conversation means coming back through messages.
     */
    async messagesIn(threadId, { grantId, limit = 50 } = {}) {
        const { data } = await messages.list({ threadId, limit, grantId });
        return data;
    },
};

/* ----------------------------------------------------------- attachments --- */

const attachments = {
    /** Build the attachment object `messages.send` wants from a file on disk. */
    fromFile(filePath) {
        const content = fs.readFileSync(filePath);
        return attachments.fromBuffer(content, path.basename(filePath));
    },

    /** Same, for bytes already in memory — an upload, say. */
    fromBuffer(buffer, filename, contentType) {
        return {
            filename,
            contentType: contentType || attachments.contentTypeFor(filename),
            content: buffer.toString("base64"),
            size: buffer.length,
        };
    },

    /** Enough of a lookup for the file types this demo sends. */
    contentTypeFor(filename) {
        const ext = path.extname(filename).toLowerCase();
        const types = {
            ".pdf": "application/pdf",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".csv": "text/csv",
            ".txt": "text/plain",
            ".ics": "text/calendar",
            ".json": "application/json",
            ".zip": "application/zip",
        };
        return types[ext] || "application/octet-stream";
    },

    /** Metadata only. `messageId` is required by the API, not optional. */
    async metadata(attachmentId, messageId, { grantId } = {}) {
        const res = await sdk().attachments.find({
            identifier: requireGrant(grantId),
            attachmentId,
            queryParams: { messageId },
        });
        return res.data;
    },

    /** The bytes, as a Buffer. */
    async download(attachmentId, messageId, { grantId } = {}) {
        return sdk().attachments.downloadBytes({
            identifier: requireGrant(grantId),
            attachmentId,
            queryParams: { messageId },
        });
    },
};

/* ------------------------------------------------------------ signatures --- */

/**
 * Signatures live on Nylas, not on the provider — Nylas never reads the
 * signature already configured in Gmail or Outlook. Create one here, then pass
 * its ID to `messages.send`.
 *
 * Limits: 10 per grant, 100KB each, HTML only, one per message. Images have to
 * be hosted elsewhere and referenced by URL.
 *
 * The SDK has no signatures resource, so these go through `request()`.
 */
const signatures = {
    async list({ grantId } = {}) {
        const res = await request({
            method: "GET",
            path: `/v3/grants/${requireGrant(grantId)}/signatures`,
        });
        return res.data ?? [];
    },

    async get(signatureId, { grantId } = {}) {
        const res = await request({
            method: "GET",
            path: `/v3/grants/${requireGrant(grantId)}/signatures/${signatureId}`,
        });
        return res.data;
    },

    async create({ name, body, grantId } = {}) {
        if (!name || !body) {
            throw new NylasDemoError("`name` and `body` are required.", { status: 400 });
        }
        const res = await request({
            method: "POST",
            path: `/v3/grants/${requireGrant(grantId)}/signatures`,
            body: { name, body },
        });
        return res.data;
    },

    async update(signatureId, changes = {}, { grantId } = {}) {
        const res = await request({
            method: "PUT",
            path: `/v3/grants/${requireGrant(grantId)}/signatures/${signatureId}`,
            body: changes,
        });
        return res.data;
    },

    async remove(signatureId, { grantId } = {}) {
        await request({
            method: "DELETE",
            path: `/v3/grants/${requireGrant(grantId)}/signatures/${signatureId}`,
        });
        return { deleted: true };
    },
};

/* --------------------------------------------------------------- folders --- */

const folders = {
    async list({ grantId, ...queryParams } = {}) {
        const res = await sdk().folders.list({
            identifier: requireGrant(grantId),
            ...(Object.keys(queryParams).length ? { queryParams } : {}),
        });
        return res.data ?? [];
    },
};

/* -------------------------------------------------------------- webhooks --- */

/**
 * Webhooks are application-scoped: they use the API key and have no grant.
 */
const webhooks = {
    async list() {
        const res = await sdk().webhooks.list();
        return res.data ?? [];
    },

    /**
     * `webhookUrl` must be public HTTPS. Nylas immediately GETs it with a
     * `challenge` param and only creates the webhook if you echo it back.
     */
    async create({ webhookUrl, triggerTypes, description, notificationEmailAddresses } = {}) {
        if (!webhookUrl) throw new NylasDemoError("`webhookUrl` is required.", { status: 400 });

        const res = await sdk().webhooks.create({
            requestBody: {
                webhookUrl,
                triggerTypes: triggerTypes ?? [...DEFAULT_TRIGGERS],
                description: description ?? "nylas-demo",
                ...(notificationEmailAddresses ? { notificationEmailAddresses } : {}),
            },
        });
        // The webhook secret is returned once, at creation. Save it now.
        return res.data;
    },

    async remove(webhookId) {
        await sdk().webhooks.destroy({ webhookId });
        return { deleted: true };
    },

    async sendTestEvent({ webhookUrl, triggerType = "message.created" } = {}) {
        return request({
            method: "POST",
            path: "/v3/webhooks/mock-payload",
            body: { webhookUrl, triggerType },
        });
    },

    /**
     * Nylas signs the raw request body with the endpoint's webhook secret:
     *   x-nylas-signature = hex(HMAC-SHA256(rawBody, webhookSecret))
     *
     * Verify against the exact bytes received. Re-serializing the parsed JSON
     * changes them and the check fails. On a gzipped delivery, verify before
     * decompressing.
     */
    verifySignature(rawBody, receivedSignature, secret = config.webhookSecret) {
        if (!secret) return { status: "skipped" };
        if (!receivedSignature) return { status: "missing" };

        const expected = crypto
            .createHmac("sha256", secret)
            .update(rawBody ?? Buffer.alloc(0))
            .digest("hex");

        const a = Buffer.from(receivedSignature, "utf8");
        const b = Buffer.from(expected, "utf8");
        const valid = a.length === b.length && crypto.timingSafeEqual(a, b);

        return { status: valid ? "valid" : "invalid" };
    },
};

/**
 * What this demo subscribes to.
 *
 * message.created fires for mail arriving AND for our own sends, so handlers
 * have to tell them apart. The send_* pair reports what happened after Nylas
 * handed the message to the provider.
 */
const DEFAULT_TRIGGERS = [
    "message.created",
    "message.updated",
    "message.send_success",
    "message.send_failed",
    "message.opened",
    "message.link_clicked",
    "grant.created",
    "grant.deleted",
    "grant.expired",
];

/**
 * Nylas appends suffixes to the trigger name when it alters the payload:
 *   .truncated    body stripped because the payload passed 1MB — re-query it
 *   .transformed  dashboard field customization is on
 *   .cleaned      Clean Conversations output, body is markdown
 *   .metadata     Google grant limited to the gmail.metadata scope
 *
 * They combine, so `message.created.cleaned.truncated` is a real type. Match on
 * the base and read the flags separately.
 */
const SUFFIXES = ["truncated", "transformed", "cleaned", "metadata"];

const parseTriggerType = (type = "") => {
    const parts = type.split(".");
    const flags = new Set();

    while (parts.length > 2 && SUFFIXES.includes(parts.at(-1))) {
        flags.add(parts.pop());
    }

    return {
        base: parts.join("."),
        truncated: flags.has("truncated"),
        transformed: flags.has("transformed"),
        cleaned: flags.has("cleaned"),
        metadataOnly: flags.has("metadata"),
    };
};

const Nylas = {
    auth,
    grants,
    messages,
    threads,
    attachments,
    signatures,
    folders,
    webhooks,
    request,
    toAddresses,
    parseTriggerType,
    setActiveGrant,
    currentGrantId,
    DEFAULT_TRIGGERS,
    NylasDemoError,
};

export default Nylas;
export {
    auth,
    grants,
    messages,
    threads,
    attachments,
    signatures,
    folders,
    webhooks,
    request,
    parseTriggerType,
    setActiveGrant,
    currentGrantId,
    DEFAULT_TRIGGERS,
    NylasDemoError,
};
