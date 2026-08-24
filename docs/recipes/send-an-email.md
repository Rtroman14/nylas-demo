# Send an email

Working code: [`src/Nylas.js`](../../src/Nylas.js) (`messages.send`) and
[`src/routes/email.js`](../../src/routes/email.js) (`POST /api/send`).

## Minimum

```js
const sent = await nylas.messages.send({
    identifier: grantId,
    requestBody: {
        to: [{ email: "someone@example.com", name: "Someone" }],
        subject: "Hello",
        body: "<p>Sent with the Nylas Email API.</p>",
    },
});

console.log(sent.data.id, sent.data.threadId);
```

`to` is an array of `{ email, name }` objects, not a string. The demo's
`Nylas.toAddresses()` helper accepts a bare string and normalizes it, because
callers almost always have one.

## What comes back

The sent message, including the two IDs worth keeping:

- `id` — pass as `replyToMessageId` to continue the thread later
- `threadId` — how you recognize an inbound reply as belonging to this conversation

Store `threadId` if you care about replies. See
[detect-replies.md](detect-replies.md).

## Useful fields

| Field | Notes |
| --- | --- |
| `cc`, `bcc` | Same array-of-objects shape as `to` |
| `replyTo` | Sets the Reply-To header. **Not** the same as `replyToMessageId` |
| `replyToMessageId` | Threads this message under an existing one |
| `signatureId` | Nylas appends a stored signature server-side. HTML bodies only |
| `attachments` | See [send-with-attachment.md](send-with-attachment.md) |
| `trackingOptions` | `{ opens, links, threadReplies, label }`. Nylas trial/sandbox apps reject this with "Tracking options are not allowed for trial accounts." |
| `sendAt` | Unix seconds; schedules the send |
| `customHeaders` | Arbitrary outbound headers |

## HTML vs plaintext

The API decides from what you send. `body` containing HTML is delivered as HTML.
Two consequences worth knowing before you pick:

- **Signatures require HTML.** A plaintext body silently gets no signature applied.
- **HTML ignores newlines.** Line breaks come from tags. If your source text is plain
  prose with `\n` in it, escape it and convert the newlines to `<br>` — otherwise the
  whole message renders as one paragraph.

```js
const escapeHtml = (text) =>
    String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const html = `<div style="font-family:Arial,sans-serif;font-size:14px;">
    ${escapeHtml(text).replace(/\r\n|\r|\n/g, "<br>")}
</div>`;
```

## Sending is synchronous

The request blocks until the provider accepts or rejects the message, and Nylas does
**not** retry a failed send. A `200` means the provider took it.

Delivery is a separate question from acceptance. For that, subscribe to
`message.send_success` and `message.send_failed`, and to `message.bounced` if you
need bounce handling.

## Rate limits

| Scope | Limit |
| --- | --- |
| Nylas, JSON send | 200 requests/second per grant |
| Nylas, multipart send | 10 requests/second per grant |
| Google | 2,000 sends/day per user |
| Microsoft | 30 sends/minute |

Provider limits are the ones you actually hit. Back off exponentially on `429` and
respect `Retry-After`.

## Failure modes

| Error | Meaning |
| --- | --- |
| `401 unauthorized` | Bad API key, or a grant that needs re-authentication |
| `403` | The grant lacks the send scope — Google needs `gmail.send`, Microsoft needs `Mail.Send` |
| `404 not_found_error` | Wrong grant ID, or the wrong region host |
| `429 rate_limit_error` | Back off; check `Retry-After` |

## Reference

- [email-send-email.md](../reference/email-send-email.md)
- [api-messages-send.md](../reference/api-messages-send.md)
