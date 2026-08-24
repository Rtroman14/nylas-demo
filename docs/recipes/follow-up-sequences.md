# Chase an unanswered proposal over email

The shape of this problem: you sent something that needs a signature, nobody replied,
and you want to nudge the same conversation a few days later and reliably notice when
the recipient finally answers.

Everything here is a sending sequence driven by a CRM record — a proposal, a quote, an
estimate. The CRM record ID is the thing you are trying to keep hold of across
several messages and an eventual reply.

## 1. Read the history before deciding anything

Pull both halves of the conversation with `anyEmail`, not `from`. It matches To, From,
Cc, and Bcc, so one call gets their replies *and* your previous sends. `from` alone
only gets their side, which reads as though you never wrote to them.

```js
const { data } = await Nylas.messages.list({
    anyEmail: "homeowner@example.com", // comma-separated, max 25 addresses
    limit: 50,
});
```

Then feed the model clean text, not raw bodies. `messages.clean` strips quoted
replies, forwarded blocks, and signatures, which is the difference between a prompt
that reasons about the conversation and one that re-reads its own footer five times:

```js
const cleaned = await Nylas.messages.clean(data.map((m) => m.id).slice(0, 20));
```

Twenty IDs per call is the hard cap. See
[clean-message-bodies.md](clean-message-bodies.md).

Two things that will surprise you:

- **`select` is how you keep payloads sane.** Bodies are large. Ask for
  `id,threadId,date,from,to,subject,snippet` when you are only building a timeline.
- **IMAP grants default to roughly three months of history.** Older mail needs
  `queryImap=true` plus an `in` folder ID, and it is slow. Google and Microsoft are
  not limited this way.

## 2. Send the follow-up into the same thread

**There is no "send to this thread" parameter.** Nylas has no `threadId` on send.
Threading is done entirely by `replyToMessageId`, which is what Nylas turns into the
`In-Reply-To` and `References` headers that mail clients actually group on.

So the answer to "reply to the previous message, or just the thread?" is that those
are the same operation, and you have to name a message:

```js
await Nylas.messages.reply({
    messageId: latestMessageIdInThread,
    to: "homeowner@example.com", // always pass this explicitly, see below
    body: "Just checking in on the estimate I sent over.",
});
```

**Reply to the newest message in the thread, not the original.** Threads are trees.
Chaining off an older message branches the conversation — every branch keeps the same
`threadId`, so your own database still matches, but the recipient's client may show it
as a separate reply stack. Sort by `date` and take the last one; do not assume the
array is chronological.

In an unanswered sequence the newest message is one *you* sent, which walks straight
into the trap in [reply-in-thread.md](reply-in-thread.md): its `from` is your own
mailbox, so deriving recipients from it mails the sequence back to yourself. Pass `to`
explicitly. `Nylas.messages.reply()` filters your own address out when you don't, but
being explicit is cheaper than trusting that.

Keep the subject stable. Nylas does not prefix `Re:` for you, and `messages.reply()`
adds one only when it is missing, so a nudge on an existing `Re:` subject stays a
single `Re:` rather than growing a chain.

### Make the send idempotent

A follow-up runs from a scheduler, and schedulers retry. Pass an `idempotencyKey`
derived from the thing being sent rather than a random UUID, so a retry collapses
instead of double-mailing someone:

```js
idempotencyKey: `proposal-${proposalId}-nudge-${attemptNumber}`,
```

Nylas dedupes on that key for one hour. Details in
[idempotent-send.md](idempotent-send.md).

### Or let Nylas hold the message

If the follow-up delay is known at send time, `sendAt` (Unix seconds) hands the
schedule to Nylas instead of your own cron, and `message.send_success` /
`message.send_failed` report the outcome. Those two triggers only fire for scheduled
sends. A cancellable queue you own is more flexible — a reply should cancel a pending
nudge — so this is a trade, not an upgrade.

## 3. Plain text is the right call, and it costs you three features

Plain text does not meaningfully hurt deliverability. What actually drives inbox
placement is domain authentication (SPF, DKIM, DMARC), sending reputation, recipient
engagement, and link patterns — not MIME type. For a one-to-one message from a real
mailbox that is supposed to read as though a person wrote it, plain text is usually
the *better* choice: no unused CSS, no tracking pixel, nothing that pattern-matches
against bulk mail.

Nylas decides HTML versus plain text from the body content itself, so a body with no
tags goes out as plain text. Newlines survive, which is the behaviour you want and the
opposite of the HTML case where `\n` collapses.

What you give up, all of it deliberately:

| Feature | Why it needs HTML |
| --- | --- |
| Stored signatures (`signatureId`) | Nylas appends signature HTML; a plaintext body silently gets none. Write your sign-off into the text. |
| Open tracking | Works by injecting a 1×1 image. No HTML, no pixel. |
| Link click tracking | Rewrites `<a>` hrefs. No anchors, nothing to rewrite. |

## 4. Do not reach for message tracking to detect replies

`tracking_options.thread_replies` exists and does produce a `thread.replied`
notification with `root_message_id` and `thread_id`. It is still the wrong tool here:

- **It is unavailable on Sandbox applications.** You get
  `Tracking options are not allowed for trial accounts` and the whole send fails —
  not just the tracking part.
- **`message.created` already tells you.** It fires for inbound mail on a production
  or sandbox app, with no tracking and no plan upgrade, and it carries `thread_id`.
  `thread.replied` is redundant signal for the same event.
- **`opens` and `links` actively work against plain text.** Rewriting every URL to a
  Nylas tracking host is a well-known spam signal, and open pixels are stripped by
  Apple Mail Privacy Protection and most blockers, so the data is unreliable anyway.
- **Deleting a grant breaks tracking links in mail you already sent.** Nylas can no
  longer attribute the events.

Tracking earns its place when "did they even look at it?" should change how hard you
chase. That is a real signal, and it is incompatible with plain-text sending. Pick one.

## 5. Detect the reply by thread, and tag by metadata

The join key is `thread_id`. Write it down when you send, then match inbound
`message.created` against it — that is exactly what
[`src/routes/webhooks.js`](../../src/routes/webhooks.js) does, and
[detect-replies.md](detect-replies.md) covers the three branches every handler needs
(your own send echoing back, autoresponders, a real human).

Metadata is the second half of that, and it is worth being precise about what it can
and cannot do.

```js
await Nylas.messages.send({
    to: "homeowner@example.com",
    body: "...",
    metadata: {
        key1: `proposal_${proposalId}`, // indexed -> queryable
        key2: jobtreadJobId,            // indexed -> queryable
        sequence_step: "2",             // stored, NOT queryable
    },
});
```

Everything below was confirmed against a live Google grant, because most of it is not
obvious from the docs.

- **Metadata lands on the message *you* create, never on their reply.** Read the two
  messages of an answered thread back and your send carries the metadata while the
  reply returns `metadata: null`. A `metadataPair` query on that thread matches only
  your own message. This is the single most important point here: metadata cannot tag
  an inbound message, so it cannot be the mechanism that recognizes a response.
- **Only `key1` through `key5` are filterable.** Anything else is stored and returned
  but rejected as a filter — `metadata_pair=sequence_step:2` fails with
  `metadata filtering not allowed on provided 'key': sequence_step`. Put the IDs you
  will query by in the reserved keys. `Nylas.INDEXED_METADATA_KEYS` is the list.
- **The Node SDK wants `metadataPair` as an object, not the `"key1:value"` string the
  docs show.** Passing the string makes the SDK iterate it character by character and
  the API rejects it with the baffling
  `metadata filtering not allowed on provided 'key': 0`. `Nylas.messages.list()`
  accepts either form and normalizes it.
- **The SDK camelCases metadata keys on the way out, which is lossy.** Write
  `already_snake` and the stored key really is `already_snake` — confirmed over raw
  HTTP — but read it back through the SDK and it is `alreadySnake`. A key with an
  underscore does not survive a write/read round trip through the SDK, so either avoid
  underscores in custom keys or read metadata over raw HTTP. `key1`–`key5` are immune,
  which is another reason to keep the identifiers there.
- **`metadataPair` cannot be combined with a provider-backed filter.** Pairing it with
  `from`, `anyEmail`, `threadId`, or `subject` returns
  `Query params can only filter by either 'metadata' or 'provider filters'`. Metadata
  lookups are always their own separate query.
- **`PUT`/`PATCH` replaces the whole metadata object.** Updating one key without
  resending the others deletes them.
- **Metadata changes generate no notification,** but metadata that exists on an object
  is included in its `*.created` and `*.updated` payloads.
- **Limits:** 50 pairs, keys 40 characters, values 500 characters, strings only — no
  nested objects. `Nylas.messages.send()` validates all of this before it calls out.

So the division of labour: `thread_id` recognizes the reply, and metadata is how you
recover the CRM mapping straight from Nylas when your own records are missing,
backfilling after downtime, or reconciling. Matching the sender's address against your
database also works, and is a reasonable cross-check, but it breaks the moment someone
replies from a different address than the one you mailed — a spouse, an assistant, a
forwarded thread. `thread_id` survives that; an address match does not.

## 6. Stop the sequence when the address is dead

`message.bounce_detected` fires for Google, Microsoft Graph, iCloud, and Yahoo grants.
Subscribe to it and kill the remaining nudges for that proposal — continuing to mail a
hard-bouncing address is what damages the sending reputation that section 3 depends on.

## 7. Webhook hardening this repo does not do

The demo processes notifications in-process because it is a demo. A sequencing service
needs more, and [webhook-best-practices.md](../reference/webhook-best-practices.md) is
the short version:

- **Ack inside 10 seconds.** Past that Nylas times out and counts the delivery as
  failed. Return `200` first, then queue the work — never do the CRM write inline.
- **Assume no ordering and no exactly-once.** An `.updated` can arrive before its
  `.created`. Make handlers idempotent on message ID — this is not theoretical: a
  single reply in testing produced two `message.created` deliveries and drove this
  repo's reply counter to 2 before [`src/store.js`](../../src/store.js) started
  deduping on the reply's message ID.
- **A brand-new Google grant is not immediately live.** Nylas has to establish its
  Gmail watch first, so mail sent seconds after connecting may produce no
  `message.created` at all, and Nylas does not backfill it. Do not treat silence right
  after an OAuth connect as a broken endpoint — confirm with
  `Nylas.webhooks.sendTestEvent()`, which proves reachability independently of any grant.
- **Watch grant health.** Subscribe to `grant.created`, `grant.updated`,
  `grant.deleted`, and `grant.expired`. On expiry, prompt re-auth — never delete the
  grant, which is permanent and takes tracking and synced data with it.
- **Backfill after an outage.** Nylas does not replay notifications missed while an
  endpoint was `failed`, or while a grant was invalid. Query the window between the
  `grant.expired` and `grant.updated` notifications and reconcile.
- **Consider `compressed_delivery: true`.** It cuts bandwidth and, usefully, gets
  payloads past WAFs that block request bodies containing HTML. Verify
  `x-nylas-signature` against the raw *compressed* bytes before decompressing.
- **Use a separate application for development,** so a bad deploy does not drown your
  production endpoint.

## 8. Rate limits that bite a sequence

| Operation | Limit |
| --- | --- |
| `messages/send` as `application/json` | 200 requests/second/grant |
| `messages/send` as `multipart/form-data` | **10** requests/second/grant |
| Messages, Threads, Contacts reads | 200 requests/second/grant |

The multipart row is the trap. A JSON send is capped at 3MB for the entire HTTP
request, and anything larger has to go multipart — which drops you to a twentieth of
the rate limit. Attaching a signed proposal PDF to a batch of follow-ups is exactly
the case that hits it. `Nylas.attachments.fitsInJsonSend(files)` tells you which path
a send will take before you fan out.

## Reference

- [metadata.md](../reference/metadata.md)
- [email-message-tracking.md](../reference/email-message-tracking.md)
- [webhook-best-practices.md](../reference/webhook-best-practices.md)
- [grant-lifecycle.md](../reference/grant-lifecycle.md)
- [email-scheduled-send.md](../reference/email-scheduled-send.md)
- [rate-limits.md](../reference/rate-limits.md)
- [search.md](../reference/search.md)
