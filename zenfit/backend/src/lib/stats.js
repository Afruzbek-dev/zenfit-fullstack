import { query, queryOne, daysAgoIso } from "../db.js";

/**
 * The foods this user logs most often, newest-first among equals.
 *
 * People eat the same handful of things — non, choy, qatiq, osh — and without
 * this the app forgot all of it overnight: every morning meant re-finding the
 * same breakfast in a 126-item catalogue. Grouping on the full macro tuple
 * keeps "osh 350 g" and "osh 200 g" as separate entries, which is what makes a
 * row directly re-loggable in one tap.
 */
export async function getRecentFoods(userId, limit = 8) {
  const rows = await query(
    `SELECT name, emoji, kcal, carbs, protein, fat, portion_g,
            COUNT(*) AS times, MAX(logged_at) AS last_at
       FROM meals
      WHERE user_id = $1 AND logged_at >= $2
   GROUP BY name, emoji, kcal, carbs, protein, fat, portion_g
   ORDER BY times DESC, last_at DESC
      LIMIT $3`,
    [userId, daysAgoIso(60), limit]
  );
  // COUNT() comes back as a string from node-postgres (int8), so coerce.
  return rows.map((r) => ({
    name: r.name,
    emoji: r.emoji,
    kcal: Number(r.kcal),
    carbs: r.carbs == null ? null : Number(r.carbs),
    protein: r.protein == null ? null : Number(r.protein),
    fat: r.fat == null ? null : Number(r.fat),
    portionG: r.portion_g == null ? null : Number(r.portion_g),
    times: Number(r.times),
  }));
}

/**
 * Day boundaries are computed in JS from a client-supplied local date so the
 * "today" a user sees matches their timezone, not the server's. Comparing
 * against an explicit [start, end) range also keeps the SQL portable between
 * Postgres and SQLite.
 *
 * `tzOffsetMinutes` is Date#getTimezoneOffset(): the minutes to ADD to local
 * time to get UTC, so Uzbekistan (UTC+5) sends -300.
 *
 * Which calendar day it is has to be decided in the user's timezone, not UTC.
 * Deriving it from the UTC date meant that between 00:00 and 05:00 in Tashkent
 * the server still thought it was yesterday: the dashboard kept showing the
 * previous day and anything logged in those five hours fell outside the
 * queried window entirely.
 */
export function dayRange(dateStr, tzOffsetMinutes = 0) {
  const day = dateStr || new Date(Date.now() - tzOffsetMinutes * 60_000).toISOString().slice(0, 10);
  const startUtc = new Date(`${day}T00:00:00Z`);
  startUtc.setMinutes(startUtc.getMinutes() + tzOffsetMinutes);
  const endUtc = new Date(startUtc);
  endUtc.setDate(endUtc.getDate() + 1);
  return { day, start: startUtc.toISOString(), end: endUtc.toISOString() };
}

export async function getDayStats(userId, dateStr, tzOffsetMinutes = 0) {
  const { day, start, end } = dayRange(dateStr, tzOffsetMinutes);

  // Issued together: these five are independent, and awaiting them in sequence
  // paid a full network round trip each — noticeable even inside one region.
  const [meals, workouts, activities, water, profile] = await Promise.all([
    query(
      `SELECT kcal, carbs, protein, fat FROM meals
        WHERE user_id = $1 AND logged_at >= $2 AND logged_at < $3`,
      [userId, start, end]
    ),
    query(
      `SELECT kcal FROM workout_logs
        WHERE user_id = $1 AND logged_at >= $2 AND logged_at < $3`,
      [userId, start, end]
    ),
    query(
      `SELECT kcal, duration_min FROM activities
        WHERE user_id = $1 AND logged_at >= $2 AND logged_at < $3`,
      [userId, start, end]
    ),
    queryOne(
      `SELECT COALESCE(SUM(ml), 0) AS total FROM water_logs
        WHERE user_id = $1 AND logged_at >= $2 AND logged_at < $3`,
      [userId, start, end]
    ),
    queryOne(`SELECT * FROM profiles WHERE user_id = $1`, [userId]),
  ]);

  const totals = meals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + (m.kcal || 0),
      carbs: acc.carbs + (m.carbs || 0),
      protein: acc.protein + (m.protein || 0),
      fat: acc.fat + (m.fat || 0),
    }),
    { kcal: 0, carbs: 0, protein: 0, fat: 0 }
  );

  // Strength sets and free activities both burn into the same daily budget.
  const workoutKcal = workouts.reduce((sum, w) => sum + (w.kcal || 0), 0);
  const activityKcal = activities.reduce((sum, a) => sum + (a.kcal || 0), 0);
  const burned = workoutKcal + activityKcal;
  const target = profile?.daily_calorie_target || 2000;

  return {
    date: day,
    ...totals,
    burned,
    activityKcal,
    activityMinutes: activities.reduce((sum, a) => sum + (a.duration_min || 0), 0),
    waterMl: Number(water?.total || 0),
    waterTargetMl: profile?.water_target_ml || 2500,
    target,
    remaining: target - totals.kcal + burned,
    mealCount: meals.length,
    workoutCount: workouts.length,
    activityCount: activities.length,
  };
}

/**
 * How far back the streak query looks, and so the largest streak reportable.
 *
 * Unbounded, this query read every row the account had ever logged — sorted in
 * the database, shipped to the function, collapsed into a Set — on every app
 * open, every summary refresh and every /streak in the bot. A year at five
 * meals a day is 1,800+ rows to produce a two-digit number, and it grew for as
 * long as the account lived. Bounding the window makes the cost a function of
 * the window rather than of account age.
 *
 * The trade is a ceiling. A run longer than this is reported AS this number,
 * not as a broken streak: the walk below stops at the edge of the window
 * instead of reading the absence of data as a missed day. So a 90-day streak
 * shows 60 and keeps showing 60 while it is alive — capped, never reset.
 * Raising the cap costs one more day of rows per day added.
 */
const STREAK_WINDOW_DAYS = 60;

/**
 * Hard ceiling on rows transferred, independent of the window — a pathological
 * account cannot reintroduce the original problem inside 62 days without
 * logging ~32 entries a day. Rows arrive newest-first, so hitting this can only
 * shorten a reported streak (the oldest days go missing), never inflate one.
 */
const STREAK_MAX_ROWS = 2000;

/**
 * Consecutive days (ending today or yesterday) with at least one meal or
 * workout logged. Yesterday still counts so the streak does not visibly break
 * before the user has had a chance to log anything today.
 *
 * Capped at STREAK_WINDOW_DAYS — see the note there.
 */
export async function getStreak(userId, tzOffsetMinutes = 0) {
  // Two days wider than the cap. The window is measured from `now`, not from
  // local midnight, so without the slack the oldest day inside the cap would be
  // only partially covered — by a margin that shifts with the time of day and
  // the caller's timezone offset.
  const since = daysAgoIso(STREAK_WINDOW_DAYS + 2);

  // Every arm is served by idx_<table>_user_date (user_id, logged_at DESC),
  // which satisfies the range and the ordering both.
  const rows = await query(
    `SELECT logged_at FROM meals WHERE user_id = $1 AND logged_at >= $2
     UNION ALL
     SELECT logged_at FROM workout_logs WHERE user_id = $1 AND logged_at >= $2
     UNION ALL
     SELECT logged_at FROM activities WHERE user_id = $1 AND logged_at >= $2
     ORDER BY logged_at DESC
     LIMIT $3`,
    [userId, since, STREAK_MAX_ROWS]
  );
  if (!rows.length) return 0;

  const localDay = (ts) => {
    const d = new Date(ts);
    d.setMinutes(d.getMinutes() - tzOffsetMinutes);
    return d.toISOString().slice(0, 10);
  };

  const activeDays = new Set(rows.map((r) => localDay(r.logged_at)));

  const today = new Date();
  today.setMinutes(today.getMinutes() - tzOffsetMinutes);

  let cursor = new Date(today);
  if (!activeDays.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!activeDays.has(cursor.toISOString().slice(0, 10))) return 0;
  }

  // The cap is the loop's exit condition rather than a clamp on the result, so
  // running off the end of the window reads as "at least this long", never as a
  // missing day that would zero the streak.
  let streak = 0;
  while (streak < STREAK_WINDOW_DAYS && activeDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Everything the AI trainer needs to answer with real numbers. */
export async function buildTrainerContext(userId, tzOffsetMinutes = 0) {
  const [profile, todayStats, recentWorkouts, planRow] = await Promise.all([
    queryOne(`SELECT * FROM profiles WHERE user_id = $1`, [userId]),
    getDayStats(userId, null, tzOffsetMinutes),
    query(
      `SELECT exercise_name, sets_completed, logged_at FROM workout_logs
        WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 10`,
      [userId]
    ),
    queryOne(
      `SELECT plan_json FROM ai_plans
        WHERE user_id = $1 AND plan_type = 'workout' AND is_active = true
        ORDER BY created_at DESC LIMIT 1`,
      [userId]
    ),
  ]);

  let activePlan = null;
  if (planRow) {
    try {
      activePlan = typeof planRow.plan_json === "string" ? JSON.parse(planRow.plan_json) : planRow.plan_json;
    } catch {
      activePlan = null;
    }
  }

  return { profile, todayStats, recentWorkouts, activePlan };
}
