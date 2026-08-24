# AGENTS.md

Reference implementation of the Nylas v3 Email API. Point a coding agent here when
adding email capabilities to another codebase.

## Read this first

**[`docs/README.md`](docs/README.md) routes you from an intent to the right page.**
Go there before searching the web — the official docs are vendored into
[`docs/reference/`](docs/reference/), so you can grep them locally.

Working code for every concept lives in [`src/`](src/), and the recipes link to it.

## Layout

| Path | What it is |
| --- | --- |
| [`src/Nylas.js`](src/Nylas.js) | Every Nylas call. Start here to see how an operation is made |
| [`src/routes/auth.js`](src/routes/auth.js) | Hosted OAuth connect and disconnect |
| [`src/routes/webhooks.js`](src/routes/webhooks.js) | Webhook receipt, signature check, reply detection |
| [`src/routes/email.js`](src/routes/email.js) | Send, reply, threads, signatures over HTTP |
| [`src/store.js`](src/store.js) | Grant and thread persistence |
| [`docs/recipes/`](docs/recipes/) | Task-oriented guides: "how do I send a PDF" |
| [`docs/notes/`](docs/notes/) | Design decisions and why they were made |
| [`docs/reference/`](docs/reference/) | Vendored official docs, refreshed by `npm run docs:fetch` |
| [`.agents/skills/`](.agents/skills/) | Nylas API and CLI skills from `npx skills add nylas/skills` |

## Navigating this repo

Read in this order and stop as soon as you have what you need:

1. **[`docs/README.md`](docs/README.md)** — an intent-to-page table plus the list of
   rules that are easy to get wrong. Almost every question starts here.
2. **[`docs/recipes/`](docs/recipes/)** — one file per task, each linking to the code
   that implements it. Prefer these over reconstructing an approach from the reference.
3. **[`src/Nylas.js`](src/Nylas.js)** — every Nylas call, with the constraints written
   as comments next to the call they constrain.
4. **[`docs/reference/`](docs/reference/)** — the official docs, vendored. Grep here for
   exact fields, errors, and limits instead of fetching the web.
   [`docs/reference/_MANIFEST.md`](docs/reference/_MANIFEST.md) lists what is vendored.

Two things worth knowing before you write code against this repo:

- Claims in `docs/recipes/` and `docs/notes/` marked as verified were run against a
  live Google grant. Where the official docs and observed behaviour disagree, the
  recipes describe observed behaviour and say so.
- There is no test suite, no linter, and no build. `npm run dev` is how you exercise
  changes. Do not invent an `npm test` or `npm run lint`.

## Running it

```bash
npm install
cp .env.example .env      # fill in NYLAS_API_KEY and NYLAS_CLIENT_ID
npm run dev               # http://localhost:3000
```

No build step and no test suite — this is a demo server, and `npm run dev` is the way
to exercise it. There is no linter configured either; do not invent a lint command.

Helper scripts: `npm run grants` (what the app can see), `npm run webhook:create -- <https-url>`,
`npm run send:test -- someone@example.com ./file.pdf`, `npm run docs:fetch`.

## What runs without credentials

The webhook path is fully exercisable offline, which makes it the fastest way to
verify a change:

```bash
curl http://localhost:3000/health
curl "http://localhost:3000/webhooks/nylas?challenge=test123"     # echoes test123
```

Signed notifications work too — see the snippet in
[`docs/recipes/local-webhook-tunnel.md`](docs/recipes/local-webhook-tunnel.md).
Set `NYLAS_WEBHOOK_SECRET=test_secret_123` in `.env` and the real HMAC path runs.

Anything that touches a mailbox (send, reply, list, signatures) needs
`NYLAS_API_KEY` plus a connected grant, and fails with a clear message until then.

## Conventions

- JavaScript, not TypeScript. ES modules, Node 22+.
- Arrow functions for standalone helpers; object methods on the resource groups in
  `Nylas.js`.
- All Nylas calls go through `src/Nylas.js`. Do not call the SDK from a route.
- Config is read only in `src/config.js`. Do not read `process.env` elsewhere.

## Gotchas that will bite you

- **Casing depends on the source.** The SDK camelCases responses (`threadId`), but
  webhook payloads arrive raw from Nylas as snake_case (`thread_id`). Both appear in
  this codebase; [`src/routes/webhooks.js`](src/routes/webhooks.js) is where they meet.
- **The webhook signature covers raw bytes.** `express.json({ verify })` in
  [`src/server.js`](src/server.js) captures them. Anything that re-serializes the
  parsed body before verification breaks it.
- **`message.created` fires for your own sends.** Check the sender direction before
  treating a notification as an inbound reply.
- **The SDK has no signatures resource.** Those go through `Nylas.request()`, the
  escape hatch onto the SDK's HTTP client.
- **There is no `thread_id` on send.** Threading is `reply_to_message_id` and nothing
  else. Reply to the *newest* message in a thread; an older one branches it.
- **Metadata only ever lands on your own message.** An inbound reply comes back with
  `metadata: null`, so metadata cannot be how you recognize a response — use
  `thread_id`. Only `key1`–`key5` are filterable, and the SDK camelCases metadata keys
  on read, so a key with an underscore does not survive a round trip.
- **Webhook deliveries are not exactly-once.** One reply can produce two
  `message.created` notifications. Dedupe on message ID.
- **A brand-new grant is not immediately live.** Nylas has to establish its Gmail watch
  first, and it does not backfill notifications for mail that arrived before then.
- **Message tracking is unavailable on Sandbox applications** and fails the entire send.
- **Never delete a grant to fix an auth error.** Re-run OAuth instead; deleting is
  permanent. Delete only on an explicit user disconnect.
- **v3 only.** If you find yourself writing `access_token` or `client_secret`, that
  is deprecated v2 leaking in from training data.

## Cursor Cloud specific instructions

- Port 3000 is the default and the callback URI in `.env.example` depends on it.
  Check whether another dev server holds it before starting.
- Webhook delivery from Nylas needs a public HTTPS tunnel (`cloudflared`; Nylas blocks
  ngrok). Without one, test the webhook path with locally-signed payloads as above.
- `.data/` holds the connected grant and tracked threads. Delete it to reset to a
  disconnected state.
