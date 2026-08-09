/**
 * The database schema, in one place, for both engines.
 *
 * This used to live as a SQLite-only string inside db.js, which meant it ran
 * only on the local development path — production Postgres was created by hand
 * in the Supabase SQL editor and existed nowhere in version control. A fresh
 * database could not be provisioned from this repo at all, so there was no way
 * to restore from backup, stand up a staging environment, or onboard a second
 * developer.
 *
 * Now scripts/migrate.js runs these against whichever engine is configured, and
 * db.js uses the same list to build the local SQLite file. Every statement is
 * IF NOT EXISTS, so applying it to the live database is a no-op for anything
 * that already exists.
 *
 * Kept as a plain function of the dialect flag rather than importing db.js, so
 * there is no import cycle (db.js needs this module during its own init).
 */

/**
 * @param {boolean} pg true for Postgres, false for SQLite
 * @returns {string[]} statements to run in order
 */
export function buildSchema(pg) {
  const ID = pg ? "BIGSERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT";
  const FK = pg ? "BIGINT" : "INTEGER";
  const TS = pg
    ? "TIMESTAMPTZ NOT NULL DEFAULT now()"
    : "TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))";
  const TS_NULL = pg ? "TIMESTAMPTZ" : "TEXT";
  const BOOL = (def) => (pg ? `BOOLEAN NOT NULL DEFAULT ${def}` : `INTEGER NOT NULL DEFAULT ${def ? 1 : 0}`);
  const REAL = pg ? "DOUBLE PRECISION" : "REAL";

  return [
    `CREATE TABLE IF NOT EXISTS users (
      id            ${ID},
      telegram_id   TEXT UNIQUE NOT NULL,
      first_name    TEXT,
      username      TEXT,
      avatar_url    TEXT,
      language_code TEXT DEFAULT 'uz',
      created_at    ${TS},
      last_seen_at  ${TS}
    )`,

    `CREATE TABLE IF NOT EXISTS profiles (
      user_id              ${FK} PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      gender               TEXT,
      age                  INTEGER,
      height_cm            ${REAL},
      weight_kg            ${REAL},
      activity_level       TEXT,
      goal                 TEXT,
      daily_calorie_target INTEGER,
      carbs_target_g       INTEGER,
      protein_target_g     INTEGER,
      fat_target_g         INTEGER,
      fitness_level        TEXT,
      active_program_id    TEXT,
      equipment            TEXT,
      days_per_week        INTEGER,
      session_duration     TEXT,
      injuries             TEXT,
      water_target_ml      INTEGER DEFAULT 2500,
      target_weight_kg     ${REAL},
      target_date          TEXT,
      display_name         TEXT,
      language             TEXT DEFAULT 'uz',
      theme                TEXT DEFAULT 'dark',
      notif_workout        ${BOOL(true)},
      notif_meal           ${BOOL(true)},
      notif_water          ${BOOL(false)},
      notif_tips           ${BOOL(true)},
      neat_confirmed       ${BOOL(false)},
      -- Pregnant or breastfeeding. Weight loss is contraindicated and the
      -- requirement is a surplus, so this blocks the deficit path outright.
      pregnant             ${BOOL(false)},
      onboarding_completed ${BOOL(false)},
      updated_at           ${TS}
    )`,

    `CREATE TABLE IF NOT EXISTS meals (
      id        ${ID},
      user_id   ${FK} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name      TEXT NOT NULL,
      emoji     TEXT,
      kcal      INTEGER NOT NULL,
      carbs     INTEGER,
      protein   INTEGER,
      fat       INTEGER,
      portion_g INTEGER,
      source    TEXT NOT NULL DEFAULT 'manual',
      logged_at ${TS}
    )`,

    `CREATE TABLE IF NOT EXISTS workout_logs (
      id             ${ID},
      user_id        ${FK} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      exercise_id    TEXT,
      exercise_name  TEXT NOT NULL,
      emoji          TEXT,
      kcal           INTEGER NOT NULL DEFAULT 0,
      sets_completed INTEGER,
      plan_day       TEXT,
      logged_at      ${TS}
    )`,

    `CREATE TABLE IF NOT EXISTS exercise_sets (
      id             ${ID},
      user_id        ${FK} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      workout_log_id ${FK} REFERENCES workout_logs(id) ON DELETE CASCADE,
      exercise_id    TEXT NOT NULL,
      exercise_name  TEXT NOT NULL,
      set_number     INTEGER NOT NULL,
      reps           INTEGER,
      weight_kg      ${REAL},
      logged_at      ${TS}
    )`,

    `CREATE TABLE IF NOT EXISTS ai_plans (
      id         ${ID},
      user_id    ${FK} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_type  TEXT NOT NULL,
      plan_json  TEXT NOT NULL,
      is_active  ${BOOL(true)},
      created_at ${TS}
    )`,

    `CREATE TABLE IF NOT EXISTS chat_messages (
      id         ${ID},
      user_id    ${FK} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role       TEXT NOT NULL,
      content    TEXT NOT NULL,
      created_at ${TS}
    )`,

    `CREATE TABLE IF NOT EXISTS water_logs (
      id        ${ID},
      user_id   ${FK} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ml        INTEGER NOT NULL,
      logged_at ${TS}
    )`,

    `CREATE TABLE IF NOT EXISTS weight_history (
      id          ${ID},
      user_id     ${FK} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      weight_kg   ${REAL} NOT NULL,
      recorded_at ${TS}
    )`,

    `CREATE TABLE IF NOT EXISTS subscriptions (
      user_id    ${FK} PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      plan       TEXT NOT NULL DEFAULT 'free',
      status     TEXT NOT NULL DEFAULT 'inactive',
      started_at ${TS_NULL},
      expires_at ${TS_NULL},
      updated_at ${TS}
    )`,

    `CREATE TABLE IF NOT EXISTS activities (
      id           ${ID},
      user_id      ${FK} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      activity_id  TEXT NOT NULL,
      name         TEXT NOT NULL,
      emoji        TEXT,
      duration_min INTEGER NOT NULL,
      distance_km  ${REAL},
      intensity    TEXT,
      kcal         INTEGER NOT NULL DEFAULT 0,
      note         TEXT,
      logged_at    ${TS}
    )`,

    `CREATE TABLE IF NOT EXISTS payments (
      id              ${ID},
      user_id         ${FK} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider        TEXT NOT NULL,
      plan_id         TEXT NOT NULL,
      plan_title      TEXT,
      amount_uzs      INTEGER NOT NULL,
      status          TEXT NOT NULL DEFAULT 'pending',
      external_id     TEXT,
      card_last4      TEXT,
      method          TEXT DEFAULT 'provider',
      receipt_file_id TEXT,
      receipt_note    TEXT,
      reviewed_at     ${TS_NULL},
      reviewed_by     TEXT,
      reject_reason   TEXT,
      created_at      ${TS},
      paid_at         ${TS_NULL}
    )`,

    // Only the provider's token and the masked tail are ever stored here — a raw
    // card number must never reach this service. See routes/payment.js.
    `CREATE TABLE IF NOT EXISTS payment_cards (
      id         ${ID},
      user_id    ${FK} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider   TEXT NOT NULL,
      token      TEXT NOT NULL,
      brand      TEXT,
      last4      TEXT,
      expiry     TEXT,
      is_default ${BOOL(false)},
      created_at ${TS}
    )`,

    // Key/value rather than columns: the payment card details change without a
    // deploy, and a new setting should not mean another migration.
    `CREATE TABLE IF NOT EXISTS app_settings (
      key        TEXT PRIMARY KEY,
      value      TEXT,
      updated_at ${TS}
    )`,

    `CREATE TABLE IF NOT EXISTS ai_usage (
      id      ${ID},
      user_id ${FK} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      feature TEXT NOT NULL,
      used_at ${TS}
    )`,

    /* ----- indexes ------------------------------------------------------- *
     * Every one of these serves a query that runs on the hot path. They were
     * previously declared on the SQLite side only, so whether production had
     * them was unknowable from the repo.
     *
     * Plain CREATE INDEX takes a write lock for the duration. The tables are
     * small today so that is imperceptible; if this database ever grows large,
     * switch the Postgres path to CREATE INDEX CONCURRENTLY (which cannot run
     * inside a transaction block).
     * -------------------------------------------------------------------- */
    `CREATE INDEX IF NOT EXISTS idx_meals_user_date        ON meals(user_id, logged_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON workout_logs(user_id, logged_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_exercise_sets_user_ex  ON exercise_sets(user_id, exercise_id, logged_at DESC)`,
    // Serves GET /workout-logs/last-sets, which orders by time across ALL
    // exercises — the index above cannot help, its leading column is exercise_id.
    `CREATE INDEX IF NOT EXISTS idx_exercise_sets_user_time ON exercise_sets(user_id, logged_at DESC)`,
    // Postgres does not index foreign keys automatically, so without this every
    // workout_logs delete cascade scans the whole exercise_sets table.
    `CREATE INDEX IF NOT EXISTS idx_exercise_sets_log      ON exercise_sets(workout_log_id)`,
    `CREATE INDEX IF NOT EXISTS idx_chat_user_time         ON chat_messages(user_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_water_user_date        ON water_logs(user_id, logged_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_weight_user_date       ON weight_history(user_id, recorded_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_ai_plans_user_active   ON ai_plans(user_id, plan_type, is_active, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_ai_usage_user_feature  ON ai_usage(user_id, feature, used_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_activities_user_date   ON activities(user_id, logged_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_payments_user_date     ON payments(user_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_payments_status        ON payments(status, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_cards_user             ON payment_cards(user_id, created_at DESC)`,
  ];
}

/** Tables that must have RLS enabled on Postgres — i.e. all of them. */
export const RLS_TABLES = [
  "users", "profiles", "meals", "workout_logs", "exercise_sets", "ai_plans",
  "chat_messages", "water_logs", "weight_history", "subscriptions",
  "activities", "payments", "payment_cards", "app_settings", "ai_usage",
];
