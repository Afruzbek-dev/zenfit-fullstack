/**
 * Pre-made daily meal plans, offered the same way `programs.js` offers
 * pre-made workouts: something real to start from without spending an AI call.
 *
 * Every item points at a row in the food catalogue, so the calories are the
 * same reference figures the rest of the app uses — nothing here is a second,
 * hand-typed copy of a nutrition table that could drift out of step.
 *
 * `amount` means what it means in the catalogue: portions for a dish, grams for
 * a product. Those numbers describe the plan's *shape* at `baseKcal`; the plan
 * is then scaled to whoever is reading it (see `buildDietPlan`), because a
 * fixed 2000 kcal day is wrong for almost everyone.
 */

import { FOOD_BY_ID, foodName, macros } from "./foods.js";

/* Slot keys are stable; the labels are looked up per language. */
export const MEAL_SLOTS = ["breakfast", "lunch", "dinner", "snack"];

const item = (foodId, amount, slot) => ({ foodId, amount, slot });

export const DIET_PLANS = [
  {
    id: "balanced-uz",
    emoji: "🍽️",
    goal: "maintain",
    items: [
      item("suli-botqa", 300, "breakfast"),
      item("tuxum", 100, "breakfast"),
      item("banan", 120, "breakfast"),
      item("shurpa", 1, "lunch"),
      item("tandir-non", 100, "lunch"),
      item("tovuq-kokrak", 180, "dinner"),
      item("grechka", 250, "dinner"),
      item("achchiq-chuchuk", 150, "dinner"),
      item("zaytun-moyi", 10, "dinner"),
      item("qatiq", 250, "snack"),
      item("olma", 180, "snack"),
    ],
  },
  {
    id: "lose-lowcal",
    emoji: "🔥",
    goal: "lose",
    items: [
      item("tvorog5", 200, "breakfast"),
      item("qulupnay", 200, "breakfast"),
      item("tuxum", 50, "breakfast"),
      item("mastava", 1, "lunch"),
      item("tandir-non", 60, "lunch"),
      item("oq-baliq", 220, "dinner"),
      item("grechka", 150, "dinner"),
      item("brokkoli", 200, "dinner"),
      item("salat", 100, "dinner"),
      item("zaytun-moyi", 10, "dinner"),
      item("kefir", 250, "snack"),
      item("olma", 200, "snack"),
    ],
  },
  {
    id: "gain-mass",
    emoji: "💪",
    goal: "gain",
    items: [
      item("suli", 90, "breakfast"),
      item("tuxum", 150, "breakfast"),
      item("tandir-non", 100, "breakfast"),
      item("mol-goshti", 180, "lunch"),
      item("oq-guruch", 300, "lunch"),
      item("sabzi", 100, "lunch"),
      item("tovuq-son", 180, "dinner"),
      item("makaron", 250, "dinner"),
      item("bodom", 40, "snack"),
      item("grek-yogurt", 200, "snack"),
      item("banan", 150, "snack"),
    ],
  },
  {
    id: "budget",
    emoji: "💸",
    goal: "maintain",
    items: [
      item("suli-botqa", 300, "breakfast"),
      item("tuxum", 150, "breakfast"),
      item("yasmiq", 250, "lunch"),
      item("qora-non", 100, "lunch"),
      item("achchiq-chuchuk", 150, "lunch"),
      item("kartoshka", 350, "dinner"),
      item("tovuq-son", 180, "dinner"),
      item("paxta-moyi", 10, "dinner"),
      item("qatiq", 300, "snack"),
    ],
  },
  {
    id: "highprotein",
    emoji: "🥚",
    goal: "gain",
    items: [
      item("tuxum", 150, "breakfast"),
      item("suzma", 100, "breakfast"),
      item("qora-non", 75, "breakfast"),
      item("tovuq-kokrak", 180, "lunch"),
      item("bulgur", 250, "lunch"),
      item("qalampir", 120, "lunch"),
      item("zaytun-moyi", 10, "lunch"),
      item("losos", 150, "dinner"),
      item("oq-guruch", 200, "dinner"),
      item("ismaloq", 150, "dinner"),
      item("tvorog9", 150, "snack"),
      item("banan", 120, "snack"),
    ],
  },
];

export const DIET_PLAN_BY_ID = Object.fromEntries(DIET_PLANS.map((p) => [p.id, p]));

/** Portions for a dish, grams/100 for a product — the catalogue's own convention. */
const factorFor = (food, amount) => (food.kind === "dish" ? amount : amount / 100);

/** What a plan costs at its authored amounts, before any scaling. */
export function rawTotals(plan) {
  return plan.items.reduce(
    (sum, it) => {
      const food = FOOD_BY_ID[it.foodId];
      if (!food) return sum;
      const m = macros(food, factorFor(food, it.amount));
      return {
        kcal: sum.kcal + m.kcal,
        carbs: sum.carbs + m.carbs,
        protein: sum.protein + m.protein,
        fat: sum.fat + m.fat,
      };
    },
    { kcal: 0, carbs: 0, protein: 0, fat: 0 }
  );
}

/**
 * How far portions may be stretched or shrunk.
 *
 * Beyond this the plan stops being the plan — a 1600 kcal cutting day pushed to
 * 3000 is four plates of the same food, not a mass-gain menu — so the caller is
 * told to pick a closer preset instead of being handed a nonsense one.
 */
const MIN_SCALE = 0.65;
const MAX_SCALE = 1.6;

/**
 * A preset rendered for one person: the same foods, portions scaled so the day
 * lands on their calorie target.
 *
 * Returns the plan in exactly the shape the AI plan uses (`summary`, `meals`,
 * `tips`), so the Recipes screen renders both with one component and the
 * "add to today" button does not care where the meal came from.
 */
export function buildDietPlan(planId, { dailyCalorieTarget, lang = "uz" } = {}) {
  const plan = DIET_PLAN_BY_ID[planId];
  if (!plan) return null;

  const raw = rawTotals(plan);
  if (!raw.kcal) return null;

  const target = Number(dailyCalorieTarget) || raw.kcal;
  const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, target / raw.kcal));

  const meals = plan.items
    .map((it) => {
      const food = FOOD_BY_ID[it.foodId];
      if (!food) return null;

      const amount = it.amount * scale;
      const m = macros(food, factorFor(food, amount));
      return {
        slot: it.slot,
        foodId: food.id,
        name: foodName(food, lang),
        emoji: food.emoji,
        // Dishes read as "1.5 porsiya", products as "180 g" — the same two
        // units the catalogue sheet already uses.
        portion:
          food.kind === "dish"
            ? `${Math.round(amount * 10) / 10}×`
            : `${Math.round(amount / 5) * 5} g`,
        ...m,
      };
    })
    .filter(Boolean);

  const totals = meals.reduce(
    (s, m) => ({
      kcal: s.kcal + m.kcal,
      carbs: s.carbs + m.carbs,
      protein: s.protein + m.protein,
      fat: s.fat + m.fat,
    }),
    { kcal: 0, carbs: 0, protein: 0, fat: 0 }
  );

  return {
    source: "preset",
    presetId: plan.id,
    emoji: plan.emoji,
    goal: plan.goal,
    // Off-target when the scale hit a clamp; the screen shows this so the
    // number on the card is never quietly wrong.
    clamped: scale === MIN_SCALE || scale === MAX_SCALE,
    totals,
    meals,
  };
}

/** Presets for this goal first, then the rest — nothing is ever hidden. */
export function sortPlansForGoal(goal) {
  return [...DIET_PLANS].sort(
    (a, b) => Number(b.goal === goal) - Number(a.goal === goal)
  );
}
