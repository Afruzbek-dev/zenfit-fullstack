import { Clock, ListChecks, ShoppingBasket } from "lucide-react";
import { Screen, ScreenHeader } from "../components/ui.jsx";
import { FOOD_BY_ID, foodName } from "../data/foods.js";
import { useBackButton } from "../lib/useBackButton.js";
import { useApp } from "../store.jsx";

/**
 * How a catalogue dish gets made: ingredients and numbered steps.
 *
 * Mirrors ExerciseGuide's shape on purpose — a full page reached the same way
 * from two places (the catalogue and an active diet plan's meal rows), not a
 * sheet, because a recipe is read top to bottom rather than glanced at.
 *
 * `food.steps` is optional — earlier catalogue entries and any "product" kind
 * never had it and never will (nobody needs a recipe for an egg or a banana).
 * A missing recipe renders a plain note rather than a blank page, matching
 * how ExerciseGuide's missing-video state degrades.
 */
export default function RecipeGuide({ foodId, onBack }) {
  const { t, lang } = useApp();
  useBackButton(onBack);

  const food = FOOD_BY_ID[foodId];
  if (!food) return null;

  const steps = food.steps?.[lang] || food.steps?.uz || [];
  const ingredients = food.ingredients?.[lang] || food.ingredients?.uz || [];

  return (
    <Screen>
      <ScreenHeader title={t("recipesScreen.recipeTitle")} subtitle={foodName(food, lang)} onBack={onBack} />

      <div className="mb-5 flex items-center gap-4">
        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-surfaceAlt text-4xl">
          {food.emoji}
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-[19px] font-bold leading-tight text-ink">{foodName(food, lang)}</h2>
          {food.minutes && (
            <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-borderSoft bg-surfaceAlt px-3 py-1.5 text-[11.5px] font-semibold text-muted">
              <Clock size={12} className="text-faint" /> {food.minutes} {t("common.min")}
            </span>
          )}
        </div>
      </div>

      {ingredients.length > 0 && (
        <section className="mb-5">
          <div className="mb-2.5 flex items-center gap-2">
            <ShoppingBasket size={14} className="text-cyan" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">
              {t("recipesScreen.ingredients")}
            </h3>
          </div>
          <ul className="flex flex-col gap-1.5 rounded-2xl border border-borderSoft bg-surface px-4 py-3">
            {ingredients.map((ing, i) => (
              <li key={i} className="text-[13px] leading-relaxed text-ink">
                • {ing}
              </li>
            ))}
          </ul>
        </section>
      )}

      {steps.length > 0 ? (
        <section>
          <div className="mb-2.5 flex items-center gap-2">
            <ListChecks size={14} className="text-neon" />
            <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">
              {t("recipesScreen.steps")}
            </h3>
          </div>
          <ol className="flex flex-col gap-2">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3 rounded-2xl border border-borderSoft bg-surface px-3.5 py-3">
                <span className="tabular grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-neon/15 text-[11px] font-bold text-neon">
                  {i + 1}
                </span>
                <span className="text-[13px] leading-relaxed text-ink">{s}</span>
              </li>
            ))}
          </ol>
        </section>
      ) : (
        <p className="text-[12.5px] leading-relaxed text-muted">{t("recipesScreen.noRecipe")}</p>
      )}
    </Screen>
  );
}
