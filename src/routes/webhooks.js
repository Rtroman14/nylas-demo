/**
 * The webhook listener.
 *
 *   GET  /webhooks/nylas  -> challenge handshake
 *   POST /webhooks/nylas  -> notifications
 *
 * This is the half of the loop that tells you a lead replied. The send side
 * writes the thread ID down (see store.trackThread); this side matches inbound
 * mail against it.
 *
 * Webhook payloads do NOT come through the SDK, so fields are raw snake_case
 * here (`thread_id`, `grant_id`) — unlike everywhere else in this codebase.
 */
import express from "express";
import Nylas from "../Nylas.js";
import store from "../store.js";
import feed from "../events.js";
import config from "../config.js";

const router = express.Router();

/**
 * Nylas GETs this URL when you create the webhook and whenever you reactivate
 * it. Echo the challenge back verbatim — no quotes, no JSON wrapper — within
 * 10 seconds. Nylas does not retry a failed verification: if this check fails,
 * the webhook stays broken and you have to create a new one.
 */
router.get("/webhooks/nylas", (req, res) => {
    const { challenge } = req.query;

    if (typeof challenge === "string") {
        feed.push("webhook", "Challenge handshake completed", { challenge });
        return res.status(200).type("text/plain").send(challenge);
    }

    res.status(200).type("text/plain").send("Nylas webhook endpoint is up.");
});

/** Notification delivery. */
router.post("/webhooks/nylas", (req, res) => {
    const signature = Nylas.webhooks.verifySignature(
        req.rawBody,
        req.get("x-nylas-signature")
    );

    if (
        config.requireValidSignature &&
        signature.status !== "valid" &&
        signature.status !== "skipped"
    ) {
        feed.push("error", `Rejected webhook — signature ${signature.status}`);
        return res.status(401).send("Invalid signature");
    }

    // Ack before doing any work. Nylas allows 10 seconds and retries 3 times
    // with exponential backoff on anything that isn't a 200.
    res.status(200).send();

    handleNotification(req.body ?? {}, signature.status).catch((err) => {
        feed.push("error", `Webhook handler failed: ${err.message}`);
    });
});

const handleNotification = async (body, signatureStatus) => {
    const { base, truncated, cleaned, transformed } = Nylas.parseTriggerType(body.type);
    const object = body.data?.object ?? {};

    feed.push("webhook", `${body.type ?? "unknown"}`, {
        signature: signatureStatus,
        deliveryAttempt: body.webhook_delivery_attempt,
        flags: { truncated, cleaned, transformed },
        object: summarize(object),
    });

    if (base === "message.created") {
        await handleInboundMessage(object, { truncated });
        return;
    }

    if (base === "message.send_success") {
        feed.push("sent", `Provider accepted message ${object.id ?? ""}`.trim());
        return;
    }

    if (base === "message.send_failed") {
        feed.push("error", `Send failed: ${object.error ?? "unknown reason"}`, object);
        return;
    }

    if (base === "message.opened") {
        feed.push("info", `Recipient opened message ${object.message_id ?? object.id ?? ""}`.trim());
        return;
    }

    if (base === "message.link_clicked") {
        feed.push("info", `Recipient clicked a link in ${object.message_id ?? object.id ?? ""}`.trim());
        return;
    }

    if (base === "grant.expired") {
        feed.push(
            "error",
            `Grant ${object.grant_id ?? ""} expired — the user must re-authenticate. `.trim() +
                "Re-run the OAuth flow; do not delete the grant."
        );
    }
};

/** Out-of-office autoresponders look like replies but aren't. */
const AUTO_REPLY_RE =
    /^\s*(re:\s*)?(automatic reply|auto(matic)?[- ]?response|out of (the )?office|undeliverable|delivery status notification)/i;

/**
 * Decide whether an inbound message is a reply to a conversation we started.
 *
 * message.created fires for our own sends too, so the first job is working out
 * which direction this message went.
 */
const handleInboundMessage = async (object, { truncated }) => {
    let message = object;

    // A truncated payload has had its body stripped to fit under 1MB. The IDs
    // survive, so re-read the message when the body actually matters.
    if (truncated && object.id) {
        try {
            message = { ...object, ...toSnake(await Nylas.messages.get(object.id)) };
        } catch (err) {
            feed.push("error", `Could not re-query truncated message: ${err.message}`);
        }
    }

    const threadId = message.thread_id;
    const sender = message.from?.[0]?.email;
    const subject = message.subject ?? "";

    if (!sender) return;

    // Our own send echoing back. Track the thread so a later reply matches.
    const grant = store.getGrant();
    if (grant?.email && sender.toLowerCase() === grant.email.toLowerCase()) {
        store.trackThread(threadId, { messageId: message.id, subject });
        feed.push("info", `Our own send on thread ${threadId ?? "?"} — tracking it.`);
        return;
    }

    if (AUTO_REPLY_RE.test(subject)) {
        feed.push("info", `Auto-reply from ${sender}, ignoring.`);
        return;
    }

    const tracked = store.getThread(threadId);
    if (!tracked) {
        feed.push("info", `New mail from ${sender} on an untracked thread.`, {
            threadId,
            subject,
        });
        return;
    }

    // This is the event a sequence app acts on: a real human replied to
    // something we sent, on a thread we know about.
    store.recordReply(threadId, message.id);

    feed.push("reply", `REPLY from ${sender} on "${tracked.subject ?? subject}"`, {
        threadId,
        messageId: message.id,
        from: sender,
        subject,
        snippet: message.snippet,
    });
};

/** Keep the event feed readable — full payloads bury everything else. */
const summarize = (object) => {
    if (!object || typeof object !== "object") return object;

    const addrs = (list) => (list ?? []).map((a) => a.email).filter(Boolean);

    return {
        id: object.id,
        object: object.object,
        threadId: object.thread_id,
        subject: object.subject,
        from: addrs(object.from),
        to: addrs(object.to),
        snippet: object.snippet,
        unread: object.unread,
        attachments: object.attachments?.length,
    };
};

/** The SDK camelCases responses; webhook code reads snake_case. Bridge them. */
const toSnake = (value) => {
    if (Array.isArray(value)) return value.map(toSnake);
    if (!value || typeof value !== "object") return value;

    return Object.fromEntries(
        Object.entries(value).map(([key, val]) => [
            key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`),
            toSnake(val),
        ])
    );
};

export default router;
