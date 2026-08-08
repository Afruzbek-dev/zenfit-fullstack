/**
 * Live preview of the goal timeline.
 *
 * Mirrors backend/src/lib/goalPlan.js so the estimate updates as the user
 * drags the target weight. The server recomputes and stores the real date on
 * save — this copy only drives the preview.
 */

const RATES = {
  lose: [0.005, 0.25, 1.0],
  gain: [0.0025, 0.15, 0.5],
};

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export function weeklyRateKg(goal, currentKg) {
  const rate = RATES[goal];
  if (!rate || !currentKg) return null;
  const [fraction, min, max] = rate;
  return clamp(currentKg * fraction, min, max);
}

export function estimateGoal({ goal, currentKg, targetKg, from = new Date() }) {
  if (goal !== "lose" && goal !== "gain") return null;
  if (!Number.isFinite(currentKg) || !Number.isFinite(targetKg)) return null;

  const deltaKg = targetKg - currentKg;
  if (goal === "lose" && deltaKg >= 0) return null;
  if (goal === "gain" && deltaKg <= 0) return null;

  const rate = weeklyRateKg(goal, currentKg);
  const weeks = Math.max(1, Math.ceil(Math.abs(deltaKg) / rate));

  const targetDate = new Date(from);
  targetDate.setDate(targetDate.getDate() + weeks * 7);

  return {
    weeks,
    months: Math.round((weeks / 4.345) * 10) / 10,
    targetDate,
    weeklyRateKg: Math.round(rate * 100) / 100,
    deltaKg: Math.round(deltaKg * 10) / 10,
  };
}

/** Sensible default target: a 10% change, which most people can actually hold. */
export function defaultTarget(goal, currentKg) {
  if (!Number.isFinite(currentKg)) return null;
  if (goal === "lose") return Math.round(currentKg * 0.9);
  if (goal === "gain") return Math.round(currentKg * 1.1);
  return null;
}

/** Slider bounds, kept inside what the backend will accept. */
export function targetBounds(goal, currentKg) {
  if (goal === "lose") return { min: Math.ceil(currentKg * 0.6), max: Math.floor(currentKg - 1) };
  if (goal === "gain") return { min: Math.ceil(currentKg + 1), max: Math.floor(currentKg * 1.5) };
  return { min: 35, max: 250 };
}
