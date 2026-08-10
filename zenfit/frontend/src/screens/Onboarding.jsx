import { useMemo, useState } from "react";
import {
  ChevronLeft, ChevronRight, Sparkles, TrendingDown, TrendingUp, Scale, Award, Zap,
  Home, Building2, Clock, Dumbbell, Check, ShieldAlert, Flame, User2, Users, Trees, Activity,
  Minus, Plus, CalendarClock, Languages, Crown,
} from "lucide-react";
import { Button, OptionCard } from "../components/ui.jsx";
import SafetyNotice from "../components/SafetyNotice.jsx";
import PremiumSheet from "./profile/PremiumSheet.jsx";
import { generateWorkoutPlan, localizeDay, rulesNote } from "../lib/aiPlanEngine.js";
import { bestProgram, PROGRAMS } from "../data/programs.js";
import { localizeExercise } from "../data/exerciseText.js";
import { estimateGoal, defaultTarget, targetBounds } from "../lib/goalPlan.js";
import { shortDate } from "../lib/format.js";
import { LANGUAGES, hasStoredLanguage } from "../lib/i18n.js";
import { haptic } from "../telegram.js";
import { useApp } from "../store.jsx";

/** Bounds only make sense once a plausible bodyweight has been entered. */
const bodyValidFor = (kg) => Number.isFinite(kg) && kg >= 30 && kg <= 300;

/**
 * Must match AGE_MIN / AGE_MAX in the backend's lib/calorie.js. The server
 * answers 400 outside this range, and a form that accepts 10 only to be
 * rejected on submit is worse than one that never offered it.
 */
const AGE_MIN = 12;
const AGE_MAX = 100;

/**
 * Only the id and the icon live here — every label comes from the dictionary,
 * keyed by that id, so a new language never means touching this file.
 */
const GOALS = [
  { id: "lose", Icon: TrendingDown },
  { id: "maintain", Icon: Scale },
  { id: "gain", Icon: TrendingUp },
];

const ACTIVITY = ["sedentary", "light", "moderate", "active", "very_active"];

const LEVELS = [
  { id: "beginner", Icon: Award },
  { id: "intermediate", Icon: Zap },
  { id: "advanced", Icon: TrendingUp },
];

const DAYS = [3, 4, 5];

const EQUIPMENT = [
  { id: "home-none", Icon: Home },
  { id: "home-dumbbell", Icon: Dumbbell },
  { id: "gym", Icon: Building2 },
  { id: "outdoor", Icon: Trees },
];

const DURATION = ["30", "60", "90"];

const INJURY_TAGS = ["tizza", "bel", "yelka"];

const FLAGS = { uz: "🇺🇿", ru: "🇷🇺", en: "🇬🇧" };

/**
 * Asked before anything else, because every screen after it — including the
 * rest of onboarding — renders in whatever is chosen here.
 *
 * The heading is trilingual and the options name themselves: at this point the
 * app has only guessed at a language from the Telegram client, so nothing on
 * this screen can go through the dictionary without risking being unreadable
 * to the person it is asking.
 */
function LanguageStep({ current, onPick, busy }) {
  return (
    <div className="animate-fade-up flex flex-col items-center text-center">
      <span className="mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-neon/12 ring-1 ring-neon/25">
        <Languages size={36} className="text-neon" />
      </span>
      <h1 className="font-display text-[26px] font-bold leading-[1.15] tracking-tight text-ink">
        Tilni tanlang
      </h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted">Выберите язык · Choose your language</p>

      <div className="mt-8 flex w-full flex-col gap-2.5">
        {LANGUAGES.map((l) => (
          <button
            key={l.id}
            onClick={() => onPick(l.id)}
            disabled={busy}
            aria-label={l.native}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left active:scale-[0.98] disabled:opacity-60 ${
              current === l.id ? "border-neon/60 bg-neon/10" : "border-borderSoft bg-surface"
            }`}
          >
            <span className="text-[22px] leading-none">{FLAGS[l.id]}</span>
            <span className="flex-1 text-[15px] font-bold text-ink">{l.native}</span>
            {current === l.id && <Check size={17} className="shrink-0 text-neon" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepShell({ title, subtitle, children }) {
  return (
    <div className="animate-fade-up flex flex-col gap-2.5">
      <h2 className="font-display text-[22px] font-bold leading-tight text-ink">{title}</h2>
      {subtitle && <p className="mb-1 text-[13px] leading-relaxed text-muted">{subtitle}</p>}
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function NumberField({ label, value, onChange, unit, min, max, placeholder, hint }) {
  const invalid = value !== "" && (Number(value) < min || Number(value) > max);
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-faint">{label}</span>
      <span
        className={`flex items-center gap-2 rounded-2xl border bg-surface px-4 py-3.5 ${
          invalid ? "border-rose" : "border-borderSoft focus-within:border-neon/60"
        }`}
      >
        <input
          type="number"
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="tabular w-full bg-transparent text-[17px] font-bold text-ink outline-none placeholder:text-faint"
        />
        <span className="shrink-0 text-[13px] font-semibold text-faint">{unit}</span>
      </span>
      {invalid && <span className="mt-1 block text-[11px] text-rose">{hint}</span>}
    </label>
  );
}

export default function Onboarding({ onFinish }) {
  const { completeOnboarding, saveWorkoutPlan, setLanguage, showToast, t, lang, subscription } = useApp();

  // Only asked when the user has never chosen: storedLanguage() otherwise
  // guesses from the Telegram client, which is often wrong here.
  const [langPicked, setLangPicked] = useState(() => hasStoredLanguage());
  const [langBusy, setLangBusy] = useState(false);

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);

  const [gender, setGender] = useState(null);
  const [pregnant, setPregnant] = useState(false);
  const [safety, setSafety] = useState(null);
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activity, setActivity] = useState(null);
  const [goal, setGoal] = useState(null);
  const [level, setLevel] = useState(null);
  const [days, setDays] = useState(null);
  const [equipment, setEquipment] = useState(null);
  const [duration, setDuration] = useState(null);
  const [injuries, setInjuries] = useState("");
  const [targets, setTargets] = useState(null);
  const [targetWeight, setTargetWeight] = useState(null);

  // Step 11 only: "personal" shows the AI-personalized plan (Premium), "preset"
  // switches to picking one of the free ready-made programs instead.
  const [planChoice, setPlanChoice] = useState("personal");
  const [premiumOpen, setPremiumOpen] = useState(false);

  const nums = {
    age: Number(age),
    heightCm: Number(height),
    weightKg: Number(weight),
  };

  const bounds = useMemo(
    () => (bodyValidFor(nums.weightKg) && (goal === "lose" || goal === "gain") ? targetBounds(goal, nums.weightKg) : null),
    [goal, nums.weightKg]
  );

  const goalEstimate = useMemo(
    () => estimateGoal({ goal, currentKg: nums.weightKg, targetKg: targetWeight }),
    [goal, nums.weightKg, targetWeight]
  );

  const bodyValid =
    nums.age >= AGE_MIN && nums.age <= AGE_MAX &&
    nums.heightCm >= 100 && nums.heightCm <= 250 &&
    nums.weightKg >= 30 && nums.weightKg <= 300;

  // 0 welcome, 1 gender, 2 body, 3 activity, 4 goal, 5 targets,
  // 6 level, 7 days, 8 equipment, 9 duration, 10 injuries, 11 plan
  const canNext = [
    true, !!gender, bodyValid, !!activity, !!goal, true,
    !!level, !!days, !!equipment, !!duration, true, true,
  ][step];

  const plan = useMemo(() => {
    if (step !== 11) return null;
    return generateWorkoutPlan({
      goal, level, daysPerWeek: days, equipment, duration, injuries, weightKg: nums.weightKg,
    });
  }, [step, goal, level, days, equipment, duration, injuries, nums.weightKg]);

  const matched = useMemo(
    () => (step === 11 ? bestProgram({ goal, level, equipment, daysPerWeek: days }) : null),
    [step, goal, level, equipment, days]
  );

  /**
   * The profile is posted twice — once at step 4 to get the computed targets,
   * once at the end to store the questionnaire answers. Both must send the same
   * shape: the server treats a missing targetWeightKg as "no goal" and nulls
   * out target_weight_kg / target_date, so the second post used to erase the
   * goal the first one had just saved.
   */
  function profilePayload() {
    return {
      gender, age: nums.age, heightCm: nums.heightCm, weightKg: nums.weightKg,
      activityLevel: activity, goal, pregnant: gender === "female" && pregnant,
      fitnessLevel: level || "beginner",
      equipment, daysPerWeek: days, sessionDuration: duration, injuries,
      targetWeightKg: targetWeight ?? undefined,
    };
  }

  async function pickLanguage(code) {
    setLangBusy(true);
    haptic("light");
    try {
      // Persists locally straight away; the write-through to the profile is a
      // no-op until one exists, which is why it is repeated once the profile is
      // created (see submitProfile).
      await setLanguage(code);
      setLangPicked(true);
    } finally {
      setLangBusy(false);
    }
  }

  async function submitProfile() {
    setBusy(true);
    try {
      const res = await completeOnboarding(profilePayload());
      setTargets(res.computed);
      // May carry a refusal: the engine downgrades an unsafe "lose" rather than
      // erroring, so this is the only place the user finds out it happened.
      setSafety(res.safety || null);
      // The profile row exists only now, so this is the first moment the chosen
      // language can actually be stored server-side. Without it the next boot
      // would read the column's 'uz' default and switch the user back.
      setLanguage(lang).catch(() => {});
      return true;
    } catch (e) {
      showToast(e.message || t("onboarding.saveFailed"), "error");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function next() {
    haptic("light");

    // Targets are computed server-side, so the profile is saved before showing them.
    if (step === 4) {
      const ok = await submitProfile();
      if (ok) setStep(5);
      return;
    }

    if (step === 10) {
      setThinking(true);
      // A brief pause makes the instant rule-engine result feel considered.
      setTimeout(() => {
        setThinking(false);
        setStep(11);
      }, 1300);
      return;
    }

    setStep((s) => s + 1);
  }

  async function finish() {
    setBusy(true);
    try {
      // Persist the questionnaire answers alongside the plan.
      await completeOnboarding(profilePayload());
      await saveWorkoutPlan(plan);
      haptic("success");
      onFinish?.();
    } catch (e) {
      showToast(e.message || t("onboarding.saveFailed"), "error");
    } finally {
      setBusy(false);
    }
  }

  /**
   * The free path: same rule engine as the personalized plan, but seeded from
   * the chosen program's own goal/level/days/equipment instead of the user's
   * answers. Bodyweight and injuries still come from the user — a "generic"
   * plan should never suggest an unsafe load or a contraindicated exercise.
   */
  async function finishWithProgram(program) {
    setBusy(true);
    try {
      const presetPlan = generateWorkoutPlan({
        goal: program.goal, level: program.level, daysPerWeek: program.days,
        equipment: program.equipment, duration, injuries, weightKg: nums.weightKg,
      });
      await completeOnboarding(profilePayload());
      await saveWorkoutPlan(presetPlan);
      haptic("success");
      onFinish?.();
    } catch (e) {
      showToast(e.message || t("onboarding.saveFailed"), "error");
    } finally {
      setBusy(false);
    }
  }

  const totalDots = 11;

  // Before the step machine, not part of it: the questions below have to be
  // readable before they can be answered.
  if (!langPicked) {
    return (
      <div className="app-atmosphere relative min-h-screen">
        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-5 py-8">
          <LanguageStep current={lang} onPick={pickLanguage} busy={langBusy} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-atmosphere relative min-h-screen">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg flex-col px-5">
        {step > 0 && step < 11 && (
          <div className="flex items-center gap-1.5" style={{ paddingTop: "calc(var(--safe-top) + 20px)" }}>
            {Array.from({ length: totalDots }).map((_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < step ? "bg-neon" : "bg-borderSoft"}`}
              />
            ))}
          </div>
        )}

        <div className="flex flex-1 flex-col justify-center py-8">
          {thinking && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative grid h-20 w-20 place-items-center">
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-neon/25" />
                <span className="relative grid h-16 w-16 place-items-center rounded-full bg-neon/15">
                  <Sparkles size={28} className="animate-pulse text-neon" />
                </span>
              </div>
              <p className="font-display text-lg font-bold text-ink">{t("onboarding.thinking")}</p>
              <p className="max-w-[260px] text-[13px] leading-relaxed text-muted">
                {t("onboarding.thinkingDesc", { kg: nums.weightKg })}
              </p>
            </div>
          )}

          {!thinking && step === 0 && (
            <div className="animate-fade-up flex flex-col items-center text-center">
              <span className="mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-neon/12 ring-1 ring-neon/25">
                <Flame size={36} className="text-neon" />
              </span>
              <h1 className="font-display text-[30px] font-bold leading-[1.1] tracking-tight text-ink">
                {t("onboarding.welcomeTitle")}
              </h1>
              <p className="mt-3 max-w-[300px] text-[14px] leading-relaxed text-muted">
                {t("onboarding.welcomeDesc")}
              </p>
              <div className="mt-8 flex w-full flex-col gap-2">
                {(t("onboarding.bullets") || []).map((bullet) => (
                  <div key={bullet} className="flex items-center gap-2.5 rounded-2xl border border-borderSoft bg-surface px-4 py-3">
                    <Check size={15} className="shrink-0 text-neon" />
                    <span className="text-left text-[13px] text-ink">{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!thinking && step === 1 && (
            <StepShell title={t("onboarding.genderTitle")} subtitle={t("onboarding.genderDesc")}>
              <OptionCard
                active={gender === "male"}
                Icon={User2}
                title={t("onboarding.male")}
                onClick={() => {
                  setGender("male");
                  setPregnant(false); // never carry the answer across a change of mind
                }}
              />
              <OptionCard active={gender === "female"} Icon={Users} title={t("onboarding.female")} onClick={() => setGender("female")} />

              {/* Asked here rather than as its own step: it is a follow-up to
                  one answer, and a whole screen for a question most users skip
                  is a screen most users would abandon on. */}
              {gender === "female" && (
                <label className="animate-fade-up mt-2 flex cursor-pointer items-start gap-3 rounded-2xl border border-borderSoft bg-surface px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={pregnant}
                    onChange={(e) => {
                      haptic("select");
                      setPregnant(e.target.checked);
                    }}
                    className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[color:rgb(var(--c-neon))]"
                  />
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-bold text-ink">{t("onboarding.pregnantTitle")}</span>
                    <span className="mt-0.5 block text-[11.5px] leading-relaxed text-muted">
                      {t("onboarding.pregnantDesc")}
                    </span>
                  </span>
                </label>
              )}
            </StepShell>
          )}

          {!thinking && step === 2 && (
            <StepShell title={t("onboarding.bodyTitle")} subtitle={t("onboarding.bodyDesc")}>
              <NumberField
                label={t("onboarding.age")} value={age} onChange={setAge} unit={t("onboarding.ageUnit")}
                min={AGE_MIN} max={AGE_MAX} placeholder="25"
                hint={t("onboarding.rangeHint", { min: AGE_MIN, max: AGE_MAX })}
              />
              <NumberField
                label={t("onboarding.height")} value={height} onChange={setHeight} unit={t("common.cm")}
                min={100} max={250} placeholder="175" hint={t("onboarding.rangeHint", { min: 100, max: 250 })}
              />
              <NumberField
                label={t("onboarding.weight")} value={weight} onChange={setWeight} unit={t("common.kg")}
                min={30} max={300} placeholder="70" hint={t("onboarding.rangeHint", { min: 30, max: 300 })}
              />
            </StepShell>
          )}

          {!thinking && step === 3 && (
            <StepShell title={t("onboarding.activityTitle")} subtitle={t("onboarding.activityDesc")}>
              {ACTIVITY.map((id) => (
                <OptionCard
                  key={id}
                  active={activity === id}
                  Icon={Activity}
                  title={t(`onboarding.activities.${id}.title`)}
                  desc={t(`onboarding.activities.${id}.desc`)}
                  onClick={() => setActivity(id)}
                />
              ))}
              <p className="mt-1 text-[11.5px] leading-relaxed text-faint">{t("onboarding.activityNote")}</p>
            </StepShell>
          )}

          {!thinking && step === 4 && (
            <StepShell title={t("onboarding.goalTitle")} subtitle={t("onboarding.goalDesc")}>
              {GOALS.map((g) => (
                <OptionCard
                  key={g.id}
                  active={goal === g.id}
                  Icon={g.Icon}
                  title={t(`onboarding.goals.${g.id}.title`)}
                  desc={t(`onboarding.goals.${g.id}.desc`)}
                  onClick={() => {
                    setGoal(g.id);
                    // Seed a realistic target the moment a direction is picked.
                    setTargetWeight(defaultTarget(g.id, nums.weightKg));
                  }}
                />
              ))}

              {(goal === "lose" || goal === "gain") && bounds && (
                <div className="animate-fade-up mt-5">
                  <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-faint">
                    {t("onboarding.targetTitle")}
                  </p>

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
                        <p className="mt-1.5 text-[11px] leading-relaxed text-faint">
                          {t("onboarding.targetSafe")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </StepShell>
          )}

          {!thinking && step === 5 && targets && (
            <div className="animate-fade-up flex flex-col items-center text-center">
              <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-neon/15">
                <Check size={26} className="text-neon" />
              </span>
              <h2 className="font-display text-[22px] font-bold text-ink">{t("onboarding.targetsReady")}</h2>
              <p className="mt-1 text-[13px] text-muted">
                {/* The goal the numbers were actually built from, which is not
                    always the one that was picked. */}
                {t("onboarding.targetsFor", { goal: t(`onboarding.goals.${safety?.goal || goal}.title`) })}
              </p>

              <SafetyNotice safety={safety} t={t} className="mt-5 w-full text-left" />

              <div className="card card-lit mt-6 w-full px-5 py-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">{t("onboarding.dailyCalories")}</p>
                <p className="tabular mt-1 text-[46px] font-bold leading-none text-neon">{targets.dailyCalorieTarget}</p>
                <p className="mt-1 text-[12px] text-muted">kcal / {t("common.day")}</p>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[
                    { l: t("home.protein"), v: targets.proteinTargetG, c: "text-neon" },
                    { l: t("home.carbs"), v: targets.carbsTargetG, c: "text-cyan" },
                    { l: t("home.fat"), v: targets.fatTargetG, c: "text-amber" },
                  ].map((m) => (
                    <div key={m.l} className="rounded-xl bg-surfaceAlt px-2 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-faint">{m.l}</p>
                      <p className={`tabular mt-0.5 text-[17px] font-bold ${m.c}`}>{m.v}<span className="text-[11px] text-faint">g</span></p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-center gap-4 border-t border-borderSoft pt-3 text-[11px] text-faint">
                  <span>BMR <b className="tabular text-muted">{targets.bmr}</b></span>
                  <span>TDEE <b className="tabular text-muted">{targets.tdee}</b></span>
                </div>
              </div>

              <p className="mt-5 text-[13px] leading-relaxed text-muted">{t("onboarding.nextSteps")}</p>
            </div>
          )}

          {!thinking && step === 6 && (
            <StepShell title={t("onboarding.levelTitle")} subtitle={t("onboarding.levelDesc")}>
              {LEVELS.map((l) => (
                <OptionCard
                  key={l.id}
                  active={level === l.id}
                  Icon={l.Icon}
                  title={t(`onboarding.levels.${l.id}.title`)}
                  desc={t(`onboarding.levels.${l.id}.desc`)}
                  onClick={() => setLevel(l.id)}
                />
              ))}
            </StepShell>
          )}

          {!thinking && step === 7 && (
            <StepShell title={t("onboarding.daysTitle")} subtitle={t("onboarding.daysDesc")}>
              {DAYS.map((d) => (
                <OptionCard
                  key={d}
                  active={days === d}
                  Icon={Clock}
                  title={t(`onboarding.days.${d}.title`)}
                  desc={t(`onboarding.days.${d}.desc`)}
                  onClick={() => setDays(d)}
                />
              ))}
            </StepShell>
          )}

          {!thinking && step === 8 && (
            <StepShell title={t("onboarding.equipmentTitle")} subtitle={t("onboarding.equipmentDesc")}>
              {EQUIPMENT.map((e) => (
                <OptionCard
                  key={e.id}
                  active={equipment === e.id}
                  Icon={e.Icon}
                  title={t(`onboarding.equipments.${e.id}.title`)}
                  desc={t(`onboarding.equipments.${e.id}.desc`)}
                  onClick={() => setEquipment(e.id)}
                />
              ))}
            </StepShell>
          )}

          {!thinking && step === 9 && (
            <StepShell title={t("onboarding.durationTitle")} subtitle={t("onboarding.durationDesc")}>
              {DURATION.map((d) => (
                <OptionCard
                  key={d}
                  active={duration === d}
                  Icon={Clock}
                  title={t(`onboarding.durations.${d}.title`)}
                  desc={t(`onboarding.durations.${d}.desc`)}
                  onClick={() => setDuration(d)}
                />
              ))}
            </StepShell>
          )}

          {!thinking && step === 10 && (
            <StepShell title={t("onboarding.injuriesTitle")} subtitle={t("onboarding.injuriesDesc")}>
              <div className="rounded-2xl border border-borderSoft bg-surface px-4 py-3.5 focus-within:border-neon/60">
                <input
                  value={injuries}
                  onChange={(e) => setInjuries(e.target.value)}
                  placeholder={t("onboarding.injuriesPlaceholder")}
                  className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {INJURY_TAGS.map((tag) => {
                  // The tag is stored by its id, so what the AI reads stays
                  // stable no matter which language the button was shown in.
                  const on = injuries.toLowerCase().includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => {
                        haptic("select");
                        setInjuries((prev) =>
                          on
                            ? prev.replace(new RegExp(`\\s*,?\\s*${tag}`, "i"), "").replace(/^,\s*/, "").trim()
                            : prev ? `${prev}, ${tag}` : tag
                        );
                      }}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
                        on ? "border-amber bg-amber/15 text-amber" : "border-borderSoft bg-surfaceAlt text-muted"
                      }`}
                    >
                      {t(`onboarding.injuryTags.${tag}`)}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11.5px] leading-relaxed text-faint">{t("onboarding.injuryWarn")}</p>
            </StepShell>
          )}

          {!thinking && step === 11 && plan && planChoice === "preset" && (
            <div className="animate-fade-up flex flex-col gap-3">
              <button
                onClick={() => {
                  haptic("light");
                  setPlanChoice("personal");
                }}
                className="flex w-fit items-center gap-1 text-[12.5px] font-semibold text-muted"
              >
                <ChevronLeft size={14} /> {t("common.back")}
              </button>

              <div className="flex flex-col items-center text-center">
                <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-neon/15">
                  <Dumbbell size={24} className="text-neon" />
                </span>
                <h2 className="font-display text-[21px] font-bold text-ink">{t("onboarding.presetTitle")}</h2>
                <p className="mt-1 max-w-[290px] text-[12.5px] leading-relaxed text-muted">
                  {t("onboarding.presetDesc")}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {PROGRAMS.map((p) => (
                  <button
                    key={p.id}
                    disabled={busy}
                    onClick={() => finishWithProgram(p)}
                    className="flex items-center gap-3 rounded-2xl border border-borderSoft bg-surfaceAlt px-4 py-3.5 text-left active:scale-[0.98] disabled:opacity-60"
                  >
                    <span className="text-[26px]">{p.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-bold text-ink">{p.title}</p>
                      <p className="mt-0.5 text-[11.5px] text-muted">
                        {p.trainer} · {p.days} {t("home.days")} · {p.weeks} {t("onboarding.weeks")}
                      </p>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-faint" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {!thinking && step === 11 && plan && planChoice === "personal" && (
            <div className="animate-fade-up flex flex-col gap-4">
              <div className="flex flex-col items-center text-center">
                <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-neon/15">
                  <Sparkles size={24} className="text-neon" />
                </span>
                <h2 className="font-display text-[21px] font-bold text-ink">{t("onboarding.planPersonal")}</h2>
                <p className="mt-1 max-w-[290px] text-[12.5px] leading-relaxed text-muted">
                  {t("onboarding.planBasedOn", { kg: nums.weightKg })}
                </p>
              </div>

              {plan.injuryNotes && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-amber/12 px-4 py-3">
                  <ShieldAlert size={16} className="mt-0.5 shrink-0 text-amber" />
                  <p className="text-[12px] leading-relaxed text-amber">{plan.injuryNotes}</p>
                </div>
              )}

              {matched && (
                <div className="flex items-center gap-2 rounded-2xl bg-cyan/10 px-4 py-3">
                  <Award size={15} className="shrink-0 text-cyan" />
                  <p className="text-[11.5px] leading-relaxed text-cyan">
                    {t("onboarding.matchedProgram", { title: matched.p.title, percent: matched.matchPercent })}
                  </p>
                </div>
              )}

              <div className="card px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint">{t("onboarding.weeklyPlan")}</span>
                  <span className="rounded-full bg-surfaceAlt px-2.5 py-1 text-[10.5px] font-semibold text-muted">
                    {t("onboarding.repsRest", { reps: plan.rules.reps, rest: plan.rules.rest })}
                  </span>
                </div>
                <p className="mb-3 text-[11.5px] leading-relaxed text-faint">{rulesNote(plan.rules, t)}</p>

                <div className="flex flex-col gap-2">
                  {plan.days.filter((d) => !d.rest).map((d) => (
                    <div key={d.day} className="rounded-2xl border border-borderSoft bg-surfaceAlt p-3.5">
                      <div className="mb-2 flex items-center gap-2">
                        <Dumbbell size={13} className="text-neon" />
                        <span className="text-[12.5px] font-bold text-ink">{localizeDay(d.day, t)} — {d.label}</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {d.exercises.map((e) => (
                          <div key={e.id} className="flex items-baseline justify-between gap-2">
                            <span className={`text-[12px] leading-snug ${e.adjusted ? "text-amber" : "text-muted"}`}>
                              {localizeExercise(e, lang).name}{e.adjusted && " ⚠"}
                            </span>
                            <span className="tabular shrink-0 text-[11px] font-semibold text-faint">
                              {e.sets}×{e.reps}
                              {e.suggestedWeightKg ? ` • ${e.suggestedWeightKg}kg` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {!subscription?.isPremium && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-amber/30 bg-amber/[0.08] px-4 py-3.5">
                  <Crown size={17} className="mt-0.5 shrink-0 text-amber" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-amber">{t("onboarding.planLockedTitle")}</p>
                    <p className="mt-0.5 text-[11.5px] leading-relaxed text-amber/85">{t("onboarding.planLockedDesc")}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {!thinking && (
          <div className="flex gap-2.5 pb-8">
            {step > 0 && step < 11 && (
              <button
                onClick={() => {
                  haptic("light");
                  setStep((s) => Math.max(0, s - 1));
                }}
                aria-label={t("common.back")}
                className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl border border-borderSoft bg-surfaceAlt active:scale-95"
              >
                <ChevronLeft size={20} className="text-ink" />
              </button>
            )}
            {step < 11 ? (
              <Button full size="lg" disabled={!canNext} loading={busy} onClick={next}>
                {step === 0 ? t("onboarding.start") : step === 10 ? t("onboarding.finish") : t("onboarding.next")}
                {step === 10 ? <Sparkles size={17} /> : <ChevronRight size={18} />}
              </Button>
            ) : planChoice === "preset" ? (
              <button
                onClick={() => onFinish?.()}
                className="w-full py-1.5 text-center text-[12px] font-semibold text-faint"
              >
                {t("onboarding.skip")}
              </button>
            ) : subscription?.isPremium ? (
              <div className="flex w-full flex-col gap-2">
                <Button full size="lg" loading={busy} onClick={finish}>
                  {t("onboarding.savePlan")}
                </Button>
                <button
                  onClick={() => onFinish?.()}
                  className="py-1.5 text-center text-[12px] font-semibold text-faint"
                >
                  {t("onboarding.skip")}
                </button>
              </div>
            ) : (
              <div className="flex w-full flex-col gap-2">
                <Button full size="lg" onClick={() => setPremiumOpen(true)}>
                  <Crown size={17} /> {t("onboarding.getPremium")}
                </Button>
                <Button
                  full
                  size="lg"
                  variant="ghost"
                  onClick={() => {
                    haptic("light");
                    setPlanChoice("preset");
                  }}
                >
                  <Dumbbell size={17} /> {t("onboarding.chooseProgram")}
                </Button>
                <button
                  onClick={() => onFinish?.()}
                  className="py-1.5 text-center text-[12px] font-semibold text-faint"
                >
                  {t("onboarding.skip")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <PremiumSheet open={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </div>
  );
}
