<!--
  Vendored from https://developer.nylas.com/docs/reference/api/messages/send-message.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Send a Message

> **POST** `https://api.us.nylas.com/v3/grants/{grant_id}/messages/send`

Source: https://developer.nylas.com/docs/reference/api/messages/send-message/

Sends the specified message. If you want to send the message immediately, omit the `send_at` field
from your request. If you want to schedule it to be sent later, set `send_at` to the time you want
to send the message, in seconds using the Unix timestamp format.

For more information about scheduling messages, see
[Schedule messages to send in the future](/docs/v3/email/scheduled-send/).

To use a custom hostname for link click or message open tracking, provide
`tracking_options.domain_name`. Nylas validates that the authenticated organization owns an
active certificate for the hostname. If you omit the field, Nylas uses its regional tracking
hostname. Scheduled sends validate an explicit custom hostname when you create the schedule and
revalidate it immediately before delivery. If the hostname is no longer eligible, the scheduled
send fails without falling back to a Nylas hostname.

(Google and Microsoft Graph only) When scheduling a message, you can set `use_draft` to `true` to
save the message in the user's Drafts folder until it's sent.

Nylas also supports sending raw MIME messages. For more information, see [Send messages with MIME data](/docs/v3/email/headers-mime-data/#send-messages-with-mime-data).

### Limitations

Microsoft Graph and iCloud don't support the `List-Unsubscribe-Post` or `List-Unsubscribe` headers.

**Authentication:** NYLAS_API_KEY, ACCESS_TOKEN

## Parameters

### Query parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `fields` | string | No | Include message headers in the send response. Headers are returned in the same `headers` array format as [Get Message](/docs/reference/api/messages/get-messages-id/) responses.  - `standard`: Returns the standard send response (no `headers` array). - `include_headers`: Returns the full set of headers on the response. - `include_basic_headers`: Returns only the three RFC threading headers (`Message-ID`,   `In-Reply-To`, `References`). Use this option when you only need to track message identity   and thread relationships — payload size is significantly smaller than `include_headers`.  Supported on **synchronous** send only. The parameter has no effect when you set the `send_at` field on the request (scheduled send is asynchronous and doesn't return headers).  For provider support details, see [Using email headers and MIME data](/docs/v3/email/headers-mime-data/#provider-support). |

### Path parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `grant_id` | string | Yes | ID of the grant to access. You can also use the email address associated with the grant, or use `/me/` to refer to the grant associated with an access token. |

### Header parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `Idempotency-Key` | string | No | A unique, client-generated key (max 256 characters) that lets you safely retry this send request without sending duplicate emails. Nylas caches the response (success or error) for 1 hour, scoped per grant. A retry with the same key and payload returns the cached response with the `Idempotent-Response: true` header set. See [Idempotent send requests](/docs/v3/email/idempotent-send/) for the full retry behavior and error responses. |

## Request body

Content-Type: application/json, multipart/form-data

- `attachments` (array) - An array of files to be sent with the message.
  - `content` (string) - The Base64-encoded file content. See
[Working with email attachments](/docs/v3/email/attachments/#attachment-schemas-and-size-limits)
for more information.
  - `content_disposition` (string) - (Not supported for Microsoft and EWS) The content disposition of the file. Usually,
this is `inline` or `attachment`, followed by the file name.
  - `content_id` (string) - (Inline attachments only) The alphanumeric `cid` from the `<img>` tag in the HTML
message body. To avoid unexpected behavior in threads, make sure to use unique CIDs
across messages of a thread.
  - `content_type` (string) - The
[MIME type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types)
of the file. This is used by the email client to determine how to display the
attachment.
  - `filename` (string) - The file name.
- `bcc` (array) - A list of people BCC'd on the message.
  - `name` (string) - The name of the person BCC'd on the message.
  - `email` (string) - The email address of the person BCC'd on the message.
- `body` (string) - The HTML body of the message.
- `cc` (array) - A list of people CC'd on the message.
  - `name` (string) - The name of the person CC'd on the message.
  - `email` (string) - The email address of the person CC'd on the message.
- `custom_headers` (array) - An array of custom headers to add to the message.
  - `name` (string) - The header name.
  - `value` (string) - The header value.
- `from` (array) - The sender of the message. Accepts a single object in an array. If omitted, Nylas uses the
grant's email address and display name.
  - `name` (string) - The name of the user sending the message.
  - `email` (string) **(required)** - The email address of the user sending the message.
- `is_plaintext` (boolean) - When `true`, the message body is sent as plain text and the MIME data doesn't include the HTML version of the message. When `false`, the message body is sent as HTML.
- `metadata` (object) - The metadata associated with the object. For more information, see
[Metadata](/docs/reference/api/#metadata).
- `reply_to` (array) - A list of people who should receive replies to the message by default.
  - `name` (string) - The name of the person who should receive replies to the message.
  - `email` (string) - The email address of the person who should receive replies to the message.
- `reply_to_message_id` (string) - The ID of the message you're replying to. For Gmail and Microsoft Graph, this is the
message ID on the provider. For IMAP Send, this is the
[RFC822](https://datatracker.ietf.org/doc/html/rfc822#section-4.6.1) `Message-ID` header
of the message you're replying to.
- `send_at` (integer) - The time when Nylas should send the message, in seconds using the Unix timestamp format. This time must be
at least one minute in the future from the time you make your request. You can schedule
a message to be sent up to 30 days in the future. If the request includes
`tracking_options.domain_name`, Nylas validates the hostname when it creates the schedule
and revalidates it before delivery.
- `subject` (string) - The subject of the message.
- `template` (object) - The [template](/docs/reference/api/application-level-templates/) to use for the message. Can be overriden by the `body` and `subject` fields.
  - `id` (string) - The template ID.
  - `strict` (boolean) - When `true`, Nylas returns an error if the template contains variables that aren't
defined in the `variables` object.
  - `variables` (object) - A set of key/value pairs representing variables to substitute for values in the
template.
- `to` (array) **(required)** - A list of people that the message will be sent to.
  - `name` (string) - The name of the person the message will be sent to.
  - `email` (string) - The email address of the person the message will be sent to.
- `tracking_options` (object) - Tracking settings for the message. See [Track messages](/docs/v3/email/message-tracking/).
  - `opens` (boolean) - When `true`, enables
[message open tracking](/docs/v3/email/message-tracking/#message-open-tracking) on the
message. Nylas generates a
[`message.opened` webhook notification](/docs/reference/notifications/#message-opened-notifications)
when a participant first opens the message.
  - `thread_replies` (boolean) - When `true`, enables
[thread replied tracking](/docs/v3/email/message-tracking/#thread-replied-tracking)
on the message. Nylas generates a
[`thread.replied` webhook notification](/docs/reference/notifications/#thread-replied-notifications)
when a participant replies to the thread.
  - `links` (boolean) - When `true`, enables
[link clicked tracking](/docs/v3/email/message-tracking/#link-clicked-tracking) on the
message. Nylas generates a
[`message.link_clicked` webhook notification](/docs/reference/notifications/#link-clicked-notifications)
when a participant clicks a link in the message.
  - `label` (string) - A brief description of the message, why it's being tracked, or the tracking options
enabled.
  - `domain_name` (string) - The custom hostname to use for link click and message open tracking. The hostname must be
registered to the authenticated organization in the
[Nylas Dashboard](https://dashboard-v3.nylas.com/organization/domains?tab=hosted-auth) and have an
active certificate.

Custom tracking hostnames are available on select plans. Contact your Nylas account representative
or the [Nylas Sales team](https://www.nylas.com/contact-sales/) to enable this feature for your
organization.

Nylas trims surrounding whitespace, removes one trailing dot, and converts ASCII letters to
lowercase before looking up the hostname. Provide an ASCII fully qualified hostname without a URL
scheme, path, port, or wildcard.

You must enable `links`, `opens`, or both when you provide this field. A custom tracking hostname
does not support `thread_replies` by itself. If you omit this field, Nylas uses its regional
tracking hostname. Invalid, inactive, blocked, deleted, and unowned hostnames return the same
generic `400` response. If Nylas cannot complete the explicit ownership and certificate lookup, it
returns a `5xx` response without falling back to a Nylas hostname.
- `use_draft` (boolean) - (Google and Microsoft only) When `true`, Nylas saves the message in the user's Drafts folder
until its `send_at` time. This field can't be `true` if `send_at` is undefined.
- `signature_id` (string) - The ID of a [signature](/docs/v3/email/signatures/) to append to the message body. Nylas
inserts the signature after a line break at the end of the body, including after any quoted
text in replies and forwards. Only one signature can be used per message.

## Responses

### 200 - 200 OK

- `grant_id` (string) **(required)**
- `request_id` (string) **(required)**
- `data` (object) **(required)**
  - `attachments` (array) - An array of Attachment objects. For google, linked Google Drive files are not included. For Microsoft, linked One Drive files are not included.
    - `id` (string) **(required)** - The ID of the attachment.
    - `content_type` (string) - The [MIME type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types) of the attachment, used by the email client to determine how to display the attachment. If you don't provide a type, Nylas infers it from the file name.
The value of this field is exactly the same as the email attachment's `Content-Type` header.
The provider might set additional parameters, such as `name` and `charset`.

Nylas returns an empty `content_type` field if an attachment file name contains non-ASCII characters (for example, accented characters like `ü`). This is because Google can't detect its content type.
    - `filename` (string) - The file name of the attachment.
    - `grant_id` (string) - The ID of grant for the connected user.
    - `content_id` (string) - (Inline attachments only) The alphanumeric `cid` from the `<img>` tag in the message's HTML. For
example, you might see something like `<img src=\"cid:ce9b9547-9eeb-43b2-ac4e-58768bdf04e4\">` in
the message body.

Sometimes, the `content_id` value is contained in angle brackets (for example,
`<ce9b9547-9eeb-43b2-ac4e-58768bdf04e4>`).
    - `content_disposition` (string) - (Not supported for Microsoft and EWS) The content disposition of the attachment. Usually, this is `inline` or `attachment` followed by the file name (for example, `inline; filename="some-image.jpeg"`).
    - `is_inline` (boolean) - If `true`, indicates that the attachment is an inline file.
    - `size` (integer) - The size of the attachment, in bytes.
  - `bcc` (array) - An array of name/email address pairs that the message was BCC'd to. For received messages, this
is nearly always empty.
    - `name` (string)
    - `email` (string) **(required)**
  - `body` (string) - The body of the message. This field is the same as the `body` field in your request.
  - `cc` (array) - An array of name/email address pairs that the message was CC'd to.
    - `name` (string)
    - `email` (string) **(required)**
  - `date` (integer) - Unix timestamp in seconds that represents when _the mail server_ received the message. This might be
different from the unified `Date` header in a raw Message object.
  - `folders` (array) - The ID(s) of the folder(s) that the message appears in.

Microsoft messages can be in a single folder only. Google allows a single message to appear in
multiple folders.
  - `from` (array) - A list of name/email address pairs that the message was sent from. This is usually one pair only,
but can be many.
    - `name` (string)
    - `email` (string)
  - `grant_id` (string) - The ID of grant for the connected user.
  - `headers` (array) - An array of key-value pairs that contain the message headers. Nylas returns this field when you
set the `fields` query parameter on the send request to either `include_headers` or
`include_basic_headers`. This is supported for **synchronous** send only — the parameter has no
effect when you set the `send_at` field on the request.

- `fields=include_headers`: Returns the full set of headers on the response.
- `fields=include_basic_headers`: Returns only the three RFC threading headers (`Message-ID`,
  `In-Reply-To`, `References`). Use this option when you only need to track message identity and
  thread relationships — payload size is significantly smaller than `include_headers`.

A single message can sometimes have multiple headers with the same key name. Nylas adds all of
the headers to the `headers` array without merging or de-duplicating the data. When the headers
contain encoded data, Nylas adds it to the `headers` array without decoding it. If you need the
decoded data, you need to build decoding logic into your project.

Some headers might contain raw MIME information (for example,
`=?Windows-1252?Q?Re:_Candidature_de_Mme_Leyah_Miller?=`).
    - `name` (string) **(required)**
    - `value` (string) **(required)**
  - `id` (string) - A globally unique object identifier for Microsoft accounts. An email address for Google accounts.
  - `object` (string) - The object type of the response (in this case, `message`).
  - `reply_to` (array) - An array of name/email address pairs that should receive replies to the message.
    - `name` (string)
    - `email` (string) **(required)**
  - `reply_to_message_id` (string) - The unique identifier of the message to which you want to draft a reply.
  - `schedule_id` (string) - The ID of the scheduled message. Nylas returns the `schedule_id` if `send_at` is set.
  - `snippet` (string) - A short snippet (the first 100 characters, with HTML tags removed) of the message body. This is
useful for displaying a preview of the message.
  - `starred` (boolean) - When `true`, shows that the message has been starred by the user. For EWS, this is only supported
for Microsoft Exchange 2010 or later.
  - `subject` (string) - The subject of the message.
  - `thread_id` (string) - A reference to the parent Thread object. Every message is associated with a thread, whether that
thread contains only one message or many. If this is a new message, Nylas assigns a `thread_id`
to it.
  - `tracking_options` (object) - Tracking options for the message.
    - `opens` (boolean) - When `true`, shows that message open tracking is enabled.
    - `thread_replies` (boolean) - When `true`, shows that thread replied tracking is enabled.
    - `links` (boolean) - When `true`, shows that link clicked tracking is enabled.
    - `label` (string) - A label describing the message tracking purpose.
  - `to` (array) - An array of name/email address pairs that the message was sent to.
    - `name` (string)
    - `email` (string) **(required)**
  - `unread` (boolean) - When `true`, shows that the message has not been read by the user.
  - `use_draft` (boolean) - (Google and Microsoft only) If `true` when scheduling a message, Nylas saves the message in the user's
Drafts folder until it's sent. For more information, see
[Schedule messages to send in the future](/docs/v3/email/scheduled-send/).

### 202 - Email Send Accepted

- `grant_id` (string) **(required)**
- `request_id` (string) **(required)**
- `data` (object) **(required)**
  - `attachments` (array) - An array of Attachment objects. For google, linked Google Drive files are not included. For Microsoft, linked One Drive files are not included.
    - `id` (string) **(required)** - The ID of the attachment.
    - `content_type` (string) - The [MIME type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types) of the attachment, used by the email client to determine how to display the attachment. If you don't provide a type, Nylas infers it from the file name.
The value of this field is exactly the same as the email attachment's `Content-Type` header.
The provider might set additional parameters, such as `name` and `charset`.

Nylas returns an empty `content_type` field if an attachment file name contains non-ASCII characters (for example, accented characters like `ü`). This is because Google can't detect its content type.
    - `filename` (string) - The file name of the attachment.
    - `grant_id` (string) - The ID of grant for the connected user.
    - `content_id` (string) - (Inline attachments only) The alphanumeric `cid` from the `<img>` tag in the message's HTML. For
example, you might see something like `<img src=\"cid:ce9b9547-9eeb-43b2-ac4e-58768bdf04e4\">` in
the message body.

Sometimes, the `content_id` value is contained in angle brackets (for example,
`<ce9b9547-9eeb-43b2-ac4e-58768bdf04e4>`).
    - `content_disposition` (string) - (Not supported for Microsoft and EWS) The content disposition of the attachment. Usually, this is `inline` or `attachment` followed by the file name (for example, `inline; filename="some-image.jpeg"`).
    - `is_inline` (boolean) - If `true`, indicates that the attachment is an inline file.
    - `size` (integer) - The size of the attachment, in bytes.
  - `bcc` (array) - An array of name/email address pairs that the message was BCC'd to. For received messages, this
is nearly always empty.
    - `name` (string)
    - `email` (string) **(required)**
  - `body` (string) - The body of the message. This field is the same as the `body` field in your request.
  - `cc` (array) - An array of name/email address pairs that the message was CC'd to.
    - `name` (string)
    - `email` (string) **(required)**
  - `date` (integer) - Unix timestamp in seconds that represents when _the mail server_ received the message. This might be
different from the unified `Date` header in a raw Message object.
  - `folders` (array) - The ID(s) of the folder(s) that the message appears in.

Microsoft messages can be in a single folder only. Google allows a single message to appear in
multiple folders.
  - `from` (array) - A list of name/email address pairs that the message was sent from. This is usually one pair only,
but can be many.
    - `name` (string)
    - `email` (string)
  - `grant_id` (string) - The ID of grant for the connected user.
  - `headers` (array) - An array of key-value pairs that contain the message headers. Nylas returns this field when you
set the `fields` query parameter on the send request to either `include_headers` or
`include_basic_headers`. This is supported for **synchronous** send only — the parameter has no
effect when you set the `send_at` field on the request.

- `fields=include_headers`: Returns the full set of headers on the response.
- `fields=include_basic_headers`: Returns only the three RFC threading headers (`Message-ID`,
  `In-Reply-To`, `References`). Use this option when you only need to track message identity and
  thread relationships — payload size is significantly smaller than `include_headers`.

A single message can sometimes have multiple headers with the same key name. Nylas adds all of
the headers to the `headers` array without merging or de-duplicating the data. When the headers
contain encoded data, Nylas adds it to the `headers` array without decoding it. If you need the
decoded data, you need to build decoding logic into your project.

Some headers might contain raw MIME information (for example,
`=?Windows-1252?Q?Re:_Candidature_de_Mme_Leyah_Miller?=`).
    - `name` (string) **(required)**
    - `value` (string) **(required)**
  - `id` (string) - A globally unique object identifier for Microsoft accounts. An email address for Google accounts.
  - `object` (string) - The object type of the response (in this case, `message`).
  - `reply_to` (array) - An array of name/email address pairs that should receive replies to the message.
    - `name` (string)
    - `email` (string) **(required)**
  - `reply_to_message_id` (string) - The unique identifier of the message to which you want to draft a reply.
  - `schedule_id` (string) - The ID of the scheduled message. Nylas returns the `schedule_id` if `send_at` is set.
  - `snippet` (string) - A short snippet (the first 100 characters, with HTML tags removed) of the message body. This is
useful for displaying a preview of the message.
  - `starred` (boolean) - When `true`, shows that the message has been starred by the user. For EWS, this is only supported
for Microsoft Exchange 2010 or later.
  - `subject` (string) - The subject of the message.
  - `thread_id` (string) - A reference to the parent Thread object. Every message is associated with a thread, whether that
thread contains only one message or many. If this is a new message, Nylas assigns a `thread_id`
to it.
  - `tracking_options` (object) - Tracking options for the message.
    - `opens` (boolean) - When `true`, shows that message open tracking is enabled.
    - `thread_replies` (boolean) - When `true`, shows that thread replied tracking is enabled.
    - `links` (boolean) - When `true`, shows that link clicked tracking is enabled.
    - `label` (string) - A label describing the message tracking purpose.
  - `to` (array) - An array of name/email address pairs that the message was sent to.
    - `name` (string)
    - `email` (string) **(required)**
  - `unread` (boolean) - When `true`, shows that the message has not been read by the user.
  - `use_draft` (boolean) - (Google and Microsoft only) If `true` when scheduling a message, Nylas saves the message in the user's
Drafts folder until it's sent. For more information, see
[Schedule messages to send in the future](/docs/v3/email/scheduled-send/).

### 400 - Bad Request

- `request_id` (string) - The request ID.
- `error` (object) - The response error object.
  - `type` (string) - The error type.
  - `message` (string) - The error message.
  - `provider_error` (object) - The error from the provider.

### 403 - Unauthorized

- `request_id` (string) - ID of the request
- `error` (object) - Response error object.
  - `type` (string) - Error Type
  - `message` (string) - Error Message
  - `provider_error` (object) - Provider Error

### 409 - Conflict. Returned when an `Idempotency-Key` conflicts with an existing entry.

- `request_id` (string) - The request ID.
- `error` (object) - The response error object.
  - `type` (string) - The error type.
  - `message` (string) - The error message.

### 429 - Rate Limit

- `request_id` (string) - The request ID.
- `error` (object) - The response error object.
  - `type` (string) - The error type.
  - `message` (string) - The error message.

### 504 - Provider Failure

- `request_id` (string) - The request ID.
- `error` (object) - The response error object.
  - `type` (string) - The error type.
  - `message` (string) - The error message.

## Code samples

### cURL (application/json)

```bash
curl --request POST \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages/send' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{
		"subject": "Reaching Out with Nylas",
		"body": "Reaching out using the <a href='https://www.nylas.com/products/email-api/'>Nylas Email API</a>",
		"to": [{
			"name": "Leyah Miller",
			"email": "leyah@example.com"
		}],
		"tracking_options": {
			"opens": true,
			"links": true,
			"thread_replies": true,
			"label": "hey just testing"
		}
	}'
```

### cURL (multipart/form-data)

```bash (multipart/form-data)
curl --request POST \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages/send' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'Content-Type: multipart/form-data' \
  --form 'message="{
	\"subject\": \"Reaching Out with Nylas\",
	\"body\": \"Reaching out using the <a href='\''https://www.nylas.com/products/email-api/'\''>Nylas Email API</a>\",
	\"to\": [{
		\"name\": \"Leyah Miller\",
		\"email\": \"leyah@example.com\"
	}]
  }"'
```

### Node.js SDK

```javascript
import Nylas from "nylas";

const nylas = new Nylas({
  apiKey: "<NYLAS_API_KEY>",
  apiUri: "<NYLAS_API_URI>",
});

async function sendEmail() {
  try {
    const sentMessage = await nylas.messages.send({
      identifier: "<NYLAS_GRANT_ID>",
      requestBody: {
        to: [{ name: "Name", email: "<EMAIL>" }],
        replyTo: [{ name: "Name", email: "<EMAIL>" }],
        replyToMessageId: "<MESSAGE_ID>",
        subject: "Your Subject Here",
        body: "Your email body here.",
      },
    });

    console.log("Sent message:", sentMessage);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

sendEmail();

```

### Python SDK

```python
import os
import sys
from nylas import Client
from nylas import utils

nylas = Client(
    "<NYLAS_API_KEY>",
    "<NYLAS_API_URI>"
)

grant_id = "<NYLAS_GRANT_ID>"
email = "<EMAIL>"

attachment = utils.file_utils.attach_file_request_builder("Nylas_Logo.png")

message = nylas.messages.send(
  grant_id,
  request_body={
    "to": [{ "name": "Name", "email": email }],
    "reply_to": [{ "name": "Name", "email": email }],
    "reply_to_message_id": "<MESSAGE_ID>",
    "subject": "Your Subject Here",
    "body": "Your email body here.",
    "attachments": [attachment]
  }
)

print(message)

```

### Ruby SDK

```ruby
require 'nylas'

# Initialize the Nylas client
nylas = Nylas::Client.new(
  api_key: '<NYLAS_API_KEY>',
  api_uri: '<NYLAS_API_URI>'
)

grant_id = '<NYLAS_GRANT_ID>'
email = '<EMAIL>'

# Prepare the attachment
attachment = Nylas::FileUtils.attach_file_request_builder('Nylas_Logo.png')

# Send the message
message, _request_id = nylas.messages.send(
  identifier: grant_id,
  request_body: {
    to: [{ name: 'Name', email: email }],
    reply_to: [{ name: 'Name', email: email }],
    reply_to_message_id: '<MESSAGE_ID>',
    subject: 'Your Subject Here',
    body: 'Your email body here.',
    attachments: [attachment]
  }
)

puts message
```

### Java SDK

```java
import com.nylas.NylasClient;
import com.nylas.models.*;
import java.util.ArrayList;
import java.util.List;
import com.nylas.util.FileUtils;

public class SendEmails {
    public static void main(String[] args) throws 
    NylasSdkTimeoutError, NylasApiError {
        NylasClient nylas = new NylasClient.Builder("<NYLAS_API_KEY>").build();

        CreateAttachmentRequest attachment = FileUtils.attachFileRequestBuilder("src/main/java/Nylas_Logo.png");
        List<CreateAttachmentRequest> request = new ArrayList<>();
        request.add(attachment);

        List<EmailName> emailNames = new ArrayList<>();
        emailNames.add(new EmailName("john.doe@example.com", 
        "John Doe"));

        TrackingOptions options = 
        new TrackingOptions("hey just testing", true, true, true);

        SendMessageRequest requestBody = 
        new SendMessageRequest.Builder(emailNames).
                trackingOptions(options).
                subject("Hey Reaching Out with Nylas").
                body("Hey I would like to track this link <a href='https://espn.com'>My Example Link</a>.").
                attachments(request).
                build();

        Response<Message> email = 
        nylas.messages().send("<NYLAS_GRANT_ID>", requestBody);
        System.out.println(email.getData());
    }
}

```

### Kotlin SDK

```kotlin
import com.nylas.NylasClient
import com.nylas.models.*
import com.nylas.util.FileUtils

fun main(args: Array<String>) {

    val nylas: NylasClient = NylasClient(
        apiKey = "<NYLAS_API_KEY>"
    )

    val attachment: CreateAttachmentRequest = FileUtils.attachFileRequestBuilder("src/main/kotlin/Nylas_Logo.png")

    val options = TrackingOptions("hey just testing", true, true, true)

    val emailNames : List<EmailName> = listOf(EmailName("john.doe@example.com", 
    "John Doe"))
    val requestBody : SendMessageRequest = 
    SendMessageRequest.Builder(emailNames).
        subject("Hey Reaching Out with Nylas").
        body("Hey I would like to track this link <a href='https://espn.com'>My Example Link</a>").
        trackingOptions(options).
        attachments(listOf(attachment)).
        build()
    val email = nylas.messages().send("<NYLAS_GRANT_ID>", 
    requestBody)
    print(email.data)
}

```
