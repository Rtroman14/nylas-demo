<!--
  Vendored from https://developer.nylas.com/docs/v3/email/messages.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Using the Nylas Messages API

Source: https://developer.nylas.com/docs/v3/email/messages/

The Nylas Messages API lets you read, search, update, and delete email messages across Gmail, Microsoft 365, and IMAP providers through a single unified interface. A message is the core email object in Nylas, representing a single email with its subject, sender, recipients, body content, [attachments](/docs/v3/email/attachments/), and [folder](/docs/v3/email/folders/) assignments. Related messages are grouped into [threads](/docs/v3/email/threads/).

Use the Messages API to read messages from a user's inbox, search for messages using provider-native queries, update message status (read/unread, starred, folder), and delete messages. The API works identically across all providers -- your code doesn't need provider-specific branches. To receive real-time notifications when messages arrive, use [webhooks](/docs/v3/notifications/) instead of polling.

> **Info:** 
> **Looking for the full API reference?** See the [Messages API reference](/docs/reference/api/messages/) for all endpoints, parameters, and response schemas.

## Before you begin

You need a Nylas developer account and API key. See the [Getting started guide](/docs/v3/getting-started/) to set up a Sandbox application and connect a provider account. You'll also need a [grant](/docs/v3/auth/) for the email account you want to access. The code examples on this page use the [Nylas SDKs](/docs/v3/sdks/) -- see the SDK documentation for installation and setup.

## Read messages from inboxes

To retrieve messages, make a [List Messages request](/docs/reference/api/messages/get-messages/) with the grant ID. The endpoint returns messages in reverse chronological order. By default, it returns the 50 most recent messages (configurable with `limit`, max 200).

```bash
curl --compressed --request GET \
  --url "https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages?limit=5" \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'Content-Type: application/json'

```

```json [mostRecentMessages-Response (JSON)]

{
  "request_id": "d0c951b9-61db-4daa-ab19-cd44afeeabac",
  "data": [
    {
      "starred": false,
      "unread": true,
      "folders": ["UNREAD", "CATEGORY_PERSONAL", "INBOX"],
      "grant_id": "1",
      "date": 1706811644,
      "attachments": [
        {
          "id": "1",
          "grant_id": "1",
          "filename": "invite.ics",
          "size": 2504,
          "content_type": "text/calendar; charset=\"UTF-8\"; method=REQUEST"
        },
        {
          "id": "2",
          "grant_id": "1",
          "filename": "invite.ics",
          "size": 2504,
          "content_type": "application/ics; name=\"invite.ics\"",
          "is_inline": false,
          "content_disposition": "attachment; filename=\"invite.ics\""
        }
      ],
      "from": [
        {
          "name": "Nylas DevRel",
          "email": "nylasdev@nylas.com"
        }
      ],
      "id": "1",
      "object": "message",
      "snippet": "Send Email with Nylas APIs",
      "subject": "Learn how to Send Email with Nylas APIs",
      "thread_id": "1",
      "to": [
        {
          "name": "Nyla",
          "email": "nyla@nylas.com"
        }
      ],
      "created_at": 1706811644,
      "body": "Learn how to send emails using the Nylas APIs!"
    }
  ],
  "next_cursor": "123"
}


```

```js [mostRecentMessages-Node.js SDK]

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

```python [mostRecentMessages-Python SDK]

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

```ruby [mostRecentMessages-Ruby SDK]
require 'nylas'

nylas = Nylas::Client.new(api_key: '<NYLAS_API_KEY>')
query_params = { limit: 5 }
messages, _ = nylas.messages.list(identifier: '<NYLAS_GRANT_ID>', query_params: query_params)

messages.each {|message|
  puts "[#{Time.at(message[:date]).strftime("%d/%m/%Y at %H:%M:%S")}] \
      #{message[:subject]}"
}
```

```java [mostRecentMessages-Java SDK]


public class ReadInbox {
  public static void main(String[] args) throws NylasSdkTimeoutError, NylasApiError {
    NylasClient nylas = new NylasClient.Builder("<NYLAS_API_KEY>").build();
    ListMessagesQueryParams queryParams = new ListMessagesQueryParams.Builder().limit(5).build();
    ListResponse<Message> message = nylas.messages().list("<NYLAS_GRANT_ID>", queryParams);

    for(Message email : message.getData()) {
      String date = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").
          format(new java.util.Date((email.getDate() * 1000L)));

      System.out.println("[" + date + "] | " + email.getSubject());
    }
  }
}
```

```kt [mostRecentMessages-Kotlin SDK]


fun dateFormatter(milliseconds: String): String {
  return SimpleDateFormat("dd/MM/yyyy HH:mm:ss").format(Date(milliseconds.toLong() * 1000)).toString()
}

fun main(args: Array<String>) {
  val nylas: NylasClient = NylasClient(apiKey = "<NYLAS_API_KEY>")
  val queryParams = ListMessagesQueryParams(limit = 5, inFolder = listOf("Inbox"))
  val messages : List<Message> = nylas.messages().list("<NYLAS_GRANT_ID>", queryParams).data

  for(message in messages) {
    println("[" + dateFormatter(message.date.toString()) + "] |" + message.subject + " | " + message.folders)
  }
}
```

```bash
nylas email list --limit 10
```


> **Info:** 
> **The [Nylas CLI](https://cli.nylas.com/) runs commands against your default grant.** Run [`nylas auth list`](https://cli.nylas.com/docs/commands/auth-list) to see your connected accounts and [`nylas auth switch <email>`](https://cli.nylas.com/docs/commands/auth-switch) to change which one commands run against. See the full [command reference](https://cli.nylas.com/docs/commands).


### Message object fields

Each message object contains the following fields:

| Field         | Type    | Description                                                                                                                       |
| ------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | string  | Unique identifier for the message. Format varies by provider (hex string for Google, base64 for Microsoft, numeric UID for IMAP). |
| `object`      | string  | Always `"message"`.                                                                                                               |
| `grant_id`    | string  | The grant ID of the account this message belongs to.                                                                              |
| `thread_id`   | string  | The ID of the thread this message belongs to. Use the [Threads API](/docs/v3/email/threads/) to group related messages.           |
| `subject`     | string  | The message subject line.                                                                                                         |
| `from`        | array   | List of sender objects, each with `name` and `email` fields.                                                                      |
| `to`          | array   | List of recipient objects, each with `name` and `email` fields.                                                                   |
| `cc`          | array   | List of CC recipient objects.                                                                                                     |
| `bcc`         | array   | List of BCC recipient objects. Empty on received messages.                                                                        |
| `reply_to`    | array   | List of reply-to addresses.                                                                                                       |
| `date`        | integer | Unix timestamp (seconds) when the message was sent or received.                                                                   |
| `unread`      | boolean | Whether the message is unread.                                                                                                    |
| `starred`     | boolean | Whether the message is starred (flagged in Microsoft).                                                                            |
| `snippet`     | string  | A short plaintext preview of the message body (first ~200 characters).                                                            |
| `body`        | string  | The full message body in HTML format. Only included when requesting a single message.                                             |
| `folders`     | array   | List of folder or label IDs the message belongs to. Google messages may have multiple labels.                                     |
| `attachments` | array   | List of attachment objects with `id`, `filename`, `size`, `content_type`, and `is_inline` fields.                                 |
| `created_at`  | integer | Unix timestamp when Nylas first synced this message.                                                                              |

For the complete schema including all optional fields, see the [Messages API reference](/docs/reference/api/messages/).

### Paginating results

The Messages endpoint returns up to 50 messages per request by default (configurable with `limit`, max 200). To retrieve additional pages, pass the `next_cursor` value from the response as the `page_token` query parameter in your next request.

```bash
# First request
curl --request GET \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages?limit=50' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>'

# Next page -- use next_cursor from previous response
curl --request GET \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages?limit=50&page_token=<NEXT_CURSOR>' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>'
```

When `next_cursor` is `null` or absent in the response, you've reached the last page.

### Provider IDs for messages

Each message has a unique `id` field. Nylas uses the provider's native ID format, so message IDs look different depending on the email provider:

| Provider          | ID format          | Example            |
| ----------------- | ------------------ | ------------------ |
| Google            | Short hex string   | `18d5a4b2c3e4f567` |
| Microsoft         | Long base64 string | `AAMkAGI2TG93AAA=` |
| IMAP/Yahoo/iCloud | Numeric UID        | `12345`            |

## Search for messages

You can add query parameters to a [List Messages request](/docs/reference/api/messages/get-messages/) to filter and search for messages.

Common query parameters:

| Parameter         | Type    | Description                                                              |
| ----------------- | ------- | ------------------------------------------------------------------------ |
| `subject`         | string  | Filter by subject line (partial match).                                  |
| `from`            | string  | Filter by sender email address.                                          |
| `to`              | string  | Filter by recipient email address.                                       |
| `in`              | string  | Filter by folder ID. For Google, use the label ID, not the display name. |
| `unread`          | boolean | Filter by read/unread status.                                            |
| `has_attachment`  | boolean | Filter for messages with attachments.                                    |
| `received_before` | integer | Unix timestamp. Return messages received before this time.               |
| `received_after`  | integer | Unix timestamp. Return messages received after this time.                |
| `limit`           | integer | Max results per page (default 50, max 200).                              |

> **Warn:** 
> **When using the `in` parameter with Google accounts, you must use the folder (label) ID, not the display name.** Use the [List Folders endpoint](/docs/reference/api/folders/get-folder/) to get the correct IDs.

```javascript [searchMessagesSDKs-Node.js SDK]

import Nylas from "nylas";

const nylas = new Nylas({
  apiKey: "<NYLAS_API_KEY>",
  apiUri: "<NYLAS_API_URI>",
});

async function searchInbox() {
  try {
    const result = await nylas.messages.list({
      identifier: "<NYLAS_GRANT_ID>",
      queryParams: {
        search_query_native: "nylas",
        limit: 5,
      },
    });

    console.log("search results:", result);
  } catch (error) {
    console.error("Error to complete search:", error);
  }
}

searchInbox();


```

```python [searchMessagesSDKs-Python SDK]

from nylas import Client

nylas = Client(
    "<NYLAS_API_KEY>",
    "<NYLAS_API_URI>"
)

grant_id = "<NYLAS_GRANT_ID>"

messages = nylas.messages.list(
  grant_id,
  query_params={
    "limit": 5,
    "search_query_native": 'nylas'
  }
)

print(messages)

```

```ruby [searchMessagesSDKs-Ruby SDK]
require 'nylas'

nylas = Nylas::Client.new(api_key: '<NYLAS_API_KEY>')
query_params = {limit: 5, search_query_native: "subject: hello"}
messages, _ = nylas.messages.list(identifier: '<NYLAS_GRANT_ID>', query_params: query_params)

messages.each {|message|
  puts "[#{Time.at(message[:date]).strftime("%d/%m/%Y at %H:%M:%S")}] \
      #{message[:subject]}"
}
```

```java [searchMessagesSDKs-Java SDK]


public class SearchInbox {
  public static void main(String[] args) throws NylasSdkTimeoutError, NylasApiError {
    NylasClient nylas = new NylasClient.Builder("<NYLAS_API_KEY>").build();

    ListMessagesQueryParams queryParams = new ListMessagesQueryParams.Builder().
        searchQueryNative("subject: hello").
        limit(5).
        build();

    ListResponse<Message> message = nylas.messages().list("<NYLAS_GRANT_ID>", queryParams);

    for(Message email : message.getData()) {
      String date = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").
          format(new java.util.Date((email.getDate() * 1000L)));

      System.out.println("[" + date + "] | " + email.getSubject());
    }
  }
}
```

```kt [searchMessagesSDKs-Kotlin SDK]


fun dateFormatter(milliseconds: String): String {
  return SimpleDateFormat("dd/MM/yyyy HH:mm:ss").format(Date(milliseconds.toLong() * 1000)).toString()
}

fun main(args: Array<String>) {
  val nylas: NylasClient = NylasClient(apiKey = "<NYLAS_API_KEY>")
  val queryParams = ListMessagesQueryParams(limit = 5, searchQueryNative = "subject: hello")
  val messages : List<Message> = nylas.messages().list("<NYLAS_GRANT_ID>", queryParams).data

  for(message in messages) {
    println("[" + dateFormatter(message.date.toString()) + "] |" + message.subject)
  }
}
```

```bash
# Search by subject
nylas email search "subject:invoice"

# Search by sender using a filter flag
nylas email search --from "boss@work.com"

# Combine provider-native syntax with filters (Gmail example)
nylas email search "has:attachment" --from "finance@company.com"
```

### Provider and Agent Account search syntax

For advanced filtering, use the `search_query_native` parameter. Connected grants pass provider-native search syntax to the underlying API, while Agent Account grants use Nylas full-text syntax.

| Provider          | Syntax                                                                                                                                           | Example                              | Docs                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ | ----------------------------------------------------------------------------------------- |
| Agent Accounts    | Nylas full-text search syntax                                                                                                                    | `(invoice OR receipt) overdue`       | [Agent Account email search](/docs/v3/agent-accounts/email-search/)                       |
| Google            | [Gmail search operators](https://support.google.com/mail/answer/7190)                                                                            | `from:alex@gmail.com has:attachment` | [Search best practices](/docs/dev-guide/best-practices/search/)                           |
| Microsoft         | [Keyword Query Language (KQL)](https://learn.microsoft.com/en-us/sharepoint/dev/general-development/keyword-query-language-kql-syntax-reference) | `subject:invoice`                    | [Microsoft Graph $search](https://learn.microsoft.com/en-us/graph/search-query-parameter) |
| IMAP/Yahoo/iCloud | [RFC 3501 SEARCH](https://datatracker.ietf.org/doc/html/rfc3501#section-6.4.4)                                                                   | `subject:invoice`                    | [IMAP search guide](/docs/dev-guide/best-practices/search/)                               |

> **Info:** 
> **Google and Microsoft restrict which parameters you can combine with `search_query_native`.** You can only use it with `in`, `limit`, and `page_token`. IMAP-based providers (Yahoo, iCloud, generic IMAP) support all other parameters available on the endpoint. Agent Accounts support all other parameters available for Agent Accounts on the endpoint.

For search details, see [Email search for Agent Accounts](/docs/v3/agent-accounts/email-search/), the [search best practices guide](/docs/dev-guide/best-practices/search/), and the provider-specific guides for [Google](/docs/cookbook/email/messages/list-messages-google/), [Microsoft](/docs/cookbook/email/messages/list-messages-microsoft/), and [IMAP](/docs/cookbook/email/messages/list-messages-imap/).

## Modify and delete messages

The Messages API supports updating message metadata and deleting messages. Here are the available operations:

| Action               | Method   | API reference                                                   | What it does                                             |
| -------------------- | -------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Update a message     | `PUT`    | [Update Message](/docs/reference/api/messages/put-messages-id/) | Change unread/starred status, move to a different folder |
| Delete a message     | `DELETE` | [Delete Message](/docs/reference/api/messages/delete-message/)  | Delete a message (moves to Trash on most providers)      |
| Create a folder      | `POST`   | [Create Folder](/docs/reference/api/folders/post-folder/)       | Create a new folder or label                             |
| Update a folder      | `PUT`    | [Update Folder](/docs/reference/api/folders/put-folders-id/)    | Rename a folder or label                                 |
| Delete a folder      | `DELETE` | [Delete Folder](/docs/reference/api/folders/delete-folders-id/) | Delete a folder or label                                 |
| Upload an attachment | `POST`   | [Attachments](/docs/reference/api/attachments/)                 | Upload a file to use as an attachment                    |

For detailed parameters and response schemas, see the [Messages](/docs/reference/api/messages/), [Folders](/docs/reference/api/folders/), and [Attachments](/docs/reference/api/attachments/) API references. To track email opens and link clicks, see [Message tracking](/docs/v3/email/message-tracking/).

## Keep in mind

- **Rate limits apply at both the Nylas and provider level.** Nylas enforces its own [API rate limits](/docs/dev-guide/best-practices/rate-limits/), and each provider has additional per-user or per-project quotas. Use [webhooks](/docs/v3/notifications/) instead of polling to minimize API calls.
- **Messages are returned in reverse chronological order** by default. Use `received_before` and `received_after` to narrow the time range.
- **Nylas maintains a 90-day rolling cache for all IMAP-based providers** (Yahoo, iCloud, generic IMAP) to improve performance and API reliability. For queries outside that 90-day window, or to query the provider directly, set `query_imap=true`.
- **The `body` field is only included on single-message requests.** List requests return `snippet` instead. Use the [Get Message endpoint](/docs/reference/api/messages/get-messages-id/) to get the full body.
- **Google uses labels instead of folders.** A single Gmail message can have multiple labels. The `folders` array on Google messages contains label IDs like `INBOX`, `UNREAD`, and `CATEGORY_PERSONAL`.

### One-click unsubscribe requirements for Google


As of February 2024, Google requires that users who send more than 5,000 messages per day to Gmail email addresses include one-click unsubscribe headers in their marketing and subscribed messages (see Google’s official [Email sender guidelines](https://support.google.com/a/answer/81126?visit_id=638454429489933730-1375591047&rd=1#subscriptions)). This is along with the visible unsubscribe links that must be in the body content of all marketing and subscribed messages.

To set up one-click unsubscribe headers using Nylas, include the `custom_headers` object in your [Send Message](/docs/reference/api/messages/send-message/) or [Create Draft](/docs/reference/api/drafts/post-draft/) request. This object accepts a set of key-value pairs, each of which represents the header’s `name` and its `value`. You must include the following headers:

- `List-Unsubscribe-Post`: `List-Unsubscribe=One-Click`
- `List-Unsubscribe`: The unsubscribe link (for example, a `mailto` link that uses the user’s email address, or a link to your list management software).

```json
"custom_headers":[
  {
    "name": "List-Unsubscribe-Post",
    "value": "List-Unsubscribe=One-Click"
  },
  {
    "name": "List-Unsubscribe",
    "value": "<mailto: nyla@example.com?subject=unsubscribe>,  <https://mailinglist.example.com/unsubscribe.html>"
  }
]
```


## What's next

- [Messages API reference](/docs/reference/api/messages/) for all endpoints, parameters, and response schemas
- [Sending messages](/docs/v3/email/send-email/) to send email and create drafts
- [Threads](/docs/v3/email/threads/) to group related messages into conversations
- [Attachments](/docs/v3/email/attachments/) to download and upload file attachments
- [Folders and labels](/docs/v3/email/folders/) to manage email organization
- [Search best practices](/docs/dev-guide/best-practices/search/) for advanced search across providers
- [Webhooks](/docs/v3/notifications/) for real-time notifications instead of polling
- Provider-specific guides: [Google](/docs/cookbook/email/messages/list-messages-google/) | [Microsoft](/docs/cookbook/email/messages/list-messages-microsoft/) | [Yahoo](/docs/cookbook/email/messages/list-messages-yahoo/) | [iCloud](/docs/cookbook/email/messages/list-messages-icloud/) | [IMAP](/docs/cookbook/email/messages/list-messages-imap/)
- [List Gmail emails from the command line](https://cli.nylas.com/guides/list-gmail-emails) — read, filter, and export Gmail messages from the terminal
- [List Outlook emails from the terminal](https://cli.nylas.com/guides/list-outlook-emails) — search and export Outlook messages without the Gmail API