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
