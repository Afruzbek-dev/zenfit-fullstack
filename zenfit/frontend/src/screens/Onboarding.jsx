import { useMemo, useState } from "react";
import {
  ChevronLeft, ChevronRight, Sparkles, TrendingDown, TrendingUp, Scale, Award, Zap,
  Home, Building2, Clock, Dumbbell, Check, ShieldAlert, Flame, User2, Users, Trees, Activity,
} from "lucide-react";
import { Button, OptionCard } from "../components/ui.jsx";
import { generateWorkoutPlan } from "../lib/aiPlanEngine.js";
import { bestProgram } from "../data/programs.js";
import { haptic } from "../telegram.js";
import { useApp } from "../store.jsx";

const GOALS = [
  { id: "lose", Icon: TrendingDown, title: "Ozish", desc: "Yog' yo'qotish va vazn kamaytirish" },
  { id: "maintain", Icon: Scale, title: "Vaznni saqlash", desc: "Shakl va tonusni ushlab turish" },
  { id: "gain", Icon: TrendingUp, title: "Massa yig'ish", desc: "Mushak massasini oshirish" },
];

const ACTIVITY = [
  { id: "sedentary", title: "Harakatsiz", desc: "Ofis ishi, deyarli mashq yo'q" },
  { id: "light", title: "Yengil", desc: "Haftasiga 1-3 marta mashq" },
  { id: "moderate", title: "O'rtacha", desc: "Haftasiga 3-5 marta mashq" },
  { id: "active", title: "Faol", desc: "Haftasiga 6-7 marta mashq" },
  { id: "very_active", title: "Juda faol", desc: "Og'ir jismoniy ish + mashq" },
];

const LEVELS = [
  { id: "beginner", Icon: Award, title: "Yangi boshlovchi", desc: "1 yildan kam tajriba" },
  { id: "intermediate", Icon: Zap, title: "O'rta daraja", desc: "1-2 yil muntazam mashq" },
  { id: "advanced", Icon: TrendingUp, title: "Tajribali", desc: "2+ yil intensiv mashq" },
];

const DAYS = [
  { id: 3, title: "2-3 kun", desc: "Full Body split" },
  { id: 4, title: "4 kun", desc: "Upper / Lower split" },
  { id: 5, title: "5-6 kun", desc: "Push / Pull / Legs split" },
];

const EQUIPMENT = [
  { id: "home-none", Icon: Home, title: "Uyda, jihozsiz", desc: "Faqat tana vazni bilan" },
  { id: "home-dumbbell", Icon: Dumbbell, title: "Uyda, gantel bilan", desc: "Gantel va turnik" },
  { id: "gym", Icon: Building2, title: "Sport zali", desc: "Shtanga, gantel, trenajyorlar" },
  { id: "outdoor", Icon: Trees, title: "Ochiq havoda", desc: "Turnik, yugurish" },
];

const DURATION = [
  { id: "30", title: "~30 daqiqa", desc: "4-5 mashq" },
  { id: "60", title: "45-60 daqiqa", desc: "5-6 mashq" },
  { id: "90", title: "60-90 daqiqa", desc: "6-7 mashq" },
];

const INJURY_TAGS = [
  { id: "tizza", label: "Tizza" },
  { id: "bel", label: "Bel" },
  { id: "yelka", label: "Yelka" },
];

function StepShell({ title, subtitle, children }) {
  return (
    <div className="animate-fade-up flex flex-col gap-2.5">
      <h2 className="font-display text-[22px] font-bold leading-tight text-ink">{title}</h2>
      {subtitle && <p className="mb-1 text-[13px] leading-relaxed text-muted">{subtitle}</p>}
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function NumberField({ label, value, onChange, unit, min, max, placeholder }) {
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
      {invalid && <span className="mt-1 block text-[11px] text-rose">{min}-{max} oralig'ida bo'lishi kerak</span>}
    </label>
  );
}

export default function Onboarding({ onFinish }) {
  const { completeOnboarding, saveWorkoutPlan, showToast } = useApp();

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);

  const [gender, setGender] = useState(null);
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

  const nums = {
    age: Number(age),
    heightCm: Number(height),
    weightKg: Number(weight),
  };

  const bodyValid =
    nums.age >= 10 && nums.age <= 100 &&
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

  async function submitProfile() {
    setBusy(true);
    try {
      const res = await completeOnboarding({
        gender, age: nums.age, heightCm: nums.heightCm, weightKg: nums.weightKg,
        activityLevel: activity, goal,
        fitnessLevel: level || "beginner",
        equipment, daysPerWeek: days, sessionDuration: duration, injuries,
      });
      setTargets(res.computed);
      return true;
    } catch (e) {
      showToast(e.message || "Saqlashda xatolik", "error");
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
      await completeOnboarding({
        gender, age: nums.age, heightCm: nums.heightCm, weightKg: nums.weightKg,
        activityLevel: activity, goal, fitnessLevel: level,
        equipment, daysPerWeek: days, sessionDuration: duration, injuries,
      });
      await saveWorkoutPlan(plan);
      haptic("success");
      onFinish?.();
    } catch (e) {
      showToast(e.message || "Rejani saqlab bo'lmadi", "error");
    } finally {
      setBusy(false);
    }
  }

  const totalDots = 11;

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
              <p className="font-display text-lg font-bold text-ink">AI rejangizni tuzmoqda…</p>
              <p className="max-w-[260px] text-[13px] leading-relaxed text-muted">
                {nums.weightKg} kg vazningiz va maqsadingiz asosida og'irliklar hisoblanmoqda
              </p>
            </div>
          )}

          {!thinking && step === 0 && (
            <div className="animate-fade-up flex flex-col items-center text-center">
              <span className="mb-6 grid h-20 w-20 place-items-center rounded-3xl bg-neon/12 ring-1 ring-neon/25">
                <Flame size={36} className="text-neon" />
              </span>
              <h1 className="font-display text-[30px] font-bold leading-[1.1] tracking-tight text-ink">
                ZenFit’ga<br />xush kelibsiz
              </h1>
              <p className="mt-3 max-w-[300px] text-[14px] leading-relaxed text-muted">
                Ovqatlanish va mashqni bitta AI orqali boshqaring. 90 soniyada shaxsiy rejangizni oling.
              </p>
              <div className="mt-8 flex w-full flex-col gap-2">
                {[
                  "Shaxsiy kaloriya va makro me'yori",
                  "Vazningizga mos og'irliklar (kg) bilan mashq rejasi",
                  "Taom rasmini skanerlab kaloriya hisoblash",
                ].map((t) => (
                  <div key={t} className="flex items-center gap-2.5 rounded-2xl border border-borderSoft bg-surface px-4 py-3">
                    <Check size={15} className="shrink-0 text-neon" />
                    <span className="text-left text-[13px] text-ink">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!thinking && step === 1 && (
            <StepShell title="Jinsingiz?" subtitle="Kaloriya hisobi formulasi shunga bog'liq">
              <OptionCard active={gender === "male"} Icon={User2} title="Erkak" onClick={() => setGender("male")} />
              <OptionCard active={gender === "female"} Icon={Users} title="Ayol" onClick={() => setGender("female")} />
            </StepShell>
          )}

          {!thinking && step === 2 && (
            <StepShell title="Tana ko'rsatkichlaringiz" subtitle="BMR va kunlik me'yoringiz shu raqamlardan hisoblanadi">
              <NumberField label="Yosh" value={age} onChange={setAge} unit="yosh" min={10} max={100} placeholder="25" />
              <NumberField label="Bo'y" value={height} onChange={setHeight} unit="sm" min={100} max={250} placeholder="175" />
              <NumberField label="Vazn" value={weight} onChange={setWeight} unit="kg" min={30} max={300} placeholder="70" />
            </StepShell>
          )}

          {!thinking && step === 3 && (
            <StepShell title="Kunlik faolligingiz?" subtitle="Mashqdan tashqari umumiy harakatingiz">
              {ACTIVITY.map((a) => (
                <OptionCard key={a.id} active={activity === a.id} Icon={Activity} title={a.title} desc={a.desc} onClick={() => setActivity(a.id)} />
              ))}
            </StepShell>
          )}

          {!thinking && step === 4 && (
            <StepShell title="Asosiy maqsadingiz?" subtitle="Kaloriya va mashq rejasi shunga moslashtiriladi">
              {GOALS.map((g) => (
                <OptionCard key={g.id} active={goal === g.id} Icon={g.Icon} title={g.title} desc={g.desc} onClick={() => setGoal(g.id)} />
              ))}
            </StepShell>
          )}

          {!thinking && step === 5 && targets && (
            <div className="animate-fade-up flex flex-col items-center text-center">
              <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-neon/15">
                <Check size={26} className="text-neon" />
              </span>
              <h2 className="font-display text-[22px] font-bold text-ink">Rejangiz tayyor!</h2>
              <p className="mt-1 text-[13px] text-muted">
                {goal === "lose" ? "Ozish" : goal === "gain" ? "Massa yig'ish" : "Vaznni saqlash"} maqsadi bo'yicha hisoblandi
              </p>

              <div className="card card-lit mt-6 w-full px-5 py-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">Kunlik kaloriya me'yori</p>
                <p className="tabular mt-1 text-[46px] font-bold leading-none text-neon">{targets.dailyCalorieTarget}</p>
                <p className="mt-1 text-[12px] text-muted">kcal / kun</p>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[
                    { l: "Oqsil", v: targets.proteinTargetG, c: "text-neon" },
                    { l: "Uglevod", v: targets.carbsTargetG, c: "text-cyan" },
                    { l: "Yog'", v: targets.fatTargetG, c: "text-amber" },
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

              <p className="mt-5 text-[13px] leading-relaxed text-muted">
                Endi mashq rejangizni tuzamiz — bu 5 ta qisqa savol.
              </p>
            </div>
          )}

          {!thinking && step === 6 && (
            <StepShell title="Mashg'ulot tajribangiz?" subtitle="Setlar soni va boshlang'ich og'irlik shunga qarab belgilanadi">
              {LEVELS.map((l) => (
                <OptionCard key={l.id} active={level === l.id} Icon={l.Icon} title={l.title} desc={l.desc} onClick={() => setLevel(l.id)} />
              ))}
            </StepShell>
          )}

          {!thinking && step === 7 && (
            <StepShell title="Haftasiga necha kun?" subtitle="Har hafta ushlab tura oladigan realistik sonni tanlang">
              {DAYS.map((d) => (
                <OptionCard key={d.id} active={days === d.id} Icon={Clock} title={d.title} desc={d.desc} onClick={() => setDays(d.id)} />
              ))}
            </StepShell>
          )}

          {!thinking && step === 8 && (
            <StepShell title="Qayerda mashq qilasiz?" subtitle="Mavjud jihozga qarab mashqlar tanlanadi">
              {EQUIPMENT.map((e) => (
                <OptionCard key={e.id} active={equipment === e.id} Icon={e.Icon} title={e.title} desc={e.desc} onClick={() => setEquipment(e.id)} />
              ))}
            </StepShell>
          )}

          {!thinking && step === 9 && (
            <StepShell title="Bir mashg'ulot qancha vaqt?" subtitle="Mashqlar soni shu vaqtga sig'diriladi">
              {DURATION.map((d) => (
                <OptionCard key={d.id} active={duration === d.id} Icon={Clock} title={d.title} desc={d.desc} onClick={() => setDuration(d.id)} />
              ))}
            </StepShell>
          )}

          {!thinking && step === 10 && (
            <StepShell title="Jarohat yoki cheklov bormi?" subtitle="Ixtiyoriy — bo'lsa, AI xavfli mashqlarni xavfsizga almashtiradi">
              <div className="rounded-2xl border border-borderSoft bg-surface px-4 py-3.5 focus-within:border-neon/60">
                <input
                  value={injuries}
                  onChange={(e) => setInjuries(e.target.value)}
                  placeholder="masalan: tizza, bel…"
                  className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-faint"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {INJURY_TAGS.map((t) => {
                  const on = injuries.toLowerCase().includes(t.id);
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        haptic("select");
                        setInjuries((prev) =>
                          on
                            ? prev.replace(new RegExp(`\\s*,?\\s*${t.id}`, "i"), "").replace(/^,\s*/, "").trim()
                            : prev ? `${prev}, ${t.id}` : t.id
                        );
                      }}
                      className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold ${
                        on ? "border-amber bg-amber/15 text-amber" : "border-borderSoft bg-surfaceAlt text-muted"
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11.5px] leading-relaxed text-faint">
                Jiddiy jarohat bo'lsa, mashq boshlashdan oldin shifokor bilan maslahatlashing.
              </p>
            </StepShell>
          )}

          {!thinking && step === 11 && plan && (
            <div className="animate-fade-up flex flex-col gap-4">
              <div className="flex flex-col items-center text-center">
                <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-neon/15">
                  <Sparkles size={24} className="text-neon" />
                </span>
                <h2 className="font-display text-[21px] font-bold text-ink">Shaxsiy rejangiz tayyor!</h2>
                <p className="mt-1 max-w-[290px] text-[12.5px] leading-relaxed text-muted">
                  {nums.weightKg} kg vazningiz asosida boshlang'ich og'irliklar hisoblandi
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
                    <b>{matched.p.title}</b> dasturi ham sizga {matched.matchPercent}% mos — Mashqlar bo'limidan almashtira olasiz.
                  </p>
                </div>
              )}

              <div className="card px-4 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint">Haftalik reja</span>
                  <span className="rounded-full bg-surfaceAlt px-2.5 py-1 text-[10.5px] font-semibold text-muted">
                    {plan.rules.reps} takror • {plan.rules.rest} dam
                  </span>
                </div>
                <p className="mb-3 text-[11.5px] leading-relaxed text-faint">{plan.rules.note}</p>

                <div className="flex flex-col gap-2">
                  {plan.days.filter((d) => !d.rest).map((d) => (
                    <div key={d.day} className="rounded-2xl border border-borderSoft bg-surfaceAlt p-3.5">
                      <div className="mb-2 flex items-center gap-2">
                        <Dumbbell size={13} className="text-neon" />
                        <span className="text-[12.5px] font-bold text-ink">{d.day} — {d.label}</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {d.exercises.map((e) => (
                          <div key={e.id} className="flex items-baseline justify-between gap-2">
                            <span className={`text-[12px] leading-snug ${e.adjusted ? "text-amber" : "text-muted"}`}>
                              {e.name}{e.adjusted && " ⚠"}
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
                aria-label="Orqaga"
                className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl border border-borderSoft bg-surfaceAlt active:scale-95"
              >
                <ChevronLeft size={20} className="text-ink" />
              </button>
            )}
            {step < 11 ? (
              <Button full size="lg" disabled={!canNext} loading={busy} onClick={next}>
                {step === 0 ? "Boshlash" : step === 10 ? "AI bilan reja tuzish" : "Davom etish"}
                {step === 10 ? <Sparkles size={17} /> : <ChevronRight size={18} />}
              </Button>
            ) : (
              <div className="flex w-full flex-col gap-2">
                <Button full size="lg" loading={busy} onClick={finish}>
                  Rejani saqlash va boshlash 🚀
                </Button>
                <button
                  onClick={() => onFinish?.()}
                  className="py-1.5 text-center text-[12px] font-semibold text-faint"
                >
                  Hozircha o'tkazib yuborish
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
