/**
 * Register this server's webhook endpoint with Nylas.
 *
 *   npm run webhook:create -- https://your-tunnel.trycloudflare.com
 *
 * Pass the PUBLIC base URL; the script appends /webhooks/nylas.
 *
 * Your server and tunnel both have to be running before this: Nylas immediately
 * GETs the URL with a ?challenge= param and only creates the webhook if your
 * endpoint echoes it back within 10 seconds.
 *
 * Nylas does not re-verify a failed endpoint. If verification fails, fix the
 * problem and create a NEW webhook — the failed entry stays broken forever.
 *
 * Note: ngrok URLs are blocked by Nylas outright. Use cloudflared, VS Code port
 * forwarding, or Hookdeck.
 */
import Nylas from "../src/Nylas.js";
import config from "../src/config.js";

const input = process.argv[2];

if (!config.apiKey) {
    console.error("Set NYLAS_API_KEY in .env first.");
    process.exit(1);
}

if (!input) {
    console.error("Usage: npm run webhook:create -- https://your-tunnel-url");
    process.exit(1);
}

if (!input.startsWith("https://")) {
    console.error("The webhook URL must be public HTTPS. Nylas cannot reach localhost.");
    process.exit(1);
}

if (/ngrok/i.test(input)) {
    console.error("Nylas blocks ngrok URLs. Use cloudflared or VS Code port forwarding.");
    process.exit(1);
}

const webhookUrl = `${input.replace(/\/+$/, "")}/webhooks/nylas`;

console.log(`\n  Registering ${webhookUrl}`);
console.log(`  Triggers: ${Nylas.DEFAULT_TRIGGERS.join(", ")}\n`);

try {
    const webhook = await Nylas.webhooks.create({ webhookUrl });

    console.log("  Created.");
    console.log(`    id:     ${webhook.id}`);
    console.log(`    status: ${webhook.status}`);

    if (webhook.webhookSecret) {
        console.log(`\n  Add this to .env and restart the server:\n`);
        console.log(`    NYLAS_WEBHOOK_SECRET=${webhook.webhookSecret}\n`);
        console.log(`  This is the only time Nylas returns the secret.`);
    }
} catch (err) {
    console.error(`\n  Failed: ${err.message}\n`);
    console.error("  The usual cause is the challenge handshake not completing.");
    console.error("  Check that the server is running and the tunnel points at it:");
    console.error(`    curl "${webhookUrl}?challenge=test"   # must print: test`);
    process.exit(1);
}
