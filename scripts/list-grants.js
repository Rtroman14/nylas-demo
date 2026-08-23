/**
 * What this application can actually see: connected mailboxes and webhooks.
 *
 *   npm run grants
 *
 * The first thing to run when mail sends but no webhooks arrive. Nylas only
 * emits message.* events for mailboxes connected to THIS application as a
 * grant — mail sent from an unconnected account produces nothing.
 */
import Nylas from "../src/Nylas.js";
import config from "../src/config.js";

if (!config.apiKey) {
    console.error("Set NYLAS_API_KEY in .env first (Nylas dashboard -> API Keys).");
    process.exit(1);
}

console.log(`\nRegion: ${config.apiUri}\n`);

console.log("=== GRANTS (connected mailboxes) ===");
const grants = await Nylas.grants.list();

if (!grants.length) {
    console.log("  NONE.");
    console.log("  No grants means no message.* webhooks will ever fire. Connect a");
    console.log("  mailbox at http://localhost:3000 first.");
} else {
    for (const grant of grants) {
        console.log(`  ${grant.email ?? "(no email)"}`);
        console.log(`    id:       ${grant.id}`);
        console.log(`    provider: ${grant.provider}`);
        console.log(`    status:   ${grant.grantStatus}`);
        if (grant.grantStatus !== "valid") {
            console.log(`              ^ re-run the OAuth flow; do NOT delete the grant.`);
        }
    }
}

console.log("\n=== WEBHOOKS ===");
const webhooks = await Nylas.webhooks.list();

if (!webhooks.length) {
    console.log("  NONE registered. Run `npm run webhook:create -- <https-url>`.");
} else {
    for (const webhook of webhooks) {
        console.log(`  ${webhook.webhookUrl}`);
        console.log(`    id:       ${webhook.id}`);
        console.log(
            `    status:   ${webhook.status}${
                webhook.status !== "active" ? "   <-- not delivering" : ""
            }`
        );
        console.log(`    triggers: ${(webhook.triggerTypes ?? []).join(", ")}`);
    }
}

console.log("");
