<!--
  Vendored from https://developer.nylas.com/docs/v3/email/threads.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Using the Threads API

Source: https://developer.nylas.com/docs/v3/email/threads/

> **Success:** 
> **Looking for the Threads API references?** [You can find them here](/docs/reference/api/threads/)!

The Nylas Threads API gives you more control over how you detect collections of messages, and how you respond to them. This page explains how to work with the Threads API.

> **Info:** 
> **Building an AI agent?** Threads are how agents maintain conversation context across replies. When someone replies to a message the agent sent, Nylas groups it into the same thread automatically. See [Email threading for agents](/docs/v3/agent-accounts/email-threading/) for how to map threads to agent state and build multi-turn conversations.

## How threads work

Most providers organize messages both as individual messages, and as threads. Threads represent collections of messages that are related to each other and result from participants replying to an email conversation.

Every message is associated with a thread, whether that thread contains only one message or many.

When you look at threads from a code perspective, you can detect a thread and group messages using several criteria (the message subject, recipients, senders, and so on). Grouping several messages into a thread provides a coherent view of an email conversation. In long or fast-moving conversations, threads help the reader follow the discussion.

For Google and Microsoft accounts, Nylas threads messages together so they're as similar as possible to the behavior that users have come to expect from email clients.

### Threads are non-linear

Threads are organized non-linearly, as collections of related messages. Email service providers use criteria such as the message subject, its recipients, and so on to collect messages into threads. They also keep track of the `message_ids` for each message in the thread.

Because all of a thread's `message_ids` are logged, you can reply to a specific message by referencing its ID. This creates a new branch of the thread — similar to a tree structure — and the messages in the new branch continue to be associated with the thread.

> **Info:** 
> **The Threads endpoint does not return the contents of messages**. To fetch the contents of a message, you send a request to the `/messages` endpoint instead. For example, you can send a request to the `/threads` endpoint to get a list of messages in a thread, and a request to the `/messages` endpoint to get an array of messages with their body content.

## Build a fully-fledged inbox with the Threads API

You can use the `/threads` endpoint to emulate popular inbox UIs, like Gmail or Outlook, which group messages into threads. This gives users a simple, centralized view of their latest email conversation. By combining this view with calls to the `/messages` endpoint, you can build a fully-fledged inbox in your application.

## Before you begin

Before you can use the Threads API, you need the following prerequisites:

- A Nylas application.
- A working authentication configuration. Either...
  - A Nylas Dashboard Sandbox application which includes a demonstration auth config,
    OR
  - A provider auth app ([Google](/docs/provider-guides/google/create-google-app/) or [Azure](/docs/provider-guides/microsoft/create-azure-app/)), and a [connector](/docs/reference/api/connectors-integrations/) for that auth app.
- [A Google or Microsoft grant](/docs/v3/getting-started/) with at least the following scopes:
  - **Google**: `gmail.readonly`
  - **Microsoft**: `Mail.Read`

## Get a list of threads

The following examples show how to return the five most recent threads from an authenticated account. For more information on filtering requests, see [Avoiding rate limits in Nylas](/docs/dev-guide/best-practices/rate-limits/#filter-results-using-query-parameters).

```bash
curl --compressed --request GET \
  --url "https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/threads?limit=5" \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'Content-Type: application/json'

```

```json [mostRecentThreads-Response (JSON)]

{
  "request_id": "1",
  "data": [
    {
      "starred": false,
      "unread": true,
      "folders": ["CATEGORY_PERSONAL", "INBOX", "UNREAD"],
      "grant_id": "<NYLAS_GRANT_ID>",
      "id": "<THREAD_ID>",
      "object": "thread",
      "latest_draft_or_message": {
        "starred": false,
        "unread": true,
        "folders": ["UNREAD", "CATEGORY_PERSONAL", "INBOX"],
        "grant_id": "<NYLAS_GRANT_ID>",
        "date": 1707836711,
        "from": [
          {
            "name": "Nyla",
            "email": "nyla@example.com"
          }
        ],
        "id": "<MESSAGE_ID>",
        "object": "message",
        "snippet": "Send Email with Nylas APIs",
        "subject": "Learn how to Send Email with Nylas APIs",
        "thread_id": "<THREAD_ID>",
        "to": [
          {
            "email": "nyla@example.com"
          }
        ],
        "created_at": 1707836711,
        "body": "Learn how to send emails using the Nylas APIs!"
      },
      "has_attachments": false,
      "has_drafts": false,
      "earliest_message_date": 1707836711,
      "latest_message_received_date": 1707836711,
      "participants": [
        {
          "email": "nylas@nylas.com"
        }
      ],
      "snippet": "Send Email with Nylas APIs",
      "subject": "Learn how to Send Email with Nylas APIs",
      "message_ids": ["<MESSAGE_ID>"]
    }
  ],
  "next_cursor": "123"
}


```

```javascript [mostRecentThreads-Node.js SDK]

import Nylas from "nylas";

const nylas = new Nylas({
  apiKey: "<NYLAS_API_KEY>",
  apiUri: "<NYLAS_API_URI>",
});

async function fetchRecentThreads() {
  try {
    const identifier = "<NYLAS_GRANT_ID>";
    const threads = await nylas.threads.list({
      identifier: identifier,
      queryParams: {
        limit: 5,
      },
    });

    console.log("Recent Threads:", threads);
  } catch (error) {
    console.error("Error fetching threads:", error);
  }
}

fetchRecentThreads();


```

```python [mostRecentThreads-Python SDK]

from nylas import Client

nylas = Client(
    "<NYLAS_API_KEY>",
    "<NYLAS_API_URI>"
)

grant_id = "<NYLAS_GRANT_ID>"

threads = nylas.threads.list(
  grant_id,
  query_params={
    "limit": 5
  }
)

print(threads)

```

```ruby [mostRecentThreads-Ruby SDK]

require 'nylas'

nylas = Nylas::Client.new(api_key: "<NYLAS_API_KEY>")
query_params = { limit: 5 }
threads, _ = nylas.threads.list(identifier: "<NYLAS_GRANT_ID>", query_params: query_params)

threads.map.with_index { |thread, i|
  puts("Thread #{i}")
  participants = thread[:participants]

  participants.each{ |participant|
    puts(
      "Subject: #{thread[:subject]} | "\
      "Participant: #{participant[:name]} | "\
      "Email: #{participant[:email]}"
    )
  }
}

```

```java [mostRecentThreads-Java SDK]

import com.nylas.NylasClient;
import com.nylas.models.*;
import com.nylas.models.Thread;
import java.util.List;

public class ReadThreadParameters {
  public static void main(String[] args) throws NylasSdkTimeoutError, NylasApiError {
    NylasClient nylas = new NylasClient.Builder("<NYLAS_API_KEY>").build();

    ListThreadsQueryParams queryParams = new ListThreadsQueryParams.Builder().limit(5).build();
    ListResponse<Thread> threads = nylas.threads().list("<NYLAS_GRANT_ID>", queryParams);
    int index = 0;

    for(Thread thread : threads.getData()){
      System.out.printf("%s ", index);

      List<EmailName> participants = thread.getParticipants();
      assert participants != null;

      for(EmailName participant : participants){
        System.out.printf("  Subject: %s | Participant: %s | Email: %s%n",
            thread.getSubject(),
            participant.getName(),
            participant.getEmail());
      }
      
      index++;
    }
  }
}

```

```kt [mostRecentThreads-Kotlin SDK]

import com.nylas.NylasClient
import com.nylas.models.*
import java.util.*

fun main(args: Array<String>) {
  val nylas: NylasClient = NylasClient(
      apiKey = "<NYLAS_API_KEY>"
  )

  val queryParams = ListThreadsQueryParams(limit = 5)
  val threads : List<Thread> = nylas.threads().list("<CALENDAR_ID>", queryParams).data

  for(i in threads.indices){
    print("$i ")

    val participants = threads[i].participants

    if (participants != null) {
      for(participant in participants){
        println(" Subject: ${threads[i].subject} + " +
            "Name: ${participant.name} + " +
            "Email: ${participant.email}")
      }
    }
  }
}

```

## Return a thread

The following request returns a specific thread.

```bash
curl --compressed --request GET \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/threads/<THREAD_ID>' \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'Content-Type: application/json'

```

```json [thread-Response (JSON)]
{
  "grant_id": "<NYLAS_GRANT_ID>",
  "id": "<THREAD_ID>",
  "object": "thread",
  "has_attachments": false,
  "has_drafts": false,
  "earliest_message_date": 1634149514,
  "latest_message_received_date": 1634832749,
  "latest_message_sent_date": 1635174399,
  "participants": [
    {
      "email": "renee.smith@example.com",
      "name": "Renee Smith"
    },
    {
      "email": "rebecca.crumpler@example.com",
      "name": "Rebecca Lee Crumpler"
    }
  ],
  "snippet": "jnlnnn --Sent with Nylas",
  "starred": false,
  "subject": "Dinner Wednesday?",
  "unread": false,
  "message_ids": [  // A list of IDs for all messages in the thread.
    "<MESSAGE_ID>",
    "<MESSAGE_ID>"
  ],
  "draft_ids": [  // A list of IDs for all drafts in the thread.
    "<DRAFT_ID>"
  ],
  "folders": [  // A list of folders that messages in the thread are associated with.
    "<FOLDER_ID>",
    "<FOLDER_ID>"
  ],
  "latest_draft_or_message": {
    "body": "Hello, I just sent a message using Nylas!",
    "date": 1635355739,
    "attachments": {
      "content": "YXR0YWNoDQoNCi0tLS0tLS0tLS0gRm9yd2FyZGVkIG1lc3NhZ2UgL=",
      "content_type": "text/calendar",
      "id": "<ATTACHMENT_ID>",
      "size": 1708,
      "content_type": "application/ics",
      "filename": "invite.ics",
      "id": "<ATTACHMENT_ID>",
      "size": 1708
    },
    "folders": {  // A list of folders the latest message in the thread is associated with.
      "<FOLDER_ID>",
      "<FOLDER_ID>"
    },
    "from": {
      "name": "Renee Smith",
      "email": "renee.smith@example.com"
    },
    "grant_id": "<NYLAS_GRANT_ID>",
    "id": "<MESSAGE_ID>",  // The message ID for the latest message in the thread.
    "object": "message",
    "reply_to": {
      "name": "Renee Smith",
      "email": "renee.smith@example.com"
    },
    "snippet": "Hello, I just sent a message using Nylas!",
    "starred": true,
    "subject": "Hello From Nylas!",
    "thread_id": "<THREAD_ID>",
    "to": {
      "name": "Geoff Dale",
      "email": "geoff.dale@example.com"
    },
    "unread": true
  }
}
```

Because [threads are non-linear](#threads-are-non-linear), you can use one of the `message_id`s listed in the response to reply to a specific message in the thread. This creates a new branch of the thread, and depending on who responds to it, the structure of the thread can resemble the example below.

![A hierarchy diagram showing a thread with several branches.](/_images/email/v3-nonlinear-thread.png)

## Search an inbox for threads

You can add query parameters to a [Get all Threads request](/docs/reference/api/threads/get-threads/) to search for threads using specific criteria.

> **Warn:** 
> **Nylas doesn't support filtering for folders and labels using keywords or attributes** (for example, the `in:inbox` query parameter returns a [`400` error](/docs/api/errors/400-response/)). Instead, you should use the folder or label ID to get the data you need.

You can also use the Nylas SDKs to search for threads, as in the following examples.

```javascript [searchThreadSDKs-Node.js SDK]

import Nylas from "nylas";

const nylas = new Nylas({
  apiKey: "<NYLAS_API_KEY>",
  apiUri: "<NYLAS_API_URI>",
});

async function searchInbox() {
  try {
    const result = await nylas.threads.list({
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

```python [searchThreadSDKs-Python SDK]

from nylas import Client

nylas = Client(
    "<NYLAS_API_KEY>",
    "<NYLAS_API_URI>"
)

grant_id = "<NYLAS_GRANT_ID>"

messages = nylas.threads.list(
  grant_id,
  query_params={
    "limit": 5,
    "search_query_native": 'nylas'
  }
)

print(messages)

```

```ruby [searchThreadSDKs-Ruby SDK]
require 'nylas'

nylas = Nylas::Client.new(api_key: '<NYLAS_API_KEY>')
query_params = { search_query_native: "subject: hello" }
threads, _ = nylas.threads.list(identifier: '<NYLAS_GRANT_ID>', query_params: query_params)

threads.each { | thread |
  puts thread[:subject]
}
```

```java [searchThreadSDKs-Java SDK]


public class SearchThreads {
  public static void main(String[] args) throws NylasSdkTimeoutError, NylasApiError {
    NylasClient nylas = new NylasClient.Builder("<NYLAS_API_KEY>").build();

    ListThreadsQueryParams queryParams = new ListThreadsQueryParams.Builder().
        searchQueryNative("subject: hello").
        limit(5).
        build();

    ListResponse<Thread> thread = nylas.threads().list("<NYLAS_GRANT_ID>", queryParams);

    for(Thread email : thread.getData()) {
      System.out.println(email.getSubject());
    }
  }
}
```

```kt [searchThreadSDKs-Kotlin SDK]


fun main(args: Array<String>) {
  val nylas: NylasClient = NylasClient(apiKey = dotenv["NYLAS_API_KEY"])
  val queryParams = ListThreadsQueryParams(limit = 5, searchQueryNative = "subject: hello")
  val threads : List<com.nylas.models.Thread> = nylas.threads().list("<NYLAS_GRANT_ID>", queryParams).data

  for(thread in threads) {
    println(thread.subject)
  }
}
```