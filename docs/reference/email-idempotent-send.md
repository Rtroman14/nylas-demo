<!--
  Vendored from https://developer.nylas.com/docs/v3/email/idempotent-send.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Idempotent send requests

Source: https://developer.nylas.com/docs/v3/email/idempotent-send/

Nylas's send endpoints accept an `Idempotency-Key` header so you can safely retry a send without delivering the same message twice. This is the cornerstone for any send pipeline that retries automatically: workflow engines, background queues that redeliver on worker crash, or client code that retries after a network blip.

## Supported endpoints

Both send endpoints accept the same `Idempotency-Key` header with the same semantics:

- **Grant-based send**: `POST /v3/grants/{grant_id}/messages/send` ([API reference](/docs/reference/api/messages/send-message/))
- **Transactional send** (Beta): `POST /v3/domains/{domain_name}/messages/send` ([API reference](/docs/reference/api/transactional-send/send-transactional-email/))

## Send a request with an Idempotency-Key

Generate a unique key per logical send (a UUID v4 is a safe choice) and pass it in the `Idempotency-Key` header:

```bash
curl --request POST \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages/send' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'Content-Type: application/json' \
  --header 'Idempotency-Key: f47ac10b-58cc-4372-a567-0e02b2c3d479' \
  --data '{
    "subject": "Welcome to Nylas",
    "to": [{ "name": "Leyah Miller", "email": "leyah@example.com" }],
    "body": "<p>Thanks for signing up!</p>"
  }'
```

```js [idempotentSend-Node.js]


const idempotencyKey = randomUUID();

const response = await fetch(
  `https://api.us.nylas.com/v3/grants/${grantId}/messages/send`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      subject: "Welcome to Nylas",
      to: [{ name: "Leyah Miller", email: "leyah@example.com" }],
      body: "<p>Thanks for signing up!</p>",
    }),
  },
);
```

```python
idempotency_key = str(uuid.uuid4())

response = requests.post(
    f"https://api.us.nylas.com/v3/grants/{grant_id}/messages/send",
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Idempotency-Key": idempotency_key,
    },
    json={
        "subject": "Welcome to Nylas",
        "to": [{"name": "Leyah Miller", "email": "leyah@example.com"}],
        "body": "<p>Thanks for signing up!</p>",
    },
)
```

### Key requirements

- **Max length**: 256 characters.
- **Uniqueness**: a key represents one logical send. Generate a fresh key for each new message.
- **Format**: any string up to 256 characters.

## Detect a cached response

When Nylas returns a cached response, the body and status code are identical to the original response, and the `Idempotent-Response` header is set to `true`. Check this header to tell whether the provider was actually contacted on this request:

```http
HTTP/1.1 200 OK
Idempotent-Response: true
Content-Type: application/json

{ "data": { ... }, "request_id": "..." }
```

The first request through a key never has this header set; only retries that hit the cache do.

## TTL and scope

- **TTL**: keys are valid for 1 hour after the first request. Once the TTL elapses, the key can be reused freely.
- **Grant-based send** is scoped per grant. The same key under two different grants creates two independent cache entries.
- **Transactional send** is scoped per Nylas application.

> **Warn:** 
> **Transactional send keys collide across domains in the same application.** If your application has multiple verified domains (for example, `mail.example.com` and `notifications.example.com`), an `Idempotency-Key` collides across all of them. For transactional send, generate keys that are unique within an application, not just within a domain.

## Idempotency error responses

| Status | Error type                            | When it happens                                                  |
| ------ | ------------------------------------- | ---------------------------------------------------------------- |
| `400`  | `api.invalid_idempotency_key`         | The `Idempotency-Key` header is longer than 256 characters.      |
| `409`  | `api.invalid_idempotent_request`      | A previous request used the same key with a different payload.  |
| `409`  | `api.concurrent_idempotent_request`   | A request with the same key is currently in flight.              |

Error response bodies follow the standard Nylas error shape (`request_id`, `error.type`, `error.message`). For the full error schema, see [Sending errors](/docs/v3/email/sending-errors/#nylas-error-responses).

## When and how to retry

Use this table to decide whether to reuse the original key or generate a new one:

| Response                                             | Retry with    | Notes                                                                                                                                          |
| ---------------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Network failure (no response received)               | Same key      | The cornerstone use case. The first request may or may not have reached Nylas. Retrying with the same key is safe.                             |
| `409 api.concurrent_idempotent_request`              | Same key      | Wait a few seconds and try again. Another caller is processing the same logical send.                                                          |
| `4xx` other than `api.concurrent_idempotent_request` | Different key | The request was rejected (bad payload, auth failure, validation error). Fix the underlying issue, then retry with a fresh key.                 |
| `5xx` from Nylas (not a provider error)              | Usually same key | Retry behavior here isn't as well-defined -- it depends on the error and when it happened (e.g. an uncaught exception, or upstream timeout can each leave the send in different states). It is recommended to evaluate the error type/message to determine retry behavior. **As a general rule, retry with the same key.** Example: Nylas returns a `504 Gateway Timeout` however the provider completed the send but was delayed. Keep retrying with the same key until the real send response is echoed back. While the original request is still in flight you may see `409 api.concurrent_idempotent_request`; once it settles, the cached response (success or error) is returned. |
| `5xx` provider error                                 | Different key | The provider rejected the message. Address the cause, then retry with a fresh key. Reusing the original key would just return the same error. |

## Limitations

- **Idempotency is enforced at the Nylas layer only.** Nylas does not propagate the key to downstream providers (Google, Microsoft, Yahoo, IMAP, EWS).
- **TTL is fixed at 1 hour** so you should implement retries within this time period.