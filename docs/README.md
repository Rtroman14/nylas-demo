# Nylas Email API docs

Start here. This folder exists so a coding agent can answer Nylas questions by
reading files instead of guessing or making network calls.

## Find what you need

| I want to... | Read |
| --- | --- |
| Understand the whole model before writing anything | [Core concepts](#core-concepts) below |
| Let a user connect their mailbox | [recipes/connect-a-mailbox.md](recipes/connect-a-mailbox.md) |
| Send an email | [recipes/send-an-email.md](recipes/send-an-email.md) |
| Attach a PDF | [recipes/send-with-attachment.md](recipes/send-with-attachment.md) |
| Add a signature to outgoing mail | [recipes/send-with-signature.md](recipes/send-with-signature.md) |
| Reply so it stays in the same thread | [recipes/reply-in-thread.md](recipes/reply-in-thread.md) |
| Get notified when someone replies | [recipes/detect-replies.md](recipes/detect-replies.md) |
| Chase an unanswered proposal over several emails | [recipes/follow-up-sequences.md](recipes/follow-up-sequences.md) |
| Read someone's whole history with us before replying | [recipes/follow-up-sequences.md](recipes/follow-up-sequences.md) |
| Tag a send with a CRM record ID | [recipes/follow-up-sequences.md](recipes/follow-up-sequences.md) |
| Receive webhooks on my laptop | [recipes/local-webhook-tunnel.md](recipes/local-webhook-tunnel.md) |
| Avoid sending twice on a retry | [recipes/idempotent-send.md](recipes/idempotent-send.md) |
| Strip quoted text from a reply | [recipes/clean-message-bodies.md](recipes/clean-message-bodies.md) |
| Look up an exact endpoint, field, or error | [reference/](reference/) — see [reference/_MANIFEST.md](reference/_MANIFEST.md) |
| Understand why this repo chose X over Y | [notes/](notes/) |

## Core concepts

Three things, and every request is a combination of them.

1. **API key** authenticates your *application*. Send it as `Authorization: Bearer <key>`.
   It is server-side only — putting it in client code exposes every connected mailbox.
2. **Grant ID** identifies *which mailbox* you are acting on. A user gets one by
   completing OAuth. One grant per email address per application; re-authenticating
   an existing address refreshes that grant rather than creating a second one.
3. **Region** is `https://api.us.nylas.com` or `https://api.eu.nylas.com`. A grant
   created in one region does not exist in the other, and a mismatched host returns
   confusing not-found errors rather than a clear region error.

Almost every call is `{base}/v3/grants/{grant_id}/{resource}`. The exceptions are
application-scoped: `/v3/connect/*` for auth and `/v3/webhooks` for webhooks, both
of which use the API key and take no grant.

## Rules that are easy to get wrong

These are the ones that cost real debugging time.

- **v3 only.** v2 is deprecated and uses a completely different model
  (`access_token` and `client_secret` instead of `api_key` and `grant_id`). Training
  data is full of v2 examples. If you see `access_token`, it is v2 and it is wrong.
- **Never delete a grant to fix an auth error.** Deleting is permanent and drops
  everything Nylas synced. An expired grant is fixed by re-running the OAuth flow,
  which refreshes it in place. Delete only when a user asks to disconnect.
- **The webhook signature covers the raw request bytes.** Verify before parsing.
  Re-serializing parsed JSON produces different bytes and the check will fail.
- **Nylas blocks ngrok.** The challenge request never arrives and the dashboard just
  reports that your server did not respond. Use cloudflared or VS Code port forwarding.
- **A failed webhook verification is permanent.** Nylas does not re-check an endpoint
  after its first failure. Fix the problem, then create a *new* webhook.
- **`message.created` fires for your own sends too.** Every handler needs to work out
  the direction of the message before treating it as an inbound reply.
- **Signatures are HTML-only.** A plaintext body silently gets no signature. So do
  open and link tracking, which need a pixel and rewritten anchors respectively.
- **There is no `thread_id` on send.** Threading is `reply_to_message_id` and nothing
  else — it is what becomes the `In-Reply-To` and `References` headers. Reply to the
  *newest* message in the thread; an older one branches it.
- **Metadata only ever lands on your own message.** An inbound reply is a separate
  object with no metadata, so metadata cannot be how you recognize a response. Use
  `thread_id` for that. Only `key1`–`key5` are indexed and therefore queryable, and
  `metadata_pair` cannot be combined with a filter like `from` or `any_email`.
- **Message tracking is unavailable on Sandbox applications,** and the whole send
  fails with `Tracking options are not allowed for trial accounts` — not just tracking.
- **A JSON send is capped at 3MB for the whole request.** Larger goes multipart, which
  drops the send rate limit from 200/s to 10/s per grant.
- **`any_email` beats `from`** for reading a conversation: it matches To, From, Cc, and
  Bcc, so it returns your sends as well as theirs.
- **`in` takes a folder ID, not a name.** `in=inbox` returns a 400 on threads.
- **Casing depends on the source.** The Node SDK camelCases responses (`threadId`),
  but webhook payloads arrive raw from Nylas as snake_case (`thread_id`). This repo
  hits that seam in [`src/routes/webhooks.js`](../src/routes/webhooks.js).

## How this repo maps to the docs

Working code for everything above:

| Concern | File |
| --- | --- |
| Every Nylas call | [`src/Nylas.js`](../src/Nylas.js) |
| OAuth connect and disconnect | [`src/routes/auth.js`](../src/routes/auth.js) |
| Webhook receipt and reply detection | [`src/routes/webhooks.js`](../src/routes/webhooks.js) |
| Send, threads, signatures over HTTP | [`src/routes/email.js`](../src/routes/email.js) |
| Grant and thread persistence | [`src/store.js`](../src/store.js) |

## Refreshing the reference docs

`reference/` is vendored verbatim from developer.nylas.com. Re-pull it with:

```bash
npm run docs:fetch
```

Add a URL to `PAGES` in [`scripts/fetch-docs.js`](../scripts/fetch-docs.js) to
include a new page. Every Nylas doc page serves markdown when you append `.md` to
its URL, and `https://developer.nylas.com/llms.txt` is a curated sitemap of them all.
