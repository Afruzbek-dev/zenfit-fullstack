import { weeklyRateKg } from "./goalPlan.js";

/**
 * Threshold-only check, not a real off-plan/plan-match — a deliberate scope
 * decision: comparing a freeform AI-generated meal name against a plan's own
 * meal names would be fragile, so this only ever looks at the meal's own
 * macros, independent of whether a plan even exists.
 */
const CALORIE_SHARE_THRESHOLD = 0.35;
const FAT_SHARE_THRESHOLD = 0.4;
const FAT_MIN_KCAL = 150;

/** Same MET-3.0-walking constant the backend uses for steps (lib/activities.js's stepsToKcal) — kept in sync deliberately. */
const WALK_MET = 3.0;
/** kcal per kg of bodyweight (~7700) — the same energy density backend/lib/calorie.js's RATE_KCAL_PER_KG (1100/week) is itself derived from. */
const KCAL_PER_KG = 7700;

function walkMinutesFor(kcal, weightKg) {
  const weight = Number(weightKg) > 0 ? Number(weightKg) : 70;
  const netKcalPerMin = ((WALK_MET - 1) * 3.5 * weight) / 200;
  return netKcalPerMin > 0 ? Math.round(kcal / netKcalPerMin) : null;
}

/**
 * Real-time nudge for a meal that's heavy on calories or fat — called from
 * store.jsx's addMeal right after logging, so it fires from every entry
 * point (scan, catalogue, plan cards, recent foods) with no per-screen wiring.
 *
 * @returns null when the meal crosses neither threshold, otherwise
 *   {reason: "fat"|"calorie"|"both", walkMinutes, delayDays: number|null}
 *   — delayDays is only ever set for goal "lose"; a maintain/gain goal has
 *   no "delay" to report, only the walk-it-off suggestion.
 */
export function evaluateMealAlert({ meal, profile }) {
  if (!meal || !profile) return null;
  const kcal = Number(meal.kcal) || 0;
  if (kcal <= 0) return null;

  const target = Number(profile.dailyCalorieTarget) || 2000;
  const overCalorie = kcal >= CALORIE_SHARE_THRESHOLD * target;

  const fat = Number(meal.fat);
  const fatKcal = Number.isFinite(fat) ? fat * 9 : null;
  const overFat = fatKcal != null && kcal >= FAT_MIN_KCAL && fatKcal / kcal >= FAT_SHARE_THRESHOLD;

  if (!overCalorie && !overFat) return null;
  const reason = overCalorie && overFat ? "both" : overCalorie ? "calorie" : "fat";

  const walkMinutes = walkMinutesFor(kcal, profile.weightKg);

  let delayDays = null;
  if (profile.goal === "lose" && Number(profile.weightKg) > 0) {
    const rate = weeklyRateKg("lose", profile.weightKg);
    if (rate) delayDays = Math.round(((kcal / KCAL_PER_KG) / rate) * 7 * 10) / 10;
  }

  return { reason, walkMinutes, delayDays };
}
