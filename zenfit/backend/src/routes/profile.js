import { Router } from "express";
import { query, queryOne } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { computeTargets } from "../lib/calorie.js";
import { mapProfile, mapSubscription } from "../lib/mappers.js";

const router = Router();

const GENDERS = ["male", "female"];
const GOALS = ["lose", "maintain", "gain"];
const LEVELS = ["beginner", "intermediate", "advanced"];
const ACTIVITY_LEVELS = ["sedentary", "light", "moderate", "active", "very_active"];
const LANGUAGES = ["uz", "ru", "en"];
const THEMES = ["dark", "light", "system"];

/** Avatars are stored inline as data URIs; anything larger belongs in object storage. */
const MAX_AVATAR_BYTES = 220_000;

function userPayload(u) {
  if (!u) return null;
  return { id: u.id, firstName: u.first_name, username: u.username, avatarUrl: u.avatar_url };
}

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const [profile, subscription, user] = await Promise.all([
      queryOne("SELECT * FROM profiles WHERE user_id = $1", [req.userId]),
      queryOne("SELECT * FROM subscriptions WHERE user_id = $1", [req.userId]),
      queryOne("SELECT id, first_name, username, avatar_url FROM users WHERE id = $1", [req.userId]),
    ]);
    // The user block is included so a restored session (token from storage)
    // still knows who it belongs to without a second round trip.
    res.json({
      profile: mapProfile(profile),
      subscription: mapSubscription(subscription),
      user: userPayload(user),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Partial profile update. Everything the profile editor, the settings screen
 * and the older "select program"/weight flows write goes through here.
 *
 * Fields are collected into a single UPDATE so one request cannot leave the row
 * half-written, and body metrics trigger a target recalculation exactly once
 * even when several of them change together.
 */
router.patch("/", requireAuth, async (req, res, next) => {
  try {
    const existing = await queryOne("SELECT * FROM profiles WHERE user_id = $1", [req.userId]);
    if (!existing) return res.status(400).json({ error: "profile_not_found" });

    const b = req.body || {};
    const sets = [];
    const params = [];
    const set = (column, value) => {
      params.push(value);
      sets.push(`${column} = $${params.length}`);
    };

    /* ----- identity ---------------------------------------------------- */
    if (b.displayName !== undefined) {
      const name = String(b.displayName || "").trim().slice(0, 60);
      set("display_name", name || null);
    }

    if (b.avatarUrl !== undefined) {
      const avatar = b.avatarUrl;
      if (avatar === null || avatar === "") {
        await query("UPDATE users SET avatar_url = NULL WHERE id = $1", [req.userId]);
      } else if (typeof avatar === "string" && /^data:image\/(png|jpeg|webp);base64,/.test(avatar)) {
        if (avatar.length > MAX_AVATAR_BYTES) {
          return res.status(413).json({ error: "avatar_too_large", message: "Rasm juda katta. Kichikroq rasm tanlang." });
        }
        await query("UPDATE users SET avatar_url = $1 WHERE id = $2", [avatar, req.userId]);
      } else {
        return res.status(400).json({ error: "invalid_avatar" });
      }
    }

    /* ----- body metrics ------------------------------------------------- */
    let weightChanged = false;
    const metrics = {
      gender: existing.gender,
      age: existing.age,
      heightCm: existing.height_cm,
      weightKg: existing.weight_kg,
      activityLevel: existing.activity_level,
      goal: existing.goal,
    };
    let metricsTouched = false;

    if (GENDERS.includes(b.gender)) {
      set("gender", b.gender);
      metrics.gender = b.gender;
      metricsTouched = true;
    }
    if (Number.isFinite(b.age) && b.age >= 12 && b.age <= 100) {
      set("age", Math.round(b.age));
      metrics.age = Math.round(b.age);
      metricsTouched = true;
    }
    if (Number.isFinite(b.heightCm) && b.heightCm >= 100 && b.heightCm <= 250) {
      set("height_cm", b.heightCm);
      metrics.heightCm = b.heightCm;
      metricsTouched = true;
    }
    if (Number.isFinite(b.weightKg) && b.weightKg >= 30 && b.weightKg <= 300) {
      set("weight_kg", b.weightKg);
      metrics.weightKg = b.weightKg;
      metricsTouched = true;
      // Only a real change belongs in the trend chart.
      weightChanged = Math.abs((existing.weight_kg || 0) - b.weightKg) > 0.001;
    }
    if (ACTIVITY_LEVELS.includes(b.activityLevel)) {
      set("activity_level", b.activityLevel);
      metrics.activityLevel = b.activityLevel;
      metricsTouched = true;
    }
    if (GOALS.includes(b.goal)) {
      set("goal", b.goal);
      metrics.goal = b.goal;
      metricsTouched = true;
    }

    if (metricsTouched && metrics.age && metrics.heightCm && metrics.weightKg) {
      const t = computeTargets(metrics);
      set("daily_calorie_target", t.dailyCalorieTarget);
      set("carbs_target_g", t.carbsTargetG);
      set("protein_target_g", t.proteinTargetG);
      set("fat_target_g", t.fatTargetG);
    }

    /* ----- training preferences ----------------------------------------- */
    if (LEVELS.includes(b.fitnessLevel)) set("fitness_level", b.fitnessLevel);
    if (b.activeProgramId !== undefined) set("active_program_id", b.activeProgramId ?? null);
    if (b.equipment !== undefined) set("equipment", b.equipment || null);
    if (Number.isFinite(b.daysPerWeek) && b.daysPerWeek >= 1 && b.daysPerWeek <= 7) set("days_per_week", Math.round(b.daysPerWeek));
    if (b.sessionDuration !== undefined) set("session_duration", b.sessionDuration || null);
    if (b.injuries !== undefined) set("injuries", String(b.injuries || "").trim().slice(0, 300) || null);
    if (Number.isFinite(b.waterTargetMl) && b.waterTargetMl >= 500 && b.waterTargetMl <= 6000) {
      set("water_target_ml", Math.round(b.waterTargetMl));
    }

    /* ----- app settings -------------------------------------------------- */
    if (LANGUAGES.includes(b.language)) set("language", b.language);
    if (THEMES.includes(b.theme)) set("theme", b.theme);
    if (b.notifications && typeof b.notifications === "object") {
      const map = { workout: "notif_workout", meal: "notif_meal", water: "notif_water", tips: "notif_tips" };
      for (const [key, column] of Object.entries(map)) {
        if (typeof b.notifications[key] === "boolean") set(column, b.notifications[key]);
      }
    }

    if (sets.length) {
      params.push(req.userId);
      await query(`UPDATE profiles SET ${sets.join(", ")}, updated_at = now() WHERE user_id = $${params.length}`, params);
    }

    if (weightChanged) {
      await query("INSERT INTO weight_history (user_id, weight_kg) VALUES ($1, $2)", [req.userId, metrics.weightKg]);
    }

    const [profile, user] = await Promise.all([
      queryOne("SELECT * FROM profiles WHERE user_id = $1", [req.userId]),
      queryOne("SELECT id, first_name, username, avatar_url FROM users WHERE id = $1", [req.userId]),
    ]);
    res.json({ profile: mapProfile(profile), user: userPayload(user) });
  } catch (err) {
    next(err);
  }
});

export default router;
