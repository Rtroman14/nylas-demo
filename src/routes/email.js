/**
 * The email API surface the demo UI drives.
 *
 *   POST /api/send            send a message (attachments + signature supported)
 *   POST /api/reply           reply inside an existing thread
 *   GET  /api/messages        list messages
 *   GET  /api/threads         list threads this app has sent on
 *   GET  /api/threads/:id     one thread, with every message body
 *   GET  /api/signatures      list stored signatures
 *   POST /api/signatures      create one
 *   GET  /api/events          recent activity
 *   GET  /api/events/stream   the same, live, over SSE
 */
import crypto from "node:crypto";
import express from "express";
import multer from "multer";
import Nylas from "../Nylas.js";
import store from "../store.js";
import feed from "../events.js";

const router = express.Router();

// Files stay in memory: they go straight back out as base64 in the send call,
// so writing them to disk would only add cleanup work.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
});

/** Turn a thrown NylasDemoError into a response without leaking a stack trace. */
const fail = (res, err) => {
    const status = err?.status && err.status < 500 ? err.status : 502;
    feed.push("error", err?.message ?? "Unknown error");
    res.status(status).json({ ok: false, error: err?.message ?? "Unknown error" });
};

/**
 * Send a message.
 *
 * Accepts multipart (so the browser can attach a PDF) or plain JSON.
 * Body fields: to, subject, body, cc, bcc, signatureId, trackOpens.
 */
router.post("/api/send", upload.array("attachments", 5), async (req, res) => {
    const { to, subject, body, cc, bcc, signatureId, trackOpens } = req.body ?? {};

    if (!to) return res.status(400).json({ ok: false, error: "Missing `to`." });
    if (!body) return res.status(400).json({ ok: false, error: "Missing `body`." });

    const files = (req.files ?? []).map((file) =>
        Nylas.attachments.fromBuffer(file.buffer, file.originalname, file.mimetype)
    );

    try {
        const sent = await Nylas.messages.send({
            to,
            subject,
            body,
            cc,
            bcc,
            // Nylas appends the signature server-side; HTML bodies only.
            signatureId: signatureId || undefined,
            attachments: files,
            ...(trackOpens === "true" || trackOpens === true
                ? { trackingOptions: { opens: true, links: true, threadReplies: true } }
                : {}),
            // Dedupes accidental double-submits for an hour.
            idempotencyKey: crypto.randomUUID(),
        });

        // Write the thread down so an inbound reply can be matched to it later.
        store.trackThread(sent.threadId, {
            messageId: sent.id,
            to,
            subject: subject || "(no subject)",
        });

        feed.push("sent", `Sent "${subject || "(no subject)"}" to ${to}`, {
            messageId: sent.id,
            threadId: sent.threadId,
            attachments: files.map((f) => f.filename),
            signatureId: signatureId || null,
        });

        res.json({
            ok: true,
            messageId: sent.id,
            threadId: sent.threadId,
            attachments: files.map((f) => f.filename),
        });
    } catch (err) {
        fail(res, err);
    }
});

/** Reply inside a thread. `messageId` is the message being replied to. */
router.post("/api/reply", express.json(), async (req, res) => {
    const { messageId, body, to, subject } = req.body ?? {};

    if (!messageId) return res.status(400).json({ ok: false, error: "Missing `messageId`." });
    if (!body) return res.status(400).json({ ok: false, error: "Missing `body`." });

    try {
        const sent = await Nylas.messages.reply({ messageId, body, to, subject });

        store.trackThread(sent.threadId, { messageId: sent.id, subject: sent.subject });
        feed.push("sent", `Replied on thread ${sent.threadId}`, { messageId: sent.id });

        res.json({ ok: true, messageId: sent.id, threadId: sent.threadId });
    } catch (err) {
        fail(res, err);
    }
});

router.get("/api/messages", async (req, res) => {
    try {
        const { data, nextCursor } = await Nylas.messages.list({
            limit: Number(req.query.limit) || 10,
            ...(req.query.threadId ? { threadId: req.query.threadId } : {}),
            ...(req.query.unread ? { unread: req.query.unread === "true" } : {}),
            ...(req.query.pageToken ? { pageToken: req.query.pageToken } : {}),
        });

        res.json({ ok: true, messages: data.map(brief), nextCursor });
    } catch (err) {
        fail(res, err);
    }
});

/** Threads this app has sent on, straight from the local store. */
router.get("/api/threads", (_req, res) => {
    res.json({ ok: true, threads: store.listThreads() });
});

/**
 * One conversation.
 *
 * The threads endpoint returns message IDs and metadata but no bodies, so the
 * messages endpoint has to be called separately to read the conversation.
 */
router.get("/api/threads/:id", async (req, res) => {
    try {
        const [thread, messages] = await Promise.all([
            Nylas.threads.get(req.params.id),
            Nylas.threads.messagesIn(req.params.id),
        ]);

        res.json({
            ok: true,
            thread: {
                id: thread.id,
                subject: thread.subject,
                messageIds: thread.messageIds,
                participants: thread.participants,
                unread: thread.unread,
            },
            messages: messages.map(brief),
            tracked: store.getThread(req.params.id),
        });
    } catch (err) {
        fail(res, err);
    }
});

router.get("/api/signatures", async (_req, res) => {
    try {
        res.json({ ok: true, signatures: await Nylas.signatures.list() });
    } catch (err) {
        fail(res, err);
    }
});

router.post("/api/signatures", express.json(), async (req, res) => {
    try {
        const created = await Nylas.signatures.create({
            name: req.body?.name,
            body: req.body?.body,
        });
        feed.push("info", `Created signature "${created.name}"`);
        res.json({ ok: true, signature: created });
    } catch (err) {
        fail(res, err);
    }
});

router.get("/api/events", (req, res) => {
    res.json({ ok: true, events: feed.recent(Number(req.query.limit) || 50) });
});

/**
 * Live event stream.
 *
 * SSE rather than websockets: the traffic is one-way and it needs no dependency.
 */
router.get("/api/events/stream", (req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        // Nothing in front of this should buffer it.
        "X-Accel-Buffering": "no",
    });
    res.write("\n");

    const unsubscribe = feed.subscribe((event) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
    });

    // Proxies drop idle connections; a comment line keeps this one warm.
    const keepAlive = setInterval(() => res.write(": ping\n\n"), 25_000);

    req.on("close", () => {
        clearInterval(keepAlive);
        unsubscribe();
    });
});

/** Trim a message to what the UI renders. Bodies are large HTML blobs. */
const brief = (message) => ({
    id: message.id,
    threadId: message.threadId,
    subject: message.subject,
    from: (message.from ?? []).map((a) => a.email),
    to: (message.to ?? []).map((a) => a.email),
    date: message.date,
    unread: message.unread,
    snippet: message.snippet,
    attachments: (message.attachments ?? []).map((a) => ({
        id: a.id,
        filename: a.filename,
        contentType: a.contentType,
        size: a.size,
    })),
});

export default router;
