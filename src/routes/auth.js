/**
 * The mailbox connect/disconnect flow, using Nylas hosted OAuth.
 *
 *   GET  /auth/connect     -> redirect the user to their provider
 *   GET  /oauth/callback   -> exchange the returned code for a grant
 *   POST /auth/disconnect  -> delete the grant
 *   GET  /api/grant        -> what the UI polls to render connection state
 *
 * Note this is hosted OAuth, not Nylas Connect. Nylas Connect is a browser SDK
 * that sits on top of an existing identity provider (Auth0, Clerk, Okta); it
 * does not apply to a server-side flow like this one.
 */
import crypto from "node:crypto";
import express from "express";
import Nylas from "../Nylas.js";
import store from "../store.js";
import feed from "../events.js";
import config, { missingFor } from "../config.js";

const router = express.Router();

/**
 * Outstanding OAuth `state` values.
 *
 * State is a CSRF guard: we generate it, hand it to Nylas, and Nylas returns it
 * unmodified on the callback. A callback carrying a state we never issued did
 * not originate from a flow we started. In-memory is fine here because a flow
 * that outlives a restart is a flow the user abandoned.
 */
const pendingStates = new Map();
const STATE_TTL_MS = 10 * 60 * 1000;

const issueState = () => {
    const state = crypto.randomBytes(16).toString("hex");
    pendingStates.set(state, Date.now());

    for (const [key, at] of pendingStates) {
        if (Date.now() - at > STATE_TTL_MS) pendingStates.delete(key);
    }

    return state;
};

const claimState = (state) => {
    if (!state || !pendingStates.has(state)) return false;
    pendingStates.delete(state);
    return true;
};

/** Start the flow. */
router.get("/auth/connect", (req, res) => {
    const missing = missingFor("oauth");
    if (missing.length) {
        return res
            .status(400)
            .type("text/plain")
            .send(
                `Cannot start OAuth. Missing: ${missing.join(", ")}.\n\n` +
                    `Set these in .env, then restart. See .env.example.`
            );
    }

    try {
        const url = Nylas.auth.urlFor({
            provider: req.query.provider,
            loginHint: req.query.login_hint,
            state: issueState(),
        });

        feed.push("auth", "Redirecting to provider for authorization");
        res.redirect(url);
    } catch (err) {
        feed.push("error", `Could not build auth URL: ${err.message}`);
        res.status(500).type("text/plain").send(err.message);
    }
});

/**
 * Where the user lands after consenting.
 *
 * The `code` is single-use: if the exchange fails, the flow has to start over
 * rather than retry with the same code.
 */
router.get("/oauth/callback", async (req, res) => {
    const { code, state, error, error_description: errorDescription } = req.query;

    if (error) {
        feed.push("error", `Authorization denied: ${error}`, { errorDescription });
        return res.redirect(`/?error=${encodeURIComponent(errorDescription || error)}`);
    }

    if (!claimState(state)) {
        feed.push("error", "Callback carried an unrecognized state value; ignoring.");
        return res.redirect("/?error=Invalid+or+expired+state");
    }

    try {
        const grant = await Nylas.auth.exchangeCode(code);

        store.saveGrant(grant);
        Nylas.setActiveGrant(grant.grantId);

        feed.push("auth", `Connected ${grant.email}`, grant);
        res.redirect("/?connected=1");
    } catch (err) {
        feed.push("error", `Token exchange failed: ${err.message}`);
        res.redirect(`/?error=${encodeURIComponent(err.message)}`);
    }
});

/**
 * Disconnect.
 *
 * This deletes the grant, which permanently removes everything Nylas synced for
 * that mailbox. That is correct for a user asking to disconnect, and wrong as a
 * fix for an auth error — re-run the OAuth flow for that instead, which
 * refreshes the existing grant and keeps its data.
 */
router.post("/auth/disconnect", async (req, res) => {
    const grant = store.getGrant();
    if (!grant) return res.status(400).json({ ok: false, error: "No mailbox connected." });

    try {
        await Nylas.grants.remove(grant.grantId);
        feed.push("auth", `Disconnected ${grant.email}`);
    } catch (err) {
        // A grant already gone on Nylas' side shouldn't strand the local copy.
        feed.push("error", `Remote grant delete failed (clearing locally): ${err.message}`);
    }

    store.clearGrant();
    Nylas.setActiveGrant("");
    res.json({ ok: true });
});

/** Connection state for the UI. */
router.get("/api/grant", (_req, res) => {
    const grant = store.getGrant();

    res.json({
        connected: Boolean(grant || config.fallbackGrantId),
        grant,
        // Present when NYLAS_GRANT_ID pins a mailbox instead of the OAuth flow.
        pinnedGrantId: grant ? null : config.fallbackGrantId || null,
        missing: {
            api: missingFor("api"),
            oauth: missingFor("oauth"),
        },
        callbackUri: config.callbackUri,
        provider: config.authProvider || "(Nylas provider picker)",
    });
});

export default router;
