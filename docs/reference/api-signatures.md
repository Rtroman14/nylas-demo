<!--
  Vendored from https://developer.nylas.com/docs/reference/api/signatures.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Signatures

Source: https://developer.nylas.com/docs/reference/api/signatures/

The Nylas Signatures API lets you create and store HTML email signatures on Nylas, and reference them by ID when sending messages or creating drafts. Nylas appends the signature to the end of the email body at send time.

Nylas signatures are managed entirely through this API and are separate from any signatures configured in the user's email provider (Gmail, Outlook, etc.). Provider signatures are not synced to Nylas, and are not applied to emails sent through the Nylas API.

Each grant supports up to 10 signatures, so users can maintain variants for different contexts (for example, "Work", "Personal", or "Mobile"). Signatures are automatically deleted when the parent grant is deleted.

For more information, see the [Using email signatures](/docs/v3/email/signatures/) documentation.


## Endpoints

- **GET** `/v3/grants/{grant_id}/signatures` - [Return all signatures](https://developer.nylas.com/docs/reference/api/signatures/list-signatures/)
- **POST** `/v3/grants/{grant_id}/signatures` - [Create a signature](https://developer.nylas.com/docs/reference/api/signatures/post-signature/)
- **GET** `/v3/grants/{grant_id}/signatures/{signature_id}` - [Return a signature](https://developer.nylas.com/docs/reference/api/signatures/get-signature/)
- **PUT** `/v3/grants/{grant_id}/signatures/{signature_id}` - [Update a signature](https://developer.nylas.com/docs/reference/api/signatures/put-signature/)
- **DELETE** `/v3/grants/{grant_id}/signatures/{signature_id}` - [Delete a signature](https://developer.nylas.com/docs/reference/api/signatures/delete-signature/)
