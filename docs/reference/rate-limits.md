<!--
  Vendored from https://developer.nylas.com/docs/dev-guide/platform/rate-limits.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Nylas API and provider rate limits

Source: https://developer.nylas.com/docs/dev-guide/platform/rate-limits/

Rate limits apply when you make requests to the Nylas APIs and add account information in the [Nylas Dashboard](https://dashboard-v3.nylas.com/login). For best practices to mitigate rate limits, see [Avoiding rate limits in Nylas](/docs/dev-guide/best-practices/rate-limits/).

## Nylas rate limits

The table below describes API rate limits for Nylas. These apply to all endpoints.

| API                                                        | Type                  | Rate limit                         | Expiration |
| ---------------------------------------------------------- | --------------------- | ---------------------------------- | ---------- |
| [Applications](/docs/reference/api/applications/)          | General               | Up to 50 requests per application. | 1 second   |
| [Authentication](/docs/reference/api/authentication-apis/) | General               | Up to 50 requests per application. | 1 second   |
| [Calendar](/docs/reference/api/calendar/)                  | General               | Up to 200 requests per grant.      | 1 second   |
| [Connectors](/docs/reference/api/connectors-integrations/) | General               | Up to 50 requests per application. | 1 second   |
| [Contacts](/docs/reference/api/contacts/)                  | General               | Up to 200 requests per grant.      | 1 second   |
| [Grants](/docs/reference/api/manage-grants/)               | General               | Up to 50 requests per application. | 1 second   |
| [Messages](/docs/reference/api/messages/)                  | General               | Up to 200 requests per grant.      | 1 second   |
| [Send](/docs/reference/api/messages/send-message/)         | `application/json`    | Up to 200 requests per grant.      | 1 second   |
| [Send](/docs/reference/api/messages/send-message/)         | `multipart/form-data` | Up to 10 requests per grant.       | 1 second   |
| [Webhooks](/docs/reference/api/webhook-notifications/)     | General               | Up to 50 requests per application. | 1 second   |

### Threads rate limits

> **Warn:** 
> **The [**Get all Threads endpoint**](/docs/reference/api/threads/get-threads/) makes a significant number of calls to the provider for each request you make**. We strongly recommend using [query parameters](#query-parameters) to limit the threads data you receive.

Because of the number of calls Nylas makes to the provider for each [Get all Threads request](/docs/reference/api/threads/get-threads/), you might encounter rate limits when working with large threads of messages. You can take the following steps to avoid rate limits:

- Specify a lower `limit` to reduce the number of results Nylas returns.
- Add [query parameters](#query-parameters) to your request to filter for specific information.

## Provider rate limits

> **Info:** 
> **Not all IMAP providers publish information about their rate limits**. If you have questions, contact your provider's customer support team.

Nylas' API requests are also subject to rate limits for the underlying providers. Keep these in mind as you build your project.

### Google rate limits

> **Warn:** 
> **As of February 2024, Gmail has new requirements for accounts that send more than 5,000 messages per day**. For more information, see [Google's official documentation](https://support.google.com/a/answer/81126).

Google has several sets of rate limits to keep in mind:

- **Overall usage limits**: 10,000 requests per minute, per application and 600 requests per minute, per user. Google calculates these limits within a one-minute sliding window.
- **Message sending limits**: 2,000 messages per day. See Google's [Gmail sending limits in Google Workspace](https://support.google.com/a/answer/166852) documentation.
- **Gmail API limits**: For Cloud projects created on or after May 1, 2026, a per-project limit of 1,200,000 quota units per minute and a per-user limit of 6,000 quota units per minute. Projects that used the Gmail API between November 2025 and April 2026 keep their previous per-user limit of 250 quota units per second. See Google's [Gmail usage limits](https://developers.google.com/gmail/api/reference/quota) documentation.
- **Google Calendar API limits**: API usage quotas, general usage limits, and operational limits. See Google's [Calendar quotas](https://developers.google.com/calendar/api/guides/quota) documentation.

A single Nylas request might make multiple calls to Google's APIs. Nylas returns a `Nylas-Provider-Request-Count` header that shows the number of calls it's made to the Google APIs, and a `Nylas-Gmail-Quota-Usage` header for requests to Nylas' [Drafts](/docs/reference/api/drafts/), [Messages](/docs/reference/api/messages/), [Threads](/docs/reference/api/threads/), [Folders](/docs/reference/api/folders/), and [Attachments](/docs/reference/api/attachments/) endpoints that shows how much of your Google API quota Nylas used for your request. We recommend monitoring these headers and spacing out your requests to avoid being rate-limited.

### Microsoft rate limits

Microsoft has two sets of rate limits to keep in mind:

- **Overall usage limits**: 10,000 requests per 10-minute period, a maximum of 4 concurrent requests, and a maximum of 150 MB uploaded per 5-minute period. See Microsoft's [Outlook service limits](https://learn.microsoft.com/en-us/graph/throttling-limits#outlook-service-limits) documentation.
- **Message sending limits**: 30 messages per minute. See Microsoft's [Exchange Online limits](https://learn.microsoft.com/en-us/office365/servicedescriptions/exchange-online-service-description/exchange-online-limits#sending-limits-1) documentation.

A single Nylas request might make multiple calls to the Microsoft Graph APIs. Nylas returns a `Nylas-Provider-Request-Count` header that shows the number of calls it's made to the Graph APIs for your request. We recommend monitoring this header and spacing out your requests to avoid being rate-limited.

If Microsoft rate-limits a request, Nylas returns a `Retry-After` header that shows the number of seconds you have to wait before you can make another request.

### EWS rate limits

Your EWS administrator configures the rate limit for your on-premises Exchange server, so Nylas cannot know the server's actual rate limits. If your Exchange server rate-limits a request, Nylas returns a `Retry-After` header that shows the number of seconds you have to wait before the server will accept another request.

### iCloud rate limits

Apple limits the number of messages you can send to 1,000 per day. For more information, see Apple's [Mailbox size and message sending limits](https://support.apple.com/en-us/102198) documentation.