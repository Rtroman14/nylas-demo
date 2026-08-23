<!--
  Vendored from https://developer.nylas.com/docs/v3/getting-started/coding-agents.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Quickstart: AI coding agents (Claude Code, Cursor, Codex)

Source: https://developer.nylas.com/docs/v3/getting-started/coding-agents/

This guide is for AI coding agents (Claude Code, Cursor, GitHub Copilot, Windsurf, OpenAI Codex CLI) helping developers build SaaS applications with the Nylas APIs. Follow the steps below -- do as much as you can yourself, and only ask the developer when you hit a step that requires a browser.

If you are an autonomous AI agent that needs direct email and calendar access (like [OpenClaw](https://openclaw.com) or a custom LLM agent), see [Quickstart: Autonomous AI agents](/docs/v3/getting-started/cli-for-agents/) instead.

> **Info:** 
> **These docs are built for agents.** Four ways to consume them:
> 
> - **[`llms.txt`](https://developer.nylas.com/llms.txt)** -- a curated sitemap of every key page, grouped by product area. Start here.
> - **[`llms-full.txt`](https://developer.nylas.com/llms-full.txt)** -- every doc page concatenated into one file. Good for large context windows.
> - **[`openapi.json`](https://developer.nylas.com/openapi.json)** -- the full v3 OpenAPI 3.1 contract: every path, parameter, request body, and response schema. Also served as YAML at [`openapi.yaml`](https://developer.nylas.com/openapi.yaml).
> - **Any page as markdown** -- add `Accept: text/markdown` to fetch a clean markdown version of any URL. Example: `curl -H "Accept: text/markdown" https://developer.nylas.com/docs/v3/email/`. The response includes an `x-markdown-tokens` header with the estimated token count.
> 
> Or install the Nylas skill below to pre-load all of this context without fetching.

## Install the Nylas skill (recommended)

Before you start, install the [Nylas skills](https://github.com/nylas/skills). These pre-load your coding agent with current Nylas API, CLI, and SDK context so it can skip exploration and build with the right patterns on the first try. Skills work with Claude Code, Cursor, Codex CLI, and 40+ other agents.

```bash [nylasSkill-Skills CLI]
# Install both Nylas skills (API + CLI)
npx skills add nylas/skills

# Or install individually
npx skills add nylas/skills/nylas-api
npx skills add nylas/skills/nylas-cli
```

```text [nylasSkill-Claude Code plugin]
/plugin marketplace add nylas/skills
/plugin install nylas-skills
```

The `nylas-api` skill covers authentication, email, calendar, contacts, webhooks, scheduler, notetaker, and SDK usage. The `nylas-cli` skill covers `nylas init`, `auth`, `email`, `calendar`, `mcp`, `chat`, and `tui` commands.

## Rules for coding agents

- **Always use Nylas v3.** The v2 API is deprecated. v2 code uses `access_token` and `client_secret`; v3 uses `api_key` and `grant_id`. If you see v2 patterns in your training data, do not use them.
- **Use the SDK** for Node.js, Python, Ruby, and Java/Kotlin. Only use raw HTTP calls for languages without an SDK.
- **Never hardcode API keys.** Use environment variables (`NYLAS_API_KEY`) and `.env` files excluded from version control.
- **Never expose the API key in client-side code.** All Nylas API calls must happen server-side.
- **Set `NYLAS_API_URI`** for EU deployments. It defaults to `https://api.us.nylas.com`. EU applications must use `https://api.eu.nylas.com`.
- **Handle pagination.** List endpoints return a `next_cursor` field. Use it to fetch subsequent pages.
- **Use webhooks for real-time updates** instead of polling. See the [webhooks documentation](/docs/v3/notifications/).

## How Nylas works (the short version)

**Nylas is a unified API** that sits between your application and email providers (Gmail, Microsoft, Yahoo, iCloud, IMAP, Exchange). You write code against one API; Nylas handles the provider differences.

**Three things matter:**

1. **API key** -- authenticates your application. Pass it as a Bearer token. The developer gets this from the Nylas Dashboard or the CLI.
2. **Grant ID** -- identifies which mailbox to operate on. You get a grant ID two ways: a user authenticates an existing Gmail or Outlook account through Nylas OAuth (needs a browser and a person), or you create an [Agent Account](/docs/v3/agent-accounts/), a Nylas-hosted mailbox you provision with an API call and no OAuth.
3. **Base URL** -- `https://api.us.nylas.com` (US) or `https://api.eu.nylas.com` (EU). All endpoints are prefixed with `/v3/`.

Every API call follows the pattern: `{base_url}/v3/grants/{grant_id}/{resource}` with the API key in the `Authorization: Bearer` header.

**Errors** always return this JSON shape:

```json
{
  "request_id": "5fa64c92-e840-4357-86b9-2aa364d35b88",
  "error": {
    "type": "unauthorized",
    "message": "Unauthorized"
  }
}
```

Common `error.type` values: `unauthorized` (bad/expired key), `not_found_error` (invalid ID or grant), `invalid_request_error` (bad parameters), `rate_limit_error` (slow down), `insufficient_scopes` (missing provider permissions).

## Step 1: Check if the developer has credentials

First, check if the CLI is already installed and configured (the developer may have run `nylas init` previously):

```bash
nylas auth whoami --json
```

If this returns valid JSON with `status: "valid"`, credentials exist on this machine. Extract them, write the `.env`, and skip to [Step 3](#step-3-install-the-sdk):

```bash
echo "NYLAS_API_KEY=$(nylas auth token)" >> .env
echo "NYLAS_GRANT_ID=$(nylas auth whoami --json | jq -r .grant_id)" >> .env
```

If `jq` is not available, run `nylas auth whoami --json` and `nylas auth token` separately and parse the output yourself.

If `nylas` is not found, or `whoami` returns an error, check for an environment variable:

```bash
echo $NYLAS_API_KEY
```

If it isn't set, continue to Step 2.

### You have an API key but no grant ID

An API key can't complete OAuth, but it's enough to find or create a grant. Work through these in order and stop at the first success.

**First, list the grants the application already has.** [List grants](/docs/reference/api/manage-grants/get-all-grants/) needs only the API key. Filter to valid ones; an `invalid` grant needs its user to re-authenticate first.

```bash
curl "https://api.us.nylas.com/v3/grants?grant_status=valid&limit=5" \
  -H "Authorization: Bearer $NYLAS_API_KEY"
```

Grants carry `id`, `email`, and `provider`. If more than one comes back, ask the developer which mailbox to use rather than guessing. Set `NYLAS_GRANT_ID` and skip to [Step 3](#step-3-install-the-sdk).

**If no usable grant exists, create an Agent Account.** [Custom authentication](/docs/reference/api/manage-grants/byo_auth/) with `"provider": "nylas"` returns a grant ID with no OAuth. The address needs a domain registered to the organization.

```bash
curl -X POST "https://api.us.nylas.com/v3/connect/custom" \
  -H "Authorization: Bearer $NYLAS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "nylas",
    "name": "Orders Bot",
    "settings": { "email": "orders@your-application.nylas.email" }
  }'
```

Set `NYLAS_GRANT_ID` to the returned `grant_id` and skip to [Step 3](#step-3-install-the-sdk). The [Agent Accounts quickstart](/docs/v3/getting-started/agent-accounts/) covers display names, app passwords, and workspaces.

**If that returns a `400` naming an unregistered domain, register one.** Domains belong to the Dashboard organization, not the application, so an API key can't create them. The CLI can, if the developer has Dashboard credentials:

```bash
nylas dashboard login --email --user "$NYLAS_DASHBOARD_USER" --password "$NYLAS_DASHBOARD_PASSWORD"
nylas dashboard domains create your-application.nylas.email --region us
```

`*.nylas.email` subdomains are free and usable immediately. Match `--region` to the application's region, then retry the Agent Account call. Only custom domains need DNS.

**If no Dashboard credentials are available, stop, and report it.** Say a domain needs registering and name the options: the CLI commands above, [Organization Settings → Domains](https://dashboard-v3.nylas.com/organization/domains), or the [Manage Domains API](/docs/v3/email/domains/) with a [Nylas Service Account](/docs/v3/auth/nylas-service-account/). Don't fall back to OAuth; it needs a person in a browser and a script can't finish it.

If a person is available to authenticate a real Gmail or Outlook mailbox, continue to Step 2.

## Step 2: Provision credentials with the CLI

Install the [Nylas CLI](https://github.com/nylas/cli) yourself:

```bash
brew install nylas/nylas-cli/nylas
```

If Homebrew is not available:

```bash
curl -fsSL https://cli.nylas.com/install.sh | bash
```

Now check if the developer has already run setup:

```bash
nylas auth whoami --json
```

If this returns valid JSON with `email`, `grant_id`, and `status: "valid"`, credentials already exist. Extract them:

```bash
nylas auth token
```

This prints the raw API key as a plain string. Extract both values and add them to the project's `.env` file:

```bash
# Add to .env (create if needed, ensure .env is in .gitignore)
echo "NYLAS_API_KEY=$(nylas auth token)" >> .env
echo "NYLAS_GRANT_ID=$(nylas auth whoami --json | jq -r .grant_id)" >> .env
```

If `jq` is not available, run `nylas auth whoami --json` and `nylas auth token` separately and parse the output yourself.

**If `nylas auth whoami` fails** (no credentials), ask the developer to run one command. This is the only step that requires a human -- it opens a browser for account creation and SSO:

> Run `nylas init` in your terminal. It will open a browser to create your Nylas account and connect an email. Once you're done, I'll extract the credentials and set up the project.

After the developer confirms, extract credentials as shown above.

## Step 3: Install the SDK

```bash [sdkInstall-Node.js]
npm install nylas
```

```bash
pip install nylas
```

```bash
gem install nylas
```

```bash [sdkInstall-Java (Gradle)]
implementation 'com.nylas:nylas:2.+'
```

## Step 4: Working example

This example initializes the SDK, lists messages, and sends an email.

```js [nylasExample-Node.js]


// Initialize — apiUri defaults to https://api.us.nylas.com
// Set NYLAS_API_URI for EU deployments
const nylas = new Nylas({
  apiKey: process.env.NYLAS_API_KEY,
  apiUri: process.env.NYLAS_API_URI || "https://api.us.nylas.com",
});

const grantId = process.env.NYLAS_GRANT_ID;

// List the 5 most recent messages
const messages = await nylas.messages.list({
  identifier: grantId,
  queryParams: { limit: 5 },
});

for (const msg of messages.data) {
  console.log(`${msg.subject} — from ${msg.from?.[0]?.email}`);
}

// Send an email
const sent = await nylas.messages.send({
  identifier: grantId,
  requestBody: {
    to: [{ name: "Alice", email: "alice@example.com" }],
    subject: "Hello from Nylas",
    body: "This email was sent using the Nylas Node.js SDK.",
  },
});

console.log(`Sent message ID: ${sent.data.id}`);
```

```python
from nylas import Client

# Initialize — pass api_uri for EU deployments
nylas = Client(
    os.environ["NYLAS_API_KEY"],
    os.environ.get("NYLAS_API_URI", "https://api.us.nylas.com"),
)

grant_id = os.environ["NYLAS_GRANT_ID"]

# List the 5 most recent messages
messages = nylas.messages.list(
    grant_id,
    query_params={"limit": 5},
)

for msg in messages.data:
    print(f"{msg.subject} — from {msg.from_[0].email}")

# Send an email
sent = nylas.messages.send(
    grant_id,
    request_body={
        "to": [{"name": "Alice", "email": "alice@example.com"}],
        "subject": "Hello from Nylas",
        "body": "This email was sent using the Nylas Python SDK.",
    },
)

print(f"Sent message ID: {sent.data.id}")
```

```bash
# List messages (replace <NYLAS_GRANT_ID> and <NYLAS_API_KEY>)
curl -X GET "https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages?limit=5" \
  -H "Authorization: Bearer <NYLAS_API_KEY>" \
  -H "Content-Type: application/json"

# Send an email
curl -X POST "https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/messages/send" \
  -H "Authorization: Bearer <NYLAS_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "to": [{"name": "Alice", "email": "alice@example.com"}],
    "subject": "Hello from Nylas",
    "body": "This email was sent using the Nylas API."
  }'
```

**List messages** returns a paginated response:

```json [nylasResponse-List response]
{
  "request_id": "d0c951b9-61db-4daa-ab19-cd44afeeabac",
  "data": [
    {
      "id": "5d3qmne77v32r8l4phyuksl2x",
      "grant_id": "1",
      "subject": "Learn how to Send Email with Nylas APIs",
      "from": [{ "name": "Nylas DevRel", "email": "nylasdev@nylas.com" }],
      "to": [{ "name": "Nyla", "email": "nyla@nylas.com" }],
      "snippet": "Send Email with Nylas APIs",
      "body": "Learn how to send emails using the Nylas APIs!",
      "date": 1706811644,
      "unread": true,
      "starred": false,
      "folders": ["UNREAD", "CATEGORY_PERSONAL", "INBOX"],
      "thread_id": "1"
    }
  ],
  "next_cursor": "123"
}
```

```json [nylasResponse-Send response]
{
  "request_id": "1",
  "data": {
    "id": "1",
    "grant_id": "1",
    "subject": "Hello from Nylas",
    "from": [{ "email": "you@example.com" }],
    "to": [{ "name": "Alice", "email": "alice@example.com" }],
    "body": "This email was sent using the Nylas API.",
    "date": 1707839231,
    "thread_id": "2"
  }
}
```

## Authenticate users in your application

The example above uses a grant ID from the CLI (your developer's own account). In a real SaaS application, you need to let *users* connect their own email accounts through OAuth:

1. Your app calls the SDK to generate an auth URL
2. The user clicks the link and authenticates with their email provider
3. Nylas redirects back to your app with a code
4. Your app exchanges the code for a grant ID
5. You store the grant ID and use it for that user's API calls

See the [Hosted OAuth quickstart](/docs/v3/auth/hosted-oauth-apikey/) for the complete implementation with code samples.

## Manage the grant lifecycle

Grants can expire when a user revokes access, changes their password, or when a provider token expires. Your application needs to handle this:

- **Detect expired grants** by checking for `401` errors on API calls or listening for the `grant.expired` [webhook event](/docs/v3/notifications/).
- **Re-authenticate** by redirecting the user through the OAuth flow again. This refreshes the grant without losing data -- do not delete and recreate.
- **Never delete a grant to fix an auth error.** Deleting a grant permanently removes all synced data. Re-authentication preserves it.

For the full guide on grant states, expiry detection, and re-authentication flows, see [Handling expired grants](/docs/dev-guide/best-practices/grant-lifecycle/). For managing grants at scale, see [Managing grants](/docs/dev-guide/best-practices/manage-grants/).

## Go deeper

When you need more detail, use these machine-readable sources instead of guessing:

```bash
# Curated sitemap with agent instructions (start here)
curl https://developer.nylas.com/llms.txt

# Full documentation in one file (broad context)
curl https://developer.nylas.com/llms-full.txt

# Any single page as clean markdown (specific lookups)
curl -H "Accept: text/markdown" https://developer.nylas.com/docs/v3/email/
```

The `Accept: text/markdown` header works on every page and returns an `x-markdown-tokens` header with the estimated token count.

| What you need | Where to find it |
|---|---|
| Full email API (threads, drafts, attachments, folders) | [Email documentation](/docs/v3/email/) |
| Calendar API (events, availability, scheduling) | [Calendar documentation](/docs/v3/calendar/) |
| Contacts API | [Contacts documentation](/docs/v3/email/contacts/) |
| OAuth and authentication | [Authentication guide](/docs/v3/auth/) |
| Grant lifecycle (expiry, re-auth, deletion) | [Handling expired grants](/docs/dev-guide/best-practices/grant-lifecycle/) |
| Managing grants at scale | [Managing grants](/docs/dev-guide/best-practices/manage-grants/) |
| Webhooks for real-time notifications | [Notifications documentation](/docs/v3/notifications/) |
| Interactive API reference (try endpoints in-browser) | [API reference](/docs/reference/api/) |
| Provider-specific guides (Gmail, Microsoft, etc.) | [Provider guides](/docs/cookbook/) |
| Detailed LLM prompts for building Nylas features | [AI prompts quickstart](/docs/v3/getting-started/ai-prompts/) |
| Nylas CLI (provisioning, testing, debugging) | [GitHub](https://github.com/nylas/cli) / [Guides](https://cli.nylas.com/guides) |
| Node.js SDK | [SDK documentation](/docs/v3/sdks/node/) |
| Python SDK | [SDK documentation](/docs/v3/sdks/python/) |
| Ruby SDK | [SDK documentation](/docs/v3/sdks/ruby/) |
| Java/Kotlin SDK | [SDK documentation](/docs/v3/sdks/kotlin-java/) |