/**
 * Idempotent schema migration.
 *
 * Run against whichever database the environment points at:
 *   node --env-file=.env scripts/migrate.js
 *
 * Every statement is safe to re-run, so this can be applied to production
 * without tracking which migrations have already gone out.
 */

import { initDb, query, usingPostgres } from "../src/db.js";

/** Postgres understands ADD COLUMN IF NOT EXISTS; SQLite needs a lookup first. */
async function addColumn(table, column, pgType, sqliteType) {
  if (usingPostgres) {
    await query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${pgType}`);
    return;
  }
  const cols = await query(`PRAGMA table_info(${table})`);
  if (cols.some((c) => c.name === column)) return;
  await query(`ALTER TABLE ${table} ADD COLUMN ${column} ${sqliteType}`);
}

const TS = () => (usingPostgres ? "TIMESTAMPTZ NOT NULL DEFAULT now()" : "TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))");
const ID = () => (usingPostgres ? "BIGSERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT");
const FK = () => (usingPostgres ? "BIGINT" : "INTEGER");
const BOOL = (def) => (usingPostgres ? `BOOLEAN NOT NULL DEFAULT ${def}` : `INTEGER NOT NULL DEFAULT ${def ? 1 : 0}`);

async function run() {
  await initDb();
  console.log(`[migrate] ${usingPostgres ? "Postgres" : "SQLite"} ustida ishlamoqda`);

  /* ----- profile photo -------------------------------------------------- */
  // Stored as a data URI (client resizes to 256px before upload) so the app
  // needs no object storage; Telegram's photo_url is used as the default.
  await addColumn("users", "avatar_url", "TEXT", "TEXT");

  /* ----- profile settings ----------------------------------------------- */
  await addColumn("profiles", "display_name", "TEXT", "TEXT");
  await addColumn("profiles", "language", "TEXT DEFAULT 'uz'", "TEXT DEFAULT 'uz'");
  await addColumn("profiles", "theme", "TEXT DEFAULT 'dark'", "TEXT DEFAULT 'dark'");
  await addColumn("profiles", "notif_workout", BOOL(true), BOOL(true));
  await addColumn("profiles", "notif_meal", BOOL(true), BOOL(true));
  await addColumn("profiles", "notif_water", BOOL(false), BOOL(false));
  await addColumn("profiles", "notif_tips", BOOL(true), BOOL(true));

  /* ----- free activities / cardio --------------------------------------- */
  await query(`
    CREATE TABLE IF NOT EXISTS activities (
      id           ${ID()},
      user_id      ${FK()} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_id  TEXT NOT NULL,
      name         TEXT NOT NULL,
      emoji        TEXT,
      duration_min INTEGER NOT NULL,
      distance_km  REAL,
      intensity    TEXT,
      kcal         INTEGER NOT NULL DEFAULT 0,
      note         TEXT,
      logged_at    ${TS()}
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities(user_id, logged_at DESC)`);

  /* ----- purchase history ----------------------------------------------- */
  await query(`
    CREATE TABLE IF NOT EXISTS payments (
      id          ${ID()},
      user_id     ${FK()} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider    TEXT NOT NULL,
      plan_id     TEXT NOT NULL,
      plan_title  TEXT,
      amount_uzs  INTEGER NOT NULL,
      status      TEXT NOT NULL DEFAULT 'pending',
      external_id TEXT,
      card_last4  TEXT,
      created_at  ${TS()},
      paid_at     ${usingPostgres ? "TIMESTAMPTZ" : "TEXT"}
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_payments_user_date ON payments(user_id, created_at DESC)`);

  /* ----- saved cards ----------------------------------------------------- *
   * Only the provider's token and the masked tail are ever stored. A raw card
   * number must never reach this service — see routes/payment.js.
   * ---------------------------------------------------------------------- */
  await query(`
    CREATE TABLE IF NOT EXISTS payment_cards (
      id         ${ID()},
      user_id    ${FK()} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider   TEXT NOT NULL,
      token      TEXT NOT NULL,
      brand      TEXT,
      last4      TEXT,
      expiry     TEXT,
      is_default ${BOOL(false)},
      created_at ${TS()}
    )
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_cards_user ON payment_cards(user_id, created_at DESC)`);

  /* ----- admin-editable settings ---------------------------------------- *
   * Key/value rather than columns: the payment card details change without a
   * deploy, and adding a new setting should not mean another migration.
   * ---------------------------------------------------------------------- */
  await query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key        TEXT PRIMARY KEY,
      value      TEXT,
      updated_at ${TS()}
    )
  `);

  /* ----- manual (card transfer) payments -------------------------------- *
   * Until a payment provider is live, users transfer to a card and upload a
   * receipt. The screenshot is pushed to the admin's Telegram chat and only
   * its file_id is stored, so no object storage is involved.
   * ---------------------------------------------------------------------- */
  await addColumn("payments", "method", "TEXT DEFAULT 'provider'", "TEXT DEFAULT 'provider'");
  await addColumn("payments", "receipt_file_id", "TEXT", "TEXT");
  await addColumn("payments", "receipt_note", "TEXT", "TEXT");
  await addColumn("payments", "reviewed_at", usingPostgres ? "TIMESTAMPTZ" : "TEXT", "TEXT");
  await addColumn("payments", "reviewed_by", "TEXT", "TEXT");
  await addColumn("payments", "reject_reason", "TEXT", "TEXT");
  await query(`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status, created_at DESC)`);

  /* ----- lock the new tables down --------------------------------------- *
   * Every existing table has RLS on with zero policies, which denies the anon
   * and authenticated Supabase roles outright. The backend connects as the
   * table owner and bypasses RLS, so the new tables must match that posture —
   * otherwise they would be the only ones readable with a public API key.
   * ---------------------------------------------------------------------- */
  if (usingPostgres) {
    for (const t of ["activities", "payments", "payment_cards", "app_settings"]) {
      await query(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY`);
    }
  }

  console.log("[migrate] tayyor ✓");
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[migrate] xato:", err.message);
    process.exit(1);
  });
