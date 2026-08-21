import { useMemo, useState } from "react";
import { ShoppingBasket, ListChecks, ThumbsUp, ThumbsDown } from "lucide-react";
import { Screen, ScreenHeader, Section } from "../components/ui.jsx";
import { FOOD_BY_ID } from "../data/foods.js";
import { groupBySlot, dayTotals } from "../lib/planMeals.js";
import { useBackButton } from "../lib/useBackButton.js";
import { useApp } from "../store.jsx";

/** "Ovqat haqida" — what the meal costs and, for catalogue-backed meals, why. */
function InfoMealCard({ meal, lang, t }) {
  const food = meal.foodId ? FOOD_BY_ID[meal.foodId] : null;
  const composition = food?.composition && {
    benefits: food.composition.benefits[lang] || food.composition.benefits.uz || [],
    harms: food.composition.harms[lang] || food.composition.harms.uz || [],
  };

  return (
    <div className="card px-4 py-3.5">
      <div className="flex items-center gap-3">
        <span className="text-xl">{meal.emoji || "🍽️"}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-ink">{meal.name}</p>
          <p className="truncate text-[11px] text-muted">{meal.portion}</p>
        </div>
        <span className="tabular shrink-0 text-[13px] font-bold text-amber">
          {meal.kcal} <span className="text-[10px] font-semibold text-faint">kcal</span>
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { l: t("home.carbs"), v: meal.carbs, c: "text-cyan" },
          { l: t("home.protein"), v: meal.protein, c: "text-neon" },
          { l: t("home.fat"), v: meal.fat, c: "text-amber" },
        ].map((m) => (
          <div key={m.l} className="rounded-xl bg-surfaceAlt px-2 py-2 text-center">
            <p className="text-[9px] font-bold uppercase tracking-wider text-faint">{m.l}</p>
            <p className={`tabular mt-0.5 text-[12px] font-bold ${m.c}`}>{Math.round(m.v || 0)}g</p>
          </div>
        ))}
      </div>

      {composition && (composition.benefits.length > 0 || composition.harms.length > 0) && (
        <div className="mt-3 flex flex-col gap-1.5 border-t border-borderSoft pt-3">
          {composition.benefits.map((b, i) => (
            <div key={`b${i}`} className="flex items-start gap-2">
              <ThumbsUp size={12} className="mt-0.5 shrink-0 text-neon" />
              <p className="text-[11.5px] leading-relaxed text-ink">{b}</p>
            </div>
          ))}
          {composition.harms.map((h, i) => (
            <div key={`h${i}`} className="flex items-start gap-2">
              <ThumbsDown size={12} className="mt-0.5 shrink-0 text-amber" />
              <p className="text-[11.5px] leading-relaxed text-ink">{h}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * "Tayyorlanishi" — ingredients and steps. Catalogue dishes (`meal.foodId`)
 * read their recipe straight from the food row, same source RecipeGuide
 * uses; AI-generated meals carry their own short `howTo` instead, since a
 * freeform AI dish has no catalogue row to look a recipe up by.
 */
function PrepMealCard({ meal, lang, t }) {
  const food = meal.foodId ? FOOD_BY_ID[meal.foodId] : null;
  const steps = food?.steps ? food.steps[lang] || food.steps.uz : meal.howTo;
  const ingredients = food?.ingredients ? food.ingredients[lang] || food.ingredients.uz : null;

  return (
    <div className="card px-4 py-3.5">
      <div className="mb-3 flex items-center gap-3">
        <span className="text-xl">{meal.emoji || "🍽️"}</span>
        <p className="min-w-0 flex-1 truncate text-[13px] font-bold text-ink">{meal.name}</p>
      </div>

      {ingredients?.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-faint">
            <ShoppingBasket size={11} className="text-cyan" /> {t("recipesScreen.ingredients")}
          </p>
          <ul className="flex flex-col gap-1">
            {ingredients.map((ing, i) => (
              <li key={i} className="text-[12px] text-muted">• {ing}</li>
            ))}
          </ul>
        </div>
      )}

      {steps?.length > 0 ? (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-faint">
            <ListChecks size={11} className="text-neon" /> {t("recipesScreen.steps")}
          </p>
          <ol className="flex flex-col gap-1.5">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-[12px] leading-relaxed text-ink">
                <span className="tabular grid h-5 w-5 shrink-0 place-items-center rounded-md bg-neon/15 text-[10px] font-bold text-neon">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="text-[11.5px] leading-relaxed text-faint">{t("dietDay.noRecipe")}</p>
      )}

      {/* Not wired to any data yet — a hook for the prep videos mentioned as a
          near-term follow-up, so a food row can carry one without another
          screen change once the first video exists. */}
      {food?.videoUrl && (
        <div className="mt-3 overflow-hidden rounded-xl">
          <iframe
            src={food.videoUrl}
            title={meal.name}
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
}

const TABS = ["info", "prep"];

/**
 * One day of a diet plan, entered separately — the meal-plan counterpart to a
 * workout day's session screen. Local to DietPlanScreen (swapped in the same
 * way RecipeGuide is), not a routed tab: a day is a view into the plan
 * already open, not a separate place in the app.
 */
export default function DietDayScreen({ day, dayLabel, onBack }) {
  const { t, lang } = useApp();
  useBackButton(onBack);
  const [tab, setTab] = useState("info");

  const groups = useMemo(() => groupBySlot(day.meals, t), [day.meals, t]);
  const totals = useMemo(() => dayTotals(day.meals), [day.meals]);

  return (
    <Screen>
      <ScreenHeader
        title={dayLabel}
        subtitle={t("dietPreset.kcalMeta", { kcal: totals.kcal, n: day.meals.length })}
        onBack={onBack}
      />

      <div className="mb-4 grid grid-cols-4 gap-2">
        {[
          { l: "kcal", v: totals.kcal, c: "text-neon" },
          { l: t("home.protein"), v: `${totals.protein}g`, c: "text-neon" },
          { l: t("home.carbs"), v: `${totals.carbs}g`, c: "text-cyan" },
          { l: t("home.fat"), v: `${totals.fat}g`, c: "text-amber" },
        ].map((m) => (
          <div key={m.l} className="rounded-xl bg-surfaceAlt px-2 py-2.5 text-center">
            <p className="truncate text-[9px] font-bold uppercase tracking-wider text-faint">{m.l}</p>
            <p className={`tabular mt-0.5 text-[13px] font-bold ${m.c}`}>{m.v}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex gap-1 rounded-2xl bg-surfaceAlt p-1">
        {TABS.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`flex-1 rounded-xl py-2.5 text-[12.5px] font-bold transition-colors ${
              tab === tb ? "bg-neon text-neonOn" : "text-muted"
            }`}
          >
            {t(`dietDay.${tb === "info" ? "infoTab" : "prepTab"}`)}
          </button>
        ))}
      </div>

      {groups.map(({ label, meals }) => (
        <Section key={label} title={label}>
          <div className="flex flex-col gap-2.5">
            {meals.map((m, i) =>
              tab === "info" ? (
                <InfoMealCard key={i} meal={m} lang={lang} t={t} />
              ) : (
                <PrepMealCard key={i} meal={m} lang={lang} t={t} />
              )
            )}
          </div>
        </Section>
      ))}
    </Screen>
  );
}
