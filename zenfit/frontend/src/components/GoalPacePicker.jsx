import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, CalendarClock } from "lucide-react";
import { estimateGoal, rateForWeeks, targetBounds } from "../lib/goalPlan.js";
import { shortDate } from "../lib/format.js";
import { haptic } from "../telegram.js";

/** Only meaningful once a plausible bodyweight is known. */
const bodyValidFor = (kg) => Number.isFinite(kg) && kg >= 30 && kg <= 300;

/** Quick-pick weeks for the custom-pace control — roughly 6 weeks / 3 months / 6 months. */
const PACE_PRESETS = [6, 13, 26];

/**
 * Target-weight slider + safe-pace estimate + optional custom-pace picker.
 *
 * Shared between Onboarding's GOAL step and HealthData's post-onboarding
 * editor — built once for onboarding, then pulled out here so existing users
 * (who never revisit onboarding) get the same custom-pace control from their
 * profile instead of only ever seeing the default %bodyweight estimate.
 *
 * Owns its own targetWeight/paceWeeks state, seeded once from
 * `initialTargetWeight`/`initialPaceWeeks` at mount. Callers that need a
 * fresh seed when `goal` changes (onboarding, when a new direction is
 * picked) should remount with `key={goal}` rather than pushing new props in
 * — simpler than syncing internal state to changing initial values.
 *
 * `paceWeeks` in onChange is `null` when the custom pace isn't in use
 * (explicitly, not just omitted) so a caller that persists it server-side
 * can tell "use the default rate" apart from "nothing sent" — see
 * routes/profile.js's target block.
 */
export default function GoalPacePicker({ goal, currentKg, initialTargetWeight, initialPaceWeeks = null, onChange, lang, t }) {
  const [targetWeight, setTargetWeight] = useState(initialTargetWeight ?? null);
  const [paceWeeks, setPaceWeeks] = useState(initialPaceWeeks); // null = default pace, not custom

  const bounds = useMemo(
    () => (bodyValidFor(currentKg) && (goal === "lose" || goal === "gain") ? targetBounds(goal, currentKg) : null),
    [goal, currentKg]
  );

  const goalEstimate = useMemo(
    () => estimateGoal({ goal, currentKg, targetKg: targetWeight }),
    [goal, currentKg, targetWeight]
  );

  // Live preview only — the server recomputes and clamps this again on save.
  const paceEstimate = useMemo(
    () => (paceWeeks != null ? rateForWeeks({ goal, currentKg, targetKg: targetWeight, weeks: paceWeeks }) : null),
    [goal, currentKg, targetWeight, paceWeeks]
  );

  useEffect(() => {
    onChange?.({ targetWeightKg: targetWeight, paceWeeks });
    // Only targetWeight/paceWeeks should re-fire this — onChange is a fresh
    // closure every render on some callers and would otherwise loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetWeight, paceWeeks]);

  if (!bounds) return null;

  return (
    <div className="animate-fade-up mt-5">
      <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-faint">{t("onboarding.targetTitle")}</p>

      <div className="card px-5 py-5">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setTargetWeight((v) => Math.max(bounds.min, (v ?? 0) - 1))}
            aria-label={t("onboarding.decrease")}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-borderSoft bg-surfaceAlt active:scale-95"
          >
            <Minus size={17} className="text-muted" />
          </button>
          <div className="text-center">
            <p className="tabular text-[38px] font-bold leading-none text-neon">{targetWeight ?? "—"}</p>
            <p className="mt-1 text-[12px] text-faint">kg</p>
          </div>
          <button
            onClick={() => setTargetWeight((v) => Math.min(bounds.max, (v ?? 0) + 1))}
            aria-label={t("onboarding.increase")}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-borderSoft bg-surfaceAlt active:scale-95"
          >
            <Plus size={17} className="text-muted" />
          </button>
        </div>

        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          value={targetWeight ?? bounds.min}
          onChange={(e) => setTargetWeight(Number(e.target.value))}
          aria-label={t("onboarding.targetWeightLabel")}
          className="mt-5 w-full accent-[color:rgb(var(--c-neon))]"
        />
        <div className="tabular mt-1 flex justify-between text-[11px] text-faint">
          <span>{bounds.min} kg</span>
          <span>{bounds.max} kg</span>
        </div>
      </div>

      {goalEstimate && (
        <div className="animate-fade-up mt-3 flex items-start gap-3 rounded-2xl border border-cyan/25 bg-cyan/[0.07] px-4 py-3.5">
          <CalendarClock size={17} className="mt-0.5 shrink-0 text-cyan" />
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-ink">
              {t("onboarding.targetBy", { date: shortDate(goalEstimate.targetDate, lang) })}
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
              {t("onboarding.targetDetail", {
                kg: Math.abs(goalEstimate.deltaKg),
                weeks: goalEstimate.weeks,
                rate: goalEstimate.weeklyRateKg,
              })}
              {goalEstimate.months >= 1 ? t("onboarding.monthsSuffix", { months: goalEstimate.months }) : ""}
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-faint">{t("onboarding.targetSafe")}</p>
          </div>
        </div>
      )}

      {goalEstimate && paceWeeks == null && (
        <button
          onClick={() => {
            haptic("light");
            setPaceWeeks(goalEstimate.weeks);
          }}
          className="mt-3 w-full text-center text-[12px] font-semibold text-cyan"
        >
          {t("onboarding.customPaceToggle")}
        </button>
      )}

      {paceWeeks != null && (
        <div className="animate-fade-up card mt-3 px-5 py-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">{t("onboarding.customPaceTitle")}</p>
            <button
              onClick={() => {
                haptic("light");
                setPaceWeeks(null);
              }}
              className="text-[11px] font-semibold text-faint"
            >
              {t("onboarding.customPaceOff")}
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            {PACE_PRESETS.map((w) => (
              <button
                key={w}
                onClick={() => {
                  haptic("select");
                  setPaceWeeks(w);
                }}
                className={`flex-1 rounded-xl border px-2 py-2 text-[12px] font-bold transition-colors ${
                  paceWeeks === w ? "border-neon bg-neon/10 text-neon" : "border-borderSoft bg-surfaceAlt text-muted"
                }`}
              >
                {w} {t("onboarding.weeksUnit")}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-center gap-4">
            <button
              onClick={() => setPaceWeeks((w) => Math.max(1, (w ?? 1) - 1))}
              aria-label={t("onboarding.decrease")}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-borderSoft bg-surfaceAlt active:scale-95"
            >
              <Minus size={15} className="text-muted" />
            </button>
            <p className="tabular text-[20px] font-bold text-ink">
              {paceWeeks ?? "—"} <span className="text-[12px] font-normal text-faint">{t("onboarding.weeksUnit")}</span>
            </p>
            <button
              onClick={() => setPaceWeeks((w) => Math.min(104, (w ?? 1) + 1))}
              aria-label={t("onboarding.increase")}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-borderSoft bg-surfaceAlt active:scale-95"
            >
              <Plus size={15} className="text-muted" />
            </button>
          </div>

          {paceEstimate && (
            <div
              className={`mt-3 rounded-xl px-3 py-2.5 text-[11.5px] leading-relaxed ${
                paceEstimate.safe ? "bg-cyan/[0.07] text-muted" : "bg-amber/[0.1] text-amber"
              }`}
            >
              {paceEstimate.safe
                ? t("onboarding.paceSafe", { rate: paceEstimate.rateKgPerWeek })
                : t("onboarding.paceUnsafe", { requested: paceEstimate.requestedRateKg, max: paceEstimate.rateKgPerWeek })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
