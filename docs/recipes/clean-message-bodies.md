# Strip quoted replies and signatures from a message

A reply body contains the whole conversation history plus a signature. Feeding that
to an LLM or showing it in a UI means dealing with hundreds of lines of quoted text
to get at the two sentences the person actually wrote.

Working code: `messages.clean` in [`src/Nylas.js`](../../src/Nylas.js).

## The endpoint

`PUT /v3/grants/{grant_id}/messages/clean` — note it is a **PUT**, and `message_id`
is an **array**.

```js
const cleaned = await nylas.messages.cleanMessages({
    identifier: grantId,
    requestBody: {
        messageId: [messageId],          // up to 20 per request
        removeConclusionPhrases: true,
    },
});

console.log(cleaned.data[0].conversation);   // just the new content
```

The cleaned text comes back on a **`conversation`** field alongside the original
message. The original `body` is untouched.

## Options

| Option | Default | Effect |
| --- | --- | --- |
| `ignoreLinks` | `true` | Strip hyperlinks |
| `ignoreImages` | `true` | Strip images |
| `ignoreTables` | `true` | Strip tables |
| `imagesAsMarkdown` | `false` | Render images as markdown instead |
| `htmlAsMarkdown` | `false` | Return the body as markdown |
| `removeConclusionPhrases` | `true` | Drop "Best regards" and similar. **English only** |

Setting both `imagesAsMarkdown` and `htmlAsMarkdown` to `true` adds an
`email_as_markdown` field to the response.

Results are cached, so cleaning the same message twice is cheap.

## Doing it at delivery instead

Subscribing to `message.created.cleaned` gets cleaned markdown delivered directly in
the webhook `body`, with no follow-up call.

Two things to know:

- Subscribing to `.cleaned` does **not** suppress `message.created`. Subscribe to
  both and you get two notifications per message.
- It requires Clean Conversations configured on the application in the dashboard.

## Limits

- 20 message IDs per request.
- `removeConclusionPhrases` only understands English sign-offs.
- Cleaning is heuristic. It is very good on standard reply chains and less reliable
  on unusual formatting, so do not rely on it for anything security-sensitive.

## Reference

- [email-parse-messages.md](../reference/email-parse-messages.md)
- [api-messages-clean.md](../reference/api-messages-clean.md)
