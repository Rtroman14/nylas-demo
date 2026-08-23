/**
 * Nylas email demo server.
 *
 *   npm run dev   ->  http://localhost:3000
 *
 * Three things live here: the connect flow (routes/auth.js), the webhook
 * listener (routes/webhooks.js), and the email operations the UI drives
 * (routes/email.js). All the actual Nylas calls are in Nylas.js.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import config, { missingFor } from "./config.js";
import Nylas from "./Nylas.js";
import store from "./store.js";
import authRoutes from "./routes/auth.js";
import webhookRoutes from "./routes/webhooks.js";
import emailRoutes from "./routes/email.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

/**
 * Capture the exact bytes of the request body.
 *
 * The webhook signature is an HMAC over the raw payload, so re-serializing the
 * parsed JSON would change the bytes and break verification. This has to run
 * before any handler reads req.body.
 */
app.use(
    express.json({
        limit: "2mb", // Nylas caps notification payloads at 1MB.
        verify: (req, _res, buf) => {
            req.rawBody = buf;
        },
    })
);
app.use(express.urlencoded({ extended: true }));

app.use(authRoutes);
app.use(webhookRoutes);
app.use(emailRoutes);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use(express.static(path.join(__dirname, "public")));

// Log anything hitting a path we don't serve — a typo in the webhook URL
// registered with Nylas shows up here instead of failing silently.
app.use((req, res) => {
    console.log(`Unhandled ${req.method} ${req.originalUrl}`);
    res.status(404).send("Not found");
});

// Restore the connected mailbox from the last run so a restart doesn't require
// reconnecting.
const saved = store.getGrant();
if (saved) Nylas.setActiveGrant(saved.grantId);

app.listen(config.port, () => {
    const missing = missingFor("oauth");

    console.log(`\n  Nylas email demo -> http://localhost:${config.port}`);
    console.log(`  Webhook path      /webhooks/nylas`);
    console.log(`  API region        ${config.apiUri}`);
    console.log(
        `  Signature check   ${
            config.webhookSecret
                ? `on (enforced=${config.requireValidSignature})`
                : "off (NYLAS_WEBHOOK_SECRET not set)"
        }`
    );
    console.log(
        `  Mailbox           ${
            saved ? `${saved.email} (${saved.grantId})` : "none connected — open / to connect"
        }`
    );

    if (missing.length) {
        console.log(`\n  Not configured: ${missing.join(", ")}`);
        console.log(`  Copy .env.example to .env and fill these in. See docs/README.md.`);
    }

    console.log("");
});

export default app;
