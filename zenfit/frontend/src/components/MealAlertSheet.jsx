import { useState } from "react";
import { AlertTriangle, Flame, Footprints, BellPlus } from "lucide-react";
import { Sheet, Button } from "./ui.jsx";
import ActivitySheet from "./ActivitySheet.jsx";
import { useApp } from "../store.jsx";

/**
 * Fires right after a meal is logged (see store.jsx's addMeal) whenever
 * evaluateMealAlert (lib/mealAlert.js) flags it as high-calorie or high-fat.
 *
 * Mounted once near the app root, like Toast/TrialOfferSheet. `activityOpen`
 * toggles which of the two sheets is visually shown rather than unmounting
 * either one, so ActivitySheet's seed props stay available (from the same
 * `mealAlert`) the whole time the user might tap through to it.
 */
export default function MealAlertSheet() {
  const { mealAlert, clearMealAlert, addBurnReminder, showToast, t } = useApp();
  const [activityOpen, setActivityOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const open = Boolean(mealAlert) && !activityOpen;
  const { reason, walkMinutes, delayDays, meal } = mealAlert || {};

  function closeAll() {
    setActivityOpen(false);
    clearMealAlert();
  }

  /**
   * Most people cannot go for a 45-minute walk the moment they finish eating.
   * This keeps the number alive instead — a card on Home that shrinks as burn
   * is logged, and an evening push from the bot if it is still outstanding.
   */
  async function remindLater() {
    setSaving(true);
    try {
      await addBurnReminder({ mealName: meal?.name, kcal: meal?.kcal, walkMinutes: walkMinutes || undefined });
      showToast(t("mealAlert.reminderAdded"), "success");
      clearMealAlert();
    } catch (e) {
      showToast(e.message || t("common.error"), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Sheet open={open} onClose={clearMealAlert} title={t("mealAlert.title")}>
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-amber/30 bg-amber/[0.08] px-4 py-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber/15">
            <AlertTriangle size={19} className="text-amber" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-ink">{meal?.name}</p>
            <p className="mt-0.5 text-[11.5px] text-muted">
              {reason === "fat"
                ? t("mealAlert.reasonFat")
                : reason === "calorie"
                  ? t("mealAlert.reasonCalorie")
                  : t("mealAlert.reasonBoth")}
            </p>
          </div>
        </div>

        {delayDays != null && (
          <p className="mb-3 text-[12.5px] leading-relaxed text-ink">
            {t("mealAlert.delaySentence", { days: delayDays })}
          </p>
        )}

        {walkMinutes != null && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-cyan/25 bg-cyan/[0.08] px-4 py-3.5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan/15">
              <Footprints size={19} className="text-cyan" />
            </span>
            <p className="min-w-0 flex-1 text-[12.5px] leading-relaxed text-ink">
              {t("mealAlert.walkSentence", { minutes: walkMinutes })}
            </p>
          </div>
        )}

        <Button full size="lg" onClick={() => setActivityOpen(true)}>
          <Flame size={17} /> {t("mealAlert.logActivity")}
        </Button>
        <Button full variant="ghost" className="mt-2" loading={saving} onClick={remindLater}>
          <BellPlus size={16} /> {t("mealAlert.remindLater")}
        </Button>
        <Button full variant="ghost" className="mt-2" onClick={clearMealAlert}>
          {t("mealAlert.dismiss")}
        </Button>
      </Sheet>

      <ActivitySheet
        open={activityOpen}
        onClose={closeAll}
        initialActivityId="walking"
        initialDurationMin={Math.max(5, walkMinutes || 30)}
      />
    </>
  );
}
