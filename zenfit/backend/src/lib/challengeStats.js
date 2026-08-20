import { query } from "../db.js";

/**
 * What a challenge can be scored on.
 *
 * Every one of these is answerable from data the app already records, which is
 * the whole reason the list is this short: a challenge nobody has to log
 * anything extra for is a challenge people actually finish.
 */
export const CHALLENGE_METRICS = ["steps", "workouts", "kcal", "active_days"];
export const isMetric = (m) => CHALLENGE_METRICS.includes(m);

/** The window a challenge is scored over. `starts_at` is NULL on older rows. */
export function challengeWindow(challenge) {
  const start = challenge.starts_at || challenge.created_at;
  const end = challenge.ends_at || new Date(Date.now() + 60_000).toISOString();
  return { start: new Date(start).toISOString(), end: new Date(end).toISOString() };
}

/**
 * Builds "$3,$4,$5" for an IN list starting after the two window params.
 * Ids come from our own tables, never from a request body, but they are still
 * bound rather than interpolated so the shape matches every other query here.
 */
function inList(ids, offset) {
  return ids.map((_, i) => `$${offset + i}`).join(",");
}

/**
 * Local-calendar-day bucketing, matching how getStreak() counts a day.
 *
 * Doing this in JS rather than SQL is deliberate: the two engines disagree on
 * date functions (Postgres has real timestamps, SQLite has ISO strings), and
 * the app already has exactly one definition of "a day" — reusing its shape
 * beats writing a second one that drifts.
 */
function distinctLocalDays(rows, tzOffsetMinutes) {
  const byUser = new Map();
  for (const r of rows) {
    const ts = new Date(r.logged_at).getTime();
    if (!Number.isFinite(ts)) continue;
    const key = new Date(ts - tzOffsetMinutes * 60_000).toISOString().slice(0, 10);
    const set = byUser.get(String(r.user_id)) || new Set();
    set.add(key);
    byUser.set(String(r.user_id), set);
  }
  const totals = new Map();
  for (const [userId, set] of byUser) totals.set(userId, set.size);
  return totals;
}

/** Caps the row scan for active_days so a long open-ended challenge stays bounded. */
const ACTIVE_DAY_MAX_ROWS = 5000;

/**
 * Each participant's score for one challenge.
 *
 * @returns {Promise<Map<string, number>>} keyed by user id as a string, since
 *   Postgres BIGSERIAL ids arrive as strings and SQLite's as numbers.
 */
export async function metricTotals(challenge, userIds, tzOffsetMinutes = 0) {
  const totals = new Map();
  if (!userIds || userIds.length === 0) return totals;

  const { start, end } = challengeWindow(challenge);
  const ids = userIds.map(String);
  const params = [start, end, ...ids];
  const list = inList(ids, 3);
  const metric = isMetric(challenge.metric) ? challenge.metric : "active_days";

  const add = (rows) => {
    for (const r of rows) totals.set(String(r.user_id), Number(r.v) || 0);
  };

  if (metric === "steps") {
    add(
      await query(
        `SELECT user_id, COALESCE(SUM(steps), 0) AS v FROM step_logs
          WHERE logged_at >= $1 AND logged_at < $2 AND user_id IN (${list})
          GROUP BY user_id`,
        params
      )
    );
  } else if (metric === "workouts") {
    add(
      await query(
        `SELECT user_id, COUNT(*) AS v FROM workout_logs
          WHERE logged_at >= $1 AND logged_at < $2 AND user_id IN (${list})
          GROUP BY user_id`,
        params
      )
    );
  } else if (metric === "kcal") {
    // Strength burn and cardio burn are stored in two tables; a "calories
    // burned" challenge means both, so they are summed rather than picked
    // between. Same figure the burned stat on Home is built from.
    const rows = await query(
      `SELECT user_id, SUM(v) AS v FROM (
         SELECT user_id, COALESCE(SUM(kcal), 0) AS v FROM workout_logs
          WHERE logged_at >= $1 AND logged_at < $2 AND user_id IN (${list}) GROUP BY user_id
         UNION ALL
         SELECT user_id, COALESCE(SUM(kcal), 0) AS v FROM activities
          WHERE logged_at >= $1 AND logged_at < $2 AND user_id IN (${list}) GROUP BY user_id
       ) g GROUP BY user_id`,
      params
    );
    add(rows);
  } else {
    const rows = await query(
      `SELECT user_id, logged_at FROM (
         SELECT user_id, logged_at FROM meals
          WHERE logged_at >= $1 AND logged_at < $2 AND user_id IN (${list})
         UNION ALL
         SELECT user_id, logged_at FROM workout_logs
          WHERE logged_at >= $1 AND logged_at < $2 AND user_id IN (${list})
         UNION ALL
         SELECT user_id, logged_at FROM activities
          WHERE logged_at >= $1 AND logged_at < $2 AND user_id IN (${list})
       ) g LIMIT ${ACTIVE_DAY_MAX_ROWS}`,
      params
    );
    for (const [userId, n] of distinctLocalDays(rows, tzOffsetMinutes)) totals.set(userId, n);
  }

  for (const id of ids) if (!totals.has(id)) totals.set(id, 0);
  return totals;
}
