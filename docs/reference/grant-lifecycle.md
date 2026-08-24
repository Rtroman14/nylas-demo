<!--
  Vendored from https://developer.nylas.com/docs/dev-guide/best-practices/grant-lifecycle.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Handling expired grants

Source: https://developer.nylas.com/docs/dev-guide/best-practices/grant-lifecycle/

An expired grant does not mean something is wrong with your integration. Grants expire regularly as part of normal operation, and the vast majority are fully recoverable. Re-authenticating the user refreshes the provider tokens while preserving the grant ID, object IDs, sync state, and tracking links. In rare cases a provider issue may prevent token renewal, but even then the grant itself remains intact and can be re-authenticated once the provider resolves the issue.

> **Error:** 
> **Do not delete expired grants.** Deleting an expired grant and recreating it causes permanent, irreversible data loss. Object IDs change, sync state resets, and tracking links break. Always attempt re-authentication first. See [what happens when you delete an expired grant](#what-happens-when-you-delete-an-expired-grant) for the full list of consequences.

## Why grants expire

Grant expiration is a normal part of the lifecycle. When a grant expires, the provider token is invalidated, but the grant record itself remains intact in Nylas. The grant's data, configuration, and associated object IDs are all preserved.

Common causes include:

- The user changed their password.
- The user or an admin revoked your app's access.
- An organization-level policy forced a token refresh (common with Microsoft tenants).
- An Azure AD client secret expired.
- A transient provider error caused the token refresh to fail.

None of these situations require deleting the grant. Re-authentication resolves all of them.

## Re-authenticate instead of deleting

Re-authentication updates an existing grant with fresh provider tokens. The grant ID stays the same, object IDs are preserved, sync state is maintained, and active tracking links continue to work.

Nylas handles this automatically: when it receives an authentication request for an email address that already has a grant, it re-authenticates the existing grant instead of creating a new one. You do not need special logic to distinguish between first-time auth and re-auth. The flow and endpoints are identical. See [creating a grant](/docs/dev-guide/best-practices/manage-grants/#create-a-grant) for the available authentication methods.

Re-authentication also preserves your ability to catch up on missed data. If the grant was invalid for less than 72 hours, Nylas automatically backfills webhook notifications for any new or updated messages, events, and other objects that arrived during the outage. This backfill can produce a large volume of notifications, so make sure your [webhook destination can handle spikes](/docs/dev-guide/best-practices/webhook-best-practices/#building-for-scalability). If the grant was out of service for longer than 72 hours, Nylas skips the backfill. You can still recover by querying the Nylas APIs for changes that occurred between the [`grant.expired`](/docs/reference/notifications/grants/grant-expired/) and [`grant.updated`](/docs/reference/notifications/grants/grant-updated/) notification timestamps.

> **Error:** 
> **Deleting an expired grant is permanent and cannot be undone.** If you delete a grant and then re-authenticate the same user, Nylas creates an entirely new grant with a new ID. You lose sync state, object IDs may change (especially for IMAP providers), and tracking links tied to the old grant stop working. Always re-authenticate instead.

## What happens when you delete an expired grant

When you delete a grant and the user authenticates again, Nylas creates a new grant. This has several consequences.

**Object IDs change for IMAP providers.** Nylas generates message and thread IDs for IMAP accounts using the grant ID as part of the hash. A new grant means new IDs for every message, even ones the user received months ago. Any references your application stored to those old IDs become invalid. Google and Microsoft use provider-native IDs that are stable across grants, but even for those providers, you lose the continuity described below.

**Sync state resets.** Nylas starts a fresh sync for the new grant. Depending on mailbox size, this can take time, and your users see a gap in data until it completes.

**You lose webhook backfill for missed data.** When you re-authenticate an existing grant, Nylas backfills webhook notifications for anything that changed while the grant was invalid (within 72 hours). A new grant created after deletion has no previous sync state to compare against, so Nylas has no way to identify what changed during the gap. For Google, Microsoft, and EWS providers, the underlying data is still in the mailbox, but you would need to paginate through all messages or events to find what you missed. For IMAP providers, even that option is unreliable because the object IDs have changed.

**Tracking links break.** If you use Nylas message tracking (open tracking, link tracking, reply tracking), those tracking pixels and links are associated with the original grant ID. A deleted grant means Nylas can no longer match incoming tracking events to the correct grant, so you stop receiving [`message.opened`](/docs/reference/notifications/message-tracking/message-opened/), [`message.link_clicked`](/docs/reference/notifications/message-tracking/message-link_clicked/), and [`thread.replied`](/docs/reference/notifications/message-tracking/thread-replied/) notifications for messages sent before the deletion.

**The user goes through full auth again.** Instead of a token refresh, the user sees the complete OAuth consent screen. For enterprise accounts with admin consent requirements, this creates unnecessary friction.

## Detect expired grants

There are two signals that a grant has expired: API responses and webhooks. In practice, your application is more likely to hit a failed API request before Nylas detects the expiration through sync.

**API responses** are typically the first signal. If you make an API call using an expired grant, Nylas returns a 401 error. Your application should handle this by prompting the user to reconnect rather than treating it as a fatal error. Because this is often the earliest indication of an expired grant, every code path that calls the Nylas API should include 401 handling.

**Webhooks** provide proactive detection. Subscribe to [`grant.expired`](/docs/reference/notifications/grants/grant-expired/) notifications to receive alerts when Nylas confirms a grant is invalid. Nylas detects expired grants through periodic sync health checks, which can take up to 10 minutes depending on the provider. Without webhooks configured, you have no proactive signal at all, and may not discover the expiration for hours until your application next makes an API call for that grant.

You should implement both signals. Handle 401 responses in every API call to catch expirations immediately, and subscribe to `grant.expired` webhooks to detect expirations for grants that your application is not actively querying.

> **Warn:** 
> **Avoid polling `GET /v3/grants/{id}` in a loop to check grant status.** This is inefficient and counts against your [rate limits](/docs/dev-guide/best-practices/rate-limits/). Use webhooks instead, and fall back to checking grant status only when you encounter a 401 during normal API usage.

## Build a re-authentication flow

The re-authentication flow is identical to initial authentication. Use [Hosted OAuth](/docs/v3/auth/hosted-oauth-apikey/) or whichever auth method your application already uses. Nylas matches on the email address and updates the existing grant rather than creating a new one.

When you receive a `grant.expired` webhook, send the affected user an email notifying them that their connection has expired and that they need to log into your application to re-establish it. Include a direct link to your OAuth flow so the user can reconnect in as few steps as possible. The faster a user re-authenticates, the smaller the data gap and the less likely you are to exceed the 72-hour backfill window.

> **Info:** 
> If you need a reliable way to deliver these re-authentication emails from your own domain without requiring a connected grant, the [Transactional Send API (Beta)](/docs/v3/getting-started/transactional-send/) lets you send email directly from a verified domain.

After re-authentication succeeds, Nylas sends a [`grant.updated`](/docs/reference/notifications/grants/grant-updated/) notification. If the grant was invalid for less than 72 hours, expect a burst of backfill notifications as Nylas catches up on missed changes. If it was longer than 72 hours, query the Nylas APIs directly for changes that occurred during the outage.

## When to delete a grant

There are only two situations where deleting a grant makes sense:

- **The user explicitly wants to disconnect.** They're leaving your platform, or they want to permanently remove their account's connection to your application.
- **You need to stop billing for an abandoned account.** If a grant has been expired for an extended period and the user is clearly never coming back, deletion stops the billing. See the [billing documentation](/docs/support/billing/) for details.

In both cases, understand that deletion is irreversible. Nylas removes the grant record, revokes associated tokens, and stops all notifications. If the user comes back later, they start from scratch with a new grant.

For the deletion procedure, see [Delete a grant](/docs/dev-guide/best-practices/manage-grants/#delete-a-grant).