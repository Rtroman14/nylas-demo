<!--
  Vendored from https://developer.nylas.com/docs/v3/getting-started/nylas-connect.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Nylas Connect overview

Source: https://developer.nylas.com/docs/v3/getting-started/nylas-connect/

**Add email, calendar, and contacts to your app in minutes.** Just a few lines of code. No token management. Works with your existing auth.

Traditional email integration means weeks of OAuth implementation, token refresh logic, security reviews, and edge case handling. **With Nylas Connect, it's three lines of code.**

This quickstart will walk you through integrating Nylas Connect with your existing identity provider (IDP). You'll authenticate users through your IDP, connect their email accounts, and make API calls using your IDP tokens—no separate Nylas authentication or complex token management required.

## Prerequisites

Before you begin, make sure you have:

- **Nylas Developer Account**: [Sign up here](https://dashboard-v3.nylas.com/register?utm_source=docs&utm_medium=devrel-surfaces&utm_campaign=&utm_content=quickstart) if you don't have one
- **Identity Provider Account**: Auth0, Clerk, Google Identity, WorkOS, or any IDP with JWKS support
- **Node.js or Browser Environment**: For running the examples

> **Why Developers Choose Nylas Connect:** 
> ✓ **5 minutes to integrate** - Get up and running faster than making coffee  
> ✓ **Zero authentication complexity** - No OAuth flows, token refresh logic, or security headaches  
> ✓ **Works with your identity provider** - Auth0, Clerk, Okta, Azure AD, or any custom JWKS provider  
> ✓ **Production-ready from day one** - PKCE flow, automatic token encryption, no secrets in your browser

## 1. Configure your identity provider

First, set up your identity provider. We'll use **Auth0** for this example:

1. Create an application in your [Auth0 Dashboard](https://manage.auth0.com/)
2. Configure these settings:
   - **Allowed Callback URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`
3. Save your **Domain** and **Client ID**

> **Tip:** 
> This guide uses Auth0, but the pattern works with any IDP. See the [full IDP integration guide](/docs/v3/auth/nylas-connect/use-external-idp/) for Clerk, Google, WorkOS, and custom IDPs.

## 2. Configure Nylas Dashboard

Configure IDP settings in your Nylas Dashboard:

1. Go to [Dashboard → Hosted Authentication → Identity Providers](https://dashboard-v3.nylas.com)
2. Add these values:
   - **Allowed Origins**: `http://localhost:3000`
   - **Callback URIs**: `http://localhost:3000`

## 3. Install packages

Install the required packages:

```bash
npm install @nylas/connect @auth0/auth0-spa-js
```

```bash
pnpm add @nylas/connect @auth0/auth0-spa-js
```

> **Built for Modern Apps:** 
> TypeScript-first, zero dependencies, works in browsers and Node.js 18+. Secure by default with PKCE flow and automatic token encryption.

## 4. Initialize and authenticate

Create your authentication setup:

```ts
// Initialize Auth0
const auth0 = new Auth0Client({
  domain: "<AUTH0_DOMAIN>",
  clientId: "<AUTH0_CLIENT_ID>",
  authorizationParams: {
    redirect_uri: window.location.origin,
  },
});

// Initialize Nylas Connect with Auth0 token
const nylasConnect = new NylasConnect({
  clientId: "<NYLAS_CLIENT_ID>",
  redirectUri: window.location.origin + "/callback",
  identityProviderToken: async () => {
    return await auth0.getTokenSilently();
  },
});

// Login with Auth0
await auth0.loginWithPopup();

// Connect email account
const result = await nylasConnect.connect({ method: "popup" });
console.log("Email connected:", result.grantInfo?.email);
```

```js
// Initialize Auth0
const auth0 = new Auth0Client({
  domain: "<AUTH0_DOMAIN>",
  clientId: "<AUTH0_CLIENT_ID>",
  authorizationParams: {
    redirect_uri: window.location.origin,
  },
});

// Initialize Nylas Connect with Auth0 token
const nylasConnect = new NylasConnect({
  clientId: "<NYLAS_CLIENT_ID>",
  redirectUri: window.location.origin + "/callback",
  identityProviderToken: async () => {
    return await auth0.getTokenSilently();
  },
});

// Login with Auth0
await auth0.loginWithPopup();

// Connect email account
const result = await nylasConnect.connect({ method: "popup" });
console.log("Email connected:", result.grantInfo?.email);
```

Replace the placeholder values:

- `<AUTH0_DOMAIN>` - Your Auth0 domain (e.g., `your-app.us.auth0.com`)
- `<AUTH0_CLIENT_ID>` - Your Auth0 Client ID
- `<NYLAS_CLIENT_ID>` - Your Nylas application's Client ID from the dashboard

> **Notice What's Missing?:** 
> No OAuth flow implementation. No token refresh logic. No separate authentication system. Your users stay logged in with your identity provider, and every Nylas API call authenticates using your IDP-issued access token. That's it.

## 5. Make API calls with your IDP token

Once authenticated, make Nylas API calls using your IDP token. One user identity. One token. Access to everything:

```ts
// Get the IDP token
const token = await auth0.getTokenSilently();

// Call Nylas API
const response = await fetch(
  "https://api.us.nylas.com/v3/grants/me/messages?limit=5",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
);

const messages = await response.json();
console.log("Latest messages:", messages.data);
```

```js
// Get the IDP token
const token = await auth0.getTokenSilently();

// Call Nylas API
const response = await fetch(
  "https://api.us.nylas.com/v3/grants/me/messages?limit=5",
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  },
);

const messages = await response.json();
console.log("Latest messages:", messages.data);
```

```bash
# Get your IDP token and user ID, then:
curl --request GET \
  --url 'https://api.us.nylas.com/v3/grants/me/messages?limit=5' \
  --header 'Authorization: Bearer <IDP_TOKEN>' \
  --header 'X-Nylas-External-User-Id: <USER_ID>'
```

## 6. Check connection status

Verify that the email account is connected:

```ts
const status = await nylasConnect.getConnectionStatus();
console.log("Connection status:", status);

const session = await nylasConnect.getSession();
if (session?.grantInfo) {
  console.log("Connected as:", session.grantInfo.email);
  console.log("Provider:", session.grantInfo.provider);
}
```

```js
const status = await nylasConnect.getConnectionStatus();
console.log("Connection status:", status);

const session = await nylasConnect.getSession();
if (session?.grantInfo) {
  console.log("Connected as:", session.grantInfo.email);
  console.log("Provider:", session.grantInfo.provider);
}
```

## What You Just Unlocked

Your IDP user is now connected to their inbox. You can call Nylas APIs using your existing auth token to access:

### 📧 Email Integration

Read, send, and search messages. Full inbox access across Gmail, Outlook, Yahoo, and more. Build features like:

- Inbox management and threading
- Smart search and filtering
- Draft handling and attachments
- Rich text and HTML email composition

### 📅 Calendar Access

Schedule, modify, and sync events. Works with Google Calendar, Outlook, iCloud, and all major providers:

- Create and manage events
- Handle availability and scheduling
- Sync across multiple calendars
- Manage recurring events and reminders

### 👥 Contact Management

Unified contact lists from all email providers. One API for everything:

- Access contacts across providers
- Create and update contact information
- Search and filter contacts
- Manage contact groups

### 🤖 Meeting Intelligence

AI-powered transcription, summaries, action items, and insights from every meeting:

- Automatic meeting transcription
- AI-generated summaries and action items
- Speaker identification and analytics
- Searchable meeting archives

> **Automatic Token Management:** 
> All of this works seamlessly with your IDP token. Token refresh, expiration handling, and session management are handled automatically. No additional code required.

## Using React?

If you're building a React application, use the `@nylas/react` library for a better developer experience:

```tsx


function MyComponent() {
  const { getAccessTokenSilently } = useAuth0();

  const { isConnected, connect } = useNylasConnect({
    clientId: "<NYLAS_CLIENT_ID>",
    redirectUri: window.location.origin + "/callback",
    identityProviderToken: async () => {
      return await getAccessTokenSilently();
    },
  });

  return (
    <button onClick={() => connect({ method: "popup" })}>Connect Email</button>
  );
}
```

See the [React IDP integration guide](/docs/v3/auth/nylas-connect-react/use-external-idp/) for complete React examples.

## Next steps

🎉 **Congratulations!** You've just integrated email, calendar, and contacts into your app without writing a single OAuth flow or token refresh handler.

### Dive Deeper

- **[Full IDP Integration Guide](/docs/v3/auth/nylas-connect/use-external-idp/)** - Detailed guides for Auth0, Clerk, Google, WorkOS, and custom IDPs
- **[NylasConnect Class Reference](/docs/v3/auth/nylas-connect/nylasconnect-class/)** - Complete API reference and configuration options
- **[React Integration](/docs/v3/auth/nylas-connect-react/)** - Using Nylas Connect in React applications

### Start Building Features

- **[Email API](/docs/v3/email/messages/)** - Work with messages, threads, and attachments
- **[Calendar API](/docs/v3/calendar/)** - Schedule and manage events
- **[Contacts API](/docs/v3/email/contacts/)** - Access and manage contacts

### Get Help and Connect

- **[Join our Developer Community](https://forums.nylas.com/)** - Ask questions and share what you're building
- **[View Live Demos](https://github.com/nylas/nylas-connect-demo)** - See working examples and sample code
- **[API Reference](/docs/reference/api/)** - Complete API documentation