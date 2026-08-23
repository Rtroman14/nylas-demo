<!--
  Vendored from https://developer.nylas.com/docs/v3/email/parse-messages.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Parsing messages in Nylas

Source: https://developer.nylas.com/docs/v3/email/parse-messages/

The [Clean Messages endpoint](/docs/reference/api/messages/clean-messages/) uses language processing and machine learning to parse messages. Nylas removes all extra information (for example, images and attachments) and returns only the information that you need. You can use this clean data to train machine learning models with email data, trigger automations, and more.

## How email parsing works

When you make a request to the [Clean Messages endpoint](/docs/reference/api/messages/clean-messages/), Nylas uses advanced machine learning models to parse structured messages. It extracts relevant content and caches the results to reduce response times. You can use these cleaned messages to train other machine learning models with your email data, trigger automations, create chat-like views of threads, and more.

Nylas removes all extraneous information (such as HTML `<script>` and `<style>` tags) and returns the cleaned body text in the `conversation` field. You can use the following configuration parameters to further specify the information Nylas returns:

- `ignore_links`: When `true`, removes links in the message or signature. Defaults to `true`.
- `ignore_images`: When `true`, removes images from the message or signature. Defaults to `true`.
- `images_as_markdown`: When `true`, Nylas returns images as Markdown links. Defaults to `false`.
- `ignore_tables`: When `true`, removes tables from the message or signature. Defaults to `true`.
- `remove_conclusion_phrases`: When `true`, removes phrases such as "Best" and "Regards" in the signature. Defaults to `true`.
- `html_as_markdown`: When `true`, converts the message to markdown. Defaults to `false`.

You set each of these options on a per-request basis, so no need to worry about deciding how you want _all_ of your cleaned messages to look. For more information, see the [Clean Messages references](/docs/reference/api/messages/clean-messages/).

## Before you begin


To follow along with the samples on this page, you first need to [sign up for a Nylas developer account](https://dashboard-v3.nylas.com/register?utm_source=docs&utm_medium=devrel-surfaces&utm_campaign=&utm_content=using-apis), which gets you a free Nylas application and API key.

For a guided introduction, you can follow the [Getting started guide](/docs/v3/getting-started/) to set up a Nylas account and Sandbox application. When you have those, you can connect an account from a calendar provider (such as Google, Microsoft, or iCloud) and use your API key with the sample API calls on this page to access that account's data.


You'll also need to set up a provider auth app ([Google](/docs/provider-guides/google/create-google-app/) or [Microsoft Azure](/docs/provider-guides/microsoft/create-azure-app/)) and [connector](/docs/reference/api/connectors-integrations/) with at least the following scopes:

- **Google**: `gmail.readonly`
- **Microsoft**: `Mail.Read`
- **EWS**: `ews.messages`

## Parse messages

Make a [Clean Messages request](/docs/reference/api/messages/clean-messages/) that includes the IDs of up to 20 messages. Nylas returns the cleaned message in the `conversation` field and any images in the `attachments` object.

```bash
curl --compressed --request PUT \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages/clean' \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --data '{
    "message_id": ["<MESSAGE_ID>"],
    "ignore_links": true,
    "ignore_images": true,
    "images_as_markdown": false,
    "ignore_tables": true,
    "remove_conclusion_phrases": true,
    "html_as_markdown": false
  }'

```

```json [-Response (JSON)]

{
  "request_id": "5fa64c92-e840-4357-86b9-2aa364d35b88",
  "data": [
    {
      "body": "<div dir=\"ltr\"><div>Hello, I just sent a message using Nylas! <br></div><img src=\"cid:ii_ltppe5ph0\" alt=\"Nylas-Logo.png\" width=\"540\" height=\"464\"><br><div dir=\"ltr\" class=\"gmail_signature\" data-smartmail=\"gmail_signature\"><div dir=\"ltr\"></div></div></div>\r\n",
      "cc": [
        {
          "name": "Leyah Miller",
          "email": "leyah@example.com"
        }
      ],
      "date": 1635355739,
      "attachments": [
        {
          "is_inline": true,
          "id": "<ATTACHMENT_ID>",
          "grant_id": "<NYLAS_GRANT_ID>",
          "filename": "Nylas-Logo.png",
          "content_type": "image/png; name=\"Nylas-Logo.png\"",
          "content_disposition": "inline; filename=\"Nylas-Logo.png\"",
          "content_id": "<CID>",
          "size": 26044
        }
      ],
      "folders": ["<FOLDER_ID>", "<FOLDER_ID>"],
      "from": [
        {
          "name": "Nylas",
          "email": "nylas@example.com"
        }
      ],
      "grant_id": "<NYLAS_GRANT_ID>",
      "id": "<MESSAGE_ID>",
      "object": "message",
      "reply_to": [
        {
          "name": "Nylas",
          "email": "nylas@example.com"
        }
      ],
      "snippet": "Hello, I just sent a message using Nylas!",
      "starred": true,
      "subject": "Hello from Nylas!",
      "thread_id": "<THREAD_ID>",
      "to": [
        {
          "name": "Nyla",
          "email": "nyla@example.com"
        }
      ],
      "unread": true,
      "conversation": "Hello, I just sent a message using Nylas!"
    }
  ]
}


```

<details>
  <summary>Before and after Clean Message request</summary>
  <div class="flex-container">
    <div class="flex-items">
      <h2>Before</h2>
      <img
        src="/_images/email/v3-clean-conversation.png"
        alt="Nylas v3"
        width="500px"
      ></img>
    </div>
    <div class="flex-items">
      <h2>After</h2>
      <code>
        Unsubscribe \n\n \nHi there,\n\nNylas API v3 is now generally available!
        The new infrastructure introduces: \n\n * Instant email and event
        functionality, boosting performance, security, and scalability.\n *
        Simplified integrations such as API keys for auth, enhanced
        notifications, Microsoft Graph, and more to streamline engineering
        efforts even further.\n * New email features such as Bounce Detection,
        Smart Compose, Scheduled Send, and custom domain for email tracking
        links to improve email deliverability and efficiency.\n\nCheck out Nylas
        docs and join our webinar on Feb 15 to learn more, and start\nmigrating
        today!\n\nHave questions about migrating? Contact your dedicated Nylas
        customer success\nmanager (CSM) or email customeronboarding@nylas.com.
        \n\n© 2024 Nylas Inc. All rights reserved.\n\nPrivacy Policy |
        Copyright | Unsubscribe\n\n2100 Geng Rd. #210, Palo Alto, CA 94303
      </code>
    </div>
  </div>
</details>

### Return parsed message as Markdown

When you set `images_as_markdown` and `html_as_markdown` to `true` in your request, Nylas formats the parsed message to Markdown and returns it in the `email_as_markdown` field.

## Parse messages with images

When you specify a message that contains images in a [Clean Message request](/docs/reference/api/messages/clean-messages/), you can choose how Nylas handles the images. If you want to return them, set `ignore_images` to `false`. If you want to return the image tags as Markdown links, set `images_as_markdown` to `true` and `ignore_images` to `false`.

Nylas returns inline images in the `conversation` field as part of the parsed message, and includes their content ID (`cid`):

- **Inline image**: `"conversation": "<img src='cid:1781777f666586677621' />\n\nImage from Gmail"`
- **Inline image as Markdown**: `"conversation": "![Nylas logo](cid:1781777f666586677621)\n\nImage from Gmail"`

> **Info:** 
> **The content ID is an internal Nylas ID**. If you want to download an image from a parsed message, use the corresponding `id` from the `attachments` object in the response instead.

Nylas returns some inline images with a link to the original source, if available. If the link isn't available, Nylas returns the `cid`.

Nylas doesn't return image attachments as part of a parsed message. You can find information about attached images in the `attachments` object.

### Download images from parsed message

To download an image that was included in a parsed message, make a [Download Attachment request](/docs/reference/api/attachments/get-attachments-id-download/) that includes the attachment and message IDs. Nylas returns the image as a binary data blob.

```bash

curl --compressed --request GET \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/attachments/<ATTACHMENT_ID>/download?message_id=<MESSAGE_ID>' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>'


```

## Get notifications for cleaned messages

Instead of polling the Clean Messages endpoint, you can subscribe to the `message.created.cleaned` webhook trigger to receive cleaned message content automatically when new messages are synced. The webhook payload includes the cleaned markdown in the `body` field, plus a `cleaning_status` field indicating whether cleaning succeeded.

Subscribing to `message.created.cleaned` does not suppress `message.created` notifications. If you subscribe to both triggers, Nylas sends two separate notifications for each new message: one with the original HTML body and one with the cleaned content.

To use cleaned message webhooks, configure Clean Conversation settings for your application and subscribe to the `message.created.cleaned` trigger. For more information, see the [`message.created.cleaned` notification reference](/docs/reference/notifications/messages/message-created-cleaned/).

## Keep in mind

Keep the following things in mind as you work with the [Clean Message endpoint](/docs/reference/api/messages/clean-messages/):

- Nylas currently detects English-language conclusion phrases only when you set `remove_conclusion_phrases` to `true`.
- Nylas removes any reply and forward content from the message, and returns only the latest message in the thread.