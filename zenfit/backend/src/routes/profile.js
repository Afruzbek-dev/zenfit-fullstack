import { Router } from "express";
import { query, queryOne } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { computeTargets, AGE_MIN, AGE_MAX } from "../lib/calorie.js";
import { defaultTarget, isValidTarget, estimateGoal } from "../lib/goalPlan.js";
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
    const slotOf = new Map();
    /**
     * Assigning the same column twice revises it instead of appending a second
     * clause: Postgres rejects `SET goal = $1, goal = $7` outright, and two
     * places below legitimately change their mind — the calorie engine can
     * refuse the goal that was just accepted, and switching to male clears a
     * pregnancy flag the same request may have set.
     */
    const set = (column, value) => {
      const slot = slotOf.get(column);
      if (slot !== undefined) {
        params[slot] = value;
        return;
      }
      params.push(value);
      slotOf.set(column, params.length - 1);
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
      pregnant: existing.pregnant === true || existing.pregnant === 1,
    };
    let metricsTouched = false;

    if (GENDERS.includes(b.gender)) {
      set("gender", b.gender);
      metrics.gender = b.gender;
      metricsTouched = true;
      // Switching to male retires the flag rather than leaving a stale `true`
      // quietly paying out a pregnancy surplus for the rest of the account's life.
      if (b.gender !== "female" && metrics.pregnant) {
        set("pregnant", false);
        metrics.pregnant = false;
      }
    }
    if (typeof b.pregnant === "boolean") {
      const value = b.pregnant && metrics.gender === "female";
      set("pregnant", value);
      metrics.pregnant = value;
      metricsTouched = true;
    }
    if (Number.isFinite(b.age) && b.age >= AGE_MIN && b.age <= AGE_MAX) {
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
      // Answering the question again is what retires the re-check prompt —
      // the value now carries its new, training-free meaning.
      set("neat_confirmed", true);
    }
    if (GOALS.includes(b.goal)) {
      set("goal", b.goal);
      metrics.goal = b.goal;
      metricsTouched = true;
    }

    let safety = null;
    if (metricsTouched && metrics.age && metrics.heightCm && metrics.weightKg) {
      const t = computeTargets(metrics);
      safety = t.safety;
      set("daily_calorie_target", t.dailyCalorieTarget);
      set("carbs_target_g", t.carbsTargetG);
      set("protein_target_g", t.proteinTargetG);
      set("fat_target_g", t.fatTargetG);
      // The engine may have refused the requested goal. Store the one it
      // actually used, or the row would claim "lose" while carrying a
      // maintenance target — and the next edit would recompute from that lie.
      if (t.goal !== metrics.goal) {
        set("goal", t.goal);
        metrics.goal = t.goal;
      }
    }

    /**
     * Goal weight & timeline. Nothing in this route ever wrote these columns
     * before — onboarding was the only place a target could be set, so a goal
     * changed later (e.g. HealthData's goal picker) or a safety downgrade left
     * the Progress screen with no target to show progress against.
     */
    if (metricsTouched || b.targetWeightKg !== undefined) {
      if (metrics.goal === "lose" || metrics.goal === "gain") {
        const requested = Number.isFinite(b.targetWeightKg) ? b.targetWeightKg : null;
        const stored = existing.target_weight_kg;
        const storedValid =
          Number.isFinite(stored) && isValidTarget({ goal: metrics.goal, currentKg: metrics.weightKg, targetKg: stored });

        let targetKg = null;
        if (requested != null && isValidTarget({ goal: metrics.goal, currentKg: metrics.weightKg, targetKg: requested })) {
          targetKg = requested;
        } else if (!storedValid) {
          // First time this goal became directional, or the stored target no
          // longer makes sense (goal switch, downgrade, or weighed past it).
          targetKg = defaultTarget(metrics.goal, metrics.weightKg);
        }

        if (targetKg != null) {
          const est = estimateGoal({ goal: metrics.goal, currentKg: metrics.weightKg, targetKg });
          set("target_weight_kg", targetKg);
          set("target_date", est?.targetDate || null);
        }
      } else if (b.goal === "maintain") {
        set("target_weight_kg", null);
        set("target_date", null);
      }
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
    // Present only when the metrics were recomputed — the settings screen
    // patches language and notifications through here too, and those have
    // nothing to explain.
    res.json({ profile: mapProfile(profile), user: userPayload(user), safety });
  } catch (err) {
    next(err);
  }
});

export default router;
