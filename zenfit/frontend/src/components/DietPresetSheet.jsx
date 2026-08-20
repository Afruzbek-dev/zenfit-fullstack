import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Sheet, Button } from "./ui.jsx";
import { MealSlotAccordion } from "./PlanMealRow.jsx";
import { groupBySlot } from "../lib/planMeals.js";
import { buildDietPlan } from "../data/dietPlans.js";
import { haptic } from "../telegram.js";
import { useApp } from "../store.jsx";

/**
 * A preset diet plan rendered against this user's calorie target.
 *
 * Shared by the plan screen and the food catalogue: the same five presets are
 * reachable from both, and both need the recipe link on each meal — preset
 * meals carry a `foodId`, so PlanMealRow resolves the steps itself.
 */
export default function DietPresetSheet({ planId, onClose, onOpenRecipe }) {
  const { profile, saveDietPlan, showToast, t, lang } = useApp();
  const [busy, setBusy] = useState(false);

  const built = useMemo(
    () => (planId ? buildDietPlan(planId, { dailyCalorieTarget: profile?.dailyCalorieTarget, lang }) : null),
    [planId, profile?.dailyCalorieTarget, lang]
  );
  const groups = useMemo(() => (built ? groupBySlot(built.meals, t) : []), [built, t]);

  async function use() {
    setBusy(true);
    try {
      // Stamped with createdAt like the AI plan so history and the day strip
      // read it the same way; a preset is simply a one-day week.
      await saveDietPlan({ ...built, createdAt: new Date().toISOString() });
      haptic("success");
      showToast(t("dietPlanScreen.planChosen"), "success");
      onClose();
    } catch (e) {
      showToast(e.message || t("common.error"), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={Boolean(planId)} onClose={onClose} title={planId ? t(`dietPreset.names.${planId}`) : ""}>
      {built && (
        <>
          <p className="mb-3 text-[12px] leading-relaxed text-muted">{t(`dietPreset.descs.${planId}`)}</p>

          <div className="mb-3 grid grid-cols-4 gap-2">
            {[
              { l: "kcal", v: built.totals.kcal, c: "text-neon" },
              { l: t("home.protein"), v: `${built.totals.protein}g`, c: "text-neon" },
              { l: t("home.carbs"), v: `${built.totals.carbs}g`, c: "text-cyan" },
              { l: t("home.fat"), v: `${built.totals.fat}g`, c: "text-amber" },
            ].map((m) => (
              <div key={m.l} className="rounded-xl bg-surfaceAlt px-2 py-2.5 text-center">
                <p className="truncate text-[9.5px] font-bold uppercase tracking-wider text-faint">{m.l}</p>
                <p className={`tabular mt-0.5 text-[14px] font-bold ${m.c}`}>{m.v}</p>
              </div>
            ))}
          </div>

          <p className={`mb-3 text-[11.5px] leading-relaxed ${built.clamped ? "text-amber" : "text-faint"}`}>
            {built.clamped
              ? t("dietPreset.clamped")
              : t("dietPreset.scaled", { kcal: profile?.dailyCalorieTarget || built.totals.kcal })}
          </p>

          <p className="mb-2 text-[11px] leading-relaxed text-faint">{t("dietPreset.openRecipe")}</p>

          <div className="mb-4">
            <MealSlotAccordion groups={groups} onOpenRecipe={onOpenRecipe} />
          </div>

          <Button full size="lg" loading={busy} onClick={use}>
            <Check size={16} /> {t("dietPreset.useThis")}
          </Button>
        </>
      )}
    </Sheet>
  );
}
