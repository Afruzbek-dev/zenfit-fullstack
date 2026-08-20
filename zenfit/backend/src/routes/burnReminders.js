import { Router } from "express";
import { query, queryOne } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { stepsToKcal } from "../lib/activities.js";

const router = Router();

/** Enough to make the point without turning Home into a wall of guilt. */
const MAX_OPEN = 5;

/**
 * How much burn the user has logged since a reminder was raised.
 *
 * Counts the same three sources the `burned` stat does — strength, cardio and
 * steps — and pointedly nothing else. This never touches `remaining`: the
 * daily budget is target minus eaten, and a debt is a separate conversation.
 */
async function burnedSince(userId, sinceIso, weightKg) {
  const [work, act, steps] = await Promise.all([
    queryOne(`SELECT COALESCE(SUM(kcal), 0) AS v FROM workout_logs WHERE user_id = $1 AND logged_at >= $2`, [userId, sinceIso]),
    queryOne(`SELECT COALESCE(SUM(kcal), 0) AS v FROM activities WHERE user_id = $1 AND logged_at >= $2`, [userId, sinceIso]),
    queryOne(`SELECT COALESCE(SUM(steps), 0) AS v FROM step_logs WHERE user_id = $1 AND logged_at >= $2`, [userId, sinceIso]),
  ]);
  return (Number(work?.v) || 0) + (Number(act?.v) || 0) + stepsToKcal(Number(steps?.v) || 0, weightKg);
}

/**
 * Outstanding debts.
 *
 * Clearing is lazy rather than scheduled: there is no job that could notice a
 * walk paid one off, and checking on read costs three indexed sums per open
 * reminder — of which there are at most five.
 */
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const profile = await queryOne("SELECT weight_kg FROM profiles WHERE user_id = $1", [req.userId]);
    const rows = await query(
      `SELECT * FROM burn_reminders WHERE user_id = $1 AND cleared_at IS NULL ORDER BY created_at ASC LIMIT ${MAX_OPEN}`,
      [req.userId]
    );

    const open = [];
    for (const r of rows) {
      const burned = await burnedSince(req.userId, new Date(r.created_at).toISOString(), Number(profile?.weight_kg));
      if (burned >= r.kcal) {
        await query("UPDATE burn_reminders SET cleared_at = now() WHERE id = $1", [r.id]);
        continue;
      }
      open.push({
        id: r.id,
        mealName: r.meal_name,
        kcal: r.kcal,
        walkMinutes: r.walk_minutes,
        burnedSince: Math.round(burned),
        createdAt: r.created_at,
      });
    }

    res.json({ reminders: open });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const kcal = Number(req.body?.kcal);
    if (!Number.isFinite(kcal) || kcal <= 0 || kcal > 10_000) {
      return res.status(400).json({ error: "invalid_kcal" });
    }
    const mealName = typeof req.body?.mealName === "string" ? req.body.mealName.trim().slice(0, 120) : null;
    const walkMinutes =
      Number.isFinite(req.body?.walkMinutes) && req.body.walkMinutes > 0
        ? Math.min(Math.round(req.body.walkMinutes), 600)
        : null;

    const openRow = await queryOne(
      "SELECT COUNT(*) AS n FROM burn_reminders WHERE user_id = $1 AND cleared_at IS NULL",
      [req.userId]
    );
    if ((Number(openRow?.n) || 0) >= MAX_OPEN) {
      return res.status(400).json({ error: "too_many_reminders", message: "Juda ko'p eslatma ochiq." });
    }

    const rows = await query(
      `INSERT INTO burn_reminders (user_id, meal_name, kcal, walk_minutes)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.userId, mealName, Math.round(kcal), walkMinutes]
    );
    const r = rows[0];
    res.status(201).json({
      reminder: {
        id: r.id,
        mealName: r.meal_name,
        kcal: r.kcal,
        walkMinutes: r.walk_minutes,
        burnedSince: 0,
        createdAt: r.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

/** Dismissing is clearing — the row is kept so the same meal is not re-flagged. */
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    await query("UPDATE burn_reminders SET cleared_at = now() WHERE id = $1 AND user_id = $2", [
      req.params.id,
      req.userId,
    ]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
