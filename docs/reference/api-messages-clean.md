<!--
  Vendored from https://developer.nylas.com/docs/reference/api/messages/clean-messages.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Clean messages

> **PUT** `https://api.us.nylas.com/v3/grants/{grant_id}/messages/clean`

Source: https://developer.nylas.com/docs/reference/api/messages/clean-messages/

Removes extra information from structured messages.

**Note**: Nylas removes all extra information, such as `<script>` and `<style>` tags, regardless
of the configuration.

**Authentication:** NYLAS_API_KEY, ACCESS_TOKEN

## Parameters

### Query parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `select` | string | No | Specify fields that you want Nylas to return, as a comma-separated list (for example, `select=id,updated_at`). This allows you to receive only the portion of object data that you're interested in. You can use `select` to optimize response size and reduce latency by limiting queries to only the information that you need. |
| `shared_from` | string | No | (Microsoft only) When provided, Nylas returns items that were shared from the specified email address. It also accepts grant ID. This parameter only accepts single email address or grant ID. Check out the [Shared folders](/docs/provider-guides/microsoft/shared-folders) guide for more information. |

### Path parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `grant_id` | string | Yes | ID of the grant to access. Use `/me/` to refer to the grant associated with an access token. |

## Request body

Content-Type: application/json

- `message_id` (array) - An array of IDs for the messages Nylas will clean.
- `ignore_links` (boolean) - If `true`, removes link-related tags (`<a>`) from the message while keeping the text.
- `ignore_images` (boolean) - If `true`, removes images from the message.
- `images_as_markdown` (boolean) - If `true`, converts images in the message to
[Markdown](https://en.wikipedia.org/wiki/Markdown). Can't be `false` when `html_as_markdown`
is `true`.
- `ignore_tables` (boolean) - If `true`, removes table-related tags (`<table>`, `<th>`, `<td>`, `<tr>`) from the message
while keeping rows.
- `remove_conclusion_phrases` (boolean) - If `true`, removes phrases such as "Best" and "Regards" from the message signature.
- `html_as_markdown` (boolean) - **This property is in beta**. If `true`, converts the message to
[Markdown](https://en.wikipedia.org/wiki/Markdown). Can't be `true` when
`images_as_markdown` is `false`.

## Responses

### 200 - Clean message response

- `request_id` (string) - The request ID.
- `data` (array)
  - `attachments` (array) - An array of Attachment objects. For Google, linked Google Drive files are not included. For
Microsoft, linked OneDrive files are not included.
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
  - `body` (string) - The body of the message as either plain-text or HTML content. If the message has both plain-text
and HTML, Nylas returns the HTML version.
  - `cc` (array) - An array of name/email address pairs that the message was CC'd to.
    - `name` (string)
    - `email` (string) **(required)**
  - `date` (integer) - Unix timestamp in seconds that represents when _the mail server_ received the message. This might be
different from the unified `Date` header in a raw Message object.
  - `folders` (array) - The IDs of the folders that the message appears in. Microsoft messages can be in a single folder
only. Google allows a single message to appear in multiple folders.
  - `from` (array) - A list of name/email address pairs that the message was sent from. This is usually one pair only,
but can be many.
    - `name` (string)
    - `email` (string)
  - `grant_id` (string) - The ID of grant for the connected user.
  - `headers` (array) - An array of key-value pairs that contain the message headers. Nylas returns this field when you
set the `fields` query parameter to either `include_headers` or `include_basic_headers`.

- `fields=include_headers`: Returns the full set of headers on the message.
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
  - `in_reply_to` (string) - (EWS only) The ID of the message that this message replies to. This ID is the same as the
`In-Reply-To` header.
  - `metadata` (object) - The metadata associated with the object. For more information, see
[Metadata](/docs/reference/api/#metadata).
  - `object` (string) - The object type of the response (in this case, `message`).
  - `raw_mime` (string) - A Base64url-encoded string containing the message data (including the body content).

To get the raw MIME content for a message, set the `fields` query parameter to `raw_mime` in
your request. When you request raw MIME data, Nylas returns the `grant_id`, `object`, `id`,
and `raw_mime` fields only.
  - `reply_to` (array) - An array of name/email address pairs that should receive replies to the message.
    - `name` (string)
    - `email` (string) **(required)**
  - `snippet` (string) - A short snippet (the first 100 characters, with HTML tags removed) of the message body. This is
useful for displaying a preview of the message.
  - `starred` (boolean) - If `true`, shows that the message has been starred by the user. For EWS, this is only supported
on Microsoft Exchange 2010 or later.
  - `subject` (string) - The subject of the message.
  - `thread_id` (string) - A reference to the parent Thread object. Every message is associated with a thread, whether that
thread contains one message or many. If the message is new, Nylas assigns a `thread_id` to it.
  - `to` (array) - An array of name/email address pairs that the message was sent to.
    - `name` (string)
    - `email` (string) **(required)**
  - `tracking_options` (object) - Tracking options for the message.
    - `opens` (boolean) - When `true`, shows that message open tracking is enabled.
    - `thread_replies` (boolean) - When `true`, shows that thread replied tracking is enabled.
    - `links` (boolean) - When `true`, shows that link clicked tracking is enabled.
    - `label` (string) - A label describing the message tracking purpose.
  - `unread` (boolean) - If `true`, shows that the message has not been read by the user.
  - `conversation` (string) - The cleaned message body. If `html_as_markdown` is `true`, the text is
Markdown-formatted. Otherwise, Nylas returns plain text.

### 400 - Bad Request

- `request_id` (string) - The request ID.
- `error` (object) - The response error object.
  - `type` (string) - The error type.
  - `message` (string) - The error message.
  - `provider_error` (object) - The error from the provider.

### 401 - Unauthorized

- `request_id` (string) - The request ID.
- `error` (object) - The response error object.
  - `type` (string) - The error type.
  - `message` (string) - The error message.
  - `provider_error` (object) - The error from the provider.

### 404 - Not Found

- `request_id` (string) - The request ID.
- `error` (object) - The response error object.
  - `type` (string) - The error type.
  - `message` (string) - The error message.
  - `provider_error` (object) - The raw error from the provider, if available
    - `code` (string)
    - `message` (string)

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

### cURL

```bash
curl --compressed --request PUT \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages/clean' \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --data '{
    "message_id": ["<MESSAGE_ID>"],
    "ignore_links": true,
    "ignore_images": true,
    "images_as_markdown": false,
    "ignore_tables": true,
    "remove_conclusion_phrases": true,
    "html_as_markdown": false
  }'
```

### Node.js SDK

```javascript
import Nylas from "nylas";

const nylas = new Nylas({
  apiKey: "<NYLAS_API_KEY>",
  apiUri: "<NYLAS_API_URI>",
});

async function cleanMessages() {
  try {
    const messages = await nylas.messages.cleanMessages({
      identifier: "<NYLAS_GRANT_ID>",
      requestBody: {
        messageId: ["<MESSAGE_ID>"],
        ignoreImages: true,
        ignoreLinks: true,
        ignoreTables: true,
        imagesAsMarkdown: true,
        removeConclusionPhrases: true,
      },
    });

    console.log("Cleaned messages:", messages);
  } catch (error) {
    console.error("Error cleaning messages:", error);
  }
}

cleanMessages();

```

### Python SDK

```python
from nylas import Client

nylas = Client(
    api_key = "<NYLAS_API_KEY>"
)

request_body = {
            "message_id": ["<MESSAGE_ID>"],
            "ignore_images": True,
            "ignore_links": True,
            "ignore_tables": True,
            "images_as_markdown": True,
            "remove_conclusion_phrases": True,
        }

response = nylas.messages.clean_messages("<NYLAS_GRANT_ID>",
                                         request_body=request_body).data
print(response[0].body)

```

### Ruby SDK

```ruby
require 'nylas'

nylas = Nylas::Client.new(
  api_key: "<NYLAS_API_KEY>"
)

request_body = {
  message_id: ["<MESSAGE_ID>"],
  ignore_images: true,
  ignore_links: true,
  ignore_tables: true,
  images_as_markdown: true,
  remove_conclusion_phrases: true
}

cleaned, _request_id = nylas.messages.clean_messages(
  identifier: "<NYLAS_GRANT_ID>",
  request_body: request_body
)

cleaned.each do |message|
  puts message[:conversation]
end

```

### Java SDK

```java
import com.nylas.NylasClient;
import com.nylas.models.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class Clean_Message {
    public static void main(String[] args) throws 
    NylasSdkTimeoutError, NylasApiError {
        NylasClient nylas = new NylasClient.Builder("<NYLAS_API_KEY>").build();

        List<String> messagesId = List.of("<MESSAGE_ID>");

        CleanMessagesRequest requestBody = 
        new CleanMessagesRequest.Builder(messagesId).
                ignoreImages(true).
                ignoreLinks(true).
                ignoreTables(true).
                imagesAsMarkdown(true).
                removeConclusionPhrases(true)
                .build();

        ListResponse<CleanMessagesResponse> clean = 
        nylas.messages().cleanMessages("<NYLAS_GRANT_ID>", requestBody);

        System.out.println(clean.getData());
    }
}

```

### Kotlin SDK

```kotlin
import com.nylas.NylasClient
import com.nylas.models.CleanMessagesRequest
import com.nylas.models.Message
import com.nylas.resources.Messages

fun main(args: Array<String>) {

    val nylas: NylasClient = NylasClient(
        apiKey = "<NYLAS_API_KEY>"
    )

    val messageId = listOf("<MESSAGE_ID>")

    val requestBody = CleanMessagesRequest.
    Builder(messageId).
    ignoreImages(true).
    ignoreLinks(true).
    ignoreTables(true).
    imagesAsMarkdown(true).
    removeConclusionPhrases(true).build()

    var result = nylas.messages().cleanMessages("<NYLAS_GRANT_ID>", 
    requestBody)
    print(result.data[0].body)
}

```
