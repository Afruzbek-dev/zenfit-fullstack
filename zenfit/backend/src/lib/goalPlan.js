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

/** Same ceiling weeklyRateKg() clamps the default pace to — a user-chosen pace is never allowed past this. */
export function maxSafeRateKg(goal) {
  const rate = RATES[goal];
  return rate ? rate[2] : null;
}

/**
 * Required weekly rate to reach targetKg in `weeks`, clamped to the safe
 * ceiling above. `safe` tells the caller whether the requested pace fit
 * inside that ceiling or had to be slowed down to it.
 */
export function rateForWeeks({ goal, currentKg, targetKg, weeks }) {
  if (goal !== "lose" && goal !== "gain") return null;
  if (!Number.isFinite(currentKg) || !Number.isFinite(targetKg)) return null;
  if (!Number.isFinite(weeks) || weeks < 1) return null;

  const deltaKg = targetKg - currentKg;
  if (goal === "lose" && deltaKg >= 0) return null;
  if (goal === "gain" && deltaKg <= 0) return null;

  const requested = Math.abs(deltaKg) / weeks;
  const max = maxSafeRateKg(goal);

  return {
    requestedRateKg: Math.round(requested * 100) / 100,
    rateKgPerWeek: Math.min(requested, max),
    safe: requested <= max,
  };
}

/**
 * Same shape as estimateGoal(), but driven by an explicit weekly rate (from
 * rateForWeeks(), or a stored target_pace_kg_per_week) instead of derived
 * from the %bodyweight table.
 */
export function estimateGoalAtRate({ goal, currentKg, targetKg, rateKgPerWeek, from = new Date() }) {
  if (goal !== "lose" && goal !== "gain") return null;
  if (!Number.isFinite(currentKg) || !Number.isFinite(targetKg)) return null;
  if (!Number.isFinite(rateKgPerWeek) || rateKgPerWeek <= 0) return null;

  const deltaKg = targetKg - currentKg;
  if (goal === "lose" && deltaKg >= 0) return null;
  if (goal === "gain" && deltaKg <= 0) return null;

  const weeks = Math.max(1, Math.ceil(Math.abs(deltaKg) / rateKgPerWeek));

  const targetDate = new Date(from);
  targetDate.setDate(targetDate.getDate() + weeks * 7);

  return {
    weeks,
    targetDate: targetDate.toISOString().slice(0, 10),
    weeklyRateKg: Math.round(rateKgPerWeek * 100) / 100,
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

/** Sanity bounds so a target cannot be set somewhere unsafe. */
export function isValidTarget({ goal, currentKg, targetKg }) {
  if (!Number.isFinite(targetKg) || targetKg < 35 || targetKg > 250) return false;
  if (!Number.isFinite(currentKg)) return false;
  if (goal === "lose") return targetKg < currentKg && targetKg >= currentKg * 0.6;
  if (goal === "gain") return targetKg > currentKg && targetKg <= currentKg * 1.5;
  return false;
}
