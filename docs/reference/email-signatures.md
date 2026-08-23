<!--
  Vendored from https://developer.nylas.com/docs/v3/email/signatures.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Using email signatures

Source: https://developer.nylas.com/docs/v3/email/signatures/

The Nylas Signatures API lets you create and store HTML email signatures on Nylas, and reference them by ID when [sending messages](/docs/v3/email/send-email/) or creating drafts. Nylas appends the signature to the end of the email body at send time, including after quoted text in replies and forwards.

> **Warn:** 
> **Nylas signatures are separate from provider signatures.** Nylas does not sync signatures from the user's email provider (Gmail, Outlook, etc.), and signatures configured in the provider are not applied to emails sent through the Nylas API. If your users need signatures on Nylas-sent emails, you must create them using this API and pass the `signature_id` when sending.

Each grant supports up to 10 signatures, so users can maintain variants for different contexts (for example, "Work", "Personal", or "Mobile").

## How it works

Nylas stores signatures independently from the email provider. They live on Nylas and are managed entirely through the API:

1. **Create a signature** by POSTing HTML content to the Signatures API. Nylas stores it against the grant.
2. **Reference the signature** by passing its `signature_id` when sending a message or creating a draft.
3. **Nylas appends it** to the end of the email body at send time.

Because signatures are stored on Nylas, they work consistently across all providers. A signature you create once works the same whether the grant is connected to Gmail, Microsoft 365, or any other provider.

Here's what that looks like in practice. First, create a signature:

```bash [sigFlow-Create signature]

curl --request POST \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/signatures' \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --data '{
    "name": "Work Signature",
    "body": "<div><p><strong>Nick Barraclough</strong></p><p>Product Manager | Nylas</p><p><a href=\"mailto:nick@nylas.com\">nick@nylas.com</a></p></div>"
  }'


```

```json [sigFlow-Response (JSON)]

{
  "request_id": "abc-123",
  "data": {
    "id": "sig_abc123",
    "name": "Work Signature",
    "body": "<div><p><strong>Nick Barraclough</strong></p><p>Product Manager | Nylas</p><p><a href=\"mailto:nick@nylas.com\">nick@nylas.com</a></p></div>",
    "created_at": 1706367600,
    "updated_at": 1706367600
  }
}


```

Then reference it when sending an email:

```bash [sigFlow-Send with signature]
curl --request POST \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages/send' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{
    "subject": "Quarterly update",
    "to": [{
      "name": "Leyah Miller",
      "email": "leyah@example.com"
    }],
    "body": "<p>Hi Leyah, here is the quarterly update...</p>",
    "signature_id": "sig_abc123"
  }'
```

The recipient sees the message body followed by the signature. You don't need to concatenate anything yourself.

## Managing signatures

Signatures support full CRUD operations on `/v3/grants/{grant_id}/signatures` and `/v3/grants/{grant_id}/signatures/{signature_id}`:

| Operation | Method | Path |
|---|---|---|
| Create | POST | `/v3/grants/{grant_id}/signatures` |
| List all | GET | `/v3/grants/{grant_id}/signatures` |
| Get one | GET | `/v3/grants/{grant_id}/signatures/{signature_id}` |
| Update | PUT | `/v3/grants/{grant_id}/signatures/{signature_id}` |
| Delete | DELETE | `/v3/grants/{grant_id}/signatures/{signature_id}` |

Each signature has a `name` (a label like "Work" or "Personal") and a `body` (the HTML content). Nylas assigns an `id` and tracks `created_at` and `updated_at` timestamps.

A few details worth knowing:

- **Updating a signature doesn't change its ID.** If you update the `name` or `body`, the `id` stays the same. Any code referencing that signature keeps working.
- **Deleting a grant deletes its signatures.** You don't need to clean up signatures separately when removing a user's grant.
- **The limit is 10 signatures per grant.** Most users need two or three, but the headroom is there for applications that support more.

### List and retrieve signatures

To show users their existing signatures in a settings page, list all signatures for the grant:

```bash
curl --request GET \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/signatures' \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>'


```

```json [listSigs-Response (JSON)]

{
  "request_id": "abc-124",
  "data": [
    {
      "id": "sig_abc123",
      "name": "Work Signature",
      "body": "<div><p><strong>Nick Barraclough</strong></p><p>Product Manager | Nylas</p></div>",
      "created_at": 1706367600,
      "updated_at": 1706367600
    },
    {
      "id": "sig_def456",
      "name": "Personal Signature",
      "body": "<div><p>Nick B.</p><p>Sent from my phone</p></div>",
      "created_at": 1706367700,
      "updated_at": 1706367700
    }
  ]
}


```

To fetch a single signature (for example, to populate an edit form), use the signature ID:

```bash

curl --request GET \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/signatures/<SIGNATURE_ID>' \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>'


```

### Update a signature

To change a signature's label or HTML content, make a PUT request with the fields you want to update. You can include either or both.

```bash

curl --request PUT \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/signatures/<SIGNATURE_ID>' \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --data '{
    "name": "Updated Work Signature",
    "body": "<div><p><strong>Nick Barraclough</strong></p><p>Senior Product Manager | Nylas</p><p><a href=\"mailto:nick@nylas.com\">nick@nylas.com</a></p></div>"
  }'


```

### Delete a signature

```bash

curl --request DELETE \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/signatures/<SIGNATURE_ID>' \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>'


```

## Using signatures with send and drafts

The `signature_id` field works on three endpoints:

- **[Send Message](/docs/v3/email/send-email/#send-a-message-directly)** (`POST /v3/grants/{grant_id}/messages/send`) -- Nylas appends the signature when sending.
- **[Create Draft](/docs/v3/email/send-email/#create-and-send-a-draft)** (`POST /v3/grants/{grant_id}/drafts`) -- Nylas appends the signature to the draft body on creation.
- **[Send Draft](/docs/v3/email/send-email/#create-and-send-a-draft)** (`POST /v3/grants/{grant_id}/drafts/{draft_id}`) -- Nylas appends the signature when sending a draft that was created without one.

Nylas places the signature after a line break at the end of the body. For replies and forwards, it goes after the quoted text. Only one signature can be used per message or draft, and if you don't pass a `signature_id`, no signature is appended. There is no default signature behavior, and the provider's own signature setting is never applied to Nylas-sent emails.

### Switching signatures on a draft

If a draft was created with a signature and you want to change it, you need to update both the `signature_id` and the draft `body`. When Nylas creates the draft, it inserts the signature HTML directly into the body. To switch signatures, remove the old signature HTML from the body and pass the new `signature_id` on the send request.

> **Info:** 
> Nylas does not automatically strip the old signature when you pass a different `signature_id`. Your application is responsible for managing the body content when switching.

## Signature content

Signatures use HTML, so you have full control over formatting, links, images, and layout. Here are the details to keep in mind:

- **HTML format.** Signature content is HTML. Nylas appends it to the HTML email body. Plain text emails don't have signatures applied.
- **Images use external URLs.** Reference images with standard `<img>` tags pointing to hosted URLs (for example, `<img src="https://cdn.example.com/logo.png">`). Nylas does not provide image hosting, so host assets on your own CDN or a service like Cloudinary or Imgix.
- **100 KB per signature.** This is generous for signature HTML. Most signatures are well under 10 KB.
- **HTML is sanitized on input.** Nylas strips potentially unsafe tags and attributes when you create or update a signature, so the stored HTML is always safe to render.

## Typical integration pattern

Here's how most applications integrate signatures:

1. **Build a signature settings page.** Add a settings screen where users create and edit their Nylas-managed signatures. A rich text editor (like TipTap, Quill, or CKEditor) or a simple HTML textarea works well. Note that any signatures the user has configured in their email provider won't appear here, since Nylas signatures are stored separately.

2. **Store signatures via the API.** When a user saves a signature, POST it to `/v3/grants/{grant_id}/signatures`. Store the returned `id` so you can reference it later.

3. **Show a preview in the compose experience.** When a user composes a message, fetch their signatures and display a preview below the message body. If they have multiple signatures, let them pick one from a dropdown.

4. **Include `signature_id` in send and draft requests.** When the user sends or saves a draft, pass the selected `signature_id` in the request body. Nylas handles the rest.

5. **Support editing and deletion.** Let users update their signature HTML or delete signatures they no longer need. Because the signature ID is stable across updates, you don't need to update references elsewhere.

This pattern keeps your application in control of the user experience while Nylas handles storage and insertion.

## Error handling

Two signature-specific errors to handle:

| Status | Error type | When it happens |
|---|---|---|
| 400 | `invalid_request` | The `signature_id` doesn't exist or is malformed |
| 403 | `forbidden` | The `signature_id` belongs to a different grant |

Both errors are returned when you pass a `signature_id` on a send or draft request. Handle them by validating that the signature exists for the current grant before sending. For more on Nylas error responses, see [Error handling](/docs/api/errors/).

## Related resources

- [Sending messages](/docs/v3/email/send-email/) for how to send email and create drafts
- [Using templates and workflows](/docs/v3/email/templates-workflows/) for reusable message body content
- [Smart Compose](/docs/v3/email/smart-compose/) for AI-generated message bodies
- [Error handling](/docs/api/errors/) for the full Nylas error response format