# Avoid sending the same email twice

A network timeout on a send leaves you unable to tell whether the message went out.
Retrying risks a duplicate; not retrying risks silence.

## The header

```js
await nylas.messages.send({
    identifier: grantId,
    requestBody: {...},
    overrides: { headers: { "Idempotency-Key": crypto.randomUUID() } },
});
```

Nylas caches the first result under that key. A second request with the same key
returns the **cached response** — same body, same status — instead of sending again.

| Property | Value |
| --- | --- |
| Max key length | 256 characters |
| Dedupe window | 1 hour from the first request |
| Scope, grant send | Per grant |
| Scope, transactional send | Per application, across all verified domains |
| Replay marker | `Idempotent-Response: true` response header |

Supported on `POST /v3/grants/{id}/messages/send` and
`POST /v3/domains/{domain}/messages/send`.

## Choosing a key

One key per *logical* send. A random UUID per attempt defeats the purpose — the key
has to be stable across retries of the same intent.

Derive it from what makes the send unique:

```js
const idempotencyKey = crypto
    .createHash("sha256")
    .update(`${contactId}|${sequenceStep}|${subject}`)
    .digest("hex")
    .slice(0, 64);
```

Now a webhook that fires twice, or a worker that retries, produces one email.

## When to reuse vs. rotate

| Outcome | Action |
| --- | --- |
| Network failure, no response | Retry with the **same** key |
| `5xx` from Nylas | Retry with the **same** key |
| `409 concurrent_idempotent_request` | In flight; wait, retry with the same key |
| `409 invalid_idempotent_request` | Same key, different payload — fix the payload |
| `4xx` other than 409 | Fix the cause, use a **fresh** key |
| Provider `5xx` | Fix the cause, use a **fresh** key |

The distinction: reuse the key when you do not know whether the send happened.
Rotate it when you know it did not and you have changed something.

## Limits

Idempotency is enforced at the Nylas layer only. The key is **not** propagated to
Google, Microsoft, Yahoo, or IMAP — so it protects against your own duplicate
requests, not against provider-side retries.

After an hour the key is free to reuse, which means it is not a permanent
"send this only once ever" guarantee. For that you still need your own record.

## The alternative

This repo also keeps an in-memory dedupe window keyed on content hash, which catches
duplicate *inbound* triggers before a send is ever attempted. The two are
complementary: content dedupe stops the request, the idempotency key stops the
delivery. Use both when a webhook you do not control can fire twice.

## Reference

- [email-idempotent-send.md](../reference/email-idempotent-send.md)
