import { Router } from "express";
import { query, queryOne } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { computeTargets } from "../lib/calorie.js";
import { estimateGoal, isValidTarget } from "../lib/goalPlan.js";
import { mapProfile } from "../lib/mappers.js";

const router = Router();

const VALID_GENDERS = ["male", "female"];
const VALID_ACTIVITY = ["sedentary", "light", "moderate", "active", "very_active"];
const VALID_GOALS = ["lose", "maintain", "gain"];
const VALID_LEVELS = ["beginner", "intermediate", "advanced"];
const VALID_EQUIPMENT = ["home-none", "home-dumbbell", "gym", "outdoor"];

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const {
      gender, age, heightCm, weightKg, activityLevel, goal,
      fitnessLevel, equipment, daysPerWeek, sessionDuration, injuries, targetWeightKg,
    } = req.body || {};

    if (
      !VALID_GENDERS.includes(gender) ||
      !Number.isFinite(age) || age < 10 || age > 100 ||
      !Number.isFinite(heightCm) || heightCm < 100 || heightCm > 250 ||
      !Number.isFinite(weightKg) || weightKg < 30 || weightKg > 300 ||
      !VALID_ACTIVITY.includes(activityLevel) ||
      !VALID_GOALS.includes(goal)
    ) {
      return res.status(400).json({ error: "invalid_or_missing_fields" });
    }

    const targets = computeTargets({ gender, age, heightCm, weightKg, activityLevel, goal });

    // The date is derived here rather than trusted from the client, so the
    // promise the user sees is always the safe-rate one.
    const target = isValidTarget({ goal, currentKg: weightKg, targetKg: Number(targetWeightKg) })
      ? estimateGoal({ goal, currentKg: weightKg, targetKg: Number(targetWeightKg) })
      : null;

    await query(
      `UPDATE profiles SET
         gender = $1, age = $2, height_cm = $3, weight_kg = $4,
         activity_level = $5, goal = $6,
         daily_calorie_target = $7, carbs_target_g = $8, protein_target_g = $9, fat_target_g = $10,
         fitness_level = $11, equipment = $12, days_per_week = $13,
         session_duration = $14, injuries = $15,
         target_weight_kg = $16, target_date = $17,
         neat_confirmed = true, onboarding_completed = true, updated_at = now()
       WHERE user_id = $18`,
      [
        gender, age, heightCm, weightKg, activityLevel, goal,
        targets.dailyCalorieTarget, targets.carbsTargetG, targets.proteinTargetG, targets.fatTargetG,
        VALID_LEVELS.includes(fitnessLevel) ? fitnessLevel : null,
        VALID_EQUIPMENT.includes(equipment) ? equipment : null,
        Number.isFinite(daysPerWeek) ? daysPerWeek : null,
        sessionDuration || null,
        injuries || null,
        target ? Number(targetWeightKg) : null,
        target ? target.targetDate : null,
        req.userId,
      ]
    );

    // Seed the weight chart, but only when the value actually changed — the
    // onboarding flow posts twice (once to compute targets, once to finish).
    const lastWeight = await queryOne(
      `SELECT weight_kg FROM weight_history WHERE user_id = $1 ORDER BY recorded_at DESC LIMIT 1`,
      [req.userId]
    );
    if (!lastWeight || Number(lastWeight.weight_kg) !== Number(weightKg)) {
      await query(`INSERT INTO weight_history (user_id, weight_kg) VALUES ($1, $2)`, [req.userId, weightKg]);
    }

    const profile = await queryOne("SELECT * FROM profiles WHERE user_id = $1", [req.userId]);
    res.json({ profile: mapProfile(profile), computed: targets, goalPlan: target });
  } catch (err) {
    next(err);
  }
});

export default router;
