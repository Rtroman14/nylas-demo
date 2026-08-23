/**
 * In-memory feed of everything that happened, fanned out to browsers over SSE.
 *
 * Deliberately not persisted: this exists so you can watch the webhook loop
 * work in real time, not as an audit log. Restarting the server clears it.
 */
const MAX_EVENTS = 200;

const events = [];
const subscribers = new Set();

let nextId = 1;

export const feed = {
    /**
     * @param kind   one of: webhook | sent | reply | auth | error | info
     * @param detail anything JSON-serializable; rendered as-is in the UI
     */
    push(kind, summary, detail = {}) {
        const event = {
            id: nextId++,
            at: new Date().toISOString(),
            kind,
            summary,
            detail,
        };

        events.push(event);
        if (events.length > MAX_EVENTS) events.shift();

        for (const send of subscribers) {
            // A disconnected browser shouldn't take the server down with it.
            try {
                send(event);
            } catch {
                subscribers.delete(send);
            }
        }

        return event;
    },

    recent(limit = 50) {
        return events.slice(-limit).reverse();
    },

    subscribe(send) {
        subscribers.add(send);
        return () => subscribers.delete(send);
    },

    clear() {
        events.length = 0;
    },
};

export default feed;
