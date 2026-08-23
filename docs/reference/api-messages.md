<!--
  Vendored from https://developer.nylas.com/docs/reference/api/messages.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Messages

Source: https://developer.nylas.com/docs/reference/api/messages/

The Nylas Send API allows you to send messages immediately, and schedule them to be sent in the future (asynchronously). You can save scheduled messages either in Nylas, or as Draft objects on the provider. The Send API uses the same commands to manage messages across all providers, and can refer to specific messages using the provider's `message_id`.

Nylas uses webhooks to let you know when an email message has been sent. The webhook's message includes a status, a reason description, and the Nylas request ID. For more information, see the [notifications documentation](/docs/v3/notifications/).

## Adding attachments to messages

Use the Messages endpoints to add and modify files attached to email messages as you send them. The [Attachments APIs](#tag--Attachments) allow you to download or get the metadata about an existing attachment, but you use the Messages API to add or modify the attachments. For more information, see [Working with email attachments](/docs/v3/email/attachments/).

### Provider IDs for messages

Nylas uses an object's provider ID to refer to the object, and different providers return differently formatted IDs. For IMAP messages, Nylas extracts the ID from the `message-id` header. For Google and Microsoft, the object ID comes from the provider's internal ID.

## Metadata on messages

You can add metadata to new and existing messages by including the `metadata` sub-object in your `POST`, `PUT`, or `PATCH` request. For more information, see the [Metadata documentation](/docs/dev-guide/metadata/).

[Agent Account](/docs/v3/agent-accounts/) grants support metadata on messages, with the same 50-pair limit and the same five indexed reserved keys as connected grants.

## Messages scopes

The table below lists the Messages endpoints and which scopes they require. The table shortens the full scope URI for space reasons, so add the prefix for the provider when requesting scopes.

The ☑️ in each column indicates the most restrictive scope you can request for each provider and still use that API. More permissive scopes appear under the minimum option. If you're already using one of the permissive scopes, you don't need to add the more restrictive scope.

| Endpoint                                                 | Google Scopes</br>`https://www.googleapis.com/auth/...`              | Microsoft Scopes</br>`https://graph.microsoft.com/...`                                 |
| :------------------------------------------------------- | :------------------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| **GET** `/messages`<br/>**GET** `/messages/<MESSAGE_ID>` | `/gmail.readonly` ☑️<br/>`/gmail.modify`                             | `Mail.Read` ☑️<br/>`Mail.ReadWrite`<br/>`Mail.Read.Shared`</br>`Mail.ReadWrite.Shared` |
| **PUT**`/messages/<MESSAGE_ID>`                          | `/gmail.modify` ☑️                                                   | `Mail.ReadWrite` ☑️<br/>`Mail.ReadWrite.Shared`                                        |
| **DELETE** `/messages/<MESSAGE_ID>`                      | `/gmail.modify` ☑️ <br/>`https://mail.google.com/` (for hard-delete) | `Mail.ReadWrite` ☑️<br/>`Mail.ReadWrite.Shared`                                        |
| **POST** `/messages/send`                                | `/gmail.send` ☑️<br/>`/gmail.compose`<br/>`/gmail.modify`            | `Mail.ReadWrite` ☑️<br/>`Mail.ReadWrite.Shared`                                        |

No scopes are required for the `/messages/schedules` endpoints, because scheduled messages are stored with Nylas. You will need `gmail.send` or `Mail.ReadWrite` to send scheduled messages, however.

For more information about scopes, see [Using scopes to request user data](/docs/dev-guide/scopes/).

## Messages notifications

You can subscribe to the following triggers so Nylas notifies you about changes to your users' data:

- `message.created`
- `message.updated`

You can subscribe to the following triggers to get notifications about the status of a scheduled message:

- `message.send_success`
- `message.send_failed`
- `message.bounce_detected` (Available for Google, Microsoft Graph, iCloud, and Yahoo.)

To receive message notifications, you must [enable specific scopes](/docs/dev-guide/scopes/#email-api-scopes) that allow Nylas to monitor for these events. For more information, see the [Message notification schemas](/docs/reference/notifications/#message-notifications).

## Message tracking and send status monitoring

You can configure options to track when a message you sent has been opened, when links inside of it are clicked, and when someone replies to a thread. For more information, see the [message tracking documentation](/docs/v3/email/message-tracking/).

Nylas includes a [`message.bounce_detected` notification](/docs/reference/notifications/#message-bounce-detected-notifications) for Google, Microsoft Graph, iCloud, and Yahoo that triggers when a message that you send bounces. You can subscribe to the trigger to monitor for bounced messages.

You can use the [`message.send_success`](/docs/reference/notifications/#message-send-success-notifications) and [`message.send_failed`](/docs/reference/notifications/#message-send-failed-notifications) triggers to monitor the status of messages that you send using Scheduled Send. For these triggers to work, you must set the `send_at` parameter in your [Send Message request](/docs/reference/api/messages/send-message/). For more information, see [Schedule messages to send in the future](/docs/v3/email/scheduled-send/).

## Search messages

Search for messages by making a [`GET /v3/grants/<NYLAS_GRANT_ID>/messages` request](/docs/reference/api/messages/get-messages/) that includes any of the following query parameters:

- `subject`, `thread_id`
- `any_email`, `to`, `from`, `cc`, `bcc`
- `received_before`, `received_after`
- `in`, `unread`, `starred`, `has_attachment`
- `search_query_native`
- `fields`

<div id="admonition-warning">⚠️ <b>Nylas doesn't support filtering for folders using keywords or attributes</b> (for example, <code>in:inbox</code> returns a <a href="/docs/api/errors/400-response/"><code>400</code> error</a>). Instead, you should use the folder ID with <code>in</code> to get the data you need.</div>

The [`search_query_native` parameter](/docs/dev-guide/best-practices/search/#search-messages-and-threads-using-search_query_native) accepts provider-specific query strings for connected grants and [Nylas full-text search syntax](/docs/v3/agent-accounts/email-search/) for Agent Accounts. The value that you specify _must_ be URL-encoded.

For more information and a list of provider considerations, see [Searching with Nylas](/docs/dev-guide/best-practices/search/).

## Query IMAP server directly

Set the `query_imap` query parameter to `true` in your [Get Message](/docs/reference/api/messages/get-messages-id/) or [Get all Messages](/docs/reference/api/messages/get-messages/) requests to query the IMAP server directly instead of the Nylas database. This lets you get the most up-to-date information from the IMAP server, or data older than the default three-month retention time.

When you use the `query_imap` query parameter in a Get all Messages request, you must also set the `in` query parameter. This tells Nylas which folder to query. Nylas includes the specified folder ID only in the returned messages' `folder` fields, even if the message is in multiple folders.

Keep in mind that most IMAP servers are slow and have low [rate limits](/docs/dev-guide/platform/rate-limits/). Nylas might take more time to return responses compared to requests that don't use the `query_imap` query parameter. If an account has many folders, you're querying for a large message, or you're also using the `has_attachment` query parameter, your request can take even longer.

Sometimes, you might receive a `404` error for valid message IDs. This is because some IMAP servers don't support searching for email headers.


## Endpoints

- **GET** `/v3/grants/{grant_id}/messages` - [Return all Messages](https://developer.nylas.com/docs/reference/api/messages/get-messages/)
- **GET** `/v3/grants/{grant_id}/messages/{message_id}` - [Return a Message](https://developer.nylas.com/docs/reference/api/messages/get-messages-id/)
- **PUT** `/v3/grants/{grant_id}/messages/{message_id}` - [Update message attributes](https://developer.nylas.com/docs/reference/api/messages/put-messages-id/)
- **DELETE** `/v3/grants/{grant_id}/messages/{message_id}` - [Delete a message](https://developer.nylas.com/docs/reference/api/messages/delete-message/)
- **PUT** `/v3/grants/{grant_id}/messages/clean` - [Clean messages](https://developer.nylas.com/docs/reference/api/messages/clean-messages/)
- **POST** `/v3/grants/{grant_id}/messages/send` - [Send a Message](https://developer.nylas.com/docs/reference/api/messages/send-message/)
- **GET** `/v3/grants/{grant_id}/messages/schedules` - [Return scheduled messages](https://developer.nylas.com/docs/reference/api/messages/get-schedules/)
- **GET** `/v3/grants/{grant_id}/messages/schedules/{scheduleId}` - [Return a scheduled message](https://developer.nylas.com/docs/reference/api/messages/get-schedule-by-id/)
- **DELETE** `/v3/grants/{grant_id}/messages/schedules/{scheduleId}` - [Cancel a scheduled message](https://developer.nylas.com/docs/reference/api/messages/delete-a-scheduled-message/)
