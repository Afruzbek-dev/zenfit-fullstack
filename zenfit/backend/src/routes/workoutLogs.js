import { Router } from "express";
import { query, queryOne } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { mapWorkoutLog, mapExerciseSet } from "../lib/mappers.js";
import { dayRange } from "../lib/stats.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const tz = Number(req.query.tz) || 0;
    const { start, end } = dayRange(req.query.date, tz);
    const rows = await query(
      `SELECT * FROM workout_logs WHERE user_id = $1 AND logged_at >= $2 AND logged_at < $3
        ORDER BY logged_at ASC`,
      [req.userId, start, end]
    );
    res.json({ workoutLogs: rows.map(mapWorkoutLog) });
  } catch (err) {
    next(err);
  }
});

/** All logs, used by the workout screen to mark completed plan days. */
router.get("/history", requireAuth, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT * FROM workout_logs WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 300`,
      [req.userId]
    );
    res.json({ workoutLogs: rows.map(mapWorkoutLog) });
  } catch (err) {
    next(err);
  }
});

/**
 * Logs a finished exercise plus its individual sets, which is what makes
 * progressive overload possible (the next session reads the last weights).
 */
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { exerciseId, exerciseName, emoji, kcal, setsCompleted, planDay, sets } = req.body || {};
    if (!exerciseName) return res.status(400).json({ error: "exerciseName_required" });

    const logRows = await query(
      `INSERT INTO workout_logs (user_id, exercise_id, exercise_name, emoji, kcal, sets_completed, plan_day)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        req.userId, exerciseId || null, String(exerciseName).slice(0, 120), emoji || null,
        Number.isFinite(kcal) ? Math.round(kcal) : 0,
        Number.isFinite(setsCompleted) ? setsCompleted : (Array.isArray(sets) ? sets.length : null),
        planDay || null,
      ]
    );
    const log = logRows[0];

    if (Array.isArray(sets)) {
      for (let i = 0; i < sets.length; i += 1) {
        const s = sets[i];
        await query(
          `INSERT INTO exercise_sets (user_id, workout_log_id, exercise_id, exercise_name, set_number, reps, weight_kg)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            req.userId, log.id, exerciseId || exerciseName, exerciseName, i + 1,
            Number.isFinite(s?.reps) ? s.reps : null,
            Number.isFinite(s?.weightKg) ? s.weightKg : null,
          ]
        );
      }
    }

    res.status(201).json({ workoutLog: mapWorkoutLog(log) });
  } catch (err) {
    next(err);
  }
});

/**
 * Last recorded sets for every exercise, keyed by exercise id. One request so
 * plan generation can apply progressive overload across the whole week.
 */
router.get("/last-sets", requireAuth, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT exercise_id, workout_log_id, set_number, reps, weight_kg, logged_at
         FROM exercise_sets WHERE user_id = $1
        ORDER BY logged_at DESC LIMIT 600`,
      [req.userId]
    );

    // Rows arrive newest-first, so the first workout_log_id seen for an
    // exercise is its most recent session; later sessions are ignored.
    const latestLogFor = {};
    const byExercise = {};
    for (const r of rows) {
      if (latestLogFor[r.exercise_id] === undefined) latestLogFor[r.exercise_id] = r.workout_log_id;
      if (latestLogFor[r.exercise_id] !== r.workout_log_id) continue;
      (byExercise[r.exercise_id] ||= []).push({ setNumber: r.set_number, reps: r.reps, weightKg: r.weight_kg });
    }
    Object.values(byExercise).forEach((sets) => sets.sort((a, b) => a.setNumber - b.setNumber));

    res.json({ byExercise });
  } catch (err) {
    next(err);
  }
});

/** Last recorded sets for one exercise — drives the suggested next weight. */
router.get("/last-sets/:exerciseId", requireAuth, async (req, res, next) => {
  try {
    const last = await queryOne(
      `SELECT workout_log_id FROM exercise_sets
        WHERE user_id = $1 AND exercise_id = $2
        ORDER BY logged_at DESC LIMIT 1`,
      [req.userId, req.params.exerciseId]
    );
    if (!last) return res.json({ sets: [] });

    const rows = await query(
      `SELECT * FROM exercise_sets WHERE user_id = $1 AND workout_log_id = $2 ORDER BY set_number ASC`,
      [req.userId, last.workout_log_id]
    );
    res.json({ sets: rows.map(mapExerciseSet) });
  } catch (err) {
    next(err);
  }
});

export default router;
