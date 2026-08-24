<!--
  Vendored from https://developer.nylas.com/docs/v3/getting-started/email.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Quickstart: Email API

Source: https://developer.nylas.com/docs/v3/getting-started/email/

The Nylas Email API lets you send, read, and search email across Gmail, Outlook, Exchange, Yahoo, iCloud, and IMAP -- all through a single API. Instead of building separate integrations for each provider, you write your code once and Nylas handles the differences.

This quickstart walks you through sending and reading email on behalf of a connected user using the Nylas SDKs and API.

## Before you begin

You need two things from Nylas to make API calls:

1. **An API key** -- authenticates your application. You'll pass it as a Bearer token.
2. **A grant ID** -- identifies which user's email account to act on. You get one when you connect an email account to Nylas.

If you don't have these yet, follow one of the setup guides first:

- **[Get started with the CLI](/docs/v3/getting-started/cli/)** -- run `nylas init` to create an account, generate an API key, and connect a test email account in one command.
- **[Get started with the Dashboard](/docs/v3/getting-started/dashboard/)** -- do the same steps through the web UI.

Then install the Nylas SDK for your language:

```bash [installSdk-Node.js]
npm install nylas
```

```bash
pip install nylas
```

```bash
gem install nylas
```

For Java and Kotlin, see the [Kotlin/Java SDK setup guide](/docs/v3/sdks/kotlin-java/).

> **Info:** 
> **How grants work.** Each connected email account becomes a **grant** with a unique grant ID. In production, your users authenticate through [Nylas OAuth](/docs/v3/auth/) and each gets their own grant. For this quickstart, you'll use the test grant you created during setup.

## Send your first email

Replace `<NYLAS_GRANT_ID>` and `<NYLAS_API_KEY>` with the values from setup. Change the `to` address to your own email so you can see it arrive.

```bash
curl --request POST \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages/send' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{
    "subject": "Hello from Nylas",
    "body": "Sent using the Nylas Email API",
    "to": [{ "name": "Test", "email": "you@example.com" }]
  }'
```

```js [sendEmail-Node.js]


const nylas = new Nylas({ apiKey: process.env.NYLAS_API_KEY });

const message = await nylas.messages.send({
  identifier: process.env.NYLAS_GRANT_ID,
  requestBody: {
    to: [{ name: "Test", email: "you@example.com" }],
    subject: "Hello from Nylas",
    body: "Sent using the Nylas Email API",
  },
});

console.log("Sent:", message.data.id);
```

```python
from nylas import Client

nylas = Client(os.environ["NYLAS_API_KEY"])

message = nylas.messages.send(
    os.environ["NYLAS_GRANT_ID"],
    request_body={
        "to": [{"name": "Test", "email": "you@example.com"}],
        "subject": "Hello from Nylas",
        "body": "Sent using the Nylas Email API",
    },
)

print("Sent:", message.data.id)
```

```ruby
require 'nylas'

nylas = Nylas::Client.new(api_key: ENV['NYLAS_API_KEY'])

message, _ = nylas.messages.send(
  identifier: ENV['NYLAS_GRANT_ID'],
  request_body: {
    to: [{ name: 'Test', email: 'you@example.com' }],
    subject: 'Hello from Nylas',
    body: 'Sent using the Nylas Email API'
  }
)

puts "Sent: #{message[:id]}"
```

```bash
nylas email send \
  --to you@example.com \
  --subject "Hello from Nylas" \
  --body "Sent using the Nylas Email API"
```

```java
public class SendEmail {
  public static void main(String[] args) throws NylasSdkTimeoutError, NylasApiError {
    NylasClient nylas = new NylasClient.Builder("<NYLAS_API_KEY>").build();

    SendMessageRequest requestBody = new SendMessageRequest.Builder(
        List.of(new EmailName("you@example.com", "Test"))
    )
        .subject("Hello from Nylas")
        .body("Sent using the Nylas Email API")
        .build();

    Response<Message> message = nylas.messages().send("<NYLAS_GRANT_ID>", requestBody);
    System.out.println("Sent: " + message.getData().getId());
  }
}
```

```kt
fun main() {
    val nylas = NylasClient(apiKey = "<NYLAS_API_KEY>")

    val requestBody = SendMessageRequest.Builder(
        listOf(EmailName("you@example.com", "Test"))
    )
        .subject("Hello from Nylas")
        .body("Sent using the Nylas Email API")
        .build()

    val message = nylas.messages().send("<NYLAS_GRANT_ID>", requestBody)
    println("Sent: ${message.data.id}")
}
```

Check the recipient's inbox -- the message should arrive within a few seconds. That same code works whether the grant is a Gmail account, Outlook, or any other supported provider.

## Read a user's inbox

List the five most recent messages from a connected user's account.

```bash
curl --compressed --request GET \
  --url "https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages?limit=5" \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'Content-Type: application/json'

```

```js [listMessages-Node.js]


const nylas = new Nylas({ apiKey: process.env.NYLAS_API_KEY });

const messages = await nylas.messages.list({
  identifier: process.env.NYLAS_GRANT_ID,
  queryParams: { limit: 5 },
});

messages.data.forEach((msg) => {
  console.log(`${msg.subject} -- from ${msg.from?.[0]?.email}`);
});
```

```python
from nylas import Client

nylas = Client(os.environ["NYLAS_API_KEY"])

messages = nylas.messages.list(
    os.environ["NYLAS_GRANT_ID"],
    query_params={"limit": 5},
)

for msg in messages.data:
    print(f"{msg.subject} -- from {msg.from_[0].email}")
```

```ruby
require 'nylas'

nylas = Nylas::Client.new(api_key: ENV['NYLAS_API_KEY'])

messages, _ = nylas.messages.list(
  identifier: ENV['NYLAS_GRANT_ID'],
  query_params: { limit: 5 }
)

messages.each do |msg|
  puts "#{msg[:subject]} -- from #{msg[:from][0][:email]}"
end
```

```java
public class ListMessages {
  public static void main(String[] args) throws NylasSdkTimeoutError, NylasApiError {
    NylasClient nylas = new NylasClient.Builder("<NYLAS_API_KEY>").build();

    ListMessagesQueryParams queryParams = new ListMessagesQueryParams.Builder().limit(5).build();
    ListResponse<Message> messages = nylas.messages().list("<NYLAS_GRANT_ID>", queryParams);

    for (Message msg : messages.getData()) {
      System.out.println(msg.getSubject() + " -- from " + msg.getFrom().get(0).getEmail());
    }
  }
}
```

```kt
fun main() {
    val nylas = NylasClient(apiKey = "<NYLAS_API_KEY>")

    val queryParams = ListMessagesQueryParams(limit = 5)
    val messages = nylas.messages().list("<NYLAS_GRANT_ID>", queryParams).data

    for (msg in messages) {
        println("${msg.subject} -- from ${msg.from?.firstOrNull()?.email}")
    }
}
```

```bash
nylas email list --limit 5
```

```json
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

## Search a user's messages

The `search_query_native` parameter uses each provider's native search syntax (Gmail search operators, Microsoft KQL, etc.), so it works the way your users expect regardless of their email provider.

```bash
curl --request GET \
  --url "https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages?search_query_native=from:notifications@github.com&limit=5" \
  --header 'Authorization: Bearer <NYLAS_API_KEY>'
```

```js [searchMessages-Node.js]
const results = await nylas.messages.list({
  identifier: process.env.NYLAS_GRANT_ID,
  queryParams: {
    search_query_native: "from:notifications@github.com",
    limit: 5,
  },
});

console.log(`Found ${results.data.length} messages`);
```

```python
results = nylas.messages.list(
    os.environ["NYLAS_GRANT_ID"],
    query_params={
        "search_query_native": "from:notifications@github.com",
        "limit": 5,
    },
)

print(f"Found {len(results.data)} messages")
```

```ruby
results, _ = nylas.messages.list(
  identifier: ENV['NYLAS_GRANT_ID'],
  query_params: {
    search_query_native: 'from:notifications@github.com',
    limit: 5
  }
)

puts "Found #{results.length} messages"
```

```java
ListMessagesQueryParams searchParams = new ListMessagesQueryParams.Builder()
    .searchQueryNative("from:notifications@github.com")
    .limit(5)
    .build();

ListResponse<Message> results = nylas.messages().list("<NYLAS_GRANT_ID>", searchParams);
System.out.println("Found " + results.getData().size() + " messages");
```

```kt
val searchParams = ListMessagesQueryParams(
    searchQueryNative = "from:notifications@github.com",
    limit = 5
)

val results = nylas.messages().list("<NYLAS_GRANT_ID>", searchParams).data
println("Found ${results.size} messages")
```

```bash
nylas email search "from:notifications@github.com" --limit 5
```

You can also filter by standard fields like `from`, `to`, `subject`, and `received_after` without relying on provider-specific syntax. See the [Messages API reference](/docs/reference/api/messages/get-messages/) for all available filters.

## What's next

- **[Authentication](/docs/v3/auth/)** -- set up OAuth so your users can connect their accounts
- **[Webhooks](/docs/v3/notifications/)** -- get notified in real-time when new messages arrive
- **[Provider-specific guides](/docs/cookbook/)** -- Gmail, Microsoft, Yahoo, iCloud, and IMAP deep dives
- **[Messages API reference](/docs/reference/api/messages/get-messages/)** -- full endpoint documentation
- **[Send email from the terminal](https://cli.nylas.com/guides/send-email-from-terminal)** -- quick testing with the Nylas CLI