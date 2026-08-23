<!--
  Vendored from https://developer.nylas.com/docs/v3/auth/hosted-oauth-apikey.md
  Do not edit by hand — run `npm run docs:fetch` to refresh.
-->

# Creating grants with Hosted Authentication and an API key

Source: https://developer.nylas.com/docs/v3/auth/hosted-oauth-apikey/

Nylas supports Hosted OAuth to get the user's authorization for scopes and create their grant. You can then use their grant ID and your application-specific API key to access their data and make other requests. This allows you to use the same request method for everything in your project, including endpoints that don't specify a grant (for example, the webhook endpoints).

## How Hosted OAuth works


> **Info:** 
> 🔍 **Nylas creates only one grant per email address in each application**. If a user authenticates with your Nylas application using the email address associated with an existing grant, Nylas re-authenticates the grant instead of creating a new one.

1. The user clicks a link or button in your project to [start an authorization request](#start-an-authorization-request).
2. Nylas forwards the user to their provider where they complete the authorization flow.
3. [The provider directs the user to the Nylas callback URI](#accept-authorization-response) and includes URL parameters that indicate whether the authorization succeeded or failed, along with other information.
4. If the authorization succeeded, Nylas creates an unverified grant record.
5. Nylas forwards the user to your project's callback URI and includes the access `code` from the provider as a URL parameter.
6. Your project uses the `code` to [perform a token exchange with the provider](#exchange-code-for-access-token).
7. When the token exchange completes successfully, Nylas marks the grant record as verified and creates a grant ID for the user.

## Start an authorization request

The first step of the authentication process is to start an authorization request. Usually this is a button or link that the user clicks.

Your project redirects the user to the [authorization request endpoint](/docs/reference/api/authentication-apis/get_oauth2_flow/) and includes their information as a set of query parameters, as in the example below. When the user goes to this URL, Nylas starts a secure authentication session and redirects them to their provider's website.

If you've registered a custom hostname, swap `api.<region>.nylas.com` for it in this URL and everything else about the flow stays the same. See [whitelabel Hosted Authentication](/docs/v3/auth/whitelabeling/).

```bash
/v3/connect/auth?
  client_id=<NYLAS_CLIENT_ID>
  &redirect_uri=https://myapp.com/callback-handler  # Your application's callback URI.
  &response_type=code
  &access_type=online                               # Specifies not to generate a refresh token for the user.
  &provider=<PROVIDER>                              # (Optional) The connector Nylas will use to authenticate the user.
  &state=<STATE>
  &scope=<SCOPES>                                   # (Optional) A list of scopes to request from the user.
```

```js [authorization-Node.js SDK]


const config = {
  clientId: process.env.NYLAS_CLIENT_ID,
  callbackUri: "http://localhost:3000/oauth/exchange",
  apiKey: process.env.NYLAS_API_KEY,
  apiUri: process.env.NYLAS_API_URI,
};

const nylas = new Nylas({
  apiKey: config.apiKey,
  apiUri: config.apiUri,
});

const app = express();
const port = 3000;

// Route to initialize authentication
app.get("/nylas/auth", (req, res) => {
  const authUrl = nylas.auth.urlForOAuth2({
    clientId: config.clientId,
    provider: "google",
    redirectUri: config.callbackUri,
    loginHint: "email_to_connect",
  });

  res.redirect(authUrl);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
```

```python [authorization-Python SDK]
from dotenv import load_dotenv
load_dotenv()


from functools import wraps
from io import BytesIO
from flask import Flask, request, redirect
from nylas import Client

nylas = Client(
    os.environ.get("NYLAS_CLIENT_ID"),
    os.environ.get("NYLAS_API_URI")
)

REDIRECT_CLIENT_URI = 'http://localhost:9000/oauth/exchange'
flask_app = Flask(__name__)

CORS(flask_app, supports_credentials=True)
@flask_app.route("/nylas/generate-auth-url", methods=["GET"])

def build_auth_url():
  auth_url = nylas.auth.url_for_oauth2(
      config={
        "client_id": os.environ.get("NYLAS_CLIENT_ID"),
        "provider": 'google',
        "redirect_uri": REDIRECT_CLIENT_URI,
        "login_hint": "email_to_connect"
      }
  )

  return redirect(auth_url)
```

```ruby [authorization-Ruby SDK]
require 'nylas'
require 'sinatra'

nylas = Nylas::Client.new(api_key: "<NYLAS_API_KEY>")

get '/nylas/auth' do
  config = {
    client_id: "<NYLAS_CLIENT_ID>",
    provider: "google",
    redirect_uri: "http://localhost:4567/oauth/exchange",
    login_hint: "<email_to_connect>"
  }

  url = nylas.auth.url_for_oauth2(config)

  redirect url
end
```

```kt [authorization-Kotlin SDK]


fun main(args: Array<String>) {
  val nylas: NylasClient = NylasClient(apiKey = "<NYLAS_API_KEY>")
  val http: Http = ignite()

  http.get("/nylas/auth") {
    val scope = listOf("https://www.googleapis.com/auth/userinfo.email")

    val config : UrlForAuthenticationConfig = UrlForAuthenticationConfig(
        "<NYLAS_CLIENT_ID>",
        "http://localhost:4567/oauth/exchange",
        AccessType.ONLINE,
        AuthProvider.GOOGLE,
        Prompt.DETECT,
        scope,
        true,
        "sQ6vFQN",
        "<email_to_connect>"
    )

    val url = nylas.auth().urlForOAuth2(config)

    response.redirect(url)
  }
}
```

```java [authorization-Java SDK]


public class AuthRequest {
  public static void main(String[] args) throws NylasSdkTimeoutError, NylasApiError {
    NylasClient nylas = new NylasClient.Builder("<NYLAS_API_KEY>").build();

    get("/nylas/auth", (request, response) -> {
      List<String> scope = new ArrayList<>();
      scope.add("https://www.googleapis.com/auth/userinfo.email");

      UrlForAuthenticationConfig config = new UrlForAuthenticationConfig(
          "<NYLAS_CLIENT_ID>",
          "http://localhost:4567/oauth/exchange",
          AccessType.ONLINE,
          AuthProvider.GOOGLE,
          Prompt.DETECT,
          scope,
          true,
          "sQ6vFQN",
          "<email_to_connect>"
      );

      String url = nylas.auth().urlForOAuth2(config);

      response.redirect(url);

      return null;
    });
  }
}
```

Each provider displays their authorization consent and approval steps differently. The steps are visible only to the user.

> **Info:** 
> **If a user authenticates using their Google account, they might be directed to Google's authorization page twice**. This is a normal part of the Hosted OAuth flow, and it ensures that the user approves all necessary scopes.

### Pass user information in `state` parameter

Nylas Hosted OAuth supports the optional `state` parameter. If you include it in an authorization request, Nylas returns the unmodified value to your project. You can use this as a verification check, or to track information about the user that you need when creating a grant or logging them in.

For more information about the `state` parameter, see the [OAuth 2.0 specification](https://datatracker.ietf.org/doc/html/rfc6749) and the [official OAuth 2.0 documentation](https://www.oauth.com/oauth2-servers/authorization/the-authorization-request/).

## Accept authorization response

After the user completes the authorization process, their provider sends them to Nylas' redirect URI (`https://api.us.nylas.com/v3/connect/callback`) and includes URL parameters with information about the user. Nylas uses the information in the parameters to find your application using its client ID and, if the authentication succeeded, create an unverified grant record for the user.

Nylas then uses your application's callback URI to direct the user back to your project, along with the `code` it received from the provider.

```bash
https://myapp.com/callback-handler?code=<CODE>
```

If you specified a `state` in the initial authorization request, Nylas includes it as a URL parameter.

## Exchange `code` for access token

> **Warn:** 
> **The OAuth `code` is a unique, one-time-use credential**. This means that if your [`POST /v3/connect/token` request](/docs/reference/api/authentication-apis/exchange_oauth2_token/) fails, you'll need to restart the OAuth flow to generate a new `code`. If you try to pass the original `code` in another token exchange request, Nylas returns an error.

Make a [`POST /v3/connect/token` request](/docs/reference/api/authentication-apis/exchange_oauth2_token/) to exchange the user's `code` for an access token. Nylas returns an access token and other information about the user.

```bash
POST /token HTTP/1.1
Host: /v3/connect/token
Content-Type: application/json

{
  "client_id": "<NYLAS_CLIENT_ID>",
  "client_secret": "<NYLAS_API_KEY>",
  "grant_type": "authorization_code",
  "code": "<CODE>",
  "redirect_uri": "<CALLBACK_URI>",
  "code_verifier": "nylas"
}
```

```json [tokenExchange-Response (JSON)]
{
  "access_token": "<ACCESS_TOKEN>",
  "token_type": "Bearer",
  "id_token": "<ID_TOKEN>",
  "grant_id": "<NYLAS_GRANT_ID>"
}
```

```js [tokenExchange-Node.js SDK]
app.get("/oauth/exchange", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    res.status(400).send("No authorization code returned from Nylas");

    return;
  }

  try {
    const response = await nylas.auth.exchangeCodeForToken({
      clientId: config.clientId,
      redirectUri: config.callbackUri,
      code,
    });

    const { grantId } = response;

    res.status(200).send(grantId);
  } catch (error) {
    res.status(500).send("Failed to exchange authorization code for token");
  }
});
```

```python [tokenExchange-Python SDK]
@flask_app.route("/oauth/exchange", methods=["GET"])

def exchange_code_for_token():
  code_exchange_response = nylas.auth.exchange_code_for_token(
      request={
        "code": request.args.get('code'),
        "client_id": os.environ.get("NYLAS_CLIENT_ID"),
        "redirect_uri": REDIRECT_CLIENT_URI
      }
  )

  return {
    'grant_id': code_exchange_response.grant_id
  }
```

```ruby [tokenExchange-Ruby SDK]
get '/oauth/exchange' do
  code = params[:code]
  status 404 if code.nil?

  begin
    response = nylas.auth.exchange_code_for_token({
      client_id: '<NYLAS_CLIENT_ID>',
      redirect_uri: 'http://localhost:4567/oauth/exchange',
      code: code
    })
  rescue StandardError
    status 500
  else
    responde_data = response[:grant_id]
    "#{response_data}"
  end
end
```

```kt [tokenExchange-Kotlin SDK]
http.get("/oauth/exchange") {
  val code : String = request.queryParams("code")

  if(code == "") { response.status(401) }

  val codeRequest : CodeExchangeRequest = CodeExchangeRequest(
      "http://localhost:4567/oauth/exchange",
      code,
      "<NYLAS_CLIENT_ID>",
      "nylas"
  )

  try {
    val codeResponse : CodeExchangeResponse = nylas.auth().exchangeCodeForToken(codeRequest)

    codeResponse
  } catch (e : Exception) {
    e
  }
}
```

```java [tokenExchange-Java SDK]
get("/oauth/exchange", (request, response) -> {
  String code = request.queryParams("code");

  if(code == null) { response.status(401);}
  assert code != null;

  CodeExchangeRequest codeRequest = new CodeExchangeRequest(
      "http://localhost:4567/oauth/exchange",
      code,
      "<NYLAS_CLIENT_ID>",
      "nylas"
  );

  try {
    CodeExchangeResponse codeResponse = nylas.auth().exchangeCodeForToken(codeRequest);

    return "%s".formatted(codeResponse);
  } catch(Exception e) {
    return  "%s".formatted(e);
  }
});
```

Nylas marks the user's grant as verified and sends you their grant ID and email address.

> **Info:** 
> **You don't need to record the user's OAuth access token or any other OAuth information**. Nylas stores what it needs in the user's grant record.

## Verify your setup

After you complete the OAuth flow and receive a grant ID, verify that your authentication is working before building it into production code. The commands below use the [Nylas CLI](https://cli.nylas.com/) — install it first if you haven't already.

**List all connected grants to confirm the authentication succeeded** with [`nylas auth list`](https://cli.nylas.com/docs/commands/auth-list):

```bash
nylas auth list
```

**Test a simple API call with your grant ID and API key** using [`nylas email list`](https://cli.nylas.com/docs/commands/email-list):

```bash
nylas email list --limit 1
```

If both commands succeed, your grant is verified and ready to use. If you see errors, double-check that:
- Your `NYLAS_API_KEY` is set correctly in your environment
- The grant ID matches the one returned from the OAuth flow
- The user completed the authorization process successfully

## Make requests with API key

Now that you have a grant ID for your user, you can make requests on their behalf with your application's API key and their grant ID.

```bash
curl --compressed --request POST \
  --url 'https://api.us.nylas.com/v3/grants/<NYLAS_GRANT_ID>/events?calendar_id=<CALENDAR_ID>' \
  --header 'Accept: application/json' \
  --header 'Authorization: Bearer <NYLAS_API_KEY>' \
  --header 'Content-Type: application/json' \
  --data '{
    "title": "Annual Philosophy Club Meeting",
    "busy": true,
    "conferencing": {
        "provider": "Zoom Meeting",
        "autocreate": {
          "conf_grant_id": "<NYLAS_GRANT_ID>",
          "conf_settings": {
            "settings": {
              "join_before_host": true,
              "waiting_room": false,
              "mute_upon_entry": false,
              "auto_recording": "none"
            }
          }
        }
      },
    "participants": [
      {
        "name": "Leyah Miller",
        "email": "leyah@example.com"
      },
      {
        "name": "Nyla",
        "email": "nyla@example.com"
      }
    ],
    "resources": [{
      "name": "Conference room",
      "email": "conference-room@example.com"
    }],
    "description": "Come ready to talk philosophy!",
    "when": {
      "start_time": 1674604800,
      "end_time": 1722382420,
      "start_timezone": "America/New_York",
      "end_timezone": "America/New_York"
    },
    "location": "New York Public Library, Cave room",
    "recurrence": [
      "RRULE:FREQ=WEEKLY;BYDAY=MO",
      "EXDATE:20211011T000000Z"
  ],
}'

```

```js [useAPIKey-Node.js SDK]

import Nylas from "nylas";

const nylas = new Nylas({
  apiKey: "<NYLAS_API_KEY>",
  apiUri: "<NYLAS_API_URI>",
});

const now = Math.floor(Date.now() / 1000); // Time in Unix timestamp format (in seconds)

async function createAnEvent() {
  try {
    const event = await nylas.events.create({
      identifier: "<NYLAS_GRANT_ID>",
      requestBody: {
        title: "Build With Nylas",
        when: {
          startTime: now,
          endTime: now + 3600,
        },
      },
      queryParams: {
        calendarId: "<CALENDAR_ID>",
      },
    });

    console.log("Event:", event);
  } catch (error) {
    console.error("Error creating event:", error);
  }
}

createAnEvent();


```

```python [useAPIKey-Python SDK]

from nylas import Client

nylas = Client(
    "<NYLAS_API_KEY>",
    "<NYLAS_API_URI>"
)

grant_id = "<NYLAS_GRANT_ID>"

events = nylas.events.create(
  grant_id,
  request_body={
    "title": 'Build With Nylas',
    "when": {
      "start_time": 1609372800,
      "end_time": 1609376400
    },
  },
  query_params={
    "calendar_id": "<CALENDAR_ID>"
  }
)

print(events)

```

```ruby [useAPIKey-Ruby SDK]

require 'nylas'
require 'date'

nylas = Nylas::Client.new(api_key: "<NYLAS_API_KEY>")

query_params = {
  calendar_id: "<CALENDAR_ID>"
}

today = Date.today
start_time = Time.local(today.year, today.month, today.day, 13, 0, 0).to_i
end_time = Time.local(today.year, today.month, today.day, 13, 30, 0).to_i

request_body = {
  when: {
    start_time: start_time,
    end_time: end_time
  },
  title: "Let's learn some Nylas Ruby SDK!",
  location: "Nylas' Headquarters",
  description: "Using the Nylas API with the Ruby SDK is easy.",
  participants: [{
    name: "Blag",
    email: "atejada@gmail.com",
    status: 'noreply'
  }]
}

event, _request_id = nylas.events.create(
  identifier: "<NYLAS_GRANT_ID>",
  query_params: query_params,
  request_body: request_body
)

puts event


```

```kt [useAPIKey-Kotlin SDK]

import com.nylas.NylasClient
import com.nylas.models.*

import java.time.LocalDateTime
import java.time.ZoneOffset

fun main(args: Array<String>) {
  val nylas: NylasClient = NylasClient(apiKey = "<NYLAS_API_KEY>")
  var startDate = LocalDateTime.now()

  // Set the time. Because we're using UTC, we need to add the difference in hours from our own timezone.
  startDate = startDate.withHour(13);
  startDate = startDate.withMinute(0);
  startDate = startDate.withSecond(0);
  val endDate = startDate.withMinute(30);

  // Convert the dates from Unix timestamp format to integer.
  val iStartDate: Int = startDate.toEpochSecond(ZoneOffset.UTC).toInt()
  val iEndDate: Int = endDate.toEpochSecond(ZoneOffset.UTC).toInt()

  // Create the timespan for the event.
  val eventWhenObj: CreateEventRequest.When = CreateEventRequest.When.
  Timespan(iStartDate, iEndDate);

  // Define the title, location, and description of the event.
  val title: String = "Let's learn about the Nylas Kotlin/Java SDK!"
  val location: String = "Blag's Den!"
  val description: String = "Using the Nylas API with the Kotlin/Java SDK is easy."

  // Create the list of participants.
  val participants: List<CreateEventRequest.Participant> = listOf(CreateEventRequest.
      Participant("<PARTICIPANT_EMAIL>", ParticipantStatus.NOREPLY, "<PARTICIPANT_NAME>"))

  // Create the event request. This adds date/time, title, location, description, and participants.
  val eventRequest: CreateEventRequest = CreateEventRequest(eventWhenObj, title, location, description, participants)

  // Set the event parameters.
  val eventQueryParams: CreateEventQueryParams = CreateEventQueryParams("<CALENDAR_ID>")

  val event: Response<Event> = nylas.events().create("<NYLAS_GRANT_ID>",
      eventRequest, eventQueryParams)
}

```

```java [useAPIKey-Java SDK]

import com.nylas.NylasClient;
import com.nylas.models.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.*;

public class create_calendar_events {
  public static void main(String[] args) throws NylasSdkTimeoutError, NylasApiError {
    NylasClient nylas = new NylasClient.Builder("<NYLAS_API_KEY>").build();

    // Get today's date
    LocalDate today = LocalDate.now();

    // Set time. Because we're using UTC we need to add the hours in difference from our own timezone.
    Instant sixPmUtc = today.atTime(13, 0).toInstant(ZoneOffset.UTC);

    // Set the date and time for the event. We add 30 minutes to the starting time.
    Instant sixPmUtcPlus = sixPmUtc.plus(30, ChronoUnit.MINUTES);

    // Get the Date and Time as a Unix timestamp
    long startTime = sixPmUtc.getEpochSecond();
    long endTime = sixPmUtcPlus.getEpochSecond();

    // Define title, location, and description of the event
    String title = "Let's learn some about the Nylas Java SDK!";
    String location = "Nylas Headquarters";
    String description = "Using the Nylas API with the Java SDK is easy.";

    // Create the timespan for the event
    CreateEventRequest.When.Timespan timespan = new CreateEventRequest.
        When.Timespan.
        Builder(Math.toIntExact(startTime), Math.toIntExact(endTime)).
        build();

    // Create the list of participants.
    List<CreateEventRequest.Participant> participants_list = new ArrayList<>();

    participants_list.add(new CreateEventRequest.
        Participant("johndoe@example.com", ParticipantStatus.NOREPLY,
        "John Doe", "", ""));

    // Build the event details.
    CreateEventRequest createEventRequest = new CreateEventRequest.Builder(timespan)
        .participants(participants_list)
        .title(title)
        .location(location)
        .description(description)
        .build();

    // Build the event parameters. In this case, the Calendar ID.
    CreateEventQueryParams createEventQueryParams = new CreateEventQueryParams.Builder("<CALENDAR_ID>").build();

    // Create the event itself
    Event event = nylas.events().create(
        "<NYLAS_GRANT_ID>",
        createEventRequest,
        createEventQueryParams).getData();
  }
}

```