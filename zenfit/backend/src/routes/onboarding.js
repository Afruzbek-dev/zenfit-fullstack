import { Router } from "express";
import { query, queryOne } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { computeTargets, AGE_MIN, AGE_MAX } from "../lib/calorie.js";
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
      pregnant,
    } = req.body || {};

    // AGE_MIN/AGE_MAX come from the calorie engine so this route and the profile
    // editor cannot disagree about who is allowed to have a target computed.
    if (
      !VALID_GENDERS.includes(gender) ||
      !Number.isFinite(age) || age < AGE_MIN || age > AGE_MAX ||
      !Number.isFinite(heightCm) || heightCm < 100 || heightCm > 250 ||
      !Number.isFinite(weightKg) || weightKg < 30 || weightKg > 300 ||
      !VALID_ACTIVITY.includes(activityLevel) ||
      !VALID_GOALS.includes(goal)
    ) {
      return res.status(400).json({ error: "invalid_or_missing_fields" });
    }

    // Only asked of, and only meaningful for, female users — a stray `true` from
    // anywhere else must not buy a 340 kcal surplus.
    const isPregnant = gender === "female" && pregnant === true;

    /*
     * The goal is not refused, it is corrected. computeTargets downgrades an
     * unsafe "lose" to "maintain" internally and reports why in `safety`, so
     * what gets stored below is already the safe goal. Answering a 400 here
     * instead would strand the user mid-onboarding on a screen whose only
     * choices are the one that was just rejected — the explanation the client
     * renders from `safety.reasons` is the useful half of a refusal without
     * the dead end.
     */
    const targets = computeTargets({ gender, age, heightCm, weightKg, activityLevel, goal, pregnant: isPregnant });
    const effectiveGoal = targets.goal;

    // The date is derived here rather than trusted from the client, so the
    // promise the user sees is always the safe-rate one. Keyed off the
    // effective goal: a downgraded "lose" must not keep a slimming deadline.
    const target = isValidTarget({ goal: effectiveGoal, currentKg: weightKg, targetKg: Number(targetWeightKg) })
      ? estimateGoal({ goal: effectiveGoal, currentKg: weightKg, targetKg: Number(targetWeightKg) })
      : null;

    await query(
      `UPDATE profiles SET
         gender = $1, age = $2, height_cm = $3, weight_kg = $4,
         activity_level = $5, goal = $6,
         daily_calorie_target = $7, carbs_target_g = $8, protein_target_g = $9, fat_target_g = $10,
         fitness_level = $11, equipment = $12, days_per_week = $13,
         session_duration = $14, injuries = $15,
         target_weight_kg = $16, target_date = $17, pregnant = $18,
         neat_confirmed = true, onboarding_completed = true, updated_at = now()
       WHERE user_id = $19`,
      [
        gender, age, heightCm, weightKg, activityLevel, effectiveGoal,
        targets.dailyCalorieTarget, targets.carbsTargetG, targets.proteinTargetG, targets.fatTargetG,
        VALID_LEVELS.includes(fitnessLevel) ? fitnessLevel : null,
        VALID_EQUIPMENT.includes(equipment) ? equipment : null,
        Number.isFinite(daysPerWeek) ? daysPerWeek : null,
        sessionDuration || null,
        injuries || null,
        target ? Number(targetWeightKg) : null,
        target ? target.targetDate : null,
        isPregnant,
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
    // `safety` is what lets the client say why the goal it sent back is not the
    // goal it asked for. Without it the downgrade is silent.
    res.json({ profile: mapProfile(profile), computed: targets, goalPlan: target, safety: targets.safety });
  } catch (err) {
    next(err);
  }
});

export default router;
