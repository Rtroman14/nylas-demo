# Receive webhooks on your laptop

Nylas only delivers to a **public HTTPS URL**, so `localhost:3000` needs a tunnel in
front of it.

## Do not use ngrok

Nylas blocks ngrok URLs outright over throughput concerns. The challenge request
never reaches your machine and the dashboard reports only that your server failed to
respond to the challenge — which sends you debugging the wrong thing.

Use one of these instead:

| Tool | Notes |
| --- | --- |
| **cloudflared** | No account needed. What this repo assumes |
| VS Code port forwarding | Built in; set the port to Public |
| Hookdeck | Adds inspection and replay |

## cloudflared

```bash
# macOS
brew install cloudflared
# Linux
curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
  -o /usr/local/bin/cloudflared && chmod +x /usr/local/bin/cloudflared

cloudflared tunnel --url http://localhost:3000
```

It prints a URL like `https://random-words-here.trycloudflare.com`. Your webhook URL
is that plus the path:

```
https://random-words-here.trycloudflare.com/webhooks/nylas
```

The URL changes every restart on the free tier, so re-register the webhook each time.

## Register it

Start the server and the tunnel **first** — Nylas verifies the endpoint the moment
you create the webhook.

```bash
npm run webhook:create -- https://random-words-here.trycloudflare.com
```

Save the returned secret to `.env` and restart:

```
NYLAS_WEBHOOK_SECRET=<secret>
```

Nylas returns the webhook secret **once**, at creation. If you lose it, rotate it.

## The handshake

On creation and on every reactivation, Nylas sends:

```
GET <your-url>?challenge=bc609b38-c81f-47fb-a275-1d9bd61a968b
```

You must reply `200` within 10 seconds, with the challenge value as the entire body.
No JSON wrapper, no quotes, no chunked encoding.

```js
app.get("/webhooks/nylas", (req, res) => {
    res.status(200).type("text/plain").send(req.query.challenge);
});
```

**Verification happens once.** Nylas does not re-check an endpoint after its first
failed attempt, so a webhook that fails verification stays broken permanently. Fix
the cause, then create a *new* webhook — updating the failed one does not help.

Confirm the handshake works before registering:

```bash
curl "https://your-tunnel.trycloudflare.com/webhooks/nylas?challenge=test"
# must print exactly: test
```

## Test the endpoint before a mailbox is connected

Nylas will POST a mock notification at any URL you name and tell you whether it
answered `200`:

```js
await Nylas.webhooks.sendTestEvent({
    webhookUrl: "https://your-tunnel.trycloudflare.com/webhooks/nylas",
});
// -> "success"
```

**This delivery is signed with the literal string `mock-webhook-secret`**, not with
the secret of the webhook you registered at that URL. So a handler that verifies
signatures correctly logs this one as `invalid`. That is the expected result and does
not mean verification is broken — confirm with a payload you sign yourself, below.

`Nylas.webhooks.mockPayload()` returns the same example payload instead of delivering
it, which is the quicker way to check field names and casing.

## Testing without a tunnel

The endpoint is fully testable offline by signing a payload yourself:

```bash
BODY='{"id":"evt_1","type":"message.created","data":{"object":{"id":"msg_1","object":"message","thread_id":"thread_1","subject":"Re: Quote","from":[{"email":"lead@example.com"}]}}}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "test_secret_123" | awk '{print $2}')

curl -X POST http://localhost:3000/webhooks/nylas \
  -H "Content-Type: application/json" \
  -H "x-nylas-signature: $SIG" \
  -d "$BODY"
```

With `NYLAS_WEBHOOK_SECRET=test_secret_123` in `.env` this exercises the real
verification path, not a bypass.

## Nothing arriving?

Work down this list:

1. `npm run grants` — no grants means no `message.*` events, ever. Nylas only emits
   them for mailboxes connected to *this* application.
2. Same command shows webhook `status`. It must be `active`.
3. Mail sent from an account that is not a grant on this application produces nothing.
4. Check the tunnel is still up and the URL has not rotated.
5. Watch the server log for `Unhandled POST /...` — that is a path typo in the
   registered URL.

## Reference

- [notifications.md](../reference/notifications.md)
