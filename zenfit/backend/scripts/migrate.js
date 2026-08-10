/**
 * Idempotent schema migration.
 *
 * Run against whichever database the environment points at:
 *   node --env-file=.env scripts/migrate.js
 *
 * Every statement is safe to re-run, so this can be applied to production
 * without tracking which migrations have already gone out.
 *
 * Two phases:
 *   1. The base schema from src/schema.js — CREATE TABLE / CREATE INDEX
 *      IF NOT EXISTS. On an existing database every one of these is a no-op
 *      apart from indexes that were never created; on an empty database this
 *      builds the whole thing. Until this was added, the base tables existed
 *      only in the SQLite path and had to be created by hand in the Supabase
 *      editor, which meant the repo could not restore or reproduce production.
 *   2. Column additions for databases created before a column existed. These
 *      stay because phase 1 cannot alter a table that is already there.
 */

import { initDb, query, usingPostgres } from "../src/db.js";
import { buildSchema, RLS_TABLES } from "../src/schema.js";

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

const BOOL = (def) => (usingPostgres ? `BOOLEAN NOT NULL DEFAULT ${def}` : `INTEGER NOT NULL DEFAULT ${def ? 1 : 0}`);

async function run() {
  await initDb();
  console.log(`[migrate] ${usingPostgres ? "Postgres" : "SQLite"} ustida ishlamoqda`);

  /* ----- phase 1: base schema ------------------------------------------- */
  const statements = buildSchema(usingPostgres);
  for (const stmt of statements) await query(stmt);
  console.log(`[migrate] schema: ${statements.length} ta ifoda qo'llandi`);

  /* ----- phase 2: columns added after a table already existed ----------- */

  // Stored as a data URI (client resizes to 256px before upload) so the app
  // needs no object storage; Telegram's photo_url is used as the default.
  await addColumn("users", "avatar_url", "TEXT", "TEXT");

  await addColumn("profiles", "display_name", "TEXT", "TEXT");
  await addColumn("profiles", "language", "TEXT DEFAULT 'uz'", "TEXT DEFAULT 'uz'");
  await addColumn("profiles", "theme", "TEXT DEFAULT 'dark'", "TEXT DEFAULT 'dark'");
  await addColumn("profiles", "notif_workout", BOOL(true), BOOL(true));
  await addColumn("profiles", "notif_meal", BOOL(true), BOOL(true));
  await addColumn("profiles", "notif_water", BOOL(false), BOOL(false));
  await addColumn("profiles", "notif_tips", BOOL(true), BOOL(true));

  /* ----- goal weight and the date it should be reached ------------------ */
  await addColumn("profiles", "target_weight_kg", "REAL", "REAL");
  await addColumn("profiles", "target_date", "TEXT", "TEXT");

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

  /* ----- daily-activity level re-confirmation ---------------------------- *
   * The activity question used to mean "how often do you train"; it now means
   * "how active is your day without training", because sessions are credited
   * separately (see lib/calorie.js). Anyone who answered the old question has
   * a level that no longer means what they picked, so the app asks them once
   * to re-check it. Onboarding and any profile save set this to true, which is
   * why new users never see the prompt.
   * ---------------------------------------------------------------------- */
  await addColumn("profiles", "neat_confirmed", BOOL(false), BOOL(false));

  /* ----- pregnancy / breastfeeding --------------------------------------- *
   * Asked once during onboarding. A calorie deficit is contraindicated and the
   * actual requirement is a surplus (+340 kcal in the second trimester, +450 in
   * the third), so lib/calorie.js refuses the "lose" path when this is set.
   * ---------------------------------------------------------------------- */
  await addColumn("profiles", "pregnant", BOOL(false), BOOL(false));

  /* ----- one-time 3-day trial -------------------------------------------- *
   * Set the first (and only) time a user starts the trial, so routes/payment.js
   * can refuse a second one once it lapses. See POST /payment/trial/start.
   * ---------------------------------------------------------------------- */
  await addColumn("subscriptions", "trial_used_at", usingPostgres ? "TIMESTAMPTZ" : "TEXT", "TEXT");

  /* ----- lock every table down ------------------------------------------ *
   * RLS on with zero policies denies the anon and authenticated Supabase
   * roles outright. The backend connects as the table owner and bypasses RLS,
   * so every table must have it — otherwise a table would be readable with a
   * public API key.
   * ---------------------------------------------------------------------- */
  if (usingPostgres) {
    for (const t of RLS_TABLES) {
      await query(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY`);
    }
    console.log(`[migrate] RLS: ${RLS_TABLES.length} ta jadval`);
  }

  console.log("[migrate] tayyor ✓");
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[migrate] xato:", err.message);
    process.exit(1);
  });
