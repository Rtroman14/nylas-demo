<!--
  Vendored from https://developer.nylas.com/docs/v3/email.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Email API

Source: https://developer.nylas.com/docs/v3/email/

> **Info:** 
> **New to the Email API?** Start with the [Email API quickstart](/docs/v3/getting-started/email/) to send and read email in under 5 minutes.

The Nylas Email API provides a single interface to read, send, search, and manage email across Gmail, Microsoft 365, Exchange, Yahoo, iCloud, and IMAP providers. Instead of building separate integrations for each provider, you connect once to Nylas and get consistent access to messages, threads, folders, attachments, contacts, and more.

## Key concepts

- **A grant** is an authenticated connection to one user's mailbox. You pass its grant ID on every Email API request to act on that account.
- **A message** is a single email, including its sender, recipients, subject, body, and attachments.
- **A thread** is a group of related messages that form one conversation.
- **A folder** is a container that organizes messages. Gmail models these as labels, so a single message can belong to more than one.
- **An attachment** is a file sent with a message. Nylas accepts up to 25 MB inline through multipart, or up to 150 MB for Microsoft grants through the attachment-uploads flow.

## What you can do

| Capability                      | Description                                                                                           | Page                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Read and search messages**    | List, filter, and search email messages across any provider                                           | [Messages API](/docs/v3/email/messages/)                       |
| **Send messages**               | Send email directly or create drafts first, with support for attachments, reply threads, and tracking | [Sending messages](/docs/v3/email/send-email/)                 |
| **Schedule sends**              | Queue messages to send at a future time with cancellation support                                     | [Scheduling messages](/docs/v3/email/scheduled-send/)          |
| **Manage threads**              | Group related messages into conversation threads                                                      | [Threads API](/docs/v3/email/threads/)                         |
| **Manage folders and labels**   | Create, rename, and organize folders and Gmail labels                                                 | [Folders API](/docs/v3/email/folders/)                         |
| **Work with attachments**       | Download, upload, and manage file attachments (up to 25 MB via multipart)                             | [Attachments API](/docs/v3/email/attachments/)                 |
| **Send large attachments**      | Upload attachments up to 150 MB for Microsoft grants using the attachment-uploads flow                | [Send large attachments (Beta)](/docs/v3/email/send-large-attachments/) |
| **Track messages**              | Track opens, link clicks, and thread replies with webhook notifications                               | [Message tracking](/docs/v3/email/message-tracking/)           |
| **Manage signatures**           | Store reusable HTML email signatures per grant and attach them when sending                            | [Email signatures](/docs/v3/email/signatures/)                 |
| **Use templates and workflows** | Define reusable templates and trigger automated email workflows                                       | [Templates and workflows](/docs/v3/email/templates-workflows/) |
| **Parse messages**              | Extract clean, display-ready HTML from raw email content                                              | [Parsing messages](/docs/v3/email/parse-messages/)             |
| **Compose with AI**             | Generate email drafts and replies using the Smart Compose endpoint                                    | [Smart Compose](/docs/v3/email/smart-compose/)                 |
| **Manage contacts**             | Read and manage contacts from address books, domains, and inboxes                                     | [Contacts API](/docs/v3/email/contacts/)                       |
| **Manage sending domains**      | Register, verify, and configure custom domains for transactional sending                              | [Managing domains](/docs/v3/email/domains/)                    |
| **Warm up domains**             | Gradually increase sending volume on new domains to build sender reputation                           | [Domain warm up](/docs/v3/agent-accounts/domain-warming/)               |
| **Handle headers and MIME**     | Access raw email headers and MIME data for advanced use cases                                         | [Headers and MIME data](/docs/v3/email/headers-mime-data/)     |
| **Use an app-owned mailbox**    | Provision a Nylas-hosted `name@yourdomain.com` mailbox entirely through the API — no OAuth, no user inbox to connect | [Agent Accounts](/docs/v3/agent-accounts/)              |

## Before you begin

> **Info:** 
> **New to Nylas?** Start with the [Getting started guide](/docs/v3/getting-started/) to create your Nylas application, get your API key, and connect your first grant.

## Related resources

- [Email API reference](/docs/reference/api/messages/) for complete endpoint documentation
- [Agent Accounts](/docs/v3/agent-accounts/) for Nylas-hosted mailboxes you provision through the API
- [Sending errors](/docs/v3/email/sending-errors/) for troubleshooting delivery failures
- [Improve email deliverability](/docs/dev-guide/best-practices/improving-email-delivery/) for best practices
- [Nylas SDKs](/docs/v3/sdks/) for Node.js, Python, Ruby, Java, and Kotlin client libraries