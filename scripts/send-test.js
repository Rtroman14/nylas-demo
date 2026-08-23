/**
 * Send a real email through Nylas from the command line.
 *
 *   npm run send:test -- someone@example.com
 *   npm run send:test -- someone@example.com ./invoice.pdf
 *
 * Exercises the three things worth proving end-to-end: an HTML body, a file
 * attachment, and a stored signature applied server-side. It then prints the
 * reply command so you can continue the thread.
 */
import fs from "node:fs";
import crypto from "node:crypto";
import Nylas from "../src/Nylas.js";
import store from "../src/store.js";
import config from "../src/config.js";

const [to, attachmentPath] = process.argv.slice(2);

if (!config.apiKey) {
    console.error("Set NYLAS_API_KEY in .env first.");
    process.exit(1);
}

if (!to) {
    console.error("Usage: npm run send:test -- someone@example.com [./file.pdf]");
    process.exit(1);
}

// Pick up the mailbox the connect flow stored, so this matches what the UI uses.
const saved = store.getGrant();
if (saved) Nylas.setActiveGrant(saved.grantId);

if (!Nylas.currentGrantId()) {
    console.error("No mailbox connected. Open http://localhost:3000 and connect one,");
    console.error("or set NYLAS_GRANT_ID in .env.");
    process.exit(1);
}

// Signatures are HTML-only, so the body has to be HTML for one to apply.
const body = `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #111;">
  <p>Hi there,</p>
  <p>This message was sent through the Nylas Email API.</p>
  ${attachmentPath ? "<p>The attachment is included with this email.</p>" : ""}
  <p>Reply to it and the demo server will detect the reply on this thread.</p>
</div>`;

const attachments = [];
if (attachmentPath) {
    if (!fs.existsSync(attachmentPath)) {
        console.error(`No such file: ${attachmentPath}`);
        process.exit(1);
    }
    attachments.push(Nylas.attachments.fromFile(attachmentPath));
}

// Use the first stored signature if the grant has one.
let signatureId;
try {
    const [first] = await Nylas.signatures.list();
    signatureId = first?.id;
    if (first) console.log(`  Applying signature "${first.name}" (${first.id})`);
} catch {
    // Signatures are optional; a grant without any is a normal state.
}

console.log(`  Sending to ${to}...\n`);

const sent = await Nylas.messages.send({
    to,
    subject: "Nylas Email API test",
    body,
    attachments,
    signatureId,
    trackingOptions: { opens: true, links: true, threadReplies: true },
    // Guards against a double-run sending twice within the hour.
    idempotencyKey: crypto.randomUUID(),
});

// Track it so an inbound reply is recognized by the webhook handler.
store.trackThread(sent.threadId, { messageId: sent.id, to, subject: sent.subject });

console.log("  Sent.");
console.log(`    message id: ${sent.id}`);
console.log(`    thread id:  ${sent.threadId}`);
console.log(`    from:       ${(sent.from ?? []).map((a) => a.email).join(", ")}`);
if (attachments.length) {
    console.log(`    attached:   ${attachments.map((a) => a.filename).join(", ")}`);
}

console.log(`\n  Thread is now tracked. Reply to this email and watch the demo UI.`);
console.log(`\n  Reply from here instead with:`);
console.log(
    `    curl -X POST http://localhost:${config.port}/api/reply \\\n` +
        `      -H 'Content-Type: application/json' \\\n` +
        `      -d '{"messageId":"${sent.id}","body":"Following up."}'\n`
);
