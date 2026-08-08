/**
 * Goal weight and how long it should take.
 *
 * Rates are deliberately conservative: roughly 0.5% of bodyweight per week for
 * fat loss and 0.25% for gaining, which is what the evidence supports for
 * keeping muscle on the way down and limiting fat on the way up. Promising a
 * faster date would be the easy thing to show and the wrong thing to do.
 */

const RATES = {
  // [fraction of bodyweight per week, min kg/week, max kg/week]
  lose: [0.005, 0.25, 1.0],
  gain: [0.0025, 0.15, 0.5],
};

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

/** Safe weekly change in kg for this bodyweight and direction. */
export function weeklyRateKg(goal, currentKg) {
  const rate = RATES[goal];
  if (!rate || !currentKg) return null;
  const [fraction, min, max] = rate;
  return clamp(currentKg * fraction, min, max);
}

/**
 * @returns {{weeks:number, targetDate:string, weeklyRateKg:number, deltaKg:number}|null}
 */
export function estimateGoal({ goal, currentKg, targetKg, from = new Date() }) {
  if (goal !== "lose" && goal !== "gain") return null;
  if (!Number.isFinite(currentKg) || !Number.isFinite(targetKg)) return null;

  const deltaKg = targetKg - currentKg;
  // A target on the wrong side of the current weight is not a plan.
  if (goal === "lose" && deltaKg >= 0) return null;
  if (goal === "gain" && deltaKg <= 0) return null;

  const rate = weeklyRateKg(goal, currentKg);
  const weeks = Math.max(1, Math.ceil(Math.abs(deltaKg) / rate));

  const targetDate = new Date(from);
  targetDate.setDate(targetDate.getDate() + weeks * 7);

  return {
    weeks,
    targetDate: targetDate.toISOString().slice(0, 10),
    weeklyRateKg: Math.round(rate * 100) / 100,
    deltaKg: Math.round(deltaKg * 10) / 10,
  };
}

/** Sanity bounds so a target cannot be set somewhere unsafe. */
export function isValidTarget({ goal, currentKg, targetKg }) {
  if (!Number.isFinite(targetKg) || targetKg < 35 || targetKg > 250) return false;
  if (!Number.isFinite(currentKg)) return false;
  if (goal === "lose") return targetKg < currentKg && targetKg >= currentKg * 0.6;
  if (goal === "gain") return targetKg > currentKg && targetKg <= currentKg * 1.5;
  return false;
}
