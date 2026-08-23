/**
 * Every environment-derived value in one place, so no other module reads
 * process.env directly and it's obvious what has to be configured.
 */
import "dotenv/config";

const bool = (value) => value === "true";

export const config = {
    port: Number(process.env.PORT) || 3000,

    // US is the default. EU applications must point at api.eu.nylas.com — a
    // grant created in one region does not exist in the other.
    apiKey: process.env.NYLAS_API_KEY || "",
    apiUri: process.env.NYLAS_API_URI || "https://api.us.nylas.com",

    // Hosted OAuth. clientId is the application's ID, not the API key.
    clientId: process.env.NYLAS_CLIENT_ID || "",
    callbackUri: process.env.NYLAS_CALLBACK_URI || "http://localhost:3000/oauth/callback",
    // Blank lets Nylas render its own provider picker.
    authProvider: process.env.NYLAS_AUTH_PROVIDER || "",

    webhookSecret: process.env.NYLAS_WEBHOOK_SECRET || "",
    requireValidSignature: bool(process.env.REQUIRE_VALID_SIGNATURE),

    // Escape hatch for scripts: pin a grant instead of running the OAuth flow.
    // A grant stored by the connect flow wins over this.
    fallbackGrantId: process.env.NYLAS_GRANT_ID || "",
};

/**
 * What's missing for a given capability. The UI and scripts use this to explain
 * what to configure instead of failing with an opaque 401 from the API.
 */
export function missingFor(capability) {
    const missing = [];

    if (!config.apiKey) missing.push("NYLAS_API_KEY");

    if (capability === "oauth") {
        if (!config.clientId) missing.push("NYLAS_CLIENT_ID");
        if (!config.callbackUri) missing.push("NYLAS_CALLBACK_URI");
    }

    return missing;
}

export default config;
