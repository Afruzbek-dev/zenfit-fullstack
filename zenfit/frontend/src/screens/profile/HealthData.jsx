import { useState } from "react";
import { Target, Dumbbell, UtensilsCrossed, Info, ShieldAlert, Sparkles, Check } from "lucide-react";
import { Screen, ScreenHeader, Section, OptionCard, ListRow, EmptyState, Button } from "../../components/ui.jsx";
import SafetyNotice from "../../components/SafetyNotice.jsx";
import GoalPacePicker from "../../components/GoalPacePicker.jsx";
import { defaultTarget, estimateGoalAtRate } from "../../lib/goalPlan.js";
import { useApp } from "../../store.jsx";
import { useBackButton } from "../../lib/useBackButton.js";
import { haptic } from "../../telegram.js";

/** WHO cut-offs. Returned as a key so the label follows the UI language. */
export function bmiInfo(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const bmi = weightKg / (heightCm / 100) ** 2;
  let key = "obese";
  if (bmi < 18.5) key = "under";
  else if (bmi < 25) key = "normal";
  else if (bmi < 30) key = "over";
  return { bmi: Math.round(bmi * 10) / 10, key };
}

const BMI_TONE = {
  under: { text: "text-cyan", bg: "bg-cyan", ring: "border-cyan/30" },
  normal: { text: "text-neon", bg: "bg-neon", ring: "border-neon/30" },
  over: { text: "text-amber", bg: "bg-amber", ring: "border-amber/30" },
  obese: { text: "text-rose", bg: "bg-rose", ring: "border-rose/30" },
};

/** Position on a 15–40 scale, which is the range worth showing on a phone. */
function BmiScale({ bmi, tone }) {
  const pct = Math.min(100, Math.max(0, ((bmi - 15) / 25) * 100));
  return (
    <div className="mt-3">
      <div className="relative h-2 overflow-hidden rounded-full">
        <div className="absolute inset-0 flex">
          <div className="h-full bg-cyan/50" style={{ width: "14%" }} />
          <div className="h-full bg-neon/60" style={{ width: "26%" }} />
          <div className="h-full bg-amber/60" style={{ width: "20%" }} />
          <div className="h-full flex-1 bg-rose/60" />
        </div>
      </div>
      <div className="relative h-0">
        <span
          className={`absolute -top-3.5 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-surface ${tone.bg}`}
          style={{ left: `${pct}%` }}
        />
      </div>
      <div className="mt-3 flex justify-between text-[9.5px] font-semibold text-faint">
        <span>15</span>
        <span>18.5</span>
        <span>25</span>
        <span>30</span>
        <span>40</span>
      </div>
    </div>
  );
}

export default function HealthData({ onBack, onNavigate }) {
  const { profile, workoutPlan, dietPlan, updateProfile, showToast, t, lang } = useApp();
  useBackButton(onBack);
  const [savingGoal, setSavingGoal] = useState(null);
  const [safety, setSafety] = useState(null);
  // Filled in by GoalPacePicker's onChange; only actually saved on tap, same
  // pattern as PantrySheet/DietPrefsSheet — a drag-slider firing PATCH on
  // every tick would be a lot of requests for nothing.
  const [pendingGoalPace, setPendingGoalPace] = useState(null);
  const [savingPace, setSavingPace] = useState(false);

  const bmi = bmiInfo(profile?.weightKg, profile?.heightCm);
  const tone = bmi ? BMI_TONE[bmi.key] : BMI_TONE.normal;

  async function pickGoal(goal) {
    if (goal === profile?.goal) return;
    setSavingGoal(goal);
    try {
      const res = await updateProfile({ goal });
      // The tick may land on a different card than the one that was tapped:
      // the engine can refuse "lose". Show why instead of letting the selection
      // appear to bounce back on its own.
      setSafety(res?.safety || null);
      const refused = res?.safety?.blocked;
      haptic(refused ? "warning" : "success");
      if (!refused) showToast(t("profile.targetsRecalc"), "success");
    } catch (e) {
      showToast(e.message || t("common.error"), "error");
    } finally {
      setSavingGoal(null);
    }
  }

  async function savePace() {
    if (!pendingGoalPace) return;
    setSavingPace(true);
    try {
      await updateProfile({ targetWeightKg: pendingGoalPace.targetWeightKg, paceWeeks: pendingGoalPace.paceWeeks });
      haptic("success");
      showToast(t("profile.targetsRecalc"), "success");
    } catch (e) {
      showToast(e.message || t("common.error"), "error");
    } finally {
      setSavingPace(false);
    }
  }

  const workoutDays = Array.isArray(workoutPlan?.days)
    ? workoutPlan.days.filter((d) => !d.rest && d.exercises?.length).length
    : 0;

  return (
    <Screen>
      <ScreenHeader title={t("profile.health")} onBack={onBack} />

      {/* BMI */}
      <Section title={t("profile.bmi")}>
        {bmi ? (
          <div className={`card card-lit border ${tone.ring} px-5 py-4`}>
            <div className="flex items-end justify-between">
              <div>
                <p className={`tabular text-[34px] font-bold leading-none ${tone.text}`}>{bmi.bmi}</p>
                <p className={`mt-1 text-[12.5px] font-bold ${tone.text}`}>{t(`profile.bmiCats.${bmi.key}`)}</p>
              </div>
              <p className="tabular text-right text-[11.5px] text-faint">
                {profile.weightKg} {t("common.kg")} · {profile.heightCm} {t("common.cm")}
              </p>
            </div>
            <BmiScale bmi={bmi.bmi} tone={tone} />
            <p className="mt-3 flex items-start gap-2 text-[11.5px] leading-relaxed text-faint">
              <Info size={13} className="mt-0.5 shrink-0" />
              {t("profile.bmiHint")}
            </p>
          </div>
        ) : (
          <EmptyState Icon={Info} title={t("common.none")} desc={t("profile.bodyMetrics")} />
        )}
      </Section>

      {/* Goal */}
      <Section title={t("profile.goal")}>
        <div className="flex flex-col gap-2">
          {["lose", "maintain", "gain"].map((g) => (
            <OptionCard
              key={g}
              active={profile?.goal === g}
              Icon={Target}
              title={t(`profile.goals.${g}`)}
              desc={savingGoal === g ? t("common.loading") : undefined}
              onClick={() => pickGoal(g)}
            />
          ))}
        </div>
        <SafetyNotice safety={safety} t={t} className="mt-2.5" />

        {/* Same picker onboarding shows when a direction is first picked —
            pulled into its own component so users who already finished
            onboarding (i.e. everyone before this shipped) can still reach a
            custom pace, not just whoever is mid-onboarding from now on. */}
        {(profile?.goal === "lose" || profile?.goal === "gain") && Number.isFinite(profile?.weightKg) && (
          <>
            <GoalPacePicker
              key={profile.goal}
              goal={profile.goal}
              currentKg={profile.weightKg}
              initialTargetWeight={profile.targetWeightKg ?? defaultTarget(profile.goal, profile.weightKg)}
              initialPaceWeeks={
                Number.isFinite(profile.targetPaceKgPerWeek) && Number.isFinite(profile.targetWeightKg)
                  ? estimateGoalAtRate({
                      goal: profile.goal,
                      currentKg: profile.weightKg,
                      targetKg: profile.targetWeightKg,
                      rateKgPerWeek: profile.targetPaceKgPerWeek,
                    })?.weeks ?? null
                  : null
              }
              onChange={setPendingGoalPace}
              lang={lang}
              t={t}
            />
            <Button full className="mt-3" loading={savingPace} onClick={savePace}>
              <Check size={17} /> {t("common.save")}
            </Button>
          </>
        )}
      </Section>

      {/* Daily targets */}
      <Section title={t("profile.dailyTarget")}>
        <div className="card grid grid-cols-4 gap-2 px-4 py-3.5">
          {[
            { l: t("common.kcal"), v: profile?.dailyCalorieTarget ?? "—", c: "text-neon" },
            { l: t("home.protein"), v: profile?.proteinTargetG ?? "—", c: "text-neon" },
            { l: t("home.carbs"), v: profile?.carbsTargetG ?? "—", c: "text-cyan" },
            { l: t("home.fat"), v: profile?.fatTargetG ?? "—", c: "text-amber" },
          ].map((m) => (
            <div key={m.l} className="text-center">
              <p className="truncate text-[9.5px] font-bold uppercase tracking-wider text-faint">{m.l}</p>
              <p className={`tabular mt-0.5 text-[15px] font-bold ${m.c}`}>{m.v}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Active plans */}
      <Section title={t("profile.activePlans")}>
        <div className="flex flex-col gap-2">
          <ListRow
            Icon={Dumbbell}
            title={t("profile.workoutPlan")}
            subtitle={
              workoutPlan
                ? `${workoutPlan.title || t("profile.workoutPlan")} · ${workoutDays} ${t("home.days")}`
                : t("profile.noPlan")
            }
            onClick={() => onNavigate("workouts")}
          />
          <ListRow
            Icon={UtensilsCrossed}
            title={t("profile.dietPlan")}
            subtitle={dietPlan ? dietPlan.title || t("profile.dietPlan") : t("profile.noPlan")}
            onClick={() => onNavigate("dietplan")}
          />
        </div>

        {!workoutPlan && (
          <div className="mt-2">
            <Button full variant="ghost" onClick={() => onNavigate("workouts")}>
              <Sparkles size={16} /> {t("profile.createPlan")}
            </Button>
          </div>
        )}
      </Section>

      {profile?.injuries && (
        <Section title={t("profile.injuries")}>
          <div className="card flex items-start gap-3 px-4 py-3.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber/12">
              <ShieldAlert size={17} className="text-amber" />
            </span>
            <p className="flex-1 text-[13px] leading-relaxed text-ink">{profile.injuries}</p>
          </div>
        </Section>
      )}
    </Screen>
  );
}
