<!--
  Vendored from https://developer.nylas.com/docs/v3/auth.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Authenticating with Nylas

Source: https://developer.nylas.com/docs/v3/auth/

Nylas uses OAuth 2.0 to create **grants** — authenticated connections that give your application access to a user's email, calendar, and contacts data. Every API call that reads or writes user data requires a `grant_id`.

> **Info:** 
> **Stuck on sign-in flows or provider setup?** Nylas [Professional Services](/docs/support/professional-services/#go-to-market-review) includes a go-to-market review of your onboarding and authentication flows, plus collaborative OAuth app setup for Microsoft Entra, Google Cloud, and Zoom.

## Choose an authentication method

> **Success:** 
> **Most applications should use [Hosted OAuth with API key](/docs/v3/auth/hosted-oauth-apikey/).** Nylas handles token refresh after the initial exchange, so you only ever use your API key and the user's `grant_id`.

| Method                                                                        | Best for                              | Token management    | Requires redirect UI? | Supported providers              |
| ----------------------------------------------------------------------------- | ------------------------------------- | ------------------- | --------------------- | -------------------------------- |
| [Hosted OAuth (API key)](/docs/v3/auth/hosted-oauth-apikey/)                  | Most server-side integrations         | Nylas manages       | Yes                   | Google, Microsoft, Yahoo, iCloud |
| [Hosted OAuth (access token + PKCE)](/docs/v3/auth/hosted-oauth-accesstoken/) | SPAs and mobile apps                  | You manage refresh  | Yes                   | Google, Microsoft                |
| [Bring your own authentication](/docs/v3/auth/bring-your-own-authentication/) | Teams with an existing OAuth flow     | You manage entirely | No                    | Google, Microsoft                |
| [IMAP](/docs/v3/auth/imap/)                                                   | Legacy or self-hosted email servers   | App passwords       | No                    | Any IMAP server                  |
| [Service account](/docs/v3/auth/nylas-service-account/)                       | Server-to-server, no user interaction | Nylas manages       | No                    | Google Workspace                 |

## Before you begin

Before setting up authentication, you need:

- A Nylas account — [sign up](https://dashboard-v3.nylas.com/register) if you don't have one yet
- A Nylas application and API key — see [Create a Nylas application](/docs/dev-guide/develop-with-nylas/#create-a-nylas-application-for-development) and [Get your API key](/docs/dev-guide/dashboard/#get-your-api-key)
- A provider auth app for Google or Microsoft integrations (see [Create provider auth apps](#create-provider-auth-apps))
- At least one connector configured in your Nylas application (see [Create connectors](#create-connectors))

## Set up authentication

1. Log in to the [Nylas Dashboard](https://dashboard-v3.nylas.com/login?utm_source=docs&utm_content=auth) and [create a Nylas application](/docs/dev-guide/develop-with-nylas/#create-a-nylas-application-for-development).
2. [Get your application's API key](/docs/dev-guide/dashboard/#get-your-api-key).
3. Create auth apps for the providers you plan to integrate with.
4. [Create connectors](#create-connectors) for your provider auth apps. Nylas supports [Google](/docs/provider-guides/google/), [Microsoft](/docs/provider-guides/microsoft/), [IMAP](/docs/provider-guides/imap/), [Exchange on-premises](/docs/provider-guides/exchange-on-prem/), [iCloud](/docs/provider-guides/icloud/), [Yahoo](/docs/provider-guides/yahoo-authentication/), and [Zoom Meetings](/docs/provider-guides/zoom-meetings/).
5. [Add your project's callback URIs](#add-callback-uris-to-your-nylas-application) to your Nylas application.
6. Authenticate your users and [create grants](/docs/dev-guide/best-practices/manage-grants/#create-a-grant) for them.

## Create provider auth apps

If you plan to connect Google or Microsoft accounts, you need a provider auth app. You can use it with internal accounts right away for development and testing — the provider review only matters before you go live.

> **Info:** 
> **We recommend maintaining separate provider auth apps per environment** so you can adjust scopes and settings in development without affecting production users. The review process can take several weeks, so plan this into your timeline.

### Google application review

Request only the most restrictive [scopes](/docs/dev-guide/scopes/) you need. If you request any of [Google's restricted scopes](/docs/provider-guides/google/google-verification-security-assessment-guide/#google-scopes), Google requires a full security assessment — this can significantly extend your verification timeline.

See the [Google verification and security assessment guide](/docs/provider-guides/google/google-verification-security-assessment-guide/) for details.


> **Info:** 
> **Alternative: skip Google's verification with the [Nylas Shared GCP App](/docs/provider-guides/google/shared-gcp-app/).** Your users authenticate through a Nylas-owned, pre-verified GCP project, so you skip GCP setup, OAuth verification, and the CASA assessment entirely. The Shared GCP App is an add-on for Nylas Contract plans — reach out to your Account Manager or [contact the Nylas Sales team](https://www.nylas.com/contact-sales/) to add it to your contract.


## Create connectors

> **Info:** 
> **You can't create connectors or change scopes on a Nylas Sandbox application.** Sandbox applications include a limited set of pre-configured connectors for testing.

Connectors store your provider app credentials so you don't need to include them in every API call. You can't create grants without at least one connector.

Create connectors from the [Nylas Dashboard](https://dashboard-v3.nylas.com/login?utm_source=docs&utm_content=auth) under **Connectors**, or with the [Create Connector API endpoint](/docs/reference/api/connectors-integrations/create_connector/).

```json
{
  "name": "Staging App 1",
  "provider": "microsoft",
  "settings": {
    "client_id": "<PROVIDER_CLIENT_ID>",
    "client_secret": "<PROVIDER_CLIENT_SECRET>",
    "tenant": "common"
  },
  "scope": ["Mail.Read", "User.Read", "offline_access"]
}
```

```json [createConnector-Response (JSON)]
{
  "name": "Staging App 1",
  "provider": "microsoft",
  "scope": ["Mail.Read", "User.Read", "offline_access"]
}
```

```js [createConnector-Node.js]

import Nylas from "nylas";

const nylas = new Nylas({
  apiKey: "<NYLAS_API_KEY>",
  apiUri: "<NYLAS_API_URI>",
});

async function createConnector() {
  try {
    const connector = await nylas.connectors.create({
      requestBody: {
        name: "google",
        provider: "google",
        settings: {
          clientId: "<GCP_CLIENT_ID>",
          clientSecret: "<GCP_CLIENT_SECRET>",
        },
        scope: [
          "openid",
          "https://www.googleapis.com/auth/userinfo.email",
          "https://www.googleapis.com/auth/gmail.modify",
          "https://www.googleapis.com/auth/calendar",
          "https://www.googleapis.com/auth/contacts",
        ],
      },
    });

    console.log("Connector created:", connector);
  } catch (error) {
    console.error("Error creating connector:", error);
  }
}

createConnector();


```

```python
from nylas import Client

nylas = Client(
    "<NYLAS_API_KEY>",
    "<NYLAS_API_URI>",
)

connector = nylas.connectors.create(
    request_body={
        "provider": "google",
        "settings": {
            "client_id": "<GCP_CLIENT_ID>",
            "client_secret": "<GCP_CLIENT_SECRET>",
        },
        "scopes": [
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/gmail.modify",
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/contacts",
        ],
    }
)


```

```ruby
require 'nylas'

nylas = Nylas::Client.new(
    api_key: "<NYLAS_API_KEY>"
)

request_body = {
  provider: "google",
  settings: {
    clientId: "<GCP_CLIENT_ID>",
    clientSecret: "<GCP_CLIENT_SECRET>",
  },
  scope: [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/contacts',
  ]
}

nylas.connectors.create(request_body: request_body)

```

```kt
import com.nylas.NylasClient
import com.nylas.models.CreateConnectorRequest
import com.nylas.models.GoogleCreateConnectorSettings

fun main(args: Array<String>) {
  val nylas: NylasClient = NylasClient(
      apiKey = "<NYLAS_API_KEY>"
  )

  var scope = listOf(
      "openid",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/contacts"
  )

  val settings : GoogleCreateConnectorSettings = GoogleCreateConnectorSettings(
      "<GCP_CLIENT_ID>",
      "<GCP_CLIENT_SECRET>",
      ""
  )

  val request : CreateConnectorRequest = CreateConnectorRequest.Google(settings, scope)
  
  nylas.connectors().create(request)
}

```

```java
import com.nylas.NylasClient;
import com.nylas.models.*;
import java.util.ArrayList;
import java.util.List;

public class connector {
  public static void main(String[] args) throws NylasSdkTimeoutError, NylasApiError {
    NylasClient nylas = new NylasClient.Builder("<NYLAS_API_KEY>").build();

    List<String> scope = new ArrayList<>();
    scope.add("openid");
    scope.add("https://www.googleapis.com/auth/userinfo.email");
    scope.add("https://www.googleapis.com/auth/gmail.modify");
    scope.add("https://www.googleapis.com/auth/calendar");
    scope.add("https://www.googleapis.com/auth/contacts");

    GoogleCreateConnectorSettings settings = new GoogleCreateConnectorSettings(
        "<GCP_CLIENT_ID>",
        "<GCP_CLIENT_SECRET>",
        ""
    );

    CreateConnectorRequest request = new CreateConnectorRequest.Google(settings, scope);

    nylas.connectors().create(request);
  }
}  

```

Each connector supports multiple credentials, letting you use different provider auth apps with a single connector. You can also set default scopes per connector and override them when creating individual grants.

For bulk setup and multi-app configurations, see [Bulk authentication grants](/docs/v3/auth/bulk-auth-grants/) and [Using multiple provider applications](/docs/v3/auth/using-multiple-provider-applications/).

## Add callback URIs to your Nylas application

Callback URIs are where Nylas redirects users after they complete authentication.

1. Log in to the [Nylas Dashboard](https://dashboard-v3.nylas.com/?utm_source=docs&utm_content=auth-with-nylas).
2. On your application's page, click **Hosted Authentication > Callback URIs** in the left navigation.
3. Click **Add a callback URI**.
4. Select the **platform** and enter a **URL**.
5. Click **Add callback URI**.

## Customize Hosted Authentication branding

[**Whitelabel Hosted Authentication**](/docs/v3/auth/whitelabeling/): replace the Nylas logo on the login page, and register a custom hostname so your own domain appears in the address bar during the OAuth flow.

## Handle expired grants

Grants can expire when users change passwords, revoke access, or when provider tokens are invalidated. Expired grants are recoverable through re-authentication, which preserves the grant ID, object IDs, and sync state. See [Handling expired grants](/docs/dev-guide/best-practices/grant-lifecycle/) for best practices on detection and recovery.