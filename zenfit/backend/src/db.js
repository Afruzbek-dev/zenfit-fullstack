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
 *
 * The schema itself lives in schema.js and is shared with scripts/migrate.js.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSchema } from "./schema.js";
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

async function initSqlite() {
  const { DatabaseSync } = await import("node:sqlite");
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "..", "data.sqlite");
  sqliteDb = new DatabaseSync(dbPath);
  sqliteDb.exec("PRAGMA foreign_keys = ON;");
  for (const stmt of buildSchema(false)) sqliteDb.exec(stmt);
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

  // NOTE: these rewrites are textual and apply to the whole statement, string
  // literals included. No query needs a literal 'true'/'false'/'now()' today;
  // if one ever does, it will be silently mangled here.
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
  if (/^\s*(select|with|pragma)/i.test(text) || /returning/i.test(text)) {
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
