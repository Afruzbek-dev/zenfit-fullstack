import { Router } from "express";
import { query, queryOne } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { mapMeal } from "../lib/mappers.js";
import { dayRange, getRecentFoods } from "../lib/stats.js";

const router = Router();

// GET /api/meals?date=2026-08-06&tz=-300  (tz = client getTimezoneOffset())
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const tz = Number(req.query.tz) || 0;
    const { start, end } = dayRange(req.query.date, tz);
    const rows = await query(
      `SELECT * FROM meals WHERE user_id = $1 AND logged_at >= $2 AND logged_at < $3
        ORDER BY logged_at ASC`,
      [req.userId, start, end]
    );
    res.json({ meals: rows.map(mapMeal) });
  } catch (err) {
    next(err);
  }
});

/** Declared before "/:id" so the literal path is not swallowed by the param route. */
router.get("/recent", requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 20);
    res.json({ foods: await getRecentFoods(req.userId, limit) });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { name, emoji, kcal, carbs, protein, fat, portionG, source } = req.body || {};
    if (!name || !Number.isFinite(kcal) || kcal < 0 || kcal > 10000) {
      return res.status(400).json({ error: "name_and_valid_kcal_required" });
    }

    const rows = await query(
      `INSERT INTO meals (user_id, name, emoji, kcal, carbs, protein, fat, portion_g, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [
        req.userId, String(name).slice(0, 120), emoji || null, Math.round(kcal),
        Number.isFinite(carbs) ? Math.round(carbs) : null,
        Number.isFinite(protein) ? Math.round(protein) : null,
        Number.isFinite(fat) ? Math.round(fat) : null,
        Number.isFinite(portionG) ? Math.round(portionG) : null,
        source || "manual",
      ]
    );
    res.status(201).json({ meal: mapMeal(rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const owned = await queryOne("SELECT id FROM meals WHERE id = $1 AND user_id = $2", [req.params.id, req.userId]);
    if (!owned) return res.status(404).json({ error: "not_found" });
    await query("DELETE FROM meals WHERE id = $1 AND user_id = $2", [req.params.id, req.userId]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
