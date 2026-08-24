/**
 * Local persistence for the demo: which mailbox is connected, and which threads
 * this app has sent on.
 *
 * A JSON file on disk, because that keeps the demo runnable with no database.
 * In a real application both of these belong on a user record:
 *
 *   - the grant ID is per-user and long-lived; storing it in a shared file
 *     means one connected mailbox for the whole process.
 *   - tracked threads are how you know an inbound message is a reply to
 *     something you sent, which is exactly the kind of state that needs to
 *     survive a deploy and be queryable by thread ID.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".data");
const FILE = path.join(DIR, "grants.json");

const EMPTY = { grant: null, threads: {} };

const read = () => {
    try {
        return { ...EMPTY, ...JSON.parse(fs.readFileSync(FILE, "utf8")) };
    } catch {
        return { ...EMPTY };
    }
};

const write = (state) => {
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
};

let state = read();

export const store = {
    /* ------------------------------------------------------------- grant --- */

    getGrant() {
        return state.grant;
    },

    saveGrant({ grantId, email, provider }) {
        state.grant = { grantId, email, provider, connectedAt: new Date().toISOString() };
        write(state);
        return state.grant;
    },

    clearGrant() {
        state.grant = null;
        write(state);
    },

    /* ----------------------------------------------------------- threads --- */

    /**
     * Remember that we sent on this thread.
     *
     * This is what makes reply detection possible: an inbound message.created
     * carries a thread_id, and the only way to know it belongs to a
     * conversation we started is to have written the thread down when we sent.
     */
    trackThread(threadId, { messageId, to, subject } = {}) {
        if (!threadId) return null;

        const existing = state.threads[threadId];
        state.threads[threadId] = {
            threadId,
            to: to ?? existing?.to,
            subject: subject ?? existing?.subject,
            lastMessageId: messageId ?? existing?.lastMessageId,
            startedAt: existing?.startedAt ?? new Date().toISOString(),
            replyCount: existing?.replyCount ?? 0,
        };
        write(state);
        return state.threads[threadId];
    },

    getThread(threadId) {
        return threadId ? (state.threads[threadId] ?? null) : null;
    },

    listThreads() {
        return Object.values(state.threads).sort((a, b) =>
            String(b.startedAt).localeCompare(String(a.startedAt))
        );
    },

    /**
     * Count a reply once.
     *
     * Nylas makes no exactly-once guarantee, and in practice the same
     * `message.created` does arrive more than once, which double-counted this
     * before. Remembering the reply IDs makes a redelivery a no-op — the same
     * thing every consumer of these notifications has to do somewhere.
     */
    recordReply(threadId, messageId) {
        const tracked = state.threads[threadId];
        if (!tracked) return null;

        tracked.replyMessageIds ??= [];
        if (messageId && tracked.replyMessageIds.includes(messageId)) return tracked;
        if (messageId) tracked.replyMessageIds.push(messageId);

        tracked.replyCount = tracked.replyMessageIds.length || tracked.replyCount + 1;
        tracked.lastReplyAt = new Date().toISOString();
        tracked.lastReplyMessageId = messageId;
        write(state);
        return tracked;
    },

    reset() {
        state = { ...EMPTY, threads: {} };
        write(state);
    },
};

export default store;
