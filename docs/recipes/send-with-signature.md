# Send an email with a signature

Working code: `signatures` in [`src/Nylas.js`](../../src/Nylas.js), wired to the
signature picker in [`src/routes/email.js`](../../src/routes/email.js).

## The thing to understand first

**Nylas does not read the signature already configured in Gmail or Outlook.** It
never syncs provider-side signatures. Mail sent through the API gets no signature at
all unless you create one in Nylas and ask for it by ID.

If you need a user's real signature, they have to re-create it through this API.

## Create a signature

```js
// The SDK has no signatures resource; go through the HTTP client.
const created = await nylas.apiClient.request({
    method: "POST",
    path: `/v3/grants/${grantId}/signatures`,
    body: {
        name: "Sales signature",
        body: `<p style="font-family:Arial,sans-serif;font-size:13px;color:#444;">
                 <strong>Jane Doe</strong><br>Acme Roofing<br>
                 <a href="mailto:jane@acme.com">jane@acme.com</a>
               </p>`,
    },
});

const signatureId = created.data.id;
```

Endpoints, all grant-scoped:

| Operation | Method | Path |
| --- | --- | --- |
| Create | POST | `/v3/grants/{grant_id}/signatures` |
| List | GET | `/v3/grants/{grant_id}/signatures` |
| Get | GET | `/v3/grants/{grant_id}/signatures/{id}` |
| Update | PUT | `/v3/grants/{grant_id}/signatures/{id}` |
| Delete | DELETE | `/v3/grants/{grant_id}/signatures/{id}` |

## Apply it

Pass the ID and Nylas appends the HTML server-side, after the body and after any
quoted text on a reply:

```js
await nylas.messages.send({
    identifier: grantId,
    requestBody: {
        to: [{ email: "someone@example.com" }],
        subject: "Following up",
        body: "<p>Just checking in.</p>",
        signatureId,
    },
});
```

Do **not** concatenate the signature HTML into the body yourself. Letting Nylas
append it keeps the signature out of your body content, which matters when you later
want to change it or strip it.

`signatureId` is accepted on exactly three endpoints:

- `POST /v3/grants/{id}/messages/send`
- `POST /v3/grants/{id}/drafts`
- `POST /v3/grants/{id}/drafts/{draft_id}`

## Constraints

| Constraint | Value |
| --- | --- |
| Signatures per grant | 10 |
| Size per signature | 100KB |
| Signatures per message | 1 |
| Body format | HTML only |
| Images | External hosted URLs only — Nylas hosts nothing |

Two behaviors that surprise people:

- **There is no default signature.** Omit `signatureId` and nothing is appended.
  Pass it on every send where you want one.
- **A plaintext body gets no signature.** Silently. If a signature is not appearing,
  check that the body is HTML before checking anything else.

## Drafts behave differently

On `messages/send`, Nylas appends the signature at send time and it never touches
your body. On **drafts**, the signature HTML is inserted into the draft body when the
draft is created.

That means switching signatures on an existing draft is your problem: strip the old
HTML out of the body yourself, then pass the new `signatureId`. Nylas will not remove
it for you, and passing a second ID just appends a second signature.

## Reference

- [email-signatures.md](../reference/email-signatures.md)
- [api-signatures.md](../reference/api-signatures.md)
