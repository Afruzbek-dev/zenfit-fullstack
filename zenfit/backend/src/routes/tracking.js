import { Router } from "express";
import { query, queryOne, daysAgoIso } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getDayStats, getStreak, getMonthActivity, dayRange } from "../lib/stats.js";
import { capExerciseCredit, tdeeFromProfileRow } from "../lib/calorie.js";
import { stepsToKcal } from "../lib/activities.js";

const router = Router();

/** One call that fills the whole home dashboard. */
router.get("/summary", requireAuth, async (req, res, next) => {
  try {
    const tz = Number(req.query.tz) || 0;
    const [stats, streak] = await Promise.all([
      getDayStats(req.userId, req.query.date, tz),
      getStreak(req.userId, tz),
    ]);
    res.json({ ...stats, streak });
  } catch (err) {
    next(err);
  }
});

/** Daily kcal in/out for the progress chart. */
router.get("/weekly", requireAuth, async (req, res, next) => {
  try {
    const days = Math.min(Number(req.query.days) || 7, 90);
    const tz = Number(req.query.tz) || 0;
    const since = daysAgoIso(days);

    const [meals, workouts, activities, steps, profile] = await Promise.all([
      query(
        `SELECT kcal, logged_at FROM meals WHERE user_id = $1 AND logged_at >= $2`,
        [req.userId, since]
      ),
      query(
        `SELECT kcal, logged_at FROM workout_logs WHERE user_id = $1 AND logged_at >= $2`,
        [req.userId, since]
      ),
      query(
        `SELECT kcal, logged_at FROM activities WHERE user_id = $1 AND logged_at >= $2`,
        [req.userId, since]
      ),
      query(
        `SELECT steps, logged_at FROM step_logs WHERE user_id = $1 AND logged_at >= $2`,
        [req.userId, since]
      ),
      queryOne(`SELECT gender, age, height_cm, weight_kg, activity_level FROM profiles WHERE user_id = $1`, [req.userId]),
    ]);

    const localDay = (ts) => {
      const d = new Date(ts);
      d.setMinutes(d.getMinutes() - tz);
      return d.toISOString().slice(0, 10);
    };

    const buckets = new Map();
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date();
      d.setMinutes(d.getMinutes() - tz);
      d.setDate(d.getDate() - i);
      buckets.set(d.toISOString().slice(0, 10), { date: d.toISOString().slice(0, 10), consumed: 0, burned: 0, stepsTotal: 0 });
    }
    meals.forEach((m) => {
      const b = buckets.get(localDay(m.logged_at));
      if (b) b.consumed += m.kcal || 0;
    });
    workouts.forEach((w) => {
      const b = buckets.get(localDay(w.logged_at));
      if (b) b.burned += w.kcal || 0;
    });
    activities.forEach((a) => {
      const b = buckets.get(localDay(a.logged_at));
      if (b) b.burned += a.kcal || 0;
    });
    steps.forEach((s) => {
      const b = buckets.get(localDay(s.logged_at));
      if (b) b.stepsTotal += s.steps || 0;
    });

    // Same daily ceiling the dashboard applies (see getDayStats). The chart
    // scales its y-axis to the tallest bar, so one 9,900 kcal typo would not
    // just be wrong — it would flatten every honest day beside it to a stub.
    const tdee = tdeeFromProfileRow(profile);
    for (const b of buckets.values()) {
      // Folded in once per bucket rather than per row — the formula is linear
      // in duration, so this is mathematically identical to converting every
      // step_logs row individually, just cheaper.
      b.burned += stepsToKcal(b.stepsTotal, profile?.weight_kg);
      delete b.stepsTotal;
      b.burned = capExerciseCredit(b.burned, { tdee }).kcal;
    }

    res.json({ days: [...buckets.values()] });
  } catch (err) {
    next(err);
  }
});

/** Per-day activity map for the current calendar month — the Progress screen's heatmap. */
router.get("/month", requireAuth, async (req, res, next) => {
  try {
    const tz = Number(req.query.tz) || 0;
    const activity = await getMonthActivity(req.userId, tz);
    res.json(activity);
  } catch (err) {
    next(err);
  }
});

/* ----------------------------- water ----------------------------- */

router.post("/water", requireAuth, async (req, res, next) => {
  try {
    const ml = Number(req.body?.ml);
    if (!Number.isFinite(ml) || ml === 0 || Math.abs(ml) > 3000) {
      return res.status(400).json({ error: "invalid_ml" });
    }
    await query("INSERT INTO water_logs (user_id, ml) VALUES ($1, $2)", [req.userId, Math.round(ml)]);
    const tz = Number(req.body?.tz) || 0;
    const stats = await getDayStats(req.userId, null, tz);
    res.status(201).json({ waterMl: stats.waterMl, waterTargetMl: stats.waterTargetMl });
  } catch (err) {
    next(err);
  }
});

router.delete("/water/today", requireAuth, async (req, res, next) => {
  try {
    const tz = Number(req.query.tz) || 0;
    const { start, end } = dayRange(null, tz);
    await query("DELETE FROM water_logs WHERE user_id = $1 AND logged_at >= $2 AND logged_at < $3", [req.userId, start, end]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

/* ----------------------------- steps ------------------------------ *
 * Manually logged, same shape as water: each POST adds to (or, negative,
 * corrects) today's total rather than setting it, so "log another 2,000
 * steps" after checking your phone again later is the natural action, not
 * "re-enter the running total" — and the same -1000/+1000 widget pattern as
 * water's -250/+250 works without a separate "undo" path. Feeds the
 * informational "burned" figure the same way workouts/activities do (see
 * stepsToKcal in lib/activities.js) — but never the calorie budget itself:
 * `remaining` in getDayStats only ever reads `totals.kcal`, never `burned`.
 * ------------------------------------------------------------------- */

router.post("/steps", requireAuth, async (req, res, next) => {
  try {
    const steps = Number(req.body?.steps);
    if (!Number.isFinite(steps) || steps === 0 || Math.abs(steps) > 20_000) {
      return res.status(400).json({ error: "invalid_steps" });
    }
    await query("INSERT INTO step_logs (user_id, steps) VALUES ($1, $2)", [req.userId, Math.round(steps)]);
    const tz = Number(req.body?.tz) || 0;
    const stats = await getDayStats(req.userId, null, tz);
    res.status(201).json({ stepsToday: stats.stepsToday });
  } catch (err) {
    next(err);
  }
});

router.delete("/steps/today", requireAuth, async (req, res, next) => {
  try {
    const tz = Number(req.query.tz) || 0;
    const { start, end } = dayRange(null, tz);
    await query("DELETE FROM step_logs WHERE user_id = $1 AND logged_at >= $2 AND logged_at < $3", [req.userId, start, end]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

/* ----------------------------- weight ---------------------------- */

router.get("/weight", requireAuth, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT weight_kg, recorded_at FROM weight_history
        WHERE user_id = $1 ORDER BY recorded_at ASC LIMIT 200`,
      [req.userId]
    );
    res.json({ history: rows.map((r) => ({ weightKg: r.weight_kg, recordedAt: r.recorded_at })) });
  } catch (err) {
    next(err);
  }
});

export default router;
