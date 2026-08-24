<!--
  Vendored from https://developer.nylas.com/docs/dev-guide/metadata.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Using metadata in Nylas

Source: https://developer.nylas.com/docs/dev-guide/metadata/

Nylas lets you add key-value pairs to certain objects so you can store data against them.

## What is metadata?

You can use the `metadata` object to add a list of custom key-value pairs to [Calendars](/docs/reference/api/calendar/), [Events](/docs/reference/api/events/), [Messages](/docs/reference/api/messages/), and [Drafts](/docs/reference/api/drafts/). Both keys and values can be any string, and you can store up to 50 key-value pairs on an object. Keys can be up to 40 characters long, and values can be up to 500 characters.

Nylas doesn't support nested `metadata` objects, and doesn't generate [notifications](/docs/v3/notifications/) when you update the `metadata` object.

> **Info:** 
> **[Agent Account](/docs/v3/agent-accounts/) grants support metadata on Events, Messages, and Drafts.** The limits, reserved keys, and `metadata_pair` filtering on this page all apply. See [Supported endpoints for Agent Accounts](/docs/v3/agent-accounts/supported-endpoints/#metadata) for the per-object detail.

### Reserved metadata keys

Nylas reserves five metadata keys (`key1`, `key2`, `key3`, `key4`, and `key5`) and indexes their contents. Nylas uses `key5` to identify events that count towards the [`max-fairness` round-robin calculation for event availability](/docs/v3/calendar/group-booking/#round-robin-max-fairness-groups).

You can add values to each of these reserved keys and reference them in a query to filter the objects that Nylas returns, as in the following examples:

- `https://api.us.nylas.com/calendar?metadata_pair=key1:on-site`
- `https://api.us.nylas.com/events?calendar_id=<CALENDAR_ID>&metadata_pair=key1:on-site`

> **Warn:** 
> **You can't create a query that includes both a provider and metadata filter, other than `calendar_id`**. For example, `https://api.us.nylas.com/calendar?metadata_pair=key1:plan-party&title=Birthday` returns an error.

## Add metadata to objects

You can add metadata to both new and existing objects. The following example adds the `"event-type": "meeting"` key-value pair to an existing Calendar.

```bash
curl --request POST \
  --url 'https://api.us.nylas.com/v3/grants/me/calendars' \
  --header 'Content-Type: application/json' \
  --data '{
    "name" : "Example metadata calendar",
    "metadata": {
      "key1": "all-meetings",
      "key2": "on-site"
    }
  }'
```

> **Warn:** 
> **Both `PUT` and `PATCH` requests overwrite the entire `metadata` object**. This means that if you update the calendar in the example above but include only `key1`, Nylas deletes `key2`.

## Remove metadata from objects

To remove a key-value pair from an object, make a `PUT` or `PATCH` request that includes the metadata you want to keep. As an example, consider the following `metadata` on an existing Calendar:

```json
...
  "metadata": {
    "key1": "all-meetings",
    "key2": "on-site"
  },
...
```

If you make the following [`PUT /v3/grants/<NYLAS_GRANT_ID>/calendars/<CALENDAR_ID>` request](/docs/reference/api/calendar/put-calendars-id/), Nylas deletes `key1` and keeps `key2`.

```bash
curl --request PUT \
  --url 'https://api.us.nylas.com/v3/grants/me/calendars/<CALENDAR_ID>' \
  --data '{
    "metadata": {
      "key2": "on-site"
    }
  }'
```

## Query metadata on objects

> **Warn:** 
> **You can only query for the [**Nylas-specific metadata keys**](#reserved-metadata-keys)**.

You can query for specific metadata by including the `metadata` object in your request, or by using the metadata query parameters. Nylas doesn't guarantee that metadata attached to an object will be returned in a specific order, so be sure to build your parsing methods with an arbitrary order in mind.

## Metadata in webhooks

If an object has metadata, Nylas includes the `metadata` property in `*.created` and `*.updated` [webhook notifications](/docs/v3/notifications/), similar to the following example.

```json {21-24}
{
  "specversion": "1.0",
  "type": "event.updated",
  "source": "/google/events/realtime",
  "id": "<WEBHOOK_ID>",
  "time": 1732575192,
  "webhook_delivery_attempt": 1,
  "data": {
    "application_id": "<NYLAS_APPLICATION_ID>",
    "object": {
      "busy": true,
      "calendar_id": "<CALENDAR_ID>",
      "created_at": 1732573232,
      "description": "Weekly one-on-one.",
      "grant_id": "<NYLAS_GRANT_ID>",
      "hide_participants": false,
      "html_link": "<LINK_TO_EVENT>",
      "ical_uid": "<ICAL_UID>",
      "id": "<EVENT_ID>",
      "location": "Room 103",
      "metadata": {
        "key1": "all-meetings",
        "key2": "on-site"
      },
      "object": "event",
      "organizer": {
        "email": "nyla@example.com",
        "name": "Nyla"
      },
      "participants": [
        {
          "email": "leyah@example.com",
          "name": "Leyah Miller",
          "status": "noreply"
        }
      ],
      "read_only": false,
      "reminders": {
        "use_default": true
      },
      "status": "confirmed",
      "title": "One-on-one",
      "updated_at": 1732575179,
      "visibility": "public",
      "when": {
        "end_time": 1732811400,
        "end_timezone": "EST5EDT",
        "object": "timespan",
        "start_time": 1732809600,
        "start_timezone": "EST5EDT"
      }
    }
  }
}
```

## Metadata for recurring events

Recurring events are comprised of a primary ("main") event, with child events or the recurrence attached. When working with metadata on recurring events, keep the following things in mind:

- You can add metadata to the primary event and child event.
- Metadata added to the primary event is passed to the child events.
- Metadata updates made to a child event are applied only to that specific child event and are not propagated to the primary or other instances in the series.
- If you change an event from non-recurring to recurring, any metadata from the non-recurring event is lost.

For more information about recurring events, see the [Schedule recurring events documentation](/docs/v3/calendar/recurring-events/).