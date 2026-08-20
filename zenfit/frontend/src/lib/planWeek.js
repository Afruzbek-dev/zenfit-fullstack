/**
 * Weekly cadence for generated plans.
 *
 * The progression engine (aiPlanEngine's progressWeight) only ever runs when a
 * plan is *generated*, so a plan left alone forever prescribes the same weights
 * forever. These helpers are what notice a plan has aged past its week and let
 * the screen offer a refresh, which is the moment the overload actually lands.
 */

const DAY_MS = 86_400_000;

export function daysSince(iso) {
  if (!iso) return 0;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return 0;
  return Math.max(0, Math.floor((Date.now() - then) / DAY_MS));
}

/** A plan is stale once a full week has passed since it was generated. */
export function isStale(plan) {
  // Plans written before createdAt existed have no age to measure, and
  // surprising those users with a "refresh me" banner on first open would be
  // worse than waiting for their next regeneration to stamp one.
  return Boolean(plan?.createdAt) && daysSince(plan.createdAt) >= 7;
}

export const weekIndexOf = (plan) => Number(plan?.weekIndex) || 1;
export const nextWeekIndex = (plan) => weekIndexOf(plan) + 1;
