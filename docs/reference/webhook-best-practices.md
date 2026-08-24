<!--
  Vendored from https://developer.nylas.com/docs/dev-guide/best-practices/webhook-best-practices.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Best practices for webhooks

Source: https://developer.nylas.com/docs/dev-guide/best-practices/webhook-best-practices/

This page includes best practices, tips, and architecture considerations to keep in mind while implementing webhooks with your Nylas application.

## Testing webhooks in a development environment

The best way to test your webhook triggers and notifications is to use a Nylas application in a development environment. This prevents you from being overwhelmed by notifications if something goes wrong, so you can test and fine-tune them before setting them up on a production-volume application.

## Building for scalability

It's important to keep scalability in mind as you build your project. For example, an application with 20 grants on the same domain and 50 shared calendars can easily generate more than 20,000 `event.updated` notifications in just a few seconds.

> **Warn:** 
> **If your webhook endpoint takes more than 10 seconds to handle incoming requests, it hits Nylas' timeout threshold and the request fails**. For more information, see [Failing and failed webhooks](/docs/v3/notifications/#failing-and-failed-webhooks).

### Creating ordering logic

The [Webhook specification](https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md) makes no guarantees about deliverability of webhook notifications, or the order in which they're delivered. This allows webhooks to function regardless of your project's internal architecture, external provider behavior, or transient endpoint errors.

Most of the time, webhook notifications match the order of events on the objects that triggered them. Your Nylas application should be able to handle the rare case when it receives an `.updated` or `.deleted` webhook notification before a `.created` notification for an object.

### Using asynchronous processing

We _strongly_ recommend you use asynchronous processing on your webhook endpoint, along with a queueing system. This allows notifications to be processed by a separate service that fetches data about the objects. With this infrastructure, your webhook endpoint remains responsive even during high-volume bursts of notifications (for example, when users first authenticate with your project).

### Distributing notification processing

You should prepare for your project to receive a large volume of webhook notifications at any time. One way to build for this is to put webhook processing servers behind a load balancer that's configured for round-robin distribution. This allows you to scale by adding more servers behind the load balancer during periods of heavy traffic so you can maintain high availability on your receiving system.

### Monitoring webhook endpoints for downtime

You should monitor your webhook endpoints to ensure they remain available, and to respond in the event that they become unavailable.

We recommend building your application so that if a webhook endpoint goes down, your application automatically restarts it. After the endpoint is available again, you can manually fetch the objects that were modified during the downtime and process them appropriately.

### Enabling compressed delivery

Set `compressed_delivery` to `true` when you create or update a webhook destination, and Nylas gzip-compresses each notification payload before `POST`ing it to your endpoint. This reduces bandwidth, speeds up delivery under load, and helps compressed payloads pass through firewalls and WAFs that would otherwise block requests containing HTML in email bodies. Verify the `X-Nylas-Signature` header against the raw compressed body _before_ decompressing. For the full walkthrough, see [Reducing payload size with compression](/docs/dev-guide/best-practices/compression/).

## Monitoring grant status

We recommend you subscribe to the following webhook triggers to monitor the status of your users' grants:

- [`grant.created`](/docs/reference/notifications/grants/grant-created/)
- [`grant.updated`](/docs/reference/notifications/grants/grant-updated/)
- [`grant.deleted`](/docs/reference/notifications/grants/grant-deleted/)
- [`grant.expired`](/docs/reference/notifications/grants/grant-expired/)

The `grant.expired` trigger allows your project to monitor for when a user's grant becomes invalid. We recommend that you set up your project so that when it receives this notification, it identifies the affected user and prompts them to re-authenticate. For a complete guide on detection, recovery, and what to avoid, see [Handling expired grants](/docs/dev-guide/best-practices/grant-lifecycle/).

> **Warn:** 
> **Nylas can't access a user's data when their grant becomes invalid, and doesn't send you webhook notifications about it**. We recommend that when a user re-authenticates, you find the most recent `grant.expired` and `grant.updated` notifications associated with the grant and query for any data that the user might have received between those times. This lets you backfill any changes that might have happened while the grant was invalid.

## Monitoring tracked messages

If your users are sending messages through your project, you can use Nylas' [message tracking webhook triggers](/docs/v3/email/message-tracking/#enable-message-tracking) to simplify how you get notifications for certain actions.