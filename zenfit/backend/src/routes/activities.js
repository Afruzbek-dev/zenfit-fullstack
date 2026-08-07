import { Router } from "express";
import { query, queryOne } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { dayRange } from "../lib/stats.js";
import { computeActivityKcal, isKnownActivity, INTENSITIES } from "../lib/activities.js";
import { mapActivity } from "../lib/mappers.js";

const router = Router();

/** Today's activities (or a given day), newest first. */
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const tz = Number(req.query.tz) || 0;
    const { start, end } = dayRange(req.query.date || null, tz);
    const rows = await query(
      `SELECT * FROM activities
        WHERE user_id = $1 AND logged_at >= $2 AND logged_at < $3
        ORDER BY logged_at DESC`,
      [req.userId, start, end]
    );
    res.json({ activities: rows.map(mapActivity) });
  } catch (err) {
    next(err);
  }
});

/** Recent history across days, for the progress screen. */
router.get("/history", requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const rows = await query(
      `SELECT * FROM activities WHERE user_id = $1 ORDER BY logged_at DESC LIMIT ${limit}`,
      [req.userId]
    );
    res.json({ activities: rows.map(mapActivity) });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { activityId, name, emoji, durationMin, distanceKm, intensity, note } = req.body || {};

    const id = typeof activityId === "string" && isKnownActivity(activityId) ? activityId : "custom";
    const minutes = Number(durationMin);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 600) {
      return res.status(400).json({ error: "invalid_duration", message: "Davomiylik 1–600 daqiqa oralig'ida bo'lishi kerak." });
    }

    const km = Number(distanceKm);
    const distance = Number.isFinite(km) && km > 0 && km <= 300 ? km : null;
    const level = INTENSITIES.includes(intensity) ? intensity : "moderate";

    // A custom activity is the only case where the client names it; known
    // activities are labelled by the app so the title follows the UI language.
    const label = id === "custom" ? String(name || "").trim().slice(0, 60) : id;
    if (id === "custom" && !label) {
      return res.status(400).json({ error: "name_required", message: "Mashq nomini kiriting." });
    }

    const profile = await queryOne("SELECT weight_kg FROM profiles WHERE user_id = $1", [req.userId]);
    const kcal = computeActivityKcal({
      activityId: id,
      intensity: level,
      durationMin: minutes,
      distanceKm: distance,
      weightKg: profile?.weight_kg,
    });

    const row = await queryOne(
      `INSERT INTO activities (user_id, activity_id, name, emoji, duration_min, distance_km, intensity, kcal, note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        req.userId,
        id,
        label,
        typeof emoji === "string" ? emoji.slice(0, 8) : null,
        Math.round(minutes),
        distance,
        level,
        kcal,
        typeof note === "string" ? note.trim().slice(0, 200) || null : null,
      ]
    );

    res.status(201).json({ activity: mapActivity(row) });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const rows = await query("DELETE FROM activities WHERE id = $1 AND user_id = $2 RETURNING id", [
      req.params.id,
      req.userId,
    ]);
    if (!rows.length) return res.status(404).json({ error: "not_found" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
