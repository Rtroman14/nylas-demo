# Reply so it stays in the same thread

Working code: `messages.reply` in [`src/Nylas.js`](../../src/Nylas.js), exposed as
`POST /api/reply` in [`src/routes/email.js`](../../src/routes/email.js).

## The one field that matters

`replyToMessageId`. Nylas derives the `In-Reply-To` and `References` headers from
that message, and those headers are what every mail client uses to group a
conversation.

```js
await nylas.messages.send({
    identifier: grantId,
    requestBody: {
        to: [{ email: "lead@example.com" }],
        subject: "Re: Your roof quote",
        body: "<p>Following up on this.</p>",
        replyToMessageId: previousMessageId,
    },
});
```

Setting a matching subject is not enough on its own. Without `replyToMessageId` the
provider may start a new conversation.

Do not confuse it with `replyTo`, which is an array of addresses that sets the
Reply-To header. Different field, unrelated purpose.

## The trap: who are you replying to

In a sequence, the message you are chaining off is usually **one you sent**. Its
`from` is your own mailbox. Resolving recipients from it mails the sequence back to
yourself.

Pass `to` explicitly whenever you know it. When you have to derive it, take everyone
on the original minus your own address:

```js
const ourEmail = (await nylas.grants.find({ grantId })).data.email.toLowerCase();
const original = (await nylas.messages.find({ identifier: grantId, messageId })).data;

const seen = new Set();
const recipients = [...(original.from ?? []), ...(original.to ?? [])].filter((addr) => {
    const key = addr.email?.toLowerCase();
    if (!key || key === ourEmail || seen.has(key)) return false;
    seen.add(key);
    return true;
});
```

This is what `Nylas.messages.reply()` does when `to` is omitted.

**It merges `from` and `to` only — `cc` is dropped.** That is correct for a plain reply
and wrong for a thread where other people were copied in, such as a homeowner who
looped in a spouse. If the whole group should stay on the thread, read the original and
pass `to` and `cc` yourself; do not rely on the fallback.

## Verified behaviour

Both shapes were run against a live Google grant. Replying to **your own** last send
with `to` omitted, and replying to **their** newest message:

| | Chained off our own send | Chained off their reply |
| --- | --- | --- |
| `thread_id` | unchanged | unchanged |
| `subject` | `Re: <original>` | `Re: <original>` |
| `to` | the other party, not us | the other party |
| `In-Reply-To` | set | set |
| `References` | set | full chain, both prior IDs |

The recipient's Gmail grouped each one into the existing conversation rather than
starting a new one. Chaining off the newest message is what produces the complete
`References` chain in the second column.

## Subject

Nylas does not prefix it for you. `Re: ` if it is not already there:

```js
const subject = /^re:/i.test(original.subject) ? original.subject : `Re: ${original.subject}`;
```

## Reading a conversation

Threads and messages are separate calls, on purpose:

```js
// Metadata and message IDs. No bodies.
const thread = await nylas.threads.find({ identifier: grantId, threadId });

// Bodies.
const messages = await nylas.messages.list({
    identifier: grantId,
    queryParams: { threadId, limit: 50 },
});
```

The threads endpoint returns `messageIds`, `participants`, `subject`, `snippet`, and
`latestDraftOrMessage` — but not the body of every message. Reading a full
conversation always means coming back through `/messages`.

## Threads are trees, not lists

Replying to an older message in a thread branches it. All branches keep the same
`threadId`, so a thread is not necessarily a straight line. If ordering matters,
sort by `date` rather than assuming the array is chronological.

## Reference

- [email-threads.md](../reference/email-threads.md)
- [api-messages-send.md](../reference/api-messages-send.md)
