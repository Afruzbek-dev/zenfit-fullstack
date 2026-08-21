import { useState } from "react";
import { BookOpen, ChefHat, ChevronDown, Plus } from "lucide-react";
import { FOOD_BY_ID } from "../data/foods.js";
import { haptic } from "../telegram.js";
import { useApp } from "../store.jsx";

/**
 * One meal inside a plan, preset or AI — the two produce the same shape, so
 * the row does not know or care which built it. Shared by DietPlanScreen
 * (inside MealSlotAccordion below) and HomeScreen (as a flat list).
 *
 * The recipe link lights up whenever a meal carries `foodId`, a real pointer
 * into the catalogue — true for preset-plan meals always, and for AI-plan
 * meals whenever the model picked one of the app's own known recipes instead
 * of inventing one (see recipeBank.js on the backend). A meal without a
 * `foodId` carries `howTo` instead — short prep steps the model wrote for
 * that specific freeform dish, since it has no catalogue row to look a real
 * recipe up by. The backend guarantees the two never both fire on one meal.
 */
export function PlanMealRow({ meal, onOpenRecipe }) {
  const { addMeal, showToast, t } = useApp();
  const [adding, setAdding] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);
  const recipeFood = meal.foodId ? FOOD_BY_ID[meal.foodId] : null;
  const hasRecipe = Boolean(recipeFood?.steps);
  const hasHowTo = Boolean(meal.howTo?.length);

  async function add() {
    setAdding(true);
    try {
      await addMeal({
        name: meal.name, emoji: meal.emoji || "🍽️", kcal: meal.kcal,
        carbs: meal.carbs, protein: meal.protein, fat: meal.fat,
        source: meal.foodId ? "diet_preset" : "ai_plan",
      });
      haptic("success");
      showToast(t("recipesScreen.added"), "success");
    } catch (e) {
      showToast(e.message || t("common.error"), "error");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="rounded-xl bg-surfaceAlt px-3 py-2.5">
      <div className="flex items-center gap-3">
        <span className="text-xl">{meal.emoji || "🍽️"}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-semibold text-ink">{meal.name}</p>
          <p className="truncate text-[11px] text-muted">{meal.portion}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="tabular text-[12.5px] font-bold text-amber">{meal.kcal}</span>
          {hasRecipe && (
            <button
              onClick={() => onOpenRecipe(meal.foodId)}
              aria-label={`${meal.name} — ${t("recipesScreen.steps")}`}
              className="grid h-7 w-7 place-items-center rounded-lg bg-cyan/12 active:scale-95"
            >
              <BookOpen size={13} className="text-cyan" />
            </button>
          )}
          {hasHowTo && (
            <button
              onClick={() => setHowToOpen((o) => !o)}
              aria-label={`${meal.name} — ${t("dietPlanScreen.howTo")}`}
              className="grid h-7 w-7 place-items-center rounded-lg bg-cyan/12 active:scale-95"
            >
              <ChefHat size={13} className="text-cyan" />
            </button>
          )}
          <button
            onClick={add}
            disabled={adding}
            aria-label={t("recipesScreen.addPortion")}
            className="grid h-7 w-7 place-items-center rounded-lg bg-neon/15 active:scale-95 disabled:opacity-50"
          >
            <Plus size={13} className="text-neon" />
          </button>
        </div>
      </div>
      {hasHowTo && howToOpen && (
        <ol className="mt-2.5 flex flex-col gap-1 border-t border-borderSoft pt-2.5">
          {meal.howTo.map((step, i) => (
            <li key={i} className="text-[11.5px] leading-relaxed text-muted">
              {i + 1}. {step}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** A collapsible mealtime section — matches both Figma states (expanded chevron-down / collapsed chevron-right). */
export function MealSlotAccordion({ groups, onOpenRecipe, defaultOpen = true }) {
  const [openLabel, setOpenLabel] = useState(defaultOpen ? groups[0]?.label : null);

  return (
    <div className="flex flex-col gap-2">
      {groups.map(({ label, meals }) => {
        const open = openLabel === label;
        const kcalTotal = meals.reduce((s, m) => s + (m.kcal || 0), 0);
        return (
          <div key={label} className="card overflow-hidden">
            <button
              onClick={() => setOpenLabel(open ? null : label)}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left"
            >
              <span className="text-[13px] font-bold text-ink">{label}</span>
              <span className="flex items-center gap-2">
                <span className="tabular text-[11.5px] font-semibold text-faint">{kcalTotal} kkal</span>
                <ChevronDown size={16} className={`text-faint transition-transform ${open ? "" : "-rotate-90"}`} />
              </span>
            </button>
            {open && (
              <div className="flex flex-col gap-2 px-4 pb-4">
                {meals.map((m, i) => (
                  <PlanMealRow key={i} meal={m} onOpenRecipe={onOpenRecipe} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
