<!--
  Vendored from https://developer.nylas.com/docs/reference/api/messages/get-messages.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Return all Messages

> **GET** `https://api.us.nylas.com/v3/grants/{grant_id}/messages`

Source: https://developer.nylas.com/docs/reference/api/messages/get-messages/

Returns all messages using [standard pagination](/docs/reference/api/#pagination).

<div id="admonition-warning">
⚠️ <b>Your users receive a large number of messages</b>. If you encounter
<a href="/docs/api/errors/400-response/"><code>429</code> errors</a> or provider
<a href="/docs/dev-guide/platform/rate-limits/">rate limits</a> when listing messages, Nylas
recommends you set the <code>limit</code> parameter to 20 and add
<a href="#query-parameters">query parameters</a> to your request to
limit the results.</div>

**Authentication:** NYLAS_API_KEY, ACCESS_TOKEN

## Parameters

### Query parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `any_email` | string | No | Return messages that were sent to or received from this comma-separated list of email addresses (for example, `leyah@example.com,nyla@example.com`). Nylas returns messages that contain one of the specified email addresses in the To, From, CC, or BCC fields. You can specify up to 25 email addresses per request. |
| `bcc` | string | No | Return messages that include the specified email address in the BCC list. Because most SMTP gateways remove BCC information, Nylas usually returns messages sent from the current grant.  For Microsoft grants, Nylas sometimes doesn't return messages that satisfy the conditions of this query parameter. This is because of a limitation on the provider. Instead, you can use the `thread_id` to retrieve a specific conversation. |
| `cc` | string | No | Return messages that include the specified email address in the CC list.  For Microsoft grants, Nylas sometimes doesn't return messages that satisfy the conditions of this query parameter. This is because of a limitation on the provider. Instead, you can use the `thread_id` to retrieve a specific conversation. |
| `fields` | string | No | Return the specified data for each message.  - `standard`: Returns the standard message payload. - `include_headers`: Returns messages and their full set of headers. - `include_basic_headers`: Returns messages with only the three RFC threading headers   (`Message-ID`, `In-Reply-To`, `References`) in the `headers` array. Use this option when you   only need to track message identity and thread relationships — payload size is significantly   smaller than `include_headers`. - `include_tracking_options`: Returns messages and their [tracking settings](/docs/v3/email/message-tracking/). - `raw_mime`: Returns the `grant_id`, `object`, `id`, and `raw_mime` fields for each message. |
| `from` | string | No | Return messages sent from the specified email address. If you want to filter for messages sent from the current grant, use the `in` query parameter and specify the Sent folder instead.  For Microsoft grants, Nylas sometimes doesn't return messages that satisfy the conditions of this query parameter. This is because of a limitation on the provider. Instead, you can use the `thread_id` to retrieve a specific conversation. |
| `has_attachment` | boolean | No | When `true`, Nylas returns messages that include attachments. |
| `in` | string | No | Return messages in the specified folder or label, by folder ID. Required when using `shared_from` or `query_imap`. |
| `limit` | integer | No | The maximum number of objects to return. See [Pagination](/docs/reference/api/#pagination) for more information. |
| `metadata_pair` | string | No | Pass a metadata key/value pair (for example, `?metadata_pair=key1:value`) to search for metadata associated with objects. See [Metadata](/docs/reference/api/#metadata) for more information. |
| `page_token` | string | No | An identifier that specifies which page of data to return. You can get this value from the `next_cursor` response field. See [Pagination](/docs/reference/api/#pagination) for more information. |
| `query_imap` | boolean | No | (IMAP, Yahoo, and iCloud only) When `true`, Nylas queries the IMAP server directly instead of the Nylas database. You also need to set the `in` query parameter in your request so Nylas knows which folder to query. |
| `received_after` | integer | No | Return messages received after the specified time, in seconds using the Unix timestamp format. |
| `received_before` | integer | No | Return messages received before the specified time, in seconds using the Unix timestamp format. |
| `search_query_native` | string | No | Specify a URL-encoded search query. Connected providers use their provider-specific syntax, while Nylas Agent Accounts use Nylas full-text search syntax. The query parameters that you can use alongside `search_query_native` depend on the provider:  - **Google**: `in`, `limit`, and `page_token` - **Microsoft**: `in`, `limit`, and `page_token` - **IMAP/Yahoo/iCloud**: Any parameter - **EWS**: Any parameter _except_ `thread_id` - **Nylas Agent Accounts**: Any other parameter supported for Agent Accounts by this endpoint  Required when using `shared_from`.  For an overview of searching messages and threads with `search_query_native` across providers, see [Searching with Nylas](/docs/dev-guide/best-practices/search/#search-messages-and-threads-using-search_query_native). If you're using a Nylas Agent Account, see [Email search for Agent Accounts](/docs/v3/agent-accounts/email-search/) for the complete Nylas search syntax, examples, and limits. |
| `select` | string | No | Specify fields that you want Nylas to return, as a comma-separated list (for example, `select=id,updated_at`). This allows you to receive only the portion of object data that you're interested in. You can use `select` to optimize response size and reduce latency by limiting queries to only the information that you need. |
| `shared_folder_id` | string | No | (Microsoft only) When provided, Nylas returns items from the specified shared folder ID. Required when using `shared_from`. This parameter only accepts a single folder ID. Check out the [Shared folders](/docs/provider-guides/microsoft/shared-folders) guide for more information. |
| `shared_from` | string | No | (Microsoft only) When provided, Nylas returns items that were shared from the specified email address. It also accepts grant ID. This parameter only accepts single email address or grant ID. Check out the [Shared folders](/docs/provider-guides/microsoft/shared-folders) guide for more information. |
| `starred` | boolean | No | When `true`, Nylas returns starred messages.  EWS only supports starred messages on Microsoft Exchange 2010 or later. |
| `subject` | string | No | Return messages with a matching subject. This filter is case-sensitive and returns partial matches. |
| `thread_id` | string | No | Return messages in the specified thread. |
| `to` | string | No | Return messages sent to the specified email address.  For Microsoft grants, Nylas sometimes doesn't return messages that satisfy the conditions of this query parameter. This is because of a limitation on the provider. Instead, you can use the `thread_id` to retrieve a specific conversation. |
| `unread` | boolean | No | When `true`, Nylas returns unread messages. |

### Path parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `grant_id` | string | Yes | ID of the grant to access. You can also use the email address associated with the grant, or use `/me/` to refer to the grant associated with an access token. |

## Responses

### 200 - Messages response

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
- `next_cursor` (string, nullable) - A cursor pointing to the next page of results for the request.

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
curl --compressed --request GET \
  --url "https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages?limit=5" \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'Content-Type: application/json'
```

### Node.js SDK

```javascript
import Nylas from "nylas";

const nylas = new Nylas({
  apiKey: "<NYLAS_API_KEY>",
  apiUri: "<NYLAS_API_URI>",
});

async function fetchRecentEmails() {
  try {
    const messages = await nylas.messages.list({
      identifier: "<NYLAS_GRANT_ID>",
      queryParams: {
        limit: 5,
      },
    });

    console.log("Messages:", messages);
  } catch (error) {
    console.error("Error fetching emails:", error);
  }
}

fetchRecentEmails();

```

### Python SDK

```python
from nylas import Client

nylas = Client(
    "<NYLAS_API_KEY>",
    "<NYLAS_API_URI>"
)

grant_id = "<NYLAS_GRANT_ID>"

messages = nylas.messages.list(
  grant_id,
  query_params={
    "limit": 5
  }
)

print(messages)
```

### Ruby SDK

```ruby
require 'nylas'

# Initialize Nylas client
nylas = Nylas::Client.new(
	api_key: "<NYLAS_API_KEY>"
)

messages, _ = nylas.messages.list(identifier: "<NYLAS_GRANT_ID>")
messages.each {|message|
	puts "[#{Time.at(message[:date]).strftime("%d/%m/%Y at %H:%M:%S")}] | \
#{message[:id]} | \
#{message[:subject]} | \
#{message[:folders]}"
}

```

### Java SDK

```java
import com.nylas.NylasClient;
import com.nylas.models.*;
import java.text.SimpleDateFormat;

public class ReadEmail {
  public static void main(String[] args) throws NylasSdkTimeoutError, NylasApiError {
    NylasClient nylas = new NylasClient.Builder("<NYLAS_API_KEY>").build();
    ListResponse<Message> message = nylas.messages().list("<NYLAS_GRANT_ID>");

    for(Message email : message.getData()){
      String date = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").
          format(new java.util.Date((email.getDate() == null ? 1 : 1000L)));

      System.out.println(email.getId() + "[" + date + "] | " + 
          email.getSubject() + " | " +
          email.getFolders());
    }
  }
}

```

### Kotlin SDK

```kotlin
import com.nylas.NylasClient
import com.nylas.models.*
import java.text.SimpleDateFormat
import java.util.*

fun dateFormatter(milliseconds: String): String {
  return SimpleDateFormat("dd/MM/yyyy HH:mm:ss").
      format(Date(milliseconds.toLong() * 1000)).
      toString()
}

fun main(args: Array<String>) {
  val nylas: NylasClient = NylasClient(
      apiKey = "<NYLAS_API_KEY>"
  )

  val messages : List<Message> = nylas.messages().list("<NYLAS_GRANT_ID>").data

  for(message in messages){
    println("[${message.id}] | " +
        "${message.subject} | " +
        "${message.folders}")
  }
}
```
