/**
 * Vercel serverless entry point.
 *
 * Vercel discovers functions under `api/`, so this file re-exports the Express
 * app. `src/server.js` detects the VERCEL env var and skips app.listen(),
 * leaving the exported handler for the platform to invoke.
 */
export { default } from "../src/server.js";
