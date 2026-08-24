# Decisions: putting Romey in the inbox

A record of the questions asked while designing Romey's email follow-up feature and
what the answers turned out to be, so the reasoning does not have to be rebuilt later.

**Romey** is an AI sales agent for JobTread. It already answers inbound leads by text
and voice. The feature being designed here is following up on **unsigned proposals**
over email: read the prior conversation, decide the next action, send, and notice when
the recipient finally replies.

The mechanics live in [../recipes/follow-up-sequences.md](../recipes/follow-up-sequences.md).
This file is the why.

## The intended flow

1. Fetch the inbox for a lead's address to gather prior conversation.
2. Decide the next action from that history.
3. Send a message, sometimes with an attachment.
4. If no answer, send again in the same thread a few days later.
5. When the recipient replies, recognize it as a response to a JobTread proposal.

## Q: Should Romey reply to the previous message, or just send into the same thread?

**They are the same operation.** There is no `thread_id` field on send. Threading is
`reply_to_message_id` and nothing else — Nylas turns it into the `In-Reply-To` and
`References` headers that mail clients group on. A matching subject alone is not enough.

**Decision: reply to the newest message in the thread.** Threads are trees, not lists.
Chaining off an older message branches the conversation; every branch keeps the same
`thread_id` so Romey's own records still match, but the recipient may see a separate
reply stack. Sort by `date` and take the last one.

In an unanswered sequence the newest message is one Romey sent, so `from` is Romey's
own mailbox. Pass `to` explicitly — deriving recipients from your own send mails the
sequence back to yourself.

## Q: Can we attach metadata to messages or conversations?

**Yes on messages, and it is useful, but it cannot do the job you were hoping for.**

Verified live: metadata attaches to the message Romey *creates*. The recipient's reply
is a separate object and comes back with `metadata: null`. A `metadata_pair` query on
an answered thread matches only Romey's own message, never the reply.

So **metadata cannot detect a response.** There is no "conversation-level" metadata to
inherit.

**Decision: `thread_id` recognizes the reply; metadata is the durable CRM mapping.**
Store `thread_id` on the proposal record when sending and match inbound
`message.created` against it. Stamp `key1` with the proposal ID and `key2` with the
JobTread job ID so the mapping can be recovered from Nylas alone when reconciling or
backfilling.

Matching the sender's address against the database is a fine cross-check, but it is not
sufficient on its own: it breaks the moment someone replies from a different address
than the one Romey mailed — a spouse, an assistant, a forwarded thread. `thread_id`
survives that.

Sharp edges found by testing, all in the recipe: only `key1`–`key5` are filterable, the
Node SDK wants `metadata_pair` as an object rather than the documented `"key1:value"`
string, the SDK camelCases metadata keys on read so `already_snake` comes back as
`alreadySnake`, and `metadata_pair` cannot be combined with `from`/`any_email`/
`thread_id`/`subject`.

## Q: Is message tracking the right call?

**No, not for reply detection.**

- **It is unavailable on Sandbox applications.** The whole send fails with
  `Tracking options are not allowed for trial accounts` — not just the tracking part.
  Hit this on the first live send.
- **`message.created` already reports the reply,** carries `thread_id`, needs no
  tracking and no plan upgrade.
- **`opens` and `links` require the HTML that plain text gives up.** Open tracking is a
  1×1 image; link tracking rewrites `<a>` hrefs.
- **Rewritten links hurt the deliverability the plain-text decision is protecting.** A
  link domain that does not match the sender is a classic spam signal.
- **Deleting a grant breaks tracking links in already-sent mail.**

**Decision: no tracking.** Use `message.created` for replies and
`message.bounce_detected` to stop chasing dead addresses.

Tracking would earn its place if "did they open the proposal?" should change how hard
Romey chases. That is a genuine signal and it is incompatible with plain-text sending.
If it ever becomes a priority, it is a deliberate trade, not an addition.

## Q: Does plain text hurt deliverability?

**Not meaningfully.** Inbox placement is driven by domain authentication (SPF, DKIM,
DMARC), sending reputation, recipient engagement, and link patterns — not MIME type.
For one-to-one mail from a real mailbox that should read as though a person wrote it,
plain text is usually *better*: nothing in it pattern-matches against bulk mail.

Nylas picks the format from the body content, so a body with no tags goes out as plain
text and newlines survive.

**Decision: plain text.** It costs exactly three things, all acceptable:

| Lost | Why |
| --- | --- |
| Stored signatures (`signature_id`) | Nylas appends signature *HTML*; a plaintext body silently gets none. Write the sign-off into the text. |
| Open tracking | Needs the pixel. |
| Link click tracking | Needs anchors. |

Verified: a plaintext send arrived with `\n` intact and no signature applied.

## Q: How does Romey fetch the inbox by email address?

**Use `any_email`, not `from`.** It matches To, From, Cc, and Bcc, so one call returns
Romey's sends as well as the lead's replies. `from` alone returns only their half,
which reads as though Romey never wrote to them. Comma-separated, up to 25 addresses.

Then run the bodies through `messages.clean` before handing them to the model. It
strips quoted replies, forwarded blocks, and signatures, which is the difference
between reasoning about a conversation and re-reading the same footer five times. Cap
is 20 message IDs per call.

Use `select` to avoid pulling full bodies when building a timeline. Note that IMAP
grants default to roughly three months of history; Google and Microsoft are not
limited this way.

## Things that were not asked but will bite

- **Multipart send rate limit.** A JSON send is capped at 3MB for the entire HTTP
  request; anything larger goes multipart, which drops the limit from 200 requests/
  second/grant to **10**. Attaching signed proposal PDFs across a batch of follow-ups
  is exactly that case. `Nylas.attachments.fitsInJsonSend(files)` tells you which path
  a send will take.
- **Webhook deliveries are not exactly-once.** A single reply produced two
  `message.created` deliveries in testing and double-counted this repo's reply counter.
  Dedupe on message ID.
- **A brand-new Google grant is not immediately live.** Nylas has to establish its
  Gmail watch, and mail sent seconds after connecting may generate no notification at
  all. Nylas does not backfill it.
- **Ack webhooks within 10 seconds** and do the CRM write on a queue. Past that Nylas
  times out and counts the delivery as failed.
- **Never delete a grant to fix an auth error.** Re-run OAuth. Deleting is permanent
  and takes synced data and tracking attribution with it.
- **Idempotency keys should be derived from the proposal and attempt**, not random, so
  a scheduler retry collapses instead of mailing twice.
- **`send_at` can replace the follow-up cron**, but a queue Romey owns is more flexible
  because a reply should cancel a pending nudge.
