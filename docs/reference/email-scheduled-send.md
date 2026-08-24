<!--
  Vendored from https://developer.nylas.com/docs/v3/email/scheduled-send.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Scheduling messages to send in the future

Source: https://developer.nylas.com/docs/v3/email/scheduled-send/

The Nylas Messages API allows you to schedule messages to be sent in the future. This means you can draft a message in advance and schedule it to send when the time is just right, for example when you want to announce a new version of your product.

## How scheduled send works

When you make a request to the [Send Message endpoint](/docs/reference/api/messages/send-message/), you can define your preferred send time (in seconds using the Unix timestamp format) in the `send_at` field.

> **Info:** 
> **Nylas stores information about scheduled messages for 72 hours after the send time**. After that point, Nylas deletes the message details from its cache.

If the user's provider is Google or Microsoft, you can choose to store the scheduled message in their Drafts folder on the provider. In this case, you can schedule it to send any time in the future.

You can also choose to have Nylas store the message until its send time, which must be between 2 minutes and 30 days in the future.

> **Success:** 
> **Tip!** You can use the `message.send_success` and `message.send_failed` notification triggers to monitor the status of scheduled messages. For more information, see the [list of notification schemas](/docs/reference/notifications/#message-notifications). To receive these webhooks for immediate (synchronous) sends too, see [Synchronous send webhooks](/docs/v3/email/send-email/#synchronous-send-webhooks).

## Before you begin

Before you start scheduling messages, you need the following prerequisites:

- A Nylas application.
- A working authentication configuration. Either...
  - A Nylas Dashboard Sandbox application which includes a demonstration auth config,
    OR
  - A provider auth app ([Google](/docs/provider-guides/google/create-google-app/) or [Azure](/docs/provider-guides/microsoft/create-azure-app/)), and a [connector](/docs/reference/api/connectors-integrations/) for that auth app.
- [A Google or Microsoft grant](/docs/v3/getting-started/) with at least the following scopes:
  - **Google**: `gmail.send`
  - **Microsoft**: `Mail.ReadWrite` and `Mail.Send`

## Schedule a message

To schedule a message to be sent in the future, make a [Send Message request](/docs/reference/api/messages/send-message/) that includes the `send_at` field, and provide the time (in Unix timestamp format) when you want the message to be sent. Nylas returns a `schedule_id` that you can use to reference the scheduled message.

```bash {12} [schedule-Request]
curl --request POST \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages/send' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{
    "subject": "Reaching out with Nylas",
    "body": "Hey! This is testing scheduled emails.",
    "to": [{
      "name": "Leyah Miller",
      "email": "leyah@example.com"
    }],
    "send_at": 1714478400
  }'
```

```json {21} [schedule-Response (JSON)]
{
  "request_id": "1",
  "grant_id": "<NYLAS_GRANT_ID>",
  "data": {
    "body": "Hey! This is testing scheduled emails.",
    "from": [
      {
        "email": "nyla@example.com"
      }
    ],
    "subject": "Reaching out with Nylas",
    "to": [
      {
        "name": "John Doe",
        "email": "john.doe@example.com"
      }
    ],
    "reply_to_message_id": "",
    "send_at": 1714478400,
    "use_draft": false,
    "schedule_id": "8cd56334-6d95-432c-86d1-c5dab0ce98be"
  }
}
```

```js [schedule-Node.js SDK]

import Nylas from "nylas";

const NylasConfig = {
  apiKey: "<NYLAS_API_KEY>",
  apiUri: "<NYLAS_API_URI>",
};

const nylas = new Nylas(NylasConfig);

async function scheduleSendEmail() {
  try {
    const sentMessage = await nylas.messages.send({
      identifier: "<GRANT_ID>",
      requestBody: {
        to: [{ name: "Ram", email: "<EMAIL>" }],
        replyTo: [{ name: "Ram", email: "<EMAIL>" }],
        subject: "Your Subject Here",
        body: "Your email body here.",
        sendAt: 1719105508,
      },
    });

    console.log("Email scheduled:", sentMessage);
  } catch (error) {
    console.error("Error scheduling email:", error);
  }
}

scheduleSendEmail();


```

```py [schedule-Python SDK]

import sys
from nylas import Client

nylas = Client(
    "<NYLAS_API_KEY>",
    "<NYLAS_API_URI>"
)

grant_id = "<GRANT_ID>"
email = "<EMAIL>"

message = nylas.messages.send(
  grant_id,
  request_body={
    "to": [{ "name": "Ram", "email": email }],
    "reply_to": [{ "name": "Ram", "email": email }],
    "subject": "Your Subject Here",
    "body": "Your email body here.",
    "send_at": 1713824548
  }
)

print(message)


```

```rb [schedule-Ruby SDK]

require 'nylas'	

nylas = Nylas::Client.new(
	api_key: "<NYLAS_API_KEY>"
)

request_body = {
    subject: "Reaching out with Nylas",
    body: "Hey! This is testing scheduled emails.",
    to: [{name: "John Doe", email: "john.doe@example.com"}],
    send_at: 1714639370
}

email, _ = nylas.messages.send(identifier: "<NYLAS_GRANT_ID>", request_body: request_body)
puts "Message \"#{email[:subject]}\" was sent"


```

```java [schedule-Java SDK]

import com.nylas.NylasClient;
import com.nylas.models.*;
import java.util.ArrayList;
import java.util.List;

public class SendScheduledEmails {
    public static void main(String[] args) throws 
    NylasSdkTimeoutError, NylasApiError {

        NylasClient nylas = new NylasClient.Builder("<NYLAS_API_KEY>").build();

        List<EmailName> emailNames = new ArrayList<>();
        emailNames.add(new EmailName("john.doe@example.com", "John Doe"));

        SendMessageRequest requestBody = new SendMessageRequest.Builder(emailNames).
                subject("Reaching out with Nylas").
                body("Hey! This is testing scheduled emails.").
                sendAt(1714640910).
                build();

        Response<Message> email = nylas.messages().send("<NYLAS_GRANT_ID>", requestBody);
        System.out.println(email.getData());
    }
}


```

```kt [schedule-Kotlin SDK]

import com.nylas.NylasClient
import com.nylas.models.*

fun main(args: Array<String>) {

    val nylas: NylasClient = NylasClient(
        apiKey = "<NYLAS_API_KEY>"
    )

    val emailNames : List<EmailName> = listOf(EmailName("john.doe@example.com", "John Doe"))
    val requestBody : SendMessageRequest = SendMessageRequest.Builder(emailNames).
    subject("Reaching out with Nylas").
    body("Hey! This is testing scheduled emails.").
    sendAt(1714640910L).
    build()
    val email = nylas.messages().send("<NYLAS_GRANT_ID>",requestBody)
    print(email.data)
}


```

```bash
nylas email send \
  --to leyah@example.com \
  --subject "Reaching out with Nylas" \
  --body "Hey! This is testing scheduled emails." \
  --schedule "tomorrow 9am"
```


> **Info:** 
> **The [Nylas CLI](https://cli.nylas.com/) runs commands against your default grant.** Run [`nylas auth list`](https://cli.nylas.com/docs/commands/auth-list) to see your connected accounts and [`nylas auth switch <email>`](https://cli.nylas.com/docs/commands/auth-switch) to change which one commands run against. See the full [command reference](https://cli.nylas.com/docs/commands).


The `--schedule` flag in the Nylas CLI accepts relative times (`"in 2 hours"`, `"tomorrow 9am"`) and absolute timestamps. See [`nylas email send`](https://cli.nylas.com/docs/commands/email-send) for supported formats.

If you're storing the message on Nylas, you can schedule it to be sent between 2 minutes and 30 days in the future. If you're storing it on the provider, you can schedule it to be sent any time in the future.

To store the message as a draft on the provider, set `use_draft` to `true`.

## Use a custom tracking hostname for a scheduled message

Add `tracking_options.domain_name` to a scheduled send when you want rewritten links and tracking images to use an active organization-owned hostname. Register the hostname first by following [the custom tracking hostname setup](/docs/v3/email/message-tracking/#register-the-hostname).

> **Info:** 
> **Custom tracking hostnames are available on select plans.** Contact your Nylas account representative or the [Nylas Sales team](https://www.nylas.com/contact-sales/) to enable this feature for your organization.

Nylas validates the hostname when it creates the schedule, so malformed, unowned, inactive, deleted, or blocked values fail synchronously with a generic `400` response. Nylas checks the normalized hostname again immediately before delivery because its ownership, certificate, or blocklist status can change while the message waits.

The execution path depends on the scheduled send family:

| Scheduled send family | Tracking and revalidation behavior |
| --- | --- |
| Grant-based message, including a provider-stored scheduled draft | Nylas injects tracking when it creates the schedule. Before the provider call, Nylas checks the custom hostname again without rewriting the tracking URLs a second time. |
| Pure Transactional Send | Nylas injects tracking when it creates the schedule. Immediately before the SES call, Nylas checks the custom hostname again without rewriting the tracking URLs a second time. The route domain remains the sender domain, and the body field remains the tracking hostname. |
| Agent Account message or draft | Nylas validates and stores `domain_name` when it creates the schedule. Inbox preserves the field during replay, then the normal send path checks the hostname again and injects tracking at execution. |

Scheduled drafts follow the behavior for their provider family. If the hostname becomes inactive, is deleted, changes ownership, or is blocked before execution, the send fails through the existing asynchronous failure path. Nylas doesn't fall back to its regional tracking hostname. Use the [`message.send_failed` notification](/docs/reference/notifications/#message-send-failed-notification) to monitor delivery failures.

## Schedule a draft

> **Info:** 
> **Currently, you can schedule drafts for Google and Microsoft Graph accounts only**.

If you want to schedule a message to be sent later, but you're not quite set on what you want the content to be yet, you can schedule a draft. To do this, make a [Send Message request](/docs/reference/api/messages/send-message/) that includes the `send_at` field, and specify `"use_draft": true`.

```bash
curl --request POST \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages/send' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{
    "subject": "Reaching out with Nylas",
    "body": "Hey! This is testing scheduled drafts.",
    "to": [{
      "name": "Leyah Miller",
      "email": "leyah@example.com"
    }],
    "send_at": 1714478400,
    "use_draft": true
  }'
```

```js [scheduleDraft-Node.js SDK]

import Nylas from "nylas";

const NylasConfig = {
  apiKey: "<NYLAS_API_KEY>",
  apiUri: "<NYLAS_API_URI>",
};

const nylas = new Nylas(NylasConfig);

async function scheduleSendEmail() {
  try {
    const sentMessage = await nylas.messages.send({
      identifier: "<GRANT_ID>",
      requestBody: {
        to: [{ name: "Ram", email: "<EMAIL>" }],
        replyTo: [{ name: "Ram", email: "<EMAIL>" }],
        subject: "Your Subject Here",
        body: "Your email body here.",
        sendAt: 1719105508,
        useDraft: true,
      },
    });

    console.log("Email scheduled:", sentMessage);
  } catch (error) {
    console.error("Error scheduling email:", error);
  }
}

scheduleSendEmail();


```

```py [scheduleDraft-Python SDK]

import sys
from nylas import Client

nylas = Client(
    "<NYLAS_API_KEY>",
    "<NYLAS_API_URI>"
)

grant_id = "<GRANT_ID>"
email = "<EMAIL>"

message = nylas.messages.send(
  grant_id,
  request_body={
    "to": [{ "name": "Ram", "email": email }],
    "reply_to": [{ "name": "Ram", "email": email }],
    "subject": "Your Subject Here",
    "body": "Your email body here.",
    "send_at": 1713824548,
    "use_draft": True
  }
)

print(message)


```

```rb [scheduleDraft-Ruby SDK]

require 'nylas'	

nylas = Nylas::Client.new(
	api_key: "<NYLAS_API_KEY>"
)

request_body = {
    subject: "Reaching out with Nylas",
    body: "Hey! This is testing scheduled emails.",
    to: [{name: "John Doe", email: "john.doe@example.com"}],
    send_at: 1714639370,
    use_draft: true
}

email, _ = nylas.messages.send(identifier: "<NYLAS_GRANT_ID>", request_body: request_body)
puts "Message \"#{email[:subject]}\" was sent"


```

```java [scheduleDraft-Java SDK]

import com.nylas.NylasClient;
import com.nylas.models.*;
import java.util.ArrayList;
import java.util.List;

public class SendScheduledEmails {
    public static void main(String[] args) throws 
    NylasSdkTimeoutError, NylasApiError {

        NylasClient nylas = new NylasClient.Builder("<NYLAS_API_KEY>").build();

        List<EmailName> emailNames = new ArrayList<>();
        emailNames.add(new EmailName("john.doe@example.com", "John Doe"));

        SendMessageRequest requestBody = new SendMessageRequest.Builder(emailNames).
                subject("Reaching out with Nylas").
                body("Hey! This is testing scheduled emails.").
                sendAt(1714640910).
                useDraft(true).
                build();

        Response<Message> email = nylas.messages().send("<NYLAS_GRANT_ID>", requestBody);
        System.out.println(email.getData());
    }
}


```

```kt [scheduleDraft-Kotlin SDK]

import com.nylas.NylasClient
import com.nylas.models.*

fun main(args: Array<String>) {

    val nylas: NylasClient = NylasClient(
        apiKey = "<NYLAS_API_KEY>"
    )

    val emailNames : List<EmailName> = listOf(EmailName("john.doe@example.com", "John Doe"))
    val requestBody : SendMessageRequest = SendMessageRequest.Builder(emailNames).
    subject("Reaching out with Nylas").
    body("Hey! This is testing scheduled emails.").
    sendAt(1714640910L).
    useDraft(true).
    build()
    val email = nylas.messages().send("<NYLAS_GRANT_ID>",requestBody)
    print(email.data)
}


```

Nylas saves the message in the user's Drafts folder until the defined `send_at` time.

> **Warn:** 
> **Don't move or delete scheduled drafts from the user's Draft folder**. If you do, Nylas is unable to send the scheduled draft, and returns an error when it tries.

You can edit a scheduled draft until 10 seconds before the defined `send_at` time. To do this, make an [Update Draft request](/docs/reference/api/drafts/put-drafts-id/) that includes the `draft_id` and the fields you want to modify.

If you want to update a draft's scheduled send time, you must [delete the schedule](#stop-a-scheduled-email-message) and create a new one.

## Read scheduled messages

You can make a [Get Scheduled Messages request](/docs/reference/api/messages/get-schedules/) or use the Nylas SDKs to get information about all of your scheduled messages. Nylas returns a list of schedule instructions, including their schedule IDs and information about their status.

```bash
curl --request GET \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages/schedules' \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>'

```

```json [scheduledMessages-Response (JSON)]
[
  {
    "schedule_id": "8cd56334-6d95-432c-86d1-c5dab0ce98be",
    "status": {
      "code": "pending",
      "description": "schedule send awaiting send at time"
    }
  },
  {
    "schedule_id": "rb856334-6d95-432c-86d1-c5dab0ce98be",
    "status": {
      "code": "success",
      "description": "schedule send succeeded"
    },
    "close_time": 1690579819
  }
]
```

```js [scheduledMessages-Node.js SDK]

import Nylas from "nylas";

const nylas = new Nylas({
  apiKey: "<NYLAS_API_KEY>",
  apiUri: "<NYLAS_API_URI>",
});

async function fetchMessageSchedules() {
  try {
    const identifier = "<NYLAS_GRANT_ID>";
    const messageSchedules = await nylas.messages.listScheduledMessages({
      identifier,
    });

    console.log("Message Schedules:", messageSchedules);
  } catch (error) {
    console.error("Error fetching message schedules:", error);
  }
}

fetchMessageSchedules();


```

```py [scheduledMessages-Python SDK]

import sys
from nylas import Client

nylas = Client(
    "<NYLAS_API_KEY>",
    "<NYLAS_API_URI>"
)

grant_id = "<NYLAS_GRANT_ID>"

messages = nylas.messages.list_scheduled_messages(
  grant_id
)

print(messages)

```

```rb [scheduledMessages-Ruby SDK]

require 'nylas'

# Initialize Nylas client
nylas = Nylas::Client.new(
	  api_key: "<NYLAS_API_KEY>"
)

messages, _ = nylas.messages.list_scheduled_messages(identifier: "<NYLAS_GRANT_ID>")

messages.each {|message|
    puts message
}

```

```java [scheduledMessages-Java SDK]

import com.nylas.NylasClient;
import com.nylas.models.*;

public class ReturnMessage {
  public static void main(String[] args) throws NylasSdkTimeoutError, NylasApiError {
    NylasClient nylas = new NylasClient.Builder("<NYLAS_API_KEY>").build();

    ListResponse<ScheduledMessage> message = nylas.messages().listScheduledMessages("<NYLAS_GRANT_ID>");
    
    System.out.println(message.getData());
  }
}


```

```kt [scheduledMessages-Kotlin SDK]

import com.nylas.NylasClient

fun main(args: Array<String>) {
  val nylas: NylasClient = NylasClient(
      apiKey = "<NYLAS_API_KEY>"
  )

  val messages = nylas.messages().listScheduledMessages("<NYLAS_GRANT_ID>").data
  
  print(messages)
}


```

```bash
nylas email scheduled list
```

See [`nylas email scheduled list`](https://cli.nylas.com/docs/commands/email-scheduled-list) for full options. If you see a schedule instruction that you're interested in, you can pass its `schedule_id` in a [Get Scheduled Message request](/docs/reference/api/messages/get-schedule-by-id/) or using the Nylas SDKs to get information about it.

```bash
curl --request GET \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages/schedules/<SCHEDULE_ID>' \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>'

```

```json [scheduledMessage-Response (JSON)]
{
  "schedule_id": "8cd56334-6d95-432c-86d1-c5dab0ce98be",
  "status": {
    "code": "pending",
    "description": "schedule send awaiting send at time"
  }
}
```

```js [scheduledMessage-Node.js SDK]

import Nylas from "nylas";

const NylasConfig = {
  apiKey: "<NYLAS_API_KEY>",
  apiUri: "<NYLAS_API_URI>",
};

const nylas = new Nylas(NylasConfig);

async function fetchScheduledMessageById() {
  try {
    const events = await nylas.messages.findScheduledMessage({
      identifier: "<NYLAS_GRANT_ID>",
      scheduleId: "<SCHEDULE_ID>",
    });

    console.log("Events:", events);
  } catch (error) {
    console.error("Error fetching calendars:", error);
  }
}

fetchScheduledMessageById();


```

```py [scheduledMessage-Python SDK]

import sys
from nylas import Client

nylas = Client(
    "<NYLAS_API_KEY>",
    "<NYLAS_API_URI>"
)

grant_id = "<NYLAS_GRANT_ID>"
schedule_id = "<SCHEDULE_ID>"

event = nylas.messages.find_scheduled_message(
    grant_id,
    schedule_id,
)

print(event)

```

```rb [scheduledMessage-Ruby SDK]

require 'nylas'

# Initialize Nylas client
nylas = Nylas::Client.new(
	  api_key: "<NYLAS_API_KEY>"
)

messages, _ = nylas.messages.find_scheduled_messages(
    identifier: "<NYLAS_GRANT_ID>",
    schedule_id: "<SCHEDULE_ID>")

messages.each {|message|
    puts message
}

```

```java [scheduledMessage-Java SDK]

import com.nylas.NylasClient;
import com.nylas.models.*;

public class ReturnMessage {
  public static void main(String[] args) throws NylasSdkTimeoutError, NylasApiError {
    NylasClient nylas = new NylasClient.Builder("<NYLAS_API_KEY>").build();

    Response<ScheduledMessage> message = nylas.messages().findScheduledMessage(
        "<NYLAS_GRANT_ID>", 
        "<SCHEDULED_MESSAGE_ID>");
        
    System.out.println(message.getData());
  }
}


```

```kt [scheduledMessage-Kotlin SDK]

import com.nylas.NylasClient

fun main(args: Array<String>) {
  val nylas: NylasClient = NylasClient(
      apiKey = "<NYLAS_API_KEY>"
  )

  val messages = nylas.messages().findScheduledMessage(
      "<NYLAS_GRANT_ID>", 
      "<SCHEDULED_MESSAGE_ID").data

  print(messages)
}

```

```bash
nylas email scheduled show <SCHEDULE_ID>
```

## Cancel a scheduled message

Sometimes, you might decide you don't want to send a scheduled message. When this happens, make a [Cancel Scheduled Message request](/docs/reference/api/messages/delete-a-scheduled-message/) at least 10 seconds before the `send_at` time.

```bash
curl --request DELETE \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages/schedules/<SCHEDULE_ID>' \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>'

```

```json [stopSchedule-Response (JSON)]
{
  "Succesfully Request Schedule Deletion": {
    "value": {
      "request_id": "8cd56334-6d95-432c-86d1-c5dab0ce98be",
      "data": {
        "message": "requested cancelation for workflow"
      }
    }
  }
}
```

```js [stopSchedule-Node.js SDK]

import Nylas from "nylas";

const NylasConfig = {
  apiKey: "<NYLAS_API_KEY>",
  apiUri: "<NYLAS_API_URI>",
};

const nylas = new Nylas(NylasConfig);

async function deleteMessageSchedule() {
  try {
    const result = await nylas.messages.stopScheduledMessage({
      identifier: "<NYLAS_GRANT_ID>",
      scheduleId: "<SCHEDULE_ID>",
    });

    console.log("Result:", result);
  } catch (error) {
    console.error("Error deleting message:", error);
  }
}

deleteMessageSchedule();


```

```py [stopSchedule-Python SDK]

import sys
from nylas import Client

nylas = Client(
    "<NYLAS_API_KEY>",
    "<NYLAS_API_URI>"
)

grant_id = "<NYLAS_GRANT_ID>"
schedule_id = "<SCHEDULE_ID>"

result = nylas.messages.stop_scheduled_message(
  grant_id,
  schedule_id,
)

print(result)

```

```rb [stopSchedule-Ruby SDK]

require 'nylas'

# Initialize Nylas client
nylas = Nylas::Client.new(
	  api_key: "<NYLAS_API_KEY>"
)

messages, _ = nylas.messages.stop_scheduled_messages(
    identifier: "<NYLAS_GRANT_ID>",
    schedule_id: "<SCHEDULE_ID>")

messages.each {|message|
    puts message
}

```

```java [stopSchedule-Java SDK]

import com.nylas.NylasClient;
import com.nylas.models.*;

public class ReturnMessage {
  public static void main(String[] args) throws NylasSdkTimeoutError, NylasApiError {
    NylasClient nylas = new NylasClient.Builder("<NYLAS_API_KEY>").build();

    Response<StopScheduledMessageResponse> message = nylas.messages().stopScheduledMessage(
        "<NYLAS_GRANT_ID>",
        "SCHEDULED_MESSAGE_ID",
        null);
        
    System.out.println(message.getData());
  }
}


```

```kt [stopSchedule-Kotlin SDK]

import com.nylas.NylasClient

fun main(args: Array<String>) {
  val nylas: NylasClient = NylasClient(
      apiKey = "<NYLAS_API_KEY>"
  )

  val messages = nylas.messages().stopScheduledMessage(
      "<NYLAS_GRANT_ID>", 
      "SCHEDULED_MESSAGE_ID").data
      
  print(messages)
}


```

```bash
nylas email scheduled cancel <SCHEDULE_ID>
```

> **Warn:** 
> **If you delete the instructions to send a message that isn't saved as a draft, you also delete the unsent message and its contents**. If you stop a scheduled draft (`"use_draft": true`), you can still access the draft and its contents by making a [Get Draft request](/docs/reference/api/drafts/get-draft-id/) that includes the `draft_id`.