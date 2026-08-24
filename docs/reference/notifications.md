<!--
  Vendored from https://developer.nylas.com/docs/v3/notifications.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Using webhooks with Nylas

Source: https://developer.nylas.com/docs/v3/notifications/

Webhooks let your project receive notifications in real time when certain events occur. They use a push notification protocol to notify you of events, rather than you having to periodically request ("poll for") the latest changes from Nylas.

Because they're lightweight, webhooks are a good way to get notifications about changes to your application's grants. You can integrate them into your project easily, and they scale as you grow.

> **Info:** 
> **Using Nylas Agent Accounts?** Webhooks fire for Agent Account grants the same way they do for any other grant — `message.created`, `message.updated`, the `event.*` triggers, and the `message.bounced`, `message.complaint`, `message.delivered`, and `message.rejected` deliverability signals. For the complete list of triggers that fire for Agent Accounts (plus the handful that don't), see [Supported endpoints for Agent Accounts](/docs/v3/agent-accounts/supported-endpoints/#webhooks).

> **Info:** 
> **Scaling your webhook layer?** A Nylas [Professional Services](/docs/support/professional-services/#notification-and-webhook-best-practices) session walks through designing a reliable notification layer with webhooks and Pub/Sub, including retry logic, high concurrency, and failure handling for production.

## How webhooks work

> **Success:** 
> **The term "webhook" can refer to any of three component parts:** a location where you receive notifications (the "webhook URL" or "webhook endpoint"), a subscription to events that you want notifications for ("webhook triggers"), or the information payload that Nylas sends when a trigger condition is met (the "webhook notification").

When you set up a webhook, you specify a URL that Nylas sends HTTP `POST` requests to and subscribe it to the specific triggers that you want notifications for. When a webhook triggers, Nylas sends a notification with details about the affected object to your application. Your project can then use that data to respond to the event that triggered the notification.

For example, when a user receives a message, Nylas can make a `POST` request to your webhook endpoint that includes the JSON Message object. Your project can then parse the object data and decide to react, and how.

## Set up a webhook

> **Info:** 
> **You can create multiple webhooks in each of your Nylas applications, but each must have its own unique endpoint**.

Make a [Create Webhook Destination request](/docs/reference/api/webhook-notifications/post-webhook-destinations/) that includes the following information:

- The full `webhook_url`. This must link to an HTTPS endpoint that's accessible from the public internet.
- A list of `trigger_types` that you want Nylas to listen for.

```bash
curl --request POST \
  --url 'https://api.us.nylas.com/v3/webhooks/' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --data-raw '{
    "trigger_types": [
      "grant.created",
      "grant.deleted",
      "grant.expired"
    ],
    "description": "local",
    "webhook_url": "<WEBHOOK_URL>",
    "notification_email_addresses": [
      "leyah@example.com",
      "nyla@example.com"
    ]
  }'

```

```js [createWebhook-Node.js]

import Nylas, { WebhookTriggers } from "nylas";

const nylas = new Nylas({
  apiKey: "<NYLAS_API_KEY>",
  apiUri: "<NYLAS_API_URI>",
});

const createWebhook = async () => {
  try {
    const webhook = await nylas.webhooks.create({
      requestBody: {
        triggerTypes: [WebhookTriggers.EventCreated],
        webhookUrl: "<WEBHOOK_URL>",
        description: "My first webhook",
        notificationEmailAddresses: ["<EMAIL_ADDRESS>"],
      },
    });

    console.log("Webhook created:", webhook);
  } catch (error) {
    console.error("Error creating webhook:", error);
  }
};

createWebhook();


```

```python
from nylas import Client
from nylas.models.webhooks import WebhookTriggers

nylas = Client(
    "<NYLAS_API_KEY>",
    "<NYLAS_API_URI>",
)

webhook = nylas.webhooks.create(
    request_body={
        "trigger_types": [WebhookTriggers.EVENT_CREATED],
        "webhook_url": "<WEBHOOK_URL>",
        "description": "My first webhook",
        "notification_email_addresses": ["<EMAIL_ADDRESS>"],
    }
)

print(webhook)


```

```ruby
require 'nylas'

nylas = Nylas::Client.new(api_key: "<NYLAS_API_KEY>")

request_body = {
  trigger_types: [Nylas::WebhookTrigger::EVENT_CREATED],
  webhook_url: "<WEBHOOK_URL>",
  description: 'My first webhook',
  notification_email_addresses: ["<EMAIL_ADDRESS>"]
}

begin
  webhook, _request_id = nylas.webhooks.create(request_body: request_body)

  puts "Webhook created: #{webhook}"
rescue Nylas::NylasApiError => e
  puts "Error creating webhook: #{e.message}"
end


```

```kt
import com.nylas.NylasClient
import com.nylas.models.*

fun main(args: Array<String>){
  val nylas: NylasClient = NylasClient(apiKey = "<NYLAS_API_KEY>")
  val triggersList: List<WebhookTriggers> = listOf(WebhookTriggers.EVENT_CREATED)

  val webhookRequest: CreateWebhookRequest = CreateWebhookRequest(
      triggersList,
      "<WEBHOOK_URL>",
      "My first webhook",
      listOf("<EMAIL_ADDRESS>"))

  try {
    val webhook: Response<WebhookWithSecret> = nylas.webhooks().create(webhookRequest)

    println(webhook.data)
  } catch(exception : Exception) {
    println("Error :$exception")
  }
}


```

```java
import com.nylas.NylasClient;
import com.nylas.models.*;
import java.util.ArrayList;
import java.util.List;

public class webhooks {
  public static void main(String[] args) throws NylasSdkTimeoutError, NylasApiError {
    NylasClient nylas = new NylasClient.Builder("<NYLAS_API_KEY>").build();

    List<WebhookTriggers> triggers = new ArrayList<>();
    triggers.add(WebhookTriggers.EVENT_CREATED);

    CreateWebhookRequest webhookRequest = new CreateWebhookRequest(
        triggers,
        "<WEBHOOK_URL>",
        "My first webhook",
        List.of("<EMAIL_ADDRESS>"));

    try {
      Response<WebhookWithSecret> webhook = nylas.webhooks().create(webhookRequest);

      System.out.println(webhook.getData());
    } catch (Exception e) {
      System.out.println("Error: " + e);
    }
  }
}


```

```bash
nylas webhook create \
  --url "https://yourapp.com/webhooks" \
  --triggers message.created,message.updated,event.created
```

> **Info:** 
> **Webhooks are application-scoped.** The CLI uses your application's API key, not a specific grant. Run `nylas auth config` to set up or update your API credentials.

If you want to set up a webhook from the [Nylas Dashboard](https://dashboard-v3.nylas.com/register?utm_source=docs&utm_content=webhooks) instead, select **Notifications** in the left navigation and click **Create webhook**. Enter your **webhook URL** and select the **triggers** you want to be notified for, then click **Create webhook**.

### Specify fields for webhook notifications

Nylas allows you to specify the fields you want to receive in [`message.created`](/docs/reference/notifications/messages/message-created/), [`message.updated`](/docs/reference/notifications/messages/message-updated/), [`event.created`](/docs/reference/notifications/events/event-created/), and [`event.updated`](/docs/reference/notifications/events/event-updated/) webhook notifications. This reduces the notification payload size and lets you receive only the information you need.

> **Info:** 
> **Nylas always includes ID fields in webhook notifications**. For `message.*` notifications, these fields are `id`, `grant_id`, and `application_id`. For `event.*` notifications, they're `id`, `grant_id`, `application_id`, `calendar_id`, and `master_event_id`.

You can customize the fields Nylas returns by navigating to **Customizations** in the [Nylas Dashboard](https://dashboard-v3.nylas.com/register?utm_source=docs&utm_content=webhooks) and updating the settings. Nylas applies these settings across _all_ webhook subscriptions of the defined type in your Nylas application.

For `message` notifications, you can request email headers in one of two forms. Select `headers` for the full set of RFC headers, or `basic_headers` for only the threading headers `Message-ID`, `In-Reply-To`, and `References`. The `basic_headers` option produces a much smaller payload and is the right choice when you only need to thread replies. The two options are mutually exclusive, so select one or the other.

When Nylas sends a customized webhook notification, it adds the `.transformed` suffix to the notification type (for example, `message.updated` becomes `message.updated.transformed`). You don't need to subscribe to triggers with the `.transformed` suffix, but you _do_ need to create logic in your project to handle this notification type.

## Verify webhook endpoint

The first time you [set up a webhook](#set-up-a-webhook) or set an existing webhook's state to `active`, Nylas automatically checks that it's valid by sending a `GET` request to your webhook endpoint. The request includes a [`challenge` query parameter](#the-challenge-query-parameter) that your project must return in a `200 OK` response as part of the verification process.

Your webhook endpoint needs to send a `200 OK` response within 10 seconds of receiving the request. It must return the _exact value_ of the `challenge` in the body of its response.

> **Info:** 
> **If you're using a low- or no-code webhook endpoint, your project might not receive the `challenge` query parameter**. If this happens, [reach out for support](/docs/support/).

After your project verifies the webhook endpoint, Nylas generates a `webhook_secret`.

### The `challenge` query parameter

Nylas automatically sends a `GET` request to your webhook endpoint containing a `challenge` query parameter when you first set up or activate a webhook.

```bash
curl -X 'GET' '<WEBHOOK_URL>?challenge=bc609b38-c81f-47fb-a275-1d9bd61a968b'
```

When your Nylas application receives this request, it's subject to the following requirements:

- Your project has up to 10 seconds to respond to the request with a `200 OK`.
  - Nylas won't try to verify the webhook endpoint again if your project fails the first check.
  - If your project doesn't respond to the verification request, Nylas returns a [`400 BAD REQUEST` error](/docs/api/errors/400-response/#error-400---bad-request).
- Your project must include the _exact value_ of the `challenge` query parameter in the body of its response. It shouldn't return any other data — not even quotation marks.
- Your project can't use [chunked encoding](https://en.wikipedia.org/wiki/Chunked_transfer_encoding) for its response to Nylas' verification request.

## Secure a webhook

When your project [verifies your webhook endpoint](#verify-webhook-endpoint), Nylas automatically generates a `webhook_secret`. Nylas includes this value in every webhook notification to indicate that it's genuine. We strongly recommend setting up your project so that it verifies the `webhook_secret` and the contents of the `x-nylas-signature` or `X-Nylas-Signature` header for each notification you receive. This helps to prevent data breaches and unauthorized access to your webhooks.

## Respond to webhook notifications

After you [set up](#set-up-a-webhook) and [verify](#verify-webhook-endpoint) a webhook, Nylas starts sending it notifications about updates. Your project must respond to webhook notifications with a `200 OK` to prevent Nylas from marking it as [`failing` or `failed`](#failing-and-failed-webhook-endpoints).

Every webhook notification Nylas sends includes either the `x-nylas-signature` or `X-Nylas-Signature` header, with its capitalization depending on the coding language or SDK you're using to integrate. This header includes a hex-encoded HMAC-SHA256 signature of the request body and uses the endpoint's `webhook_secret` as the signing key. The signature is for the _exact content_ of the request body, so make sure that your processing code doesn't modify the body before checking the signature.

### Truncated webhook notifications

Nylas sends webhook notifications as JSON payloads containing the object that triggered the notification, up to a maximum payload size of 1 MB. If a notification exceeds the size limit, Nylas truncates the payload by removing its body content and adds the `.truncated` suffix to the notification type (for example, `message.created.truncated`). This reduces the size of the payload and improves performance.

> **Info:** 
> **Nylas only sends truncated webhook notifications for `message.*` triggers**. For any other notification type, Nylas always sends the full payload.

When you receive a truncated notification, you need to re-query the Nylas APIs to get the object data. For example, if you receive a `message.updated.truncated` notification, make a [Get Message request](/docs/reference/api/messages/get-messages-id/) that includes the specified `message_id`.

You don't need to subscribe to `*.truncated` webhook triggers, but you _do_ need to make sure your project can handle this notification type.

### Cleaned message notifications

When you subscribe to the `message.created.cleaned` trigger and have [Clean Conversations](/docs/v3/email/parse-messages/) settings configured for your application, Nylas automatically cleans new messages during sync and delivers the cleaned content via webhook. The `body` field contains cleaned markdown instead of the original HTML.

The `.cleaned` suffix can combine with `.transformed` and `.truncated`, producing notification types like `message.created.cleaned.transformed`, `message.created.cleaned.truncated`, or `message.created.cleaned.transformed.truncated`. You don't need to subscribe to these suffix combinations separately, but you _do_ need to handle them in your webhook processing logic.

For more information, see the [`message.created.cleaned` notification schema](/docs/reference/notifications/messages/message-created-cleaned/).

### Compressed webhook notifications

When you enable compressed delivery by setting `compressed_delivery` to `true` on a webhook destination, Nylas gzip-compresses the JSON notification payload before sending the HTTP `POST` request to your endpoint.

Nylas adds the `Content-Encoding: gzip` header to compressed requests. Your endpoint needs to decompress the gzip body before parsing the JSON payload.

> **Warn:** 
> **The HMAC-SHA256 signature is computed over the compressed bytes**. When you verify the `X-Nylas-Signature` header, validate it against the raw compressed request body _before_ decompressing. If you decompress first and then check the signature, verification will fail.

Compressed delivery is useful in two situations:

- **Reducing payload size**: Compression can significantly shrink large notifications, reducing bandwidth and improving delivery performance.
- **Avoiding firewall issues**: Some firewalls and WAFs inspect HTTP request bodies and block requests that contain HTML tags. Email message notifications often include HTML content in the message body, which can trigger these rules. Because compressed payloads are opaque gzip binary data, they pass through these firewalls without being flagged.

To enable compressed delivery, set `compressed_delivery` to `true` when you [create](/docs/reference/api/webhook-notifications/post-webhook-destinations/) or [update](/docs/reference/api/webhook-notifications/put-webhook-by-id/) a webhook destination.

## Test a webhook

Nylas includes two utility API endpoints to help you test your webhook configuration:

- The [Send Test Event endpoint](/docs/reference/api/webhook-notifications/send_test_event/) sends a test webhook payload and listens for a `200 OK` response from the webhook endpoint.
- The [Get Mock Notification Payload endpoint](/docs/reference/api/webhook-notifications/get_mock_webhook_payload/) sends an example notification payload for the requested `trigger_type`.

You can test your webhook quickly from the command line:

```bash
# List all webhooks
nylas webhook list

# Send a test event to your endpoint
nylas webhook test send https://yourapp.com/webhooks

# Inspect a mock payload for a specific trigger
nylas webhook test payload message.created
```

For local development, `nylas webhook server` starts a listener that prints received payloads to your terminal. Add `--tunnel cloudflared` to expose it via a public HTTPS URL that Nylas can reach.

## Retry a webhook

If Nylas doesn't receive a `200 OK` response to a webhook notification, it tries to deliver the notification two more times for a total of three attempts, backing off exponentially. The final delivery attempt occurs between 10–20 minutes after the first.

Retries are based on the HTTP response status code Nylas receives.

- [**`408` – Request timeout**](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/408): The server took too long to respond. This might be because of a temporary connectivity issue.
- [**`429` – Too many requests**](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429): The endpoint is being [rate-limited](/docs/dev-guide/best-practices/rate-limits/#what-are-rate-limits). Try again after the number of seconds listed in the `Retry-After` header.
- [**`502` – Bad gateway**](/docs/api/errors/500-response/#error-502---bad-gateway): The server received an invalid response from an upstream server. This could be because the upstream server is temporarily unavailable.
- [**`503` – Service unavailable**](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/503): The server is temporarily unavailable.
- [**`504` – Gateway timeout**](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/504): The server didn't receive a response from the upstream server in time.
- [**`507` – Insufficient storage**](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/507): The server can't complete the request because of a temporary lack of storage space.

Nylas only retries webhook notifications if the response indicates a temporary issue that might be solved by trying to deliver the notification again. For all other status codes, Nylas doesn't try sending the notification again. This is because the status codes indicate permanent failures (authentication errors, invalid requests, and so on) or issues that are unlikely to resolve by trying to deliver the notification again.

If Nylas can't deliver a notification after three attempts, it skips the affected notification type. It continues to send others in case there's a problem that prevents your project from acknowledging the specific notification.

## Deactivate a webhook

By default, Nylas marks webhooks as `active` when you create them. When you deactivate a webhook, Nylas stops sending all events associated with it to your endpoint.

You can deactivate a webhook by making an [Update Webhook Destination request](/docs/reference/api/webhook-notifications/put-webhook-by-id/) that sets the status to `inactive`, or by navigating to **Notifications** in the Nylas Dashboard, finding the webhook you want to update, and selecting **Disable** in its options menu.

If you reactivate a webhook, Nylas starts sending data from the time that it was reactivated. Nylas doesn't send notifications for events that occurred while a webhook was inactive.

## Failing and failed webhook endpoints

Nylas marks a webhook endpoint as `failing` when it receives 95% non-`200` responses or non-responses from it over a period of 15 minutes. While the endpoint is in the `failing` state, Nylas continues delivering webhook notifications to it for 72 hours, backing off exponentially.

If Nylas receives 95% non-`200` responses or non-responses from a webhook endpoint over 72 hours, it marks the endpoint as `failed`.

When a webhook endpoint's state changes to either `failing` or `failed`, Nylas sends you an email notification about the change.

> **Warn:** 
> **Sometimes, the message notifying you that a webhook endpoint is failing or failed might end up in your Spam folder**. Be sure to add `admin-webhook@notifications.nylas.com` to your allowlist to avoid this.

Nylas doesn't automatically restart or reactivate `failed` webhook endpoints – you need to reactivate them either through the [Nylas Dashboard](https://dashboard-v3.nylas.com/register?utm_source=docs&utm_content=webhooks) or using the [Webhooks API](/docs/reference/api/webhook-notifications/). Nylas doesn't send notifications for events that occurred while the endpoint was marked as `failed`.

## Keep in mind

- Nylas guarantees "at least once" delivery of webhook notifications. You might receive duplicate notifications because of the provider's behavior (for example, when Google and Microsoft Graph send upserts).
- It might take up to two minutes for your project to receive notifications about newly authenticated grants.
- Changes to webhook settings apply to all grants for future sync. However, Nylas doesn't load any data from the past. For example, if you subscribe to the `event.updated` trigger, you'll only receive notifications for events updated from the moment you apply the new settings.
- Nylas blocks requests to Ngrok testing URLs because of throughput limiting concerns. We recommend using [Visual Studio Code port forwarding](https://code.visualstudio.com/docs/editor/port-forwarding), [Hookdeck](https://hookdeck.com/), or a similar webhook tool instead.

### Google `.metadata` notifications

Nylas sends [`message.created.metadata` and `message.updated.metadata` notifications](/docs/reference/notifications/message-metadata/message-created-metadata/) for Google grants that include the `/gmail.metadata` scope. These notifications include a limited amount of data because of the restrictive scope.

> **Warn:** 
> **Even if a grant requests more permissive scopes, Google falls back to the `/gmail.metadata` permissions**.

You don't need to subscribe to `message.*.metadata` webhook triggers, but you _do_ need to make sure your project can handle this notification type.

## Webhooks for agent reply loops

If you're building an AI agent that reacts to inbound email -- receiving replies, continuing conversations, extracting data -- webhooks are the way in. The `message.created` trigger fires within seconds of mail arriving at any grant, including [Agent Accounts](/docs/v3/agent-accounts/). The payload includes `thread_id`, which the agent can use to match the reply to an existing conversation without parsing email headers.

For the patterns that build on this:

- [Handle email replies in an agent loop](/docs/cookbook/agent-accounts/handle-replies/) -- detect replies, restore context, route to the right handler
- [Build a multi-turn email conversation](/docs/cookbook/agent-accounts/multi-turn-conversations/) -- the full send-receive-respond loop with persistent state
- [Prevent duplicate agent replies](/docs/cookbook/agent-accounts/prevent-duplicate-replies/) -- dedup webhook deliveries and lock before sending

## Related resources

- [Test webhooks with the Nylas CLI](https://cli.nylas.com/guides/if-match-gmail-api) -- understand incremental sync, ETags, and push-based alternatives to polling