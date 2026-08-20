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
      -- Non-null when the user picked their own pace (weeks to reach
      -- target_weight_kg) instead of the default %bodyweight rate — see
      -- lib/goalPlan.js. Drives both target_date and the calorie deficit in
      -- lib/calorie.js's computeTargets(). Null means "use the default".
      target_pace_kg_per_week ${REAL},
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
      -- "Mahsulotlarim": JSON array of food catalogue ids the user says they
      -- have at home, used to build a meal plan out of what is actually in the
      -- kitchen. Ids only — the nutrition values stay in the client catalogue.
      pantry               TEXT,
      -- Diet-plan questionnaire answers (restrictions, meals/day, eats out) —
      -- JSON object. Asked once before the first AI diet plan, reused after.
      diet_prefs           TEXT,
      -- Muscle groups the user asked to emphasise. JSON array of picker ids;
      -- the split builder turns them into training days.
      focus_muscles        TEXT,
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

    // Manually logged, same shape as water_logs — a running daily total, not
    // a set-exact-value. Feeds the step count next to the onboarding target.
    `CREATE TABLE IF NOT EXISTS step_logs (
      id        ${ID},
      user_id   ${FK} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      steps     INTEGER NOT NULL,
      logged_at ${TS}
    )`,

    `CREATE TABLE IF NOT EXISTS weight_history (
      id          ${ID},
      user_id     ${FK} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      weight_kg   ${REAL} NOT NULL,
      recorded_at ${TS}
    )`,

    `CREATE TABLE IF NOT EXISTS subscriptions (
      user_id        ${FK} PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      plan           TEXT NOT NULL DEFAULT 'free',
      status         TEXT NOT NULL DEFAULT 'inactive',
      started_at     ${TS_NULL},
      expires_at     ${TS_NULL},
      -- Set once, the first (and only) time this user starts the 3-day trial —
      -- distinct from expires_at so a lapsed trial can't just be restarted.
      trial_used_at  ${TS_NULL},
      -- Set by an admin in the admin panel to unlock the trial-offer popup for
      -- this specific user. The trial stays admin-gated: POST /trial/start
      -- refuses to run unless this is set, same once-only guard as trial_used_at.
      trial_offer_granted_at ${TS_NULL},
      updated_at     ${TS}
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

    // An edge between two users, not an attribute of one — referee_id is UNIQUE
    // so a user can be captured as somebody's referee at most once, ever, which
    // is what actually stops double-crediting (the app-level "is this user
    // brand new" check is only a fast path in front of this guarantee).
    `CREATE TABLE IF NOT EXISTS referrals (
      id          ${ID},
      referrer_id ${FK} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      referee_id  ${FK} NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      -- Running total granted to the referrer for this referral: SIGNUP_REWARD_DAYS
      -- at capture time, plus CONVERSION_REWARD_DAYS once (if ever) the referee
      -- makes their first purchase — see converted_at below.
      reward_days INTEGER NOT NULL,
      -- Set once, the first time the referee's payment is approved. Both the
      -- guard against paying the referrer's conversion bonus twice (e.g. on a
      -- renewal) and the switch for whether the referee still qualifies for
      -- their one-time referral discount.
      converted_at ${TS_NULL},
      created_at  ${TS}
    )`,

    // The "o'zim tuzaman" (build-your-own) diet plan: one row per food a user
    // has added into a meal-time slot. A relational table, not a JSON column
    // like pantry/diet_prefs, because this is edited one item at a time rather
    // than saved as a whole sheet — a JSON blob would race on near-simultaneous
    // adds. No versioning/is_active column: unlike ai_plans this never
    // "regenerates", so exactly one plan per user falls out of the schema
    // itself rather than needing an active-row flag.
    `CREATE TABLE IF NOT EXISTS custom_diet_plan_items (
      id         ${ID},
      user_id    ${FK} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      -- 0-based index into MEAL_SLOT_SETS[mealsPerDay] (lib/aiFeatures.js) —
      -- NOT the slot label, because the 5-meal set has two slots both
      -- labelled "Gazak" and a label cannot be a unique key there.
      slot_index INTEGER NOT NULL,
      -- Optional pointer back to the client-only food catalogue, kept purely
      -- so the recipe-link button can still find a match. Macros below are
      -- snapshotted at add-time (the backend has no catalogue to re-resolve
      -- against), so a later catalogue edit or removal never changes a
      -- plan row that already exists.
      food_id    TEXT,
      name       TEXT NOT NULL,
      emoji      TEXT,
      portion    TEXT,
      kcal       INTEGER NOT NULL,
      carbs      INTEGER,
      protein    INTEGER,
      fat        INTEGER,
      created_at ${TS}
    )`,

    // Admin-authored announcements, broadcast to a chosen audience — see
    // routes/challenges.js (user-facing read) and routes/admin.js
    // (create/delete). No progress-tracking columns by design: this is a
    // motivational announcement, not a tracked goal.
    `CREATE TABLE IF NOT EXISTS challenges (
      id            ${ID},
      title         TEXT NOT NULL,
      description   TEXT,
      audience      TEXT NOT NULL DEFAULT 'all',
      duration_days INTEGER,
      -- Computed in JS at insert time from duration_days, never SQL
      -- date-math (db.js's SQLite rewriter only understands
      -- now()/true/false/$n). NULL means open-ended.
      ends_at       ${TS_NULL},
      created_by    TEXT,
      created_at    ${TS}
    )`,

    // One row per targeted user, only populated when audience = 'selected'.
    // The 'all'/'premium'/'free' audiences are resolved by query instead.
    `CREATE TABLE IF NOT EXISTS challenge_recipients (
      id           ${ID},
      challenge_id ${FK} NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
      user_id      ${FK} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at   ${TS}
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
    `CREATE INDEX IF NOT EXISTS idx_steps_user_date        ON step_logs(user_id, logged_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_weight_user_date       ON weight_history(user_id, recorded_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_ai_plans_user_active   ON ai_plans(user_id, plan_type, is_active, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_ai_usage_user_feature  ON ai_usage(user_id, feature, used_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_activities_user_date   ON activities(user_id, logged_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_payments_user_date     ON payments(user_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_payments_status        ON payments(status, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_cards_user             ON payment_cards(user_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_referrals_referrer     ON referrals(referrer_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_custom_diet_items_user ON custom_diet_plan_items(user_id, slot_index, id)`,
    `CREATE INDEX IF NOT EXISTS idx_challenge_recipients_challenge ON challenge_recipients(challenge_id)`,
    `CREATE INDEX IF NOT EXISTS idx_challenge_recipients_user      ON challenge_recipients(user_id, challenge_id)`,
  ];
}

/** Tables that must have RLS enabled on Postgres — i.e. all of them. */
export const RLS_TABLES = [
  "users", "profiles", "meals", "workout_logs", "exercise_sets", "ai_plans",
  "chat_messages", "water_logs", "step_logs", "weight_history", "subscriptions",
  "activities", "payments", "payment_cards", "app_settings", "ai_usage",
  "referrals", "custom_diet_plan_items", "challenges", "challenge_recipients",
];
