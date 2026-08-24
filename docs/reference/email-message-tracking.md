<!--
  Vendored from https://developer.nylas.com/docs/v3/email/message-tracking.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Tracking messages

Source: https://developer.nylas.com/docs/v3/email/message-tracking/

The Nylas Messages API offers several tracking options that allow you to monitor engagement with the messages you send. You can monitor the following interactions:

- A link in the message has been clicked.
- The message has been opened.
- Someone replied to the thread.

> **Warn:** 
> **Message tracking isn't available for Sandbox applications**. To use message tracking features, you need to upgrade to a production application. For more information about upgrading, see [Using the Dashboard](/docs/dev-guide/dashboard/)
> 
> If you're using a Sandbox application (trial account), you'll receive this error message: `Tracking options are not allowed for trial accounts`.

## How message tracking works

When you enable a tracking flag, Nylas modifies the content of the message so it can be tracked. You can subscribe to the notification triggers for each of the available tracking options to be notified when an event occurs.

When a user acts on a message that you enabled tracking for (for example, opening the message), Nylas sends a `POST` to your notification endpoint (webhook listener or Pub/Sub topic) with information about the action. This includes important information that you can use to track or respond to the event.

To learn more about the general structure of message tracking notifications, see the [list of notification schemas](/docs/reference/notifications/#message-tracking-notifications).

> **Warn:** 
> **If you delete a grant, tracking links associated with that grant stop working.** Nylas can no longer match incoming tracking events to the deleted grant, so you lose open, click, and reply notifications for messages sent before the deletion. If a grant expires, re-authenticate it instead of deleting it to preserve tracking data. See [Handling expired grants](/docs/dev-guide/best-practices/grant-lifecycle/) for details.

## Scopes for message tracking

Before you start using message tracking, you need to request the following [scopes](/docs/dev-guide/scopes/):

- **Google**: `gmail.send`
- **Microsoft**: `Mail.ReadWrite`, `Mail.Send`

> **Info:** 
> **IMAP connectors don't support scopes**. Don't worry. You'll still receive webhook and Pub/Sub notifications when their trigger conditions are met. For more information, see [Create grants with IMAP authentication](/docs/v3/auth/imap/).

## Enable message tracking

To enable tracking for a message, include a `tracking_options` JSON object in your [Send Message](/docs/reference/api/messages/send-message/) or [Create Draft](/docs/reference/api/drafts/post-draft/) request.

```json
...
  "tracking_options": {
    "opens": true,      // Enable message open tracking.
    "links": true,      // Enable link clicked tracking.
    "thread_replies": true,    // Enable thread replied tracking.
    "label": "Use this string to describe the message you're enabling tracking for. It's included in notifications about tracked events."
  }
...
```

```python [enableTracking-Python SDK]

from nylas import Client

nylas = Client(
    "<NYLAS_API_KEY>",
    "<NYLAS_API_URI>"
)

grant_id = "<NYLAS_GRANT_ID>"
email = "<EMAIL>"

message = nylas.messages.send(
  grant_id,
  request_body={
    "to": [{ "name": "Name", "email": email }],
    "reply_to": [{ "name": "Name", "email": email }],
    "reply_to_message_id": "<MESSAGE_ID>",
    "subject": "Your Subject Here",
    "body": "Your email body here.",
    "tracking_options": {
      "opens": True,
      "links": True,
      "thread_replies": True,
    }
  }
)

print(message)

```

```ruby [enableTracking-Ruby SDK]
require 'nylas'

nylas = Nylas::Client.new(api_key: '<NYLAS_API_KEY>')

request_body = {
  subject: "With Love, from Nylas",
  body: "This email was sent using the <b>Ruby SDK</b> for the Nylas Email API.
      Visit <a href='https://nylas.com'>Nylas.com</a> for details.",
  to: [{name: "Nylas", email: "ireadthedocs@nylas.com"}],
  tracking_options: {label: "Track this message",
      opens: true,
      links: true,
      thread_replies: true}
}

email, _ = nylas.messages.send(identifier: '<NYLAS_GRANT_ID>', request_body: request_body)

puts "Message \"#{email[:subject]}\" was sent with ID #{email[:id]}"
```

```java [enableTracking-Java SDK]


public class EmailTracking {
  public static void main(String[] args) throws NylasSdkTimeoutError, NylasApiError {
    NylasClient nylas = new NylasClient.Builder("<NYLAS_API_KEY>").build();
    List<EmailName> emailNames = new ArrayList<>();
    emailNames.add(new EmailName("swag@example.com", "Nylas"));
    TrackingOptions options = new TrackingOptions("Track this message",true, true, true);

    SendMessageRequest requestBody = new SendMessageRequest.Builder(emailNames).
        subject("With Love, from Nylas").
        body("This email was sent using the <b>Java SDK</b> for the Nylas Email API. " +
            "Visit <a href='https://nylas.com'>Nylas.com</a> for details.").
        trackingOptions(options).build();

    Response<Message> email = nylas.messages().send("<NYLAS_GRANT_ID>", requestBody);

    System.out.println("Message " + email.getData().getSubject() + " was sent with ID " + email.getData().getId());
  }
}
```

```kt [enableTracking-Kotlin SDK]


fun main(args: Array<String>) {
  val nylas: NylasClient = NylasClient(apiKey = "<NYLAS_API_KEY>")
  val emailNames : List<EmailName> = listOf(EmailName("swag@example.com", "Nylas"))
  val options : TrackingOptions = TrackingOptions("Track this message", true, true, true)

  val requestBody : SendMessageRequest = SendMessageRequest.
      Builder(emailNames).
      subject("With Love, from Nylas").
      body("This email was sent using the <b>Kotlin SDK</b> for the Nylas Email API. " +
          "See the <a href='https://developer.nylas.com/docs/v3/sdks/'>Nylas documentation</a> for details.").
      trackingOptions(options).
      build()

  val email = nylas.messages().send("<NYLAS_GRANT_ID>", requestBody)

  print("Message " + email.data.subject + " was sent with ID " + email.data.id)
}
```

## Use a custom tracking hostname

By default, Nylas uses its regional tracking hostname for rewritten links and tracking images. To keep recipient-facing tracking URLs under your brand, register an organization-owned custom hostname and select it with `tracking_options.domain_name`.

> **Info:** 
> **Custom tracking hostnames are available on select plans.** Contact your Nylas account representative or the [Nylas Sales team](https://www.nylas.com/contact-sales/) to enable this feature for your organization.

### Register the hostname

Registration is the same organization-level procedure used for [whitelabeled Hosted Authentication](/docs/v3/auth/whitelabeling/). Pick a subdomain that reads well in a link, such as `links.example.com` or `click.example.com`, since recipients see it on every rewritten link and every tracking image.


A custom hostname is a subdomain you own that Nylas serves under its own TLS certificate. Registration is organization-level and shared: Hosted Authentication and [message tracking](/docs/v3/email/message-tracking/#use-a-custom-tracking-hostname) use the same registry, the same DNS records, and the same certificate process. There's no purpose field, and you don't attach a hostname to an application.

Register a separate hostname for each use, because the two are seen in different places. A hostname such as `auth.example.com` appears in the browser while someone connects their mailbox, and one such as `links.example.com` appears in tracked links inside messages you send. Registering both is the same 4 steps, run twice.

1. Open **Organization > Domains > Custom Hostnames** in the [Nylas Dashboard](https://dashboard-v3.nylas.com/organization/domains?tab=hosted-auth).
2. Add the fully qualified hostname you want to use. Nylas generates the two `CNAME` records for it, one for traffic and one for Automated Certificate Management Environment (ACME) validation.
3. Publish both records the Dashboard lists under **Configure DNS Records**. Use **Copy zone file** to grab them in one step, or copy each target individually.
4. Click **Verify**. Nylas checks the records, issues the TLS certificate, and confirms when the hostname is active and ready to use.

| Dashboard label | Record name | `CNAME` target | Purpose |
| --- | --- | --- | --- |
| Traffic CNAME | `<your-hostname>` | `<certificate-id>.ch.<region>.nylas.com` | Routes requests for the hostname to Nylas. |
| ACME delegation CNAME | `_acme-challenge.<your-hostname>` | `<certificate-id>.acme.<region>.nylas.com` | Lets Nylas issue and renew the hostname's TLS certificate. |

Both targets share one certificate ID, a UUID unique to that hostname, and `<region>` is the region your organization is in: `us` or `eu`. Copy the values from the Dashboard rather than assembling them by hand.

Verification is the only manual step. Once you click **Verify** and both records resolve, Nylas issues the certificate over ACME and it usually goes active in under a minute.

> **Warn:** 
> **Deleting a custom hostname takes effect immediately.** Hosted Authentication stops working on that hostname, and tracking links and tracking images in messages you already sent break. Keep both DNS records in place while any auth flow or delivered message still depends on the hostname.


### Select the hostname in a request

Set `domain_name` in `tracking_options` and enable `links`, `opens`, or both. Nylas uses the same custom hostname for every rewritten link and open pixel in that request.

For Transactional Send, the two domain values have different jobs:

- `sender.example.com` in `/v3/domains/sender.example.com/messages/send` is the verified domain that sends the message.
- `tracking.example.com` in `tracking_options.domain_name` is the custom hostname used for link click and message open tracking.

The sender domain and tracking hostname can be different. Both must be registered and eligible for their respective uses.

### Custom hostname validation and errors

Nylas normalizes `tracking_options.domain_name` by trimming surrounding whitespace, removing one trailing dot, and converting ASCII letters to lowercase. Use an ASCII fully qualified hostname with at least one dot. Don't use a URL scheme, path, port, wildcard, Unicode internationalized hostname, empty value, or value longer than 253 characters.

| Request condition | Behavior |
| --- | --- |
| `domain_name` is omitted | Nylas uses its regional tracking hostname. If `tracking_options` is also omitted, existing send behavior is unchanged. |
| The organization owns the active hostname | Nylas uses it for enabled link click and message open tracking. |
| The hostname is malformed, inactive, deleted, blocked, or owned by another organization | Nylas returns a generic `400` response. |
| `domain_name` is set while both `links` and `opens` are disabled | Nylas returns the same generic `400` response because the hostname has no effect on the message. |
| Only `thread_replies` is enabled with `domain_name` | Nylas returns the same generic `400` response. Thread reply tracking doesn't generate a URL and doesn't support a custom hostname. |
| The explicit ownership and certificate lookup fails | Nylas returns a `5xx` response without substituting a Nylas hostname. |

Malformed, unowned, inactive, deleted, and blocked hostnames use the same customer-facing error so the response doesn't reveal another organization's hostname:

> `tracking_options.domain_name must be an active custom hostname for this organization`

### Custom hostname behavior for drafts

- **Create Draft** validates and stores an explicit custom hostname with the draft's link click and message open tracking state.
- **Update Draft with `domain_name`** validates the value and replaces the draft's previous custom hostname.
- **Update Draft without `domain_name`** inherits the draft's current custom hostname while Nylas merges the other tracking options.
- **Disable both `links` and `opens`** to remove their tracking state and stored custom hostname.
- **Re-enable `links` or `opens` later without `domain_name`** to use the regional Nylas tracking hostname.

Scheduled messages validate a custom hostname both when you create the schedule and before delivery. For the execution behavior of grant-based, Transactional Send, and Agent Account schedules, see [Use a custom tracking hostname for a scheduled message](/docs/v3/email/scheduled-send/#use-a-custom-tracking-hostname-for-a-scheduled-message).

## Link clicked tracking

When you enable link clicked tracking for a message, Nylas replaces the links in the message with tracking links. When a user clicks one of the links, Nylas logs the click, forwards the user to the original link address, and sends you a notification.

> **Info:** 
> **Link clicked tracking applies to all links in a message, with some exceptions for security purposes**. It can't be enabled for only _some_ links.

Nylas ignores any links that contain credentials, so you don't have to worry about rewriting sensitive URLs. For more information, see the [Best practices for link clicked tracking section](#best-practices-for-link-clicked-tracking).

### Formatting links for tracking

For link clicked tracking to work correctly, you must use a valid URI format and enclose the link in HTML anchor tags (for example, `<a href="https://www.example.com">link</a>`). Nylas supports the following URI schemes:

- `https`
- `mailto`
- `tel`

Nylas can detect and track links like the following examples:

- `<a href="https://www.google.com">google.com</a>`
- `<a href="mailto:nyla@example.com">Mailto Nyla!</a>`
- `<a href="tel:+1-201-555-0123">Call now to make your reservation.</a>`

The links below are invalid and can't be tracked:

- `<a>www.google.com</a>`: Improperly formatted HTML.
- `<a href="zoommtg://zoom.us/join?confno=12345">Join a zoom conference</a>`: Unsupported URI scheme (`zoommtg:`).

Nylas also checks every link against a reputation denylist before rewriting it, and rejects the whole send if any link is on it. Placeholder domains are a common casualty: sending a tracked message with an `example.com` link returns an `api.tracking_error` response with the message `has been reported as phishing or spam. please remove the link from your email.` Use a domain you own when you test link clicked tracking.

> **Warn:** 
> **Nylas doesn't replace invalid links with a tracking link**. They're left as-written and aren't tracked. Be sure to double-check your links before sending a message!

### Link clicked tracking examples

The following example shows the type of JSON notification you can expect.

```json

{
  "specversion": "1.0",
  "type": "message.link_clicked",
  "source": "/com/nylas/tracking",
  "id": "<WEBHOOK_ID>",
  "time": 1695480423,
  "data": {
    "application_id": "NYLAS_APPLICATION_ID",
    "grant_id": "NYLAS_GRANT_ID",
    "object": {
      "link_data": [
        {
          "count": 1,
          "url": "https://www.example.com"
        }
      ],
      "message_id": "18ac281f237c934b",
      "label": "Hey, just testing",
      "recents": [
        {
          "click_id": "0",
          "ip": "<IP ADDR>",
          "link_index": "0",
          "timestamp": 1695480422,
          "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
        },
        {
          "click_id": "1",
          "ip": "<IP ADDR>",
          "link_index": "0",
          "timestamp": 1695480422,
          "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
        },
        {
          "click_id": "2",
          "ip": "<IP ADDR>",
          "link_index": "0",
          "timestamp": 1695480422,
          "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
        }
      ],
      "sender_app_id": "<app id>",
      "timestamp": 1695480422
    }
  }
}


```

For more information about metadata in link clicked tracking responses, see the [Link Clicked notification schema](/docs/reference/notifications/message-tracking/message-link_clicked/).

#### The `recents` array in link clicked tracking

The `recents` array in a [`message.link_clicked` notification](/docs/reference/notifications/message-tracking/message-link_clicked/) contains entries for the last 50 link tracking events for a specific link, in a specific message. Each entry includes a `link_index`, which identifies the link that was clicked, and a `click_id`, which identifies the specific event. The user's Internet Protocol address and [user agent](https://www.useragents.me/) are also logged.

Event IDs are unique only within a specific `recents` array, and each message/trigger pair has its own `recents` array.

The `message.link_clicked` notification payload also includes the `link_data` dictionary, which contains the links from the message and a `count` representing how many times each link has been clicked at the time that the notification was generated.

> **Info:** 
> **Note**: While the `count` of events starts at `1`, the `click_id` and `opened_id` indices start at `0`.

### Best practices for link clicked tracking

When you enable link clicked tracking, Nylas rewrites all valid HTML links with a new URL that allows tracking. This process omits and doesn't rewrite tracking links with embedded login credentials, because the destination servers don't recognize the rewritten credentials. For this reason, Nylas ignores links that contain credentials. The links still work when clicked, but Nylas doesn't track user interactions with them. For example, private Google Form URLs contain login credentials, so Nylas ignores those links and they can't be tracked.

## Message open tracking

When you enable message open tracking for a message, Nylas inserts a transparent one-pixel image into the message's HTML. When a recipient opens the message, their email client makes a request to Nylas to download the file. Nylas records that request as a `message.opened` event and sends you a notification.

> **Info:** 
> **If your grant is expired, you'll still receive `message.opened` notifications**. If your grant has been deleted, however, Nylas stops sending `message.send` notifications.

Because this method relies on the email client requesting the file from Nylas' servers, ad blockers and content delivery networks can interfere with message open tracking. It's best to use message open tracking along with link clicked tracking and other methods. For more information, see [Troubleshooting immediate webhook notifications](/docs/support/troubleshooting/immediate-webhook-notification/).

### Message open tracking examples

The following code samples show how to enable message open tracking for a message, and the type of JSON notification you can expect.

```bash
curl --request POST \
  --url https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages/send \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{
	"subject": "Hey Reaching Out with Nylas",
	"body": "Hey I would like to track this link <a href='https://espn.com'>My Example Link</a>",
	"to": [
		{
			"name": "John Doe",
			"email": "john.doe@example.com"
		}
	],
	"tracking_options": {
		"opens": true
	}
}'


```

```json [messageOpen-Notification (JSON)]

{
  "specversion": "1.0",
  "type": "message.opened",
  "source": "/com/nylas/tracking",
  "id": "<WEBHOOK_ID>",
  "time": 1695480567,
  "data": {
    "application_id": "NYLAS_APPLICATION_ID",
    "grant_id": "NYLAS_GRANT_ID",
    "object": {
      "message_data": {
        "count": 1,
        "timestamp": 1695480410
      },
      "message_id": "18ac281f237c934b",
      "label": "Testing Nylas Messaged Opened Tracking",
      "recents": [
        {
          "ip": "<IP ADDR>",
          "opened_id": 0,
          "timestamp": 1695480567,
          "user_agent": "Mozilla/5.0"
        },
        {
          "ip": "<IP ADDR>",
          "opened_id": 1,
          "timestamp": 1695480567,
          "user_agent": "Mozilla/5.0"
        },
        {
          "ip": "<IP ADDR>",
          "opened_id": 2,
          "timestamp": 1695480567,
          "user_agent": "Mozilla/5.0"
        }
      ],
      "sender_app_id": "<app id>",
      "timestamp": 1695480410
    }
  }
}


```

```js [messageOpen-Node.js SDK]

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
        trackingOptions: {
          opens: true,
        },
      },
    });

    console.log("Email sent:", sentMessage);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

sendEmail();


```

```python [messageOpen-Python SDK]

from nylas import Client

nylas = Client(
    "<NYLAS_API_KEY>",
    "<NYLAS_API_URI>"
)

grant_id = "<NYLAS_GRANT_ID>"
email = "<EMAIL>"

message = nylas.messages.send(
  grant_id,
  request_body={
    "to": [{ "name": "Name", "email": email }],
    "reply_to": [{ "name": "Name", "email": email }],
    "reply_to_message_id": "<MESSAGE_ID>",
    "subject": "Your Subject Here",
    "body": "Your email body here.",
    "tracking_options": {
      "opens": True,
      "links": False,
      "thread_replies": False,
    }
  }
)

print(message)

```

```ruby [messageOpen-Ruby SDK]
require 'nylas'

nylas = Nylas::Client.new(api_key: '<NYLAS_API_KEY>')

request_body = {
  subject: "With Love, from Nylas",
  body: "This email was sent using the <b>Ruby SDK</b> for the Nylas Email API.
      Visit <a href='https://nylas.com'>Nylas.com</a> for details.",
  to: [{name: "Nylas", email: "swag@example.com"}],
  tracking_options: {label: "Track when the message gets opened",
      opens: true,
      links: false,
      thread_replies: false}
}

email, _ = nylas.messages.send(identifier: '<NYLAS_GRANT_ID>', request_body: request_body)

puts "Message \"#{email[:subject]}\" was sent with ID #{email[:id]}"
```

```java [messageOpen-Java SDK]


public class EmailTracking {
  public static void main(String[] args) throws NylasSdkTimeoutError, NylasApiError {
    NylasClient nylas = new NylasClient.Builder("<NYLAS_API_KEY>").build();

    List<EmailName> emailNames = new ArrayList<>();
    emailNames.add(new EmailName("swag@example.com", "Nylas"));

    TrackingOptions options = new TrackingOptions("Track when the message gets opened", true, false, false);

    SendMessageRequest requestBody = new SendMessageRequest.Builder(emailNames).
        subject("With Love, from Nylas").
        body("This email was sent using the <b>Java SDK</b> for the Nylas Email API. " +
            "Visit <a href='https://nylas.com'>Nylas.com</a> for details.").
        trackingOptions(options).build();

    Response<Message> email = nylas.messages().send("<NYLAS_GRANT_ID>", requestBody);

    System.out.println("Message " + email.getData().getSubject() + " was sent with ID " + email.getData().getId());
  }
}
```

```kt [messageOpen-Kotlin SDK]


fun main(args: Array<String>) {
  val nylas: NylasClient = NylasClient(apiKey = "<NYLAS_API_KEY>")
  val emailNames : List<EmailName> = listOf(EmailName("swag@example.com", "Nylas"))
  val options : TrackingOptions = TrackingOptions("Track when the message gets opened", true, false, false)

  val requestBody : SendMessageRequest = SendMessageRequest.
      Builder(emailNames).
      subject("With Love, from Nylas").
      body("This email was sent using the <b>Kotlin SDK</b> for the Nylas Email API. " +
          "Visit <a href='https://nylas.com'>Nylas.com</a> for details.").
      trackingOptions(options).
      build()

  val email = nylas.messages().send("<NYLAS_GRANT_ID>", requestBody)

  print("Message " + email.data.subject + " was sent with ID " + email.data.id)
}
```

#### The `recents` array in message open tracking

Like [link clicked tracking](#the-recents-array-in-link-clicked-tracking), the notification for [`message.opened`](/docs/reference/notifications/message-tracking/message-opened/) events contains a `recents` array. This array contains entries for the last 50 events for the message that generated the notification. Each entry includes an `opened_id` which identifies the specific event, the timestamp for the `message.opened` event, and the user's Internet Protocol address and [user agent](https://www.useragents.me/).

## Thread replied tracking

When you send a message with thread replied tracking enabled, Nylas notifies you when there are new responses to the thread.

### Thread replied tracking examples

The following code samples show how to enable thread replied tracking for a message, and the kind of JSON notification you can expect.

```bash
curl --request POST \
  --url https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages/send \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{
	"subject": "Hey Reaching Out with Nylas",
	"body": "Hey I would like to track this link <a href='https://espn.com'>My Example Link</a>",
	"to": [
		{
			"name": "John Doe",
			"email": "john.doe@example.com"
		}
	],
	"tracking_options": {
		"thread_replies": true
	}
}'


```

```json [threadReplied-Notification (JSON)]

{
  "specversion": "1.0",
  "type": "thread.replied",
  "source": "/com/nylas/tracking",
  "id": "<WEBHOOK_ID>",
  "time": 1696007157,
  "data": {
    "application_id": "NYLAS_APPLICATION_ID",
    "grant_id": "NYLAS_GRANT_ID",
    "object": {
      "message_id": "<message-id-of-reply>",
      "root_message_id": "<message-id-of-original-tracked-message>",
      "label": "some-client-label",
      "reply_data": {
        "count": 1
      },
      "sender_app_id": "<app-id>",
      "thread_id": "<thread-id-of-sent-message>",
      "timestamp": 1696007157
    }
  }
}


```

```js [threadReplied-Node.js SDK]

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
        trackingOptions: {
          threadReplies: true,
        },
      },
    });

    console.log("Email sent:", sentMessage);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

sendEmail();


```

```python [threadReplied-Python SDK]

from nylas import Client

nylas = Client(
    "<NYLAS_API_KEY>",
    "<NYLAS_API_URI>"
)

grant_id = "<NYLAS_GRANT_ID>"
email = "<EMAIL>"

message = nylas.messages.send(
  grant_id,
  request_body={
    "to": [{ "name": "Name", "email": email }],
    "reply_to": [{ "name": "Name", "email": email }],
    "reply_to_message_id": "<MESSAGE_ID>",
    "subject": "Your Subject Here",
    "body": "Your email body here.",
    "tracking_options": {
      "opens": False,
      "links": False,
      "thread_replies": True,
    }
  }
)

print(message)

```

```ruby [threadReplied-Ruby SDK]
require 'nylas'

nylas = Nylas::Client.new(api_key: '<NYLAS_API_KEY>')

request_body = {
  subject: "With Love, from Nylas",
  body: "This email was sent using the <b>Ruby SDK</b> for the Nylas Email API.
      Visit <a href='https://nylas.com'>Nylas.com</a> for details.",
  to: [{name: "Nylas", email: "swag@example.com"}],
  tracking_options: {label: "Track message replies",
      opens: false,
      links: false,
      thread_replies: true}
}

email, _ = nylas.messages.send(identifier: '<NYLAS_GRANT_ID>', request_body: request_body)

puts "Message \"#{email[:subject]}\" was sent with ID #{email[:id]}"
```

```java [threadReplied-Java SDK]


public class EmailTracking {
  public static void main(String[] args) throws NylasSdkTimeoutError, NylasApiError {
    NylasClient nylas = new NylasClient.Builder("<NYLAS_API_KEY>").build();

    List<EmailName> emailNames = new ArrayList<>();
    emailNames.add(new EmailName("swag@example.com", "Nylas"));

    TrackingOptions options = new TrackingOptions("Track message replies",false, false, true);

    SendMessageRequest requestBody = new SendMessageRequest.Builder(emailNames).
        subject("With Love, from Nylas").
        body("This email was sent using the <b>Java SDK</b> for the Nylas Email API. " +
            "Visit <a href='https://nylas.com'>Nylas.com</a> for details.").
        trackingOptions(options).build();

    Response<Message> email = nylas.messages().send("<NYLAS_GRANT_ID>", requestBody);

    System.out.println("Message " + email.getData().getSubject() + " was sent with ID " + email.getData().getId());
  }
}
```

```kt [threadReplied-Kotlin SDK]


fun main(args: Array<String>) {
  val nylas: NylasClient = NylasClient(apiKey = "<NYLAS_API_KEY>")
  val emailNames : List<EmailName> = listOf(EmailName("swag@example.com", "Nylas"))
  val options : TrackingOptions = TrackingOptions("Track message replies", false, false, true)

  val requestBody : SendMessageRequest = SendMessageRequest.
      Builder(emailNames).
      subject("With Love, from Nylas").
      body("This email was sent using the <b>Kotlin SDK</b> for the Nylas Email API. " +
          "Visit <a href='https://nylas.com'>Nylas.com</a> for details.").
      trackingOptions(options).
      build()

  val email = nylas.messages().send("<NYLAS_GRANT_ID>", requestBody)

  print("Message " + email.data.subject + " was sent with ID " + email.data.id)
}
```

## Message tracking errors

The following sections describe errors that you may encounter when using message tracking.

### Link clicked tracking errors

Link clicked tracking is limited to 100 tracked links per message. A message that contains more than 100 links and has link clicked tracking enabled will fail to send with an error message like the following:

> Too many tracking links: 101 exceeds the maximum of 100. Please reduce the number of links in your email.

Disable link clicked tracking or reduce the number of links in the message to send it.

### Message open tracking errors

If a message with message open tracking enabled can't handle the metadata object's size (for example, the `payload` is too large), you might receive the following error message:

> `The message has not been sent. Please try resending with open tracking disabled.`

Disable message open tracking to send the message.

### Thread replied tracking errors

If a message with thread replied tracking enabled can't handle the metadata object's size (for example, the `payload` is too large), you might receive the following error message:

> `The message has not been sent. Please try resending with reply tracking disabled.`

Disable thread replied tracking to send the message.