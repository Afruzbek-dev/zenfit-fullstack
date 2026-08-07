import { Router } from "express";
import { query, daysAgoIso } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getDayStats, getStreak, dayRange } from "../lib/stats.js";

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

    const [meals, workouts, activities] = await Promise.all([
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
      buckets.set(d.toISOString().slice(0, 10), { date: d.toISOString().slice(0, 10), consumed: 0, burned: 0 });
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

    res.json({ days: [...buckets.values()] });
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
