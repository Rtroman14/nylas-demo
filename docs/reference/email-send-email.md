<!--
  Vendored from https://developer.nylas.com/docs/v3/email/send-email.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Sending messages with Nylas

Source: https://developer.nylas.com/docs/v3/email/send-email/

The Nylas Email API lets you send messages on behalf of authenticated users through their own email provider. You can either send a message immediately or create a draft and send it later. Both approaches use the same REST API, and the provider sees the activity as the user sending the message directly.

## Before you begin

Before you start sending messages, you need the following prerequisites:

- A Nylas application.
- A working authentication configuration. Either...
  - A Nylas Dashboard Sandbox application which includes a demonstration auth config,
    OR
  - A provider auth app ([Google](/docs/provider-guides/google/create-google-app/) or [Azure](/docs/provider-guides/microsoft/create-azure-app/)), and a [connector](/docs/reference/api/connectors-integrations/) for that auth app.
- [A Google or Microsoft grant](/docs/v3/getting-started/) with at least the following scopes:
  - **Google**: `gmail.send`
  - **Microsoft**: `Mail.ReadWrite` and `Mail.Send`

If you haven't set up your Nylas application yet, complete the [Getting Started guide](/docs/v3/getting-started/) first.

## Choose how to send

Nylas offers two ways to send email:

- **[Create and send a draft](#create-and-send-a-draft)** -- prepare a message, save it as a draft synced with the provider, and send it when ready. Best for messages that need review or editing before sending.
- **[Send a message directly](#send-a-message-directly)** -- compose and send in a single request. Best for automated or transactional messages that don't need a draft stage.

Both operations are synchronous. The request blocks until the provider accepts or rejects the message. If the submission fails, Nylas does _not_ retry automatically.

When you make a [Send Message request](/docs/reference/api/messages/send-message/), Nylas connects to the provider and sends the message as the user. Providers see this as the user sending directly, not as an external platform acting on their behalf. This gives you high deliverability, but messages are subject to the provider's rate limits and abuse detection. See [Improve email deliverability](/docs/dev-guide/best-practices/improving-email-delivery/) for best practices.

### Create and send a draft

To prepare a message you don't need to send immediately, create a draft and send it later. Nylas syncs the draft with the provider's Drafts folder.

Make a [Create Draft request](/docs/reference/api/drafts/post-draft/) with the message content:

```bash
curl --request POST \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/drafts' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{
    "subject": "With Love, From Nylas",
    "to": [{
      "email": "leyah@example.com",
      "name": "Leyah Miller"
    }],
    "cc": [{
      "email": "nyla@example.com",
      "name": "Nyla"
    }],
    "bcc": [{
      "email": "nylas-devrel@example.com",
      "name": "Nylas DevRel"
    }],
    "reply_to": [{
      "email": "nylas@example.com",
      "name": "Nylas"
    }],
    "body": "This email was sent using the Nylas Email API. Visit https://nylas.com for details.",
    "tracking_options": {
      "opens": true,
      "links": true,
      "thread_replies": true,
      "label": "Just testing"
    }
  }'

```

```js [createDraftv3-Node.js SDK]

import Nylas from "nylas";

const nylas = new Nylas({
  apiKey: "<NYLAS_API_KEY>",
  apiUri: "<NYLAS_API_URI>",
});
const identifier = "<NYLAS_GRANT_ID>";

const createDraft = async () => {
  try {
    const draft = {
      subject: "Your Subject Here",
      to: [{ name: "Recipient Name", email: "recipient@example.com" }],
      body: "Your email body here.",
    };

    const createdDraft = await nylas.drafts.create({
      identifier,
      requestBody: draft,
    });

    console.log("Draft created:", createdDraft);
  } catch (error) {
    console.error("Error creating draft:", error);
  }
};

createDraft();


```

```python [createDraftv3-Python SDK]

from nylas import Client
from nylas import utils

nylas = Client(
    "<NYLAS_API_KEY>",
    "<NYLAS_API_URI>"
)

grant_id = "<NYLAS_GRANT_ID>"
email = "<EMAIL>"

attachment = utils.file_utils.attach_file_request_builder("Nylas_Logo.png")

draft = nylas.drafts.create(
  grant_id,
  request_body={
    "to": [{ "name": "Name", "email": email }],
    "reply_to": [{ "name": "Name", "email": email }],
    "subject": "Your Subject Here",
    "body": "Your email body here.",
    "attachments": [attachment]
  }
)

print(draft)


```

```ruby [createDraftv3-Ruby SDK]

require 'nylas'	

# Initialize Nylas client
nylas = Nylas::Client.new(
	api_key: "<NYLAS_API_KEY>"
)

file = Nylas::FileUtils.attach_file_request_builder("Nylas_Logo.png")

request_body = {
    subject: "From Nylas",
    body: 'This email was sent using the ' +
              'Nylas email API. ' + 
              'Visit https://nylas.com for details.',
    to: [{ name: "Dorothy Vaughan", 
            email: "dorothy@example.com"}],
    cc: [{ name: "George Washington Carver", 
            email: "carver@example.com"}],
    bcc: [{ name: "Albert Einstein", 
            email: "al@example.com"}],
    reply_to: [{ name: "Stephanie Kwolek", 
            email: "skwolek@example.com"}],
   tracking_options: {label: "hey just testing", 
        opens: true, 
        links: true,
        thread_replies: true},
   attachments: [file]        
}

draft, _ = nylas.drafts.create(identifier: "<NYLAS_GRANT_ID>", request_body: request_body)
puts "Draft \"#{draft[:subject]}\" was created with ID: #{draft[:id]}"


```

```java [createDraftv3-Java SDK]

import com.nylas.NylasClient;
import com.nylas.models.*;
import com.nylas.util.FileUtils;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class CreateDraft {
  public static void main(String[] args) throws NylasSdkTimeoutError, NylasApiError {
    NylasClient nylas = new NylasClient.Builder("<NYLAS_API_KEY>").build();

    CreateAttachmentRequest attachment = FileUtils.attachFileRequestBuilder("src/main/java/Nylas_Logo.png");
    List<CreateAttachmentRequest> request = new ArrayList<>();
    request.add(attachment);

    CreateDraftRequest requestBody = new CreateDraftRequest.Builder().
        to(Collections.singletonList(new EmailName("swag@example.com", "Nylas"))).
        cc(Collections.singletonList(new EmailName("dorothy@example.com", "Dorothy Vaughan"))).
        bcc(Collections.singletonList(new EmailName("Lamarr@example.com", "Hedy Lamarr"))).
        subject("With Love, from Nylas").
        body("This email was sent using the Nylas email API. Visit https://nylas.com for details.").
        attachments(request).
        build();

    Response<Draft> drafts = nylas.drafts().create("<NYLAS_GRANT_ID>", requestBody);

    System.out.println("Draft " + drafts.getData().getSubject() + 
        " was created with ID " + drafts.getData().getId());
  }
}


```

```kt [createDraftv3-Kotlin SDK]

import com.nylas.NylasClient
import com.nylas.models.*
import com.nylas.util.FileUtils

fun main(args: Array<String>) {
  val nylas: NylasClient = NylasClient(
      apiKey = "<NYLAS_API_KEY>"
  )
  
  val attachment: CreateAttachmentRequest = FileUtils.attachFileRequestBuilder("src/main/kotlin/Nylas_Logo.png")

  val requestBody = CreateDraftRequest(
      to = listOf(EmailName("swag@example.com", "Nylas")),
      cc = listOf(EmailName("dorothy@example.com", "Dorothy Vaughan")),
      bcc = listOf(EmailName("Lamarr@example.com", "Hedy Lamarr")),
      subject = "With Love, from Nylas",
      body = "This email was sent using the Nylas Email API. Visit https://nylas.com for details.",
      attachments = listOf(attachment)
  )

  val draft = nylas.drafts().create("<NYLAS_GRANT_ID>", requestBody).data
  
  print("Draft " + draft.subject + " was created with ID: " + draft.id)
}


```

The Create Draft request body accepts the same fields as the [Send Message request](#send-message-request-fields), with these differences:

- `to` is **optional** for drafts (you can save an incomplete draft).
- `starred` (boolean) is supported for drafts but not direct sends.
- `send_at` and `use_draft` are not available on Create Draft. Use [Send Message](/docs/reference/api/messages/send-message/) with `send_at` for [scheduled sends](/docs/v3/email/scheduled-send/).

When you're ready, send the draft by making a [Send Draft request](/docs/reference/api/drafts/send-draft-id/):

```bash
curl --request POST \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/drafts/<DRAFT_ID>'  \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'Content-Type: application/json' \

```

```js [sendDraft-Node.js SDK]

import Nylas from "nylas";

const nylas = new Nylas({
  apiKey: "<NYLAS_API_KEY>",
  apiUri: "<NYLAS_API_URI>",
});
const identifier = "<NYLAS_GRANT_ID>";
const draftId = "<DRAFT_ID>";

const sendDraft = async () => {
  try {
    const sentMessage = await nylas.drafts.send({ identifier, draftId });
    console.log("Draft sent:", sentMessage);
  } catch (error) {
    console.error("Error sending draft:", error);
  }
};

sendDraft();


```

```python [sendDraft-Python SDK]

from nylas import Client

nylas = Client(
    "<NYLAS_API_KEY>",
    "<NYLAS_API_URI>"
)

grant_id = "<NYLAS_GRANT_ID>"
draft_id = "<DRAFT_ID>"

draft = nylas.drafts.send(
  grant_id,
  draft_id
)

print(draft)

```

```ruby [sendDraft-Ruby SDK]

require 'nylas'	

nylas = Nylas::Client.new(
	api_key: "<NYLAS_API_KEY>"
)

draft, _ = nylas.drafts.send(identifier: "<NYLAS_GRANT_ID>", draft_id: "<DRAFT_ID>")

```

```kt [sendDraft-Kotlin SDK]

import com.nylas.NylasClient

fun main(args: Array<String>) {

    val nylas: NylasClient = NylasClient(
        apiKey = "<NYLAS_API_KEY>"
    )

    val draft = nylas.drafts().send("<NYLAS_GRANT_ID>", "<DRAFT_ID>")
    print(draft.data)
}


```

```java [sendDraft-Java SDK]

import com.nylas.NylasClient;
import com.nylas.models.*;

public class SendDraft {
    public static void main(String[] args) throws 
    NylasSdkTimeoutError, NylasApiError {

        NylasClient nylas = new NylasClient.Builder("<NYLAS_API_KEY>").build();

        Response<Message> draft = 
        nylas.drafts().send("<NYLAS_GRANT_ID>", "<DRAFT_ID>");
        System.out.println(draft.getData());
    }
}


```

```bash
# Step 1: Create the draft
nylas email drafts create \
  --to recipient@example.com \
  --subject "Review this draft" \
  --body "Please review and let me know."

# Step 2: Send it by ID when ready
nylas email drafts send <DRAFT_ID>
```


> **Info:** 
> **The [Nylas CLI](https://cli.nylas.com/) runs commands against your default grant.** Run [`nylas auth list`](https://cli.nylas.com/docs/commands/auth-list) to see your connected accounts and [`nylas auth switch <email>`](https://cli.nylas.com/docs/commands/auth-switch) to change which one commands run against. See the full [command reference](https://cli.nylas.com/docs/commands).


### Send a message directly

To send a message without creating a draft, make a [Send Message request](/docs/reference/api/messages/send-message/):

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

```js [sendEmail-Node.js SDK]

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

```python [sendEmail-Python SDK]

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

```ruby [sendEmail-Ruby SDK]

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

```kt [sendEmail-Kotlin SDK]

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

```java [sendEmail-Java SDK]

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

```bash
nylas email send \
  --to recipient@example.com \
  --cc cc@example.com \
  --subject "Project Update" \
  --body "Here's the latest status on the project..."
```

### Send Message request fields

| Field                 | Type          | Required | Description                                                                                                                                                  |
| --------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `to`                  | array[object] | Yes      | Recipients. Each object includes `name` (string) and `email` (string, required).                                                                             |
| `subject`             | string        | No       | Email subject line.                                                                                                                                          |
| `body`                | string        | No       | Message body. HTML is supported unless `is_plaintext` is true.                                                                                               |
| `is_plaintext`        | boolean       | No       | When true, `body` is sent as plain text instead of HTML. Default: false.                                                                                     |
| `cc`                  | array[object] | No       | CC recipients. Same format as `to`.                                                                                                                          |
| `bcc`                 | array[object] | No       | BCC recipients. Same format as `to`.                                                                                                                         |
| `from`                | array[object] | No       | Sender override. See [Override sender display name](#override-sender-display-name).                                                                          |
| `reply_to`            | array[object] | No       | Reply-to addresses. Same format as `to`.                                                                                                                     |
| `reply_to_message_id` | string        | No       | ID of the message being replied to. Nylas adds `In-Reply-To` and `References` headers automatically.                                                         |
| `attachments`         | array[object] | No       | File attachments. Each object includes `filename`, `content` (Base64-encoded), and `content_type`. See [Attachments](/docs/v3/email/attachments/). For files larger than 25MB on Microsoft grants, use the [large attachments flow](/docs/v3/email/send-large-attachments/) and pass `{ "id": "<attachment_id>" }`. |
| `custom_headers`      | array[object] | No       | Custom email headers. Each object includes `name` and `value`. See [Headers and MIME data](/docs/v3/email/headers-mime-data/).                               |
| `tracking_options`    | object        | No       | Open, link click, and thread reply tracking. See [Tracking messages](/docs/v3/email/message-tracking/).                                                      |
| `send_at`             | integer       | No       | Unix timestamp for scheduled delivery. Must be at least 1 minute in the future, max 30 days. See [Scheduling messages](/docs/v3/email/scheduled-send/).      |
| `use_draft`           | boolean       | No       | Google and Microsoft only. When true with `send_at`, saves the message in the Drafts folder until send time. Default: false.                                 |
| `template`            | object        | No       | Template to merge into the message. Includes `id` (required), `strict`, and `variables`. See [Templates and workflows](/docs/v3/email/templates-workflows/). |
| `metadata`            | object        | No       | Key-value pairs for custom metadata. Max 50 pairs, values max 500 characters each.                                                                           |

For the full schema including nested object details, see the [Send Message API reference](/docs/reference/api/messages/send-message/).

## Override sender display name

You can set the sender's display name by including the `from.name` parameter in your request.

> **Warn:** 
> **Some Exchange servers ignore From headers when sending messages and default to the sender's account display name.** When this happens, Nylas can't override the display name. The user needs to change it in their account settings instead.

```bash {12}
curl --request POST \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages/send' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{
    "subject": "Reaching out with Nylas",
    "to": [{
      "name": "Leyah Miller",
      "email": "leyah@example.com"
    }],
    "from": [{
      "name": "Nyla",
      "email": "nyla@example.com"
    }]
  }'
```

If you don't include the `from` field, Nylas uses the account's default display name.

## Attach a signature

You can automatically append an HTML signature to any outgoing message by including the `signature_id` field in your request body. Nylas appends the signature after the message body at send time, including after quoted text in replies and forwards.

```bash
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
    "signature_id": "<SIGNATURE_ID>"
  }'
```

The `signature_id` field also works on [Create Draft](/docs/api/v3/ecc/#tag/drafts/POST/v3/grants/{grant_id}/drafts) and [Send Draft](/docs/api/v3/ecc/#tag/drafts/POST/v3/grants/{grant_id}/drafts/{draft_id}) requests. See [Using email signatures](/docs/v3/email/signatures/) for the full guide on creating, managing, and integrating signatures.

## Keep in mind

> **Warn:** 
> **Set your HTTP client timeout to at least 150 seconds.** Self-hosted Exchange accounts can take up to two minutes to complete a send request, though the average is about two seconds. If your timeout is too low, your application may drop the connection before the provider finishes processing.

> **Warn:** 
> **Apply a backoff strategy for `503` errors.** Your application may need to wait 10-20 minutes before retrying, or the SMTP server may continue refusing connections. See [Sending errors](/docs/v3/email/sending-errors/) for all error codes.

- **Send operations are synchronous.** The request blocks until the provider accepts or rejects the message. If it fails, Nylas does not retry automatically.
- **Use idempotency keys for safe retries.** Pass an `Idempotency-Key` header to retry without sending duplicate emails. See [Idempotent send requests](/docs/v3/email/idempotent-send/).
- **Provider rate limits apply.** Each provider limits how many messages you can send per day. See [Provider rate limits](/docs/dev-guide/best-practices/rate-limits/#provider-rate-limits) for details. For high-volume sending, consider a transactional service like SendGrid, Mailgun, or Amazon SES.
- **Microsoft and iCloud don't support `List-Unsubscribe-Post` or `List-Unsubscribe` headers.** Nylas can't add these headers for messages sent from Microsoft Graph or iCloud accounts.
- **Some providers move messages between folders after sending** (for example, from Outbox to Sent), which may trigger multiple [`message.updated` notifications](/docs/reference/notifications/messages/message-updated/) for a single send.
- **Nylas de-duplicates some webhook notifications**, so you may receive a [`message.updated` notification](/docs/reference/notifications/messages/message-updated/) instead of a [`message.created` notification](/docs/reference/notifications/messages/message-created/) after sending.
- **Bounced messages are detected automatically.** See [Bounce detection](#bounce-detection) below.

## Synchronous send webhooks

Subscribe to the [`message.send_success`](/docs/reference/notifications/messages/message-send_success/) and [`message.send_failed`](/docs/reference/notifications/messages/message-send_failed/) notification triggers to track the outcome of a send.

By default, these webhooks fire only for [scheduled sends](/docs/v3/email/scheduled-send/) (sends that use `send_at`). To also receive them for synchronous (immediate) sends, enable **Synchronous send webhooks** in the [Nylas Dashboard](https://dashboard.nylas.com/): open your application, go to **Customizations → Notifications**, and turn on the setting.

> **Info:** 
> **This setting applies per application.** Once enabled, every synchronous send from the application emits `message.send_success` or `message.send_failed`, in addition to the webhooks you already receive for scheduled sends.

## Bounce detection

Nylas monitors for and notifies you when a user gets a message bounce notification. A bounce notification is a message sent by a recipient's provider when a message can't be delivered. It usually includes a detailed error message explaining the cause.

When a user receives a bounce notification, Nylas scans it and extracts the reason from the error message.

> **Info:** 
> **Bounce notifications are generated only if the bounced messages are sent through Nylas.** If a user sends a message directly through their provider (for example, through the Gmail or Outlook UI), Nylas won't detect the bounce.

Messages can bounce for temporary or permanent reasons:

- **Soft bounces** have a temporary root cause, like the recipient's inbox being full.
- **Hard bounces** have a permanent root cause, like the recipient's email address no longer existing.

Currently, Nylas detects hard bounces only and publishes `mailbox_unavailable` and `domain_not_found` bounce types.

> **Info:** 
> **For bounce detection to work, the bounced message must be properly threaded to the original message.** If threading is broken, the webhook notification won't trigger.

For more information, see the [`message.bounce_detected` notification schema](/docs/reference/notifications/messages/message-bounce_detected/) and [Soft vs. Hard Bounce](https://www.nylas.com/blog/soft-vs-hard-bounce-email-whats-the-difference/?utm_source=docs&utm_content=send-email) on the Nylas blog.

## What's next

- [Idempotent send requests](/docs/v3/email/idempotent-send/) to retry safely without sending duplicates
- [Sending errors](/docs/v3/email/sending-errors/) for error codes and troubleshooting
- [Improve email deliverability](/docs/dev-guide/best-practices/improving-email-delivery/) for best practices
- [Send email from the terminal](https://cli.nylas.com/guides/send-email-from-terminal) — test email sending across providers without writing code