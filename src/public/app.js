/**
 * Demo UI. Plain modules, no build step — what you read here is what runs.
 */

const $ = (selector) => document.querySelector(selector);

const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

const time = (iso) => new Date(iso).toLocaleTimeString([], { hour12: false });

/* ------------------------------------------------------------ mailbox --- */

const renderMailbox = (state) => {
    const status = $("#connection");
    const body = $("#mailbox-body");

    // Nothing works without an API key, so say that before anything else.
    if (state.missing.api.length) {
        status.innerHTML = `<span class="status status-off">Not configured</span>`;
        body.innerHTML = `
            <p class="muted">Missing required configuration:</p>
            <ul class="setup-list">
                ${state.missing.api.map((key) => `<li><code>${escapeHtml(key)}</code></li>`).join("")}
            </ul>
            <p class="muted">Copy <code>.env.example</code> to <code>.env</code>, fill these in, and restart.</p>`;
        return;
    }

    if (state.connected) {
        const grant = state.grant;
        status.innerHTML = `<span class="status status-on">Connected</span>`;

        body.innerHTML = grant
            ? `<dl class="kv">
                   <dt>Email</dt><dd>${escapeHtml(grant.email)}</dd>
                   <dt>Provider</dt><dd>${escapeHtml(grant.provider ?? "—")}</dd>
                   <dt>Grant ID</dt><dd>${escapeHtml(grant.grantId)}</dd>
                   <dt>Since</dt><dd>${escapeHtml(new Date(grant.connectedAt).toLocaleString())}</dd>
               </dl>
               <button id="disconnect" class="secondary">Disconnect this mailbox</button>
               <p class="hint">Disconnecting deletes the grant and everything Nylas synced for it.</p>`
            : `<dl class="kv">
                   <dt>Grant ID</dt><dd>${escapeHtml(state.pinnedGrantId)}</dd>
               </dl>
               <p class="hint">Pinned by <code>NYLAS_GRANT_ID</code> rather than the connect flow.</p>`;

        $("#disconnect")?.addEventListener("click", disconnect);
        return;
    }

    status.innerHTML = `<span class="status status-off">Not connected</span>`;

    if (state.missing.oauth.length) {
        body.innerHTML = `
            <p class="muted">The connect flow needs more configuration:</p>
            <ul class="setup-list">
                ${state.missing.oauth.map((key) => `<li><code>${escapeHtml(key)}</code></li>`).join("")}
            </ul>
            <p class="muted">
                Also register <code>${escapeHtml(state.callbackUri)}</code> as a callback URI on
                your application in the Nylas dashboard.
            </p>`;
        return;
    }

    body.innerHTML = `
        <p class="muted">Connect a mailbox to send and receive mail through Nylas.</p>
        <a class="button-link" href="/auth/connect">Connect a mailbox</a>
        <p class="hint">
            Provider: ${escapeHtml(state.provider)} &middot;
            returns to <code>${escapeHtml(state.callbackUri)}</code>
        </p>`;
};

const loadMailbox = async () => {
    try {
        renderMailbox(await (await fetch("/api/grant")).json());
    } catch {
        $("#connection").innerHTML = `<span class="status status-off">Server unreachable</span>`;
    }
};

const disconnect = async () => {
    if (!confirm("Delete this grant? Nylas removes all synced data for the mailbox.")) return;

    const button = $("#disconnect");
    button.disabled = true;
    button.textContent = "Disconnecting…";

    await fetch("/auth/disconnect", { method: "POST" });
    await Promise.all([loadMailbox(), loadThreads()]);
};

/* --------------------------------------------------------- signatures --- */

const loadSignatures = async () => {
    const select = $("#signature-select");

    try {
        const { ok, signatures } = await (await fetch("/api/signatures")).json();
        if (!ok) return;

        select.innerHTML =
            `<option value="">None</option>` +
            signatures
                .map((s) => `<option value="${escapeHtml(s.id)}">${escapeHtml(s.name)}</option>`)
                .join("");
    } catch {
        // No mailbox connected yet — the "None" option is the correct state.
    }
};

const createDemoSignature = async () => {
    const name = prompt("Signature name:", "Demo signature");
    if (!name) return;

    const res = await fetch("/api/signatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name,
            body: `<p style="font-family:Arial,sans-serif;font-size:13px;color:#444;">
                     <strong>${escapeHtml(name)}</strong><br>Sent with the Nylas Email API
                   </p>`,
        }),
    });

    const data = await res.json();
    if (!data.ok) return alert(`Could not create signature: ${data.error}`);

    await loadSignatures();
    $("#signature-select").value = data.signature.id;
};

/* --------------------------------------------------------------- send --- */

const send = async (event) => {
    event.preventDefault();

    const form = event.target;
    const button = form.querySelector("button[type=submit]");
    const result = $("#send-result");

    button.disabled = true;
    button.textContent = "Sending…";
    result.hidden = true;

    try {
        // FormData so the file rides along; the route accepts multipart.
        const res = await fetch("/api/send", { method: "POST", body: new FormData(form) });
        const data = await res.json();

        result.hidden = false;
        result.className = `result ${data.ok ? "result-ok" : "result-bad"}`;
        result.textContent = data.ok
            ? `Sent. message ${data.messageId} on thread ${data.threadId}` +
              (data.attachments?.length ? ` with ${data.attachments.join(", ")}` : "")
            : `Failed: ${data.error}`;

        if (data.ok) loadThreads();
    } catch (err) {
        result.hidden = false;
        result.className = "result result-bad";
        result.textContent = `Failed: ${err.message}`;
    } finally {
        button.disabled = false;
        button.textContent = "Send";
    }
};

/* ------------------------------------------------------------ threads --- */

const loadThreads = async () => {
    const container = $("#threads");

    try {
        const { threads } = await (await fetch("/api/threads")).json();

        if (!threads.length) {
            container.innerHTML = `<p class="muted">Nothing sent yet.</p>`;
            return;
        }

        container.innerHTML = threads
            .map(
                (thread) => `
                <div class="thread">
                    <p class="thread-subject">
                        ${escapeHtml(thread.subject ?? "(no subject)")}
                        ${
                            thread.replyCount
                                ? `<span class="badge">${thread.replyCount} repl${
                                      thread.replyCount === 1 ? "y" : "ies"
                                  }</span>`
                                : ""
                        }
                    </p>
                    <div class="thread-meta">
                        ${thread.to ? `to ${escapeHtml(thread.to)}<br>` : ""}
                        thread ${escapeHtml(thread.threadId)}
                    </div>
                </div>`
            )
            .join("");
    } catch {
        container.innerHTML = `<p class="muted">Could not load threads.</p>`;
    }
};

/* ------------------------------------------------------------- events --- */

const eventHtml = (event) => `
    <div class="event event-${escapeHtml(event.kind)}">
        <span class="event-time">${time(event.at)}</span>
        <span class="event-kind">${escapeHtml(event.kind)}</span>
        <span class="event-summary">${escapeHtml(event.summary)}</span>
        ${
            event.detail && Object.keys(event.detail).length
                ? `<details>
                       <summary>payload</summary>
                       <pre>${escapeHtml(JSON.stringify(event.detail, null, 2))}</pre>
                   </details>`
                : ""
        }
    </div>`;

const addEvent = (event) => {
    const container = $("#events");
    if (container.querySelector(".muted")) container.innerHTML = "";

    container.insertAdjacentHTML("afterbegin", eventHtml(event));

    // A reply changes the thread list, and it's the whole point of the demo.
    if (event.kind === "reply" || event.kind === "sent") loadThreads();
    if (event.kind === "auth") loadMailbox();
};

const loadEvents = async () => {
    const container = $("#events");
    const { events } = await (await fetch("/api/events")).json();

    container.innerHTML = events.length
        ? events.map(eventHtml).join("")
        : `<p class="muted">Waiting for activity…</p>`;
};

/** Live feed. EventSource reconnects on its own, so this needs no retry logic. */
const openStream = () => {
    const pill = $("#stream-status");
    const stream = new EventSource("/api/events/stream");

    stream.onopen = () => {
        pill.textContent = "live";
        pill.className = "pill pill-on";
    };

    stream.onmessage = (message) => addEvent(JSON.parse(message.data));

    stream.onerror = () => {
        pill.textContent = "reconnecting";
        pill.className = "pill pill-off";
    };
};

/* --------------------------------------------------------------- init --- */

const showBanner = () => {
    const params = new URLSearchParams(location.search);
    const error = params.get("error");
    const connected = params.get("connected");

    if (!error && !connected) return;

    const banner = $("#banner");
    banner.hidden = false;
    banner.className = `banner ${error ? "banner-error" : "banner-good"}`;
    banner.textContent = error ? `Connection failed: ${error}` : "Mailbox connected.";

    history.replaceState({}, "", location.pathname);
};

showBanner();
$("#send-form").addEventListener("submit", send);
$("#create-signature").addEventListener("click", createDemoSignature);

await Promise.all([loadMailbox(), loadThreads(), loadEvents(), loadSignatures()]);
openStream();
