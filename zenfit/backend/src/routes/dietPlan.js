import { Router } from "express";
import { query, queryOne, parseJsonColumn } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { mapCustomDietItem } from "../lib/mappers.js";
import { MEAL_SLOT_SETS } from "../lib/aiFeatures.js";

const router = Router();

/** Same defensive cap as PANTRY_MAX (routes/profile.js) — a bound on a user-controlled collection. */
const CUSTOM_PLAN_MAX_ITEMS = 200;

async function resolveSlots(userId) {
  const profile = await queryOne("SELECT diet_prefs FROM profiles WHERE user_id = $1", [userId]);
  const prefs = parseJsonColumn(profile?.diet_prefs);
  return MEAL_SLOT_SETS[prefs?.mealsPerDay] || MEAL_SLOT_SETS[4];
}

// GET /api/diet-plan/custom
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const [items, slots] = await Promise.all([
      query("SELECT * FROM custom_diet_plan_items WHERE user_id = $1 ORDER BY slot_index ASC, id ASC", [req.userId]),
      resolveSlots(req.userId),
    ]);
    res.json({ items: items.map(mapCustomDietItem), slots });
  } catch (err) {
    next(err);
  }
});

// POST /api/diet-plan/custom/items
router.post("/items", requireAuth, async (req, res, next) => {
  try {
    const { slotIndex, foodId, name, emoji, portion, kcal, carbs, protein, fat } = req.body || {};

    const slots = await resolveSlots(req.userId);
    if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= slots.length) {
      return res.status(400).json({ error: "invalid_slot_index" });
    }
    if (!name || typeof name !== "string" || !Number.isFinite(kcal) || kcal < 0 || kcal > 10000) {
      return res.status(400).json({ error: "name_and_valid_kcal_required" });
    }
    if (foodId != null && !/^[a-z0-9-]{1,40}$/i.test(String(foodId))) {
      return res.status(400).json({ error: "invalid_food_id" });
    }

    const { count } = await queryOne("SELECT COUNT(*) AS count FROM custom_diet_plan_items WHERE user_id = $1", [req.userId]);
    if (Number(count) >= CUSTOM_PLAN_MAX_ITEMS) {
      return res.status(400).json({ error: "custom_plan_full", message: "Rejangizda juda ko'p taom bor." });
    }

    const rows = await query(
      `INSERT INTO custom_diet_plan_items (user_id, slot_index, food_id, name, emoji, portion, kcal, carbs, protein, fat)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        req.userId, slotIndex, foodId || null, String(name).slice(0, 120), emoji || null, portion ? String(portion).slice(0, 40) : null,
        Math.round(kcal),
        Number.isFinite(carbs) ? Math.round(carbs) : null,
        Number.isFinite(protein) ? Math.round(protein) : null,
        Number.isFinite(fat) ? Math.round(fat) : null,
      ]
    );
    res.status(201).json({ item: mapCustomDietItem(rows[0]) });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/diet-plan/custom/items/:id
router.delete("/items/:id", requireAuth, async (req, res, next) => {
  try {
    const owned = await queryOne(
      "SELECT id FROM custom_diet_plan_items WHERE id = $1 AND user_id = $2",
      [req.params.id, req.userId]
    );
    if (!owned) return res.status(404).json({ error: "not_found" });
    await query("DELETE FROM custom_diet_plan_items WHERE id = $1 AND user_id = $2", [req.params.id, req.userId]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
