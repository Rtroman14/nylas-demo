<!--
  Vendored from https://developer.nylas.com/docs/v3/email/attachments.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Using the Attachments API

Source: https://developer.nylas.com/docs/v3/email/attachments/

The [Attachments APIs](/docs/reference/api/attachments/) allow you to download or get the metadata about an existing attachment, but you use the Messages or Drafts APIs to add or modify the attachments.

> **Hint:** 
> **Sending files larger than 25MB?** For Microsoft grants, Nylas supports attachments up to 150MB via the beta [large attachments flow](/docs/v3/email/send-large-attachments/). You upload the file once, then reference its ID in your send request.

## What counts as an attachment?

In messages, an attachment is any file that is included either inline as part of a message, or attached as a separate file to the message.

However, major email providers such as Google and Microsoft have their own cloud storage ("drive") services, which usually appear as links in the message body instead of attachments on the message object. Google Drive allows users to attach files either as a link, or as an actual attachment. Microsoft One Drive attachments always appear as links in the message body.

## Attachment schemas and size limits

Nylas supports two ways to add attachments to messages and drafts:

- Using the [`application/json` schema](#json-schema). With this format, you pass attachment content as Base64-encoded strings in the `attachments` object on a Message or Draft.
- Using the [`multipart/form` schema](#multipart-schema). With this format, you break your message into parts, each of which can have their own MIME format.

### JSON schema

When you add attachments to messages and drafts using the `application/json` schema, you pass the contents of the attachments as Base64-encoded strings in the `attachments` object, as in the following example.

> **Info:** 
> **This method is limited to request payloads of 3MB or smaller**. The size limit includes the entire HTTP request, not just the attachment content.
> 
> For files larger than 25MB (up to 150MB), use the separate [large attachments flow](/docs/v3/email/send-large-attachments/) for Microsoft grants.

```bash
curl --request PUT \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/drafts/<DRAFT_ID>' \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{
    "subject": "Happy Birthday from Nylas!",
    "body": "Wishing you the happiest of birthdays. <img src=\"cid:123456hbd\"> \n Fondly, \n Nylas",
    "to": [{
      "name": "Leyah Miller",
      "email": "leyah@example.com"
    }],
    "attachments": [
      {
        "content_type": "image/png; name=\"nylas-hbd.png\"",
        "filename": "nylas-hbd.png",
        "content": "<Base64-encoded picture content>",
        "content_id": "123456hbd"
      },
      {
        "content_type": "application/ics",
        "filename": "invite.ics",
        "content": "<Base64-encoded ICS file>",
        "content_id": "7890bdnyl"
      }
    ]
  }'
```

### Multipart schema

When you add attachments to messages or drafts using the `multipart/form` schema, you break the message into parts, each of which can have its own MIME format. The message schema at the start of a multipart request is the same as in a normal cURL request.

Nylas recommends using this schema if you're adding a lot of attachments or if the files are large to avoid encountering provider limitations.

> **Info:** 
> **Multipart messages are limited to 25MB**. This size limit includes the body content.
> 
> If you are sending to Microsoft (Outlook or Exchange Online) and your file is larger than 25MB, use the [large attachments flow](/docs/v3/email/send-large-attachments/) to send attachments up to 150MB.

```bash [multipart-Example cURL request]
curl --request POST \
  --url 'https://api.us.nylas.com/v3/grants/<GRANT_ID>/drafts' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'content-type: multipart/form-data' \
  --form 'message={
    "subject": "Happy Birthday from Nylas!",
    "body": "Wishing you the happiest of birthdays. \n Fondly, \n -Nylas <123456aklkdfanl>",
    "to": [{
      "name": "Leyah Miller",
      "email": "leyah@example.com"
    }]
  }' \
  --form 'kldj234567hbd2u=@/file/path/to/attachment/invite.ics' \
  --form '123456aklkdfanl=@/file/path/to/attachment/nylas-hbd.png'
```

```txt [multipart-Example raw multipart message]
// Example Multipart Email:
From: nyla@example.com
To: jacob.doe@example.com
Subject: Happy Birthday from Nylas!
Content-Type: multipart/alternative; boundary="boundary-string"

--your-boundary
Content-Type: text/plain; charset="utf-8"
Content-Transfer-Encoding: quoted-printable
Content-Disposition: inline

Wishing you the happiest of birthdays. \n Fondly, \n -Nylas

//This section is the fallback in case the email client does not support HTML.
--boundary-string
Content-Type: text/html; charset="utf-8"
Content-Transfer-Encoding: quoted-printable
Content-Disposition: inline

<h1>Happy Birthday!</h1>
<p>Wishing you the happiest of birthdays. <\br> Fondly, <\br> -Nylas</p>
<p>This section displays in most modern email clients.</p>
<img src="cid:the-cid-of-this-file-is-12345" alt="Happy Birthday from Nylas!"=>

--boundary-string--

--the-cid-of-this-file-is-12345
Content-Type: image/png
Content-ID: <nylas-hbd.png>
Content-Disposition: inline; filename="nylas-hbd.png"

[IMAGE content]

--the-cid-of-this-file-is-12345--

--this-is-an-invite-file
Content-Type: application/ics
Content-ID: <invite.ics>
Content-Disposition: attachment; filename="invite.ics"

[ICS file content]

--=_8ab337ec2e38e1a8b82a01a5712a8bdb--
```

In most cases, you should use an SDK for your project language to prepare multipart form data, since most languages include a helper library that simplifies formatting.

## Add attachments to messages or drafts

You can add attachments to a message [when you send it](/docs/reference/api/messages/send-message/), or when you [create](/docs/reference/api/drafts/post-draft/) or [update](/docs/reference/api/drafts/put-drafts-id/) a draft, by adding the attachments as content to the `attachments` array.

If a draft already has attachments and you send an update request with an `attachments` array, Nylas replaces the existing attachments list on the draft with the exact list you provide.

The encoding format you use depends on the total size of the HTTP payload of your message, as noted above.

Nylas recommends using the [`multipart/form-data` schema](#multipart-schema) if you're adding a lot of attachments, or if the attachments are large. Nylas can send up to 25MB of attachments using multipart before encountering provider limitations.

```bash
curl --request PUT \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/drafts/<DRAFT_ID>' \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{
    "attachments": [
      {
        "content_type": "image/png; name=\"logo.png\"",
        "filename": "logo.png",
        "content": "<Base64-encoded picture content>"
      },
      {
        "content_type": "application/ics",
        "filename": "invite.ics",
        "content": "<Base64-encoded ICS file>"
      }
    ]
  }'
```

## Get attachment information

Use the [Return Attachment Metadata endpoint](/docs/reference/api/attachments/get-attachments-id/) to get information about specific attachments by ID.

```bash
curl --compressed --request GET \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/attachments/<ATTACHMENT_ID>?message_id=<MESSAGE_ID>' \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>'


```

```json [group_1-Response (JSON)]
{
  "request_id": "5fa64c92-e840-4357-86b9-2aa123456789",
  "data": {
    "content_type": "image/png; name=\"pic.png\"",
    "filename": "pic.png",
    "grant_id": "<NYLAS_GRANT_ID>",
    "content_id": "185e56cb50e12e82",
    "size": 13068,
    "content_id": "<ce9b9547-9eeb-43b2-ac4e-58768bdf04e4>"
  }
}
```

To find the attachment ID, you can start with the ID of the message that the file is attached to, then make a [Get Message request](/docs/reference/api/messages/get-messages-id/) using field selection (`?select=attachments`) to return just the `attachments` object from the message. From there you can parse the response to find the ID of the attachment you want.

```bash
curl -L 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages/<MESSAGE_ID>?select=attachments' \
  -H 'Authorization: Bearer <NYLAS_API_KEY>'
```

```json [group_2-Reponse (JSON)]
{
  "request_id": "041d52e4-fe02-49d9-aeb6-3f0987654321",
  "data": {
    "attachments": [
      {
        "content_disposition": "attachment; filename=\"nylas-logo.png\"",
        "content_id": "ii_123456789",
        "content_type": "image/png; name=\"nylas-logo.png\"",
        "filename": "nylas-logo.png",
        "grant_id": "<NYLAS_GRANT_ID>",
        "id": "<ATTACHMENT_ID>",
        "is_inline": true,
        "size": 4452
      },
      {
        "content_disposition": "attachment; filename=\"invite.ics\"",
        "content_id": "ii_987654321",
        "content_type": "application/ics; name=\"invite.ics\"",
        "filename": "invite.ics",
        "grant_id": "<NYLAS_GRANT_ID>",
        "id": "<ATTACHMENT_ID>",
        "is_inline": false,
        "size": 2456
      }
    ]
  }
}
```

## Update or remove an attachment from a draft

Nylas only updates the fields you include in your requests, so you can make an [Update Draft request](/docs/reference/api/drafts/put-drafts-id/) and only pass the `attachments` object to update just the attachments.

To update a file's content or filename, update the attachments list with the corrected content. Nylas replaces the entire `attachments` array with your new values.

To remove a attachment from a draft, make an update draft request, include just the `attachments` object, and leave out the file you want to remove.

```bash
curl --request PUT \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/drafts/<DRAFT_ID>' \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{
    "attachments": [{
      "content_type": "image/png; name=\"logo.png\"",
      "filename": "pic.png",
      "content": "<BASE_64_PICTURE_CONTENT>"
    }]
  }'
```

## Working with inline attachments

How you work with inline attachments depends on which schema you're using to send your message.

If you're using the [`application/json` schema](#json-schema), set up `<cid>` references in the message body where the files should appear, then pass the CIDs as the `content_id` for the associated attachment. If Nylas can't find the associated `cid` reference, the attachment is still added to the message, but does not display inline. The `cid` should only be alphanumeric characters.

```bash {8,18,24}
curl --request PUT \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/drafts/<DRAFT_ID>' \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{
    "subject": "Happy Birthday from Nylas!",
    "body": "Wishing you the happiest of birthdays. <img src=\"cid:123456hbd\"> \n Fondly, \n Nylas",
    "to": [{
      "name": "Leyah Miller",
      "email": "leyah@example.com"
    }],
    "attachments": [
      {
        "content_type": "image/png; name=\"nylas-hbd.png\"",
        "filename": "nylas-hbd.png",
        "content": "<BASE_64_PICTURE_CONTENT>",
        "content_id": "<CID>"
      },
      {
        "content_type": "application/ics",
        "filename": "invite.ics",
        "content": "<BASE_64_ICS_FILE>",
        "content_id": "<CID>"
      }
    ]
  }'
```

If you include a `content_id` in an attachment, Nylas assumes it should be displayed inline.

If you're using the [`multipart/form-data` schema](#multipart-schema), attach the files using the multipart schema, then make a [Get Message request](/docs/reference/api/messages/get-messages-id/) and check the form IDs to find the content IDs you can include in the message body.