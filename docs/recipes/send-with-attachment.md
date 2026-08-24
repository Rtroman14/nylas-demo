# Send an email with a PDF attached

Working code: `attachments.fromFile` / `attachments.fromBuffer` in
[`src/Nylas.js`](../../src/Nylas.js), used by `POST /api/send` in
[`src/routes/email.js`](../../src/routes/email.js).

## From a file on disk

```js
import Nylas from "nylas";
import { createFileRequestBuilder } from "nylas/lib/esm/utils.js";

const sent = await nylas.messages.send({
    identifier: grantId,
    requestBody: {
        to: [{ email: "someone@example.com" }],
        subject: "Your invoice",
        body: "<p>Invoice attached.</p>",
        attachments: [createFileRequestBuilder("./invoice.pdf")],
    },
});
```

## From bytes already in memory

An upload arrives as a Buffer, so there is no path to hand the SDK helper:

```js
const attachment = {
    filename: file.originalname,
    contentType: file.mimetype,          // "application/pdf"
    content: file.buffer.toString("base64"),
    size: file.buffer.length,
};
```

This is what `Nylas.attachments.fromBuffer()` builds in this repo.

## Size limits decide the encoding

| Payload | Encoding | Limit |
| --- | --- | --- |
| Under 3MB | JSON, base64 in `attachments` | 3MB for the **entire** request |
| 3MB to 25MB | `multipart/form-data` | 25MB including the body |
| 25MB to 150MB | Upload session | Microsoft grants only, Beta |

The Node SDK switches from JSON to multipart automatically once the total payload
passes 3MB, so you normally do not choose. Two things to keep in mind anyway:

- The 3MB ceiling covers the whole HTTP request, not just the file. Base64 inflates
  binary by about 33%, so a 2.4MB PDF is already over.
- Send it to a real inbox before trusting it. Providers enforce their own limits
  below Nylas's.

## Inline images

An attachment with a `contentId` is treated as inline. Reference it from the body
with a `cid:` URL:

```js
{
    body: '<p>Logo: <img src="cid:logo123"></p>',
    attachments: [{
        filename: "logo.png",
        contentType: "image/png",
        content: base64,
        contentId: "logo123",           // alphanumeric only
    }],
}
```

If the `cid` has no matching reference in the body, the file still sends — it just
arrives as a normal attachment rather than displaying inline.

## Reading attachments off a received message

The attachment ID is on the message, so start there. Field selection keeps the
response small:

```js
const message = await nylas.messages.find({
    identifier: grantId,
    messageId,
    queryParams: { select: "attachments" },
});

const pdf = message.data.attachments.find((a) => a.contentType.startsWith("application/pdf"));

// messageId is required on the download, not optional.
const bytes = await nylas.attachments.downloadBytes({
    identifier: grantId,
    attachmentId: pdf.id,
    queryParams: { messageId },
});
```

Note the distinction: `contentId` is an internal reference used for inline display.
Downloads use the attachment's `id`.

## Provider quirks

Google Drive and OneDrive files usually arrive as **links in the body**, not as
attachments on the message. OneDrive always does. A message that looks empty of
attachments may still be carrying a file that way.

## Reference

- [email-attachments.md](../reference/email-attachments.md)
- [api-messages-send.md](../reference/api-messages-send.md)
