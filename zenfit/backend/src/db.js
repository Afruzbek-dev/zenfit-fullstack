/**
 * Dual-driver database layer.
 *
 * Production (Supabase/Postgres): set DATABASE_URL.
 * Local development: leave DATABASE_URL unset and a SQLite file is used instead,
 * so the app runs with zero credentials.
 *
 * Every query in the codebase is written in Postgres dialect ($1, $2, now(), ...).
 * The SQLite driver translates placeholders and a small set of functions, so
 * route code never needs to know which engine is live.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
// `node:sqlite` is imported lazily inside initSqlite(): it only exists on
// Node 22.5+, and the Postgres path must not depend on the host's Node version.

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const usingPostgres = Boolean(process.env.DATABASE_URL);

/* ------------------------------------------------------------------ *
 * Postgres driver
 * ------------------------------------------------------------------ */

let pgPool = null;

async function initPostgres() {
  const { default: pg } = await import("pg");
  pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    // Supabase requires TLS but serves a cert chain Node doesn't ship by default.
    ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
    max: 5,
  });
  await pgPool.query("select 1");
}

/* ------------------------------------------------------------------ *
 * SQLite driver
 * ------------------------------------------------------------------ */

let sqliteDb = null;

const SQLITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id   TEXT UNIQUE NOT NULL,
  first_name    TEXT,
  username      TEXT,
  language_code TEXT DEFAULT 'uz',
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  last_seen_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id              INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  gender               TEXT,
  age                  INTEGER,
  height_cm            REAL,
  weight_kg            REAL,
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
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  updated_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE IF NOT EXISTS meals (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  emoji     TEXT,
  kcal      INTEGER NOT NULL,
  carbs     INTEGER,
  protein   INTEGER,
  fat       INTEGER,
  portion_g INTEGER,
  source    TEXT NOT NULL DEFAULT 'manual',
  logged_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE IF NOT EXISTS workout_logs (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id    TEXT,
  exercise_name  TEXT NOT NULL,
  emoji          TEXT,
  kcal           INTEGER NOT NULL DEFAULT 0,
  sets_completed INTEGER,
  plan_day       TEXT,
  logged_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE IF NOT EXISTS exercise_sets (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_log_id INTEGER REFERENCES workout_logs(id) ON DELETE CASCADE,
  exercise_id    TEXT NOT NULL,
  exercise_name  TEXT NOT NULL,
  set_number     INTEGER NOT NULL,
  reps           INTEGER,
  weight_kg      REAL,
  logged_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE IF NOT EXISTS ai_plans (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_type  TEXT NOT NULL,
  plan_json  TEXT NOT NULL,
  is_active  INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE IF NOT EXISTS water_logs (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ml        INTEGER NOT NULL,
  logged_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE IF NOT EXISTS weight_history (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight_kg   REAL NOT NULL,
  recorded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE IF NOT EXISTS subscriptions (
  user_id    INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  plan       TEXT NOT NULL DEFAULT 'free',
  status     TEXT NOT NULL DEFAULT 'inactive',
  started_at TEXT,
  expires_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE IF NOT EXISTS ai_usage (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  used_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_meals_user_date        ON meals(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_date ON workout_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_user_ex  ON exercise_sets(user_id, exercise_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_user_time         ON chat_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_water_user_date        ON water_logs(user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_weight_user_date       ON weight_history(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_plans_user_active   ON ai_plans(user_id, plan_type, is_active);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_feature  ON ai_usage(user_id, feature, used_at DESC);
`;

async function initSqlite() {
  const { DatabaseSync } = await import("node:sqlite");
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "..", "data.sqlite");
  sqliteDb = new DatabaseSync(dbPath);
  sqliteDb.exec("PRAGMA foreign_keys = ON;");
  sqliteDb.exec(SQLITE_SCHEMA);
}

/**
 * Rewrites a Postgres-dialect statement for SQLite.
 * Placeholders are re-emitted in occurrence order so repeated $n still binds
 * the right value.
 */
function toSqlite(sql, params) {
  const outParams = [];
  const text = sql.replace(/\$(\d+)/g, (_, n) => {
    outParams.push(params[Number(n) - 1]);
    return "?";
  });

  const translated = text
    .replace(/\bnow\(\)/gi, "strftime('%Y-%m-%dT%H:%M:%SZ','now')")
    .replace(/\btrue\b/gi, "1")
    .replace(/\bfalse\b/gi, "0");

  // node:sqlite rejects JS booleans/undefined — normalise to storable values.
  const safeParams = outParams.map((v) => {
    if (v === undefined) return null;
    if (typeof v === "boolean") return v ? 1 : 0;
    if (v !== null && typeof v === "object" && !(v instanceof Date)) return JSON.stringify(v);
    if (v instanceof Date) return v.toISOString();
    return v;
  });

  return { text: translated, params: safeParams };
}

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */

export async function initDb() {
  if (usingPostgres) {
    await initPostgres();
    console.log("[db] Postgres (Supabase) ulandi");
    return;
  }

  // Serverless filesystems are read-only apart from /tmp, and even /tmp is
  // wiped between invocations — refuse rather than silently losing user data.
  if (process.env.VERCEL === "1" || process.env.VERCEL_ENV) {
    throw new Error(
      "DATABASE_URL o'rnatilmagan. Serverless muhitda SQLite ishlamaydi — Supabase Postgres ulanish satrini qo'shing."
    );
  }

  await initSqlite();
  console.log("[db] SQLite lokal rejim (DATABASE_URL o'rnatilmagan)");
}

/** Runs a statement and returns all rows. */
export async function query(sql, params = []) {
  if (usingPostgres) {
    const res = await pgPool.query(sql, params);
    return res.rows;
  }
  const { text, params: p } = toSqlite(sql, params);
  const stmt = sqliteDb.prepare(text);
  // node:sqlite throws on .all() for statements that return nothing.
  if (/^\s*(select|with)/i.test(text) || /returning/i.test(text)) {
    return stmt.all(...p);
  }
  stmt.run(...p);
  return [];
}

/** Runs a statement and returns the first row, or null. */
export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length ? rows[0] : null;
}

/** Parses a JSON column that Postgres returns as an object and SQLite as text. */
export function parseJsonColumn(value) {
  if (value == null) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

/** Returns an ISO date string N days back, for portable date filtering. */
export function daysAgoIso(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export default { query, queryOne, initDb, usingPostgres, parseJsonColumn, daysAgoIso };
