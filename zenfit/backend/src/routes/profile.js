import { Router } from "express";
import { query, queryOne } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { computeTargets } from "../lib/calorie.js";
import { mapProfile, mapSubscription } from "../lib/mappers.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const [profile, subscription, user] = await Promise.all([
      queryOne("SELECT * FROM profiles WHERE user_id = $1", [req.userId]),
      queryOne("SELECT * FROM subscriptions WHERE user_id = $1", [req.userId]),
      queryOne("SELECT id, first_name, username FROM users WHERE id = $1", [req.userId]),
    ]);
    // The user block is included so a restored session (token from storage)
    // still knows who it belongs to without a second round trip.
    res.json({
      profile: mapProfile(profile),
      subscription: mapSubscription(subscription),
      user: user ? { id: user.id, firstName: user.first_name, username: user.username } : null,
    });
  } catch (err) {
    next(err);
  }
});

/** Partial profile update — used by "select program", weight edits and settings. */
router.patch("/", requireAuth, async (req, res, next) => {
  try {
    const existing = await queryOne("SELECT * FROM profiles WHERE user_id = $1", [req.userId]);
    if (!existing) return res.status(400).json({ error: "profile_not_found" });

    const { activeProgramId, weightKg, waterTargetMl, injuries, equipment, daysPerWeek } = req.body || {};

    if (activeProgramId !== undefined) {
      await query(
        "UPDATE profiles SET active_program_id = $1, updated_at = now() WHERE user_id = $2",
        [activeProgramId ?? null, req.userId]
      );
    }

    if (Number.isFinite(weightKg) && weightKg >= 30 && weightKg <= 300) {
      // Recompute targets so calories follow the new bodyweight.
      const merged = {
        gender: existing.gender,
        age: existing.age,
        heightCm: existing.height_cm,
        weightKg,
        activityLevel: existing.activity_level,
        goal: existing.goal,
      };
      const targets = computeTargets(merged);
      await query(
        `UPDATE profiles SET weight_kg = $1, daily_calorie_target = $2, carbs_target_g = $3,
           protein_target_g = $4, fat_target_g = $5, updated_at = now()
         WHERE user_id = $6`,
        [weightKg, targets.dailyCalorieTarget, targets.carbsTargetG, targets.proteinTargetG, targets.fatTargetG, req.userId]
      );
      await query("INSERT INTO weight_history (user_id, weight_kg) VALUES ($1, $2)", [req.userId, weightKg]);
    }

    if (Number.isFinite(waterTargetMl) && waterTargetMl >= 500 && waterTargetMl <= 6000) {
      await query("UPDATE profiles SET water_target_ml = $1, updated_at = now() WHERE user_id = $2", [waterTargetMl, req.userId]);
    }
    if (injuries !== undefined) {
      await query("UPDATE profiles SET injuries = $1, updated_at = now() WHERE user_id = $2", [injuries || null, req.userId]);
    }
    if (equipment !== undefined) {
      await query("UPDATE profiles SET equipment = $1, updated_at = now() WHERE user_id = $2", [equipment || null, req.userId]);
    }
    if (Number.isFinite(daysPerWeek)) {
      await query("UPDATE profiles SET days_per_week = $1, updated_at = now() WHERE user_id = $2", [daysPerWeek, req.userId]);
    }

    const profile = await queryOne("SELECT * FROM profiles WHERE user_id = $1", [req.userId]);
    res.json({ profile: mapProfile(profile) });
  } catch (err) {
    next(err);
  }
});

export default router;
