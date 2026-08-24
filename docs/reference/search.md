<!--
  Vendored from https://developer.nylas.com/docs/dev-guide/best-practices/search.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Searching with Nylas

Source: https://developer.nylas.com/docs/dev-guide/best-practices/search/

Depending on the number of users authenticated to your project, Nylas might return _a lot_ of data for "Get all" requests. This page explains how you can search and filter your users' data.

## How searching works in Nylas

Generally, filtering for data follows this flow:

1. Determine the [query parameters](#query-parameters) you plan to use.
2. Make a "Get all" request (for example, [Get all Messages](/docs/reference/api/messages/get-messages/)) with your query parameters.
3. Inspect the results to find the ID of the object you want to work with.

To get more information about a specific object, you can make a `GET` request with the object's ID.

## Search for grants

Nylas supports the following standard query parameters for [Get all Grants requests](/docs/reference/api/manage-grants/get-all-grants/):

- `before`, `since`
- `grant_status`, `email`, `provider`, `ip`
- `account_id`, `account_ids`

> **Info:** 
> **`account_id` and `account_ids` are populated for grants created during the v2-to-v3 migration process only**. For all other grants, these fields are blank.

## Search for calendars

Calendars are tied to users' grants, so you have to specify a grant ID when you make a [Get all Calendars request](/docs/reference/api/calendar/get-all-calendars/). We don't expect users to have a large number of individual calendars, so the search options Nylas offers for calendars are minimal.

If you know that the calendar you want to work with is the user's primary calendar (for providers that support it), you can use `primary` as the calendar locator instead of searching for a calendar ID.

## Search for events

> **Warn:** 
> **You can only search for events from one calendar at a time**. You need to include a calendar ID (or `primary`, for providers that support it) in your [Get all Events request](/docs/reference/api/events/get-all-events/) to search for events. Nylas returns a [`400` error](/docs/api/errors/400-response/) if you don't specify a calendar.

Nylas supports the following standard query parameters for [Get all Events requests](/docs/reference/api/events/get-all-events/):

- `title`, `description`, `location`
- `start`, `end`
- `event_type` - Google only.
- `updated_before`, `updated_after` - Google, Microsoft, and EWS only.
- `ical_uid`, `master_event_id`, `busy` - Not supported for iCloud.
- `attendees` - Not supported for virtual calendars.
- `show_cancelled` - Not supported for iCloud or EWS.

### Microsoft Graph query considerations for events

When you search for events on Microsoft Graph, the number of days between the `start` and `end` values can't be greater than 1,825 days. If you need to find events over a longer time period, you'll need to make multiple requests.

### iCloud query considerations for events

If you're searching for an event within a certain time range on iCloud, the difference between `start` and `end` can't be greater than six months. If you include a time range greater than six months, Nylas returns an "Invalid request" error.

## Search for drafts

Nylas supports the following standard query parameters for [Get all Drafts requests](/docs/reference/api/drafts/get-drafts/):

- `subject`, `thread_id`
- `any_email`, `to`, `cc`, `bcc`
- `starred`, `has_attachment`

## Search for messages

Nylas supports the following standard query parameters for [Get all Messages requests](/docs/reference/api/messages/get-messages/):

- `subject`, `thread_id`
- `any_email`, `to`, `from`, `cc`, `bcc`
- `received_before`, `received_after`
- `in`, `unread`, `starred`, `has_attachment`
- `fields`

> **Info:** 
> **Nylas doesn't support filtering for folders using keywords or attributes**. For example, `in:inbox` returns a [`400` error](/docs/api/errors/400-response/). Instead, you should use the folder ID with `in` to get the data you need.

You can also use the [`search_query_native` parameter](#search-messages-and-threads-using-search_query_native) to define URL-encoded search queries for Google, Microsoft Graph, EWS, IMAP, and Nylas Agent Accounts.

## Search for threads

Nylas supports the following standard query parameters for [Get all Threads requests](/docs/reference/api/threads/get-threads/):

- `subject`
- `any_email`, `to`, `from`, `cc`, `bcc`
- `latest_message_before`, `latest_message_after`
- `in`, `unread`, `starred`, `has_attachment`

> **Info:** 
> **Nylas doesn't support filtering for folders using keywords or attributes**. For example, `in:inbox` returns a [`400` error](/docs/api/errors/400-response/). Instead, you should use the folder ID with `in` to get the data you need.

You can also use the [`search_query_native` parameter](#search-messages-and-threads-using-search_query_native) to define URL-encoded search queries for Google, Microsoft Graph, EWS, IMAP, and Nylas Agent Accounts.

## Search messages and threads using `search_query_native`

You can include the `search_query_native` query parameter in [Get all Messages](/docs/reference/api/messages/get-messages/) and [Get all Threads](/docs/reference/api/threads/get-threads/) requests to search using a URL-encoded query string. Connected grants use the syntax defined by [Google](https://support.google.com/mail/answer/7190?hl=en), [Microsoft Graph](https://learn.microsoft.com/en-us/graph/search-query-parameter?tabs=http#using-search-on-message-collections), [EWS](https://learn.microsoft.com/en-us/windows/win32/lwef/-search-2x-wds-aqsreference), or [IMAP](https://datatracker.ietf.org/doc/html/rfc3501#section-6.4.4). Agent Account grants use Nylas search syntax.

Agent Accounts (`provider: "nylas"`) support full-text message and thread search with Nylas Boolean syntax, phrases, negation, grouping, standard filters, and relevance ordering. See [Email search for Agent Accounts](/docs/v3/agent-accounts/email-search/) for the complete grammar, examples, limits, and pagination behavior.

> **Warn:** 
> **Some IMAP providers don't support the `SEARCH` operator**. If you try to use it, you might get a [`400` error](/docs/api/errors/400-response/). In these cases, we recommend using the standard query parameters for [messages](#search-for-messages) and [threads](#search-for-threads) instead.

For example, if you want to search a Google account for messages with "foo" or "bar" in the subject, you first create the provider-specific query string (`subject:foo OR subject:bar`), then URL-encode it (`subject%3Afoo%20OR%20subject%3Abar`) and include it in your request.

```bash {2}
curl --request GET \
  --url "https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages?search_query_native=subject%3Afoo%20OR%20subject%3Abar" \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'Content-Type: application/json'
```

You can also use [Microsoft Graph `$filter` queries](https://learn.microsoft.com/en-us/graph/filter-query-parameter) in the `search_query_native` parameter. For example, if you want to find messages where one of the participants is `leyah@example.com`, first create the query string (`$filter=from/emailAddress/address eq 'leyah@example.com'`), then URL-encode it (`%24filter%3Dfrom%2FemailAddress%2Faddress%20eq%20%27leyah%40example.com%27`) and include it in your request.

```bash {2}
curl --request GET \
  --url "https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages?search_query_native=%24filter%3Dfrom%2FemailAddress%2Faddress%20eq%20%27leyah%40example.com%27" \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'Content-Type: application/json'
```

If you include `search_query_native` in a [Get all Messages request](/docs/reference/api/messages/get-messages/), you can only use a limited set of query parameters with it, depending on the provider:

- **Microsoft**: `in`, `limit`, and `page_token`
- **Google**: `in`, `limit`, and `page_token`
- **IMAP/Yahoo/iCloud**: All other query parameters supported by the Messages endpoint
- **EWS**: All query parameters _except_ `thread_id`
- **Nylas Agent Accounts**: All other query parameters supported for Agent Accounts by the Messages endpoint

For [Get all Threads requests](/docs/reference/api/threads/get-threads/), Google and Microsoft support only `in`, `limit`, and `page_token` alongside `search_query_native`. IMAP, Yahoo, and iCloud support all other parameters available on the endpoint. Agent Accounts support all other parameters available for Agent Accounts on the endpoint. EWS supports all parameters except `thread_id`.

## Search for folders

Nylas supports the `parent_id` query parameter for folders in Microsoft and EWS accounts only. You can use it to get all of the sub-folders under a specific folder.

Nylas doesn't support filtering for folders using keywords or attributes. For example, `in:inbox` returns a [`400` error](/docs/api/errors/400-response/). Instead, you should use the folder ID with `in` to get the data you need.

## Search for attachments

You can search for attachments by making a [Get all Messages](/docs/reference/api/messages/get-messages/) or [Get all Threads](/docs/reference/api/threads/get-threads/) request that includes the `has_attachment` query parameter. Nylas returns only the objects that include attachments, so you can sort through them to find the file you want to work with, then make a [Get Attachment Metadata](/docs/reference/api/attachments/get-attachments-id/) or [Download Attachment](/docs/reference/api/attachments/get-attachments-id-download/) request using the attachment ID and the associated message ID.

## Search for contacts

Nylas supports the following standard query parameters for [Get all Contacts requests](/docs/reference/api/contacts/list-contact/):

- `email`, `source`
- `phone_number` - Google only.
- `group` - Not supported for EWS.
- `recurse` - Microsoft only.

## Search for contact groups

You can search for contact groups on all providers _except_ EWS. The [Get all Contact Groups endpoint](/docs/reference/api/contacts/list-contact-groups/) only accepts the query parameters that allow you to [sort responses](/docs/dev-guide/best-practices/rate-limits/#filter-results-using-query-parameters) and those that [limit the results Nylas returns](/docs/dev-guide/best-practices/rate-limits/#reduce-response-size-with-field-selection).

## Microsoft Graph immutable identifiers

Nylas returns globally unique, immutable identifiers for messages and threads. This means that if you store a Nylas `message_id` or `thread_id` in your database, you can reliably use it to retrieve the same message or thread at any time in the future.

For Microsoft Graph–backed accounts, Nylas uses immutable identifiers to ensure consistency even if a message is moved between folders.

**Note: Draft exception**  
When a draft message is sent, the provider creates a new sent message object. As a result, the draft and the resulting sent message have different identifiers. If your application stores draft `message_id` values, you should treat the sent message as a new object and update any stored references accordingly.

## Microsoft Graph mutually exclusive query parameters

When you list messages or threads for Microsoft Graph accounts, certain types of query parameters become mutually exclusive. This means that if you use any parameters from the first group, you cannot use any from the second, and vice versa.

- **Group 1**: Specific, broadly defined provider categories (`thread_id`, `unread`, and `starred`).
- **Group 2**: Specific envelope fields (`subject`, `to`, `cc`, `bcc`, and `any_email`).

For example, you can't use the `starred` query parameter while also filtering for threads `to` a specific email address.

Historically, Nylas hasn't seen many combinations of these query parameters. If this limitation is negatively impacting your experience, [contact Nylas Support](https://support.nylas.com/hc/en-us/requests/new).

## EWS query considerations

Nylas query parameters can only work for on-premises Microsoft Exchange servers if an administrator has enabled search indexing for all mailboxes, and the Advanced Query Syntax (AQS) parser is supported. If query parameters are not returning expected results, contact the server administrator to check if this setting has been enabled.

Even though Nylas accepts any Unix timestamp for `received_before`, `received_after`, `latest_message_before`, and `latest_message_after`, the filtering on EWS is limited to the same day (for example, 01/01/2001), and the results are inclusive of the specified day. For more information, see [Microsoft's notes on AQS query strings](https://learn.microsoft.com/en-us/exchange/client-developer/web-service-reference/querystring-querystringtype#remarks).

The accuracy of search results using `to`, `from`, `cc`, `bcc`, or `any_email` depends on the search indexing speed of your on-premises Microsoft Exchange server. For example, if you try to query Nylas for a message that just came in, but the Exchange server hasn't indexed it yet, Nylas doesn't return it. However, the message will be available after the next search index refresh.