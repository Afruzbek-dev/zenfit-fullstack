import { query, queryOne } from "../db.js";

/**
 * Admin-editable settings, cached per process.
 *
 * These are read on nearly every premium screen but change perhaps twice a
 * year, so a short TTL keeps a serverless invocation from paying for the round
 * trip while still picking up an admin edit quickly.
 */
const TTL_MS = 60_000;
let cache = null;
let cachedAt = 0;

export const SETTING_KEYS = [
  "payment_card_number",
  "payment_card_holder",
  "payment_card_bank",
  "payment_instructions",
  "admin_chat_id",
];

export async function getSettings({ fresh = false } = {}) {
  if (!fresh && cache && Date.now() - cachedAt < TTL_MS) return cache;

  const rows = await query("SELECT key, value FROM app_settings");
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  cache = Object.fromEntries(SETTING_KEYS.map((k) => [k, map[k] ?? null]));
  cachedAt = Date.now();
  return cache;
}

export async function setSettings(patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (!SETTING_KEYS.includes(key)) continue;
    const clean = value === null || value === "" ? null : String(value).slice(0, 500);
    await query(
      `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = now()`,
      [key, clean]
    );
  }
  cache = null;
  return getSettings({ fresh: true });
}

/** Where receipt screenshots are pushed. Falls back to the env var. */
export async function getAdminChatId() {
  const settings = await getSettings();
  return settings.admin_chat_id || process.env.ADMIN_CHAT_ID || null;
}

/** True once a card has been configured, which is what gates the manual flow. */
export async function manualPaymentReady() {
  const s = await getSettings();
  return Boolean(s.payment_card_number);
}

export async function getSetting(key) {
  const row = await queryOne("SELECT value FROM app_settings WHERE key = $1", [key]);
  return row?.value ?? null;
}
