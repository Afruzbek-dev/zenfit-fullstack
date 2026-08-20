/**
 * Shared between DietPlanScreen and HomeScreen — a diet plan's meals grouped
 * by mealtime label.
 *
 * Preset plans key their slots with an enum ("breakfast"); the AI plan
 * already returns a worded label ("Nonushta"). Grouping by the *resolved
 * display label* rather than the raw `slot` value sidesteps that mismatch
 * entirely, since it's what both sources ultimately display.
 */
const SLOT_KEYS = new Set(["breakfast", "lunch", "dinner", "snack"]);
export const slotLabel = (slot, t) => (SLOT_KEYS.has(slot) ? t(`dietPreset.slots.${slot}`) : slot);

export function groupBySlot(meals, t) {
  const order = [];
  const byLabel = new Map();
  for (const m of meals) {
    const label = slotLabel(m.slot, t);
    if (!byLabel.has(label)) {
      byLabel.set(label, []);
      order.push(label);
    }
    byLabel.get(label).push(m);
  }
  return order.map((label) => ({ label, meals: byLabel.get(label) }));
}

/**
 * A plan's days, whatever shape it was stored in.
 *
 * The AI plan is a week now, but preset plans are a single day and plans saved
 * before the weekly rework are a bare `meals` array. Normalising here means
 * every screen renders one shape and nobody has to special-case old data.
 */
export function planDays(plan) {
  if (Array.isArray(plan?.days) && plan.days.length > 0) return plan.days;
  return [{ day: 1, meals: plan?.meals || [] }];
}

/** Which day of the plan today is — it rotates rather than expiring. */
export function todayDayIndex(plan) {
  const days = planDays(plan);
  if (!plan?.createdAt || days.length <= 1) return 0;
  const started = new Date(plan.createdAt).getTime();
  if (!Number.isFinite(started)) return 0;
  const elapsed = Math.floor((Date.now() - started) / 86_400_000);
  return ((elapsed % days.length) + days.length) % days.length;
}

export function dayTotals(meals = []) {
  return meals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + (Number(m.kcal) || 0),
      protein: acc.protein + (Number(m.protein) || 0),
      carbs: acc.carbs + (Number(m.carbs) || 0),
      fat: acc.fat + (Number(m.fat) || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}
