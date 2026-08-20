import { Router } from "express";
import { query, queryOne } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { mapWorkoutLog, mapExerciseSet } from "../lib/mappers.js";
import { dayRange } from "../lib/stats.js";
import { computeStrengthKcal } from "../lib/activities.js";

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
    const { exerciseId, exerciseName, emoji, compound, setsCompleted, planDay, sets } = req.body || {};
    if (!exerciseName) return res.status(400).json({ error: "exerciseName_required" });

    const doneSets = Number.isFinite(setsCompleted) ? setsCompleted : (Array.isArray(sets) ? sets.length : null);

    // Burned calories are derived here, never taken from the request. A client
    // figure would be both forgeable and stale the moment the model is tuned —
    // cardio has always worked this way and strength now matches it.
    const profile = await queryOne(`SELECT weight_kg FROM profiles WHERE user_id = $1`, [req.userId]);
    const kcal = computeStrengthKcal({
      setsCompleted: doneSets,
      compound: Boolean(compound),
      weightKg: Number(profile?.weight_kg) || undefined,
    });

    const logRows = await query(
      `INSERT INTO workout_logs (user_id, exercise_id, exercise_name, emoji, kcal, sets_completed, plan_day)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        req.userId, exerciseId || null, String(exerciseName).slice(0, 120), emoji || null,
        kcal, doneSets, planDay || null,
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

/** Minutes credited per set — the same constant computeStrengthKcal uses. */
const MIN_PER_SET = 1.6;

/**
 * What one day of training actually came to.
 *
 * Everything here is derived from rows that already exist: `workout_logs`
 * carries the server-computed burn, `exercise_sets` carries every rep and
 * weight. There is no session record to write because there is nothing a
 * session record would know that these two do not.
 */
router.get("/day-summary", requireAuth, async (req, res, next) => {
  try {
    const tz = Number(req.query.tz) || 0;
    const { day, start, end } = dayRange(req.query.date, tz);
    const planDay = typeof req.query.planDay === "string" && req.query.planDay ? req.query.planDay : null;

    const logs = await query(
      `SELECT id, exercise_id, exercise_name, kcal, sets_completed, plan_day, logged_at
         FROM workout_logs
        WHERE user_id = $1 AND logged_at >= $2 AND logged_at < $3
        ORDER BY logged_at ASC`,
      [req.userId, start, end]
    );
    const dayLogs = planDay ? logs.filter((l) => l.plan_day === planDay) : logs;

    if (dayLogs.length === 0) {
      return res.json({
        summary: { date: day, kcal: 0, exerciseCount: 0, setCount: 0, repCount: 0, volumeKg: 0, minutes: 0, exercises: [] },
      });
    }

    const logIds = new Set(dayLogs.map((l) => String(l.id)));
    const sets = await query(
      `SELECT workout_log_id, exercise_id, exercise_name, reps, weight_kg
         FROM exercise_sets
        WHERE user_id = $1 AND logged_at >= $2 AND logged_at < $3`,
      [req.userId, start, end]
    );

    const byExercise = new Map();
    for (const l of dayLogs) {
      const key = l.exercise_id || l.exercise_name;
      const entry = byExercise.get(key) || { exerciseId: l.exercise_id, exerciseName: l.exercise_name, sets: 0, reps: 0, volumeKg: 0, topWeightKg: 0 };
      entry.exerciseName = l.exercise_name || entry.exerciseName;
      byExercise.set(key, entry);
    }

    let setCount = 0;
    let repCount = 0;
    let volumeKg = 0;
    for (const s of sets) {
      if (!logIds.has(String(s.workout_log_id))) continue;
      const key = s.exercise_id || s.exercise_name;
      const entry = byExercise.get(key);
      if (!entry) continue;
      const reps = Number(s.reps) || 0;
      const weight = Number(s.weight_kg) || 0;
      entry.sets += 1;
      entry.reps += reps;
      entry.volumeKg += reps * weight;
      if (weight > entry.topWeightKg) entry.topWeightKg = weight;
      setCount += 1;
      repCount += reps;
      volumeKg += reps * weight;
    }

    // Fall back to sets × 1.6 min when the whole day was logged in one go —
    // first-to-last timestamps would otherwise report a 0-minute workout.
    const firstAt = new Date(dayLogs[0].logged_at).getTime();
    const lastAt = new Date(dayLogs[dayLogs.length - 1].logged_at).getTime();
    const spanMin = Number.isFinite(firstAt) && Number.isFinite(lastAt) ? (lastAt - firstAt) / 60_000 : 0;
    const loggedSets = setCount || dayLogs.reduce((n, l) => n + (Number(l.sets_completed) || 0), 0);

    res.json({
      summary: {
        date: day,
        kcal: dayLogs.reduce((n, l) => n + (Number(l.kcal) || 0), 0),
        exerciseCount: byExercise.size,
        setCount: loggedSets,
        repCount,
        volumeKg: Math.round(volumeKg),
        minutes: Math.max(1, Math.round(Math.max(spanMin, loggedSets * MIN_PER_SET))),
        exercises: [...byExercise.values()].map((e) => ({ ...e, volumeKg: Math.round(e.volumeKg) })),
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Per-exercise all-time records.
 *
 * Grouped twice: the inner query collapses each session, the outer one takes
 * the best and the sum across them. That inner step is what makes "best single
 * session" answerable at all — it cannot be read off individual set rows.
 */
router.get("/records", requireAuth, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT exercise_id, exercise_name,
              MAX(v) AS best_session_volume, SUM(v) AS total_volume,
              SUM(st) AS total_sets, SUM(rp) AS total_reps,
              MAX(mw) AS max_weight, MAX(last_at) AS last_at, COUNT(*) AS sessions
         FROM (SELECT exercise_id, exercise_name, workout_log_id,
                      SUM(COALESCE(reps,0) * COALESCE(weight_kg,0)) AS v,
                      COUNT(*) AS st, SUM(COALESCE(reps,0)) AS rp,
                      MAX(weight_kg) AS mw, MAX(logged_at) AS last_at
                 FROM exercise_sets WHERE user_id = $1
                GROUP BY exercise_id, exercise_name, workout_log_id) g
        GROUP BY exercise_id, exercise_name
        ORDER BY total_volume DESC`,
      [req.userId]
    );

    const num = (v) => Number(v) || 0;
    const records = rows.map((r) => ({
      exerciseId: r.exercise_id,
      exerciseName: r.exercise_name,
      maxWeightKg: num(r.max_weight),
      bestSessionVolumeKg: Math.round(num(r.best_session_volume)),
      totalVolumeKg: Math.round(num(r.total_volume)),
      totalSets: num(r.total_sets),
      totalReps: num(r.total_reps),
      sessions: num(r.sessions),
      lastAt: r.last_at,
    }));

    res.json({
      records,
      totals: {
        volumeKg: records.reduce((n, r) => n + r.totalVolumeKg, 0),
        sets: records.reduce((n, r) => n + r.totalSets, 0),
        reps: records.reduce((n, r) => n + r.totalReps, 0),
        exercises: records.length,
      },
    });
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
