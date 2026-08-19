import { useMemo, useState } from "react";
import { Sparkles, Dumbbell, Coffee, Check, Play, RefreshCw, BookOpen, ShieldAlert, Lightbulb, Crown, Flame } from "lucide-react";
import { Screen, Section, Button, Sheet, EmptyState, ListRow, ErrorNote } from "../components/ui.jsx";
import WorkoutSession from "./WorkoutSession.jsx";
import ExerciseLibrary from "./ExerciseLibrary.jsx";
import PremiumSheet from "./profile/PremiumSheet.jsx";
import ActivitySheet from "../components/ActivitySheet.jsx";
import { dayLabel, generateWorkoutPlan, localizeDay, planTitle } from "../lib/aiPlanEngine.js";
import MuscleTargetPicker from "../components/MuscleTargetPicker.jsx";
import { ACTIVITY_BY_ID } from "../data/activities.js";
import { PROGRAMS } from "../data/programs.js";
import { api } from "../api.js";
import { haptic } from "../telegram.js";
import { useApp } from "../store.jsx";
import { localDateKey } from "../lib/format.js";

/** Suggests weekly cardio/HIIT volume alongside the strength split, and opens the activity logger pre-seeded with it. */
function CardioCard({ cardio, t, onStart }) {
  if (!cardio) return null;
  const activities = cardio.activities.map((id) => ACTIVITY_BY_ID[id]).filter(Boolean);

  return (
    <div className="card px-4 py-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan/12">
          <Flame size={18} className="text-cyan" />
        </span>
        <div className="min-w-0">
          <p className="text-[13.5px] font-bold text-ink">
            {t("workout.cardioFreq", { n: cardio.sessionsPerWeek, min: cardio.durationMin })}
          </p>
          <p className="text-[11.5px] text-muted">{t(`workout.cardioNote.${cardio.noteKey}`)}</p>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {activities.map((a) => (
          <button
            key={a.id}
            onClick={() => onStart(a.id, cardio.durationMin)}
            className="flex items-center gap-1.5 rounded-full border border-borderSoft bg-surfaceAlt px-3 py-1.5 text-[12px] font-semibold text-ink active:scale-95"
          >
            <span>{a.emoji}</span> {t(`activity.names.${a.id}`)}
          </button>
        ))}
      </div>

      <Button full variant="ghost" onClick={() => onStart(cardio.activities[0], cardio.durationMin)}>
        <Flame size={15} /> {t("workout.logCardio")}
      </Button>
    </div>
  );
}

function PlanDayCard({ item, doneCount, onOpen, t }) {
  const day = localizeDay(item.day, t);

  if (item.rest) {
    return (
      <div className="card flex items-center gap-3 px-4 py-3.5 opacity-70">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surfaceAlt">
          <Coffee size={17} className="text-muted" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-bold text-ink">{day} — {t("workout.restDay")}</p>
          <p className="mt-0.5 text-[11.5px] text-muted">{t("workout.restDayDesc")}</p>
        </div>
      </div>
    );
  }

  const total = item.exercises.length;
  const complete = doneCount >= total && total > 0;

  return (
    <button onClick={onOpen} className="card card-lit flex w-full items-center gap-3 px-4 py-3.5 text-left active:scale-[0.99]">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${complete ? "bg-neon/15" : "bg-surfaceAlt"}`}>
        {complete ? <Check size={18} className="text-neon" /> : <Dumbbell size={17} className="text-muted" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-bold text-ink">{day} — {dayLabel(item, t)}</span>
        <span className="mt-0.5 block text-[11.5px] text-muted">
          {t("workout.exercisesCount", { total, done: doneCount })}
        </span>
      </span>
      <span
        className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${
          complete ? "bg-neon/12 text-neon" : "bg-neon text-neonOn"
        }`}
      >
        {complete ? <><Check size={12} /> {t("workout.done")}</> : <><Play size={11} fill="currentColor" /> {t("workout.start")}</>}
      </span>
    </button>
  );
}

/** A ready-made program card. Falls back to a gradient+emoji tile until its photo lands under public/programs/. */
function ProgramCard({ program, onClick, t }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = program.image && !imgFailed;

  return (
    <button
      onClick={onClick}
      className="flex w-[168px] shrink-0 flex-col overflow-hidden rounded-2xl border border-borderSoft bg-surface text-left active:scale-[0.98]"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-surfaceAlt">
        {showImage ? (
          <img
            src={program.image}
            alt=""
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neon/20 via-surfaceAlt to-surfaceAlt">
            <span className="text-5xl">{program.emoji}</span>
          </div>
        )}
      </div>
      <div className="px-3 py-2.5">
        <p className="truncate text-[13px] font-bold text-ink">{program.title}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted">
          {t("workout.programMeta", { days: program.days, weeks: program.weeks })}
        </p>
      </div>
    </button>
  );
}

function RegenerateSheet({ open, onClose, onDone, onLocked }) {
  const { profile, subscription, saveWorkoutPlan, showToast, t } = useApp();
  const [days, setDays] = useState(profile?.daysPerWeek || 3);
  const [equipment, setEquipment] = useState(profile?.equipment || "home-none");
  const [focusMuscles, setFocusMuscles] = useState(profile?.focusMuscles || []);
  const [focusSide, setFocusSide] = useState("front");
  const [busy, setBusy] = useState(false);

  const dayOptions = [3, 4, 5];
  const eqOptions = ["home-none", "home-dumbbell", "gym", "outdoor"];

  async function regenerate() {
    // Regenerating re-tailors the plan to the user's own answers, same as the
    // onboarding-end personalized plan — a Premium perk, not the free preset pick.
    if (!subscription?.isPremium) {
      onClose();
      onLocked?.();
      return;
    }

    setBusy(true);
    try {
      // Fold in the last logged sets so the new plan continues progression
      // rather than resetting everyone to the beginner baseline.
      let lastSetsByExercise = {};
      try {
        const res = await api.getAllLastSets();
        lastSetsByExercise = res.byExercise || {};
      } catch {
        /* first-time users have no history; the baseline is correct for them */
      }

      const plan = generateWorkoutPlan({
        goal: profile?.goal || "maintain",
        level: profile?.fitnessLevel || "beginner",
        daysPerWeek: days,
        equipment,
        duration: profile?.sessionDuration || "60",
        injuries: profile?.injuries || "",
        weightKg: profile?.weightKg || 70,
        lastSetsByExercise,
        focusMuscles,
      });
      await saveWorkoutPlan(plan);
      await api.patchProfile({ daysPerWeek: days, equipment, focusMuscles });
      haptic("success");
      showToast(t("workout.planRegenerated"), "success");
      onDone?.();
      onClose();
    } catch (e) {
      showToast(e.message || t("common.error"), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={t("workout.regenerate")}>
      <p className="mb-4 text-[12.5px] leading-relaxed text-muted">{t("workout.regenerateDesc")}</p>

      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">{t("workout.perWeek")}</p>
      <div className="mb-4 flex gap-2">
        {dayOptions.map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`flex-1 rounded-xl border px-3 py-2.5 text-[12px] font-semibold ${
              days === d ? "border-neon bg-neon/12 text-neon" : "border-borderSoft bg-surfaceAlt text-muted"
            }`}
          >
            {t(`onboarding.days.${d}.title`)}
          </button>
        ))}
      </div>

      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">{t("workout.equipmentLabel")}</p>
      <div className="mb-5 grid grid-cols-2 gap-2">
        {eqOptions.map((e) => (
          <button
            key={e}
            onClick={() => setEquipment(e)}
            className={`rounded-xl border px-3 py-2.5 text-[12px] font-semibold ${
              equipment === e ? "border-neon bg-neon/12 text-neon" : "border-borderSoft bg-surfaceAlt text-muted"
            }`}
          >
            {t(`workout.eqShort.${e}`)}
          </button>
        ))}
      </div>

      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">{t("muscles.editTitle")}</p>
      <div className="mb-5">
        <MuscleTargetPicker
          side={focusSide}
          onSide={setFocusSide}
          picked={focusMuscles}
          onChange={setFocusMuscles}
        />
      </div>

      <Button full size="lg" loading={busy} onClick={regenerate}>
        <Sparkles size={16} /> {t("workout.regenerateCta")}
      </Button>
    </Sheet>
  );
}

export default function WorkoutsScreen() {
  const { workoutPlan, workoutHistory, profile, saveWorkoutPlan, showToast, subscription, t } = useApp();
  const [view, setView] = useState("plan"); // plan | library
  const [sessionDay, setSessionDay] = useState(null);
  const [regenOpen, setRegenOpen] = useState(false);
  const [tips, setTips] = useState(null);
  const [tipsError, setTipsError] = useState(null);
  const [tipsBusy, setTipsBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [cardioSeed, setCardioSeed] = useState(null);

  const today = localDateKey();
  const doneByDay = useMemo(() => {
    const map = {};
    workoutHistory
      .filter((w) => localDateKey(new Date(w.loggedAt)) === today)
      .forEach((w) => {
        if (!w.planDay) return;
        map[w.planDay] = (map[w.planDay] || 0) + 1;
      });
    return map;
  }, [workoutHistory, today]);

  if (sessionDay) {
    return <WorkoutSession day={sessionDay} onBack={() => setSessionDay(null)} />;
  }
  if (view === "library") {
    return <ExerciseLibrary onBack={() => setView("plan")} />;
  }

  async function createPlan() {
    // Personalizing a plan to the user's own weight/injury/history answers is
    // the Premium perk — a free user picks one of the ready-made programs below.
    if (!subscription?.isPremium) {
      setPremiumOpen(true);
      return;
    }

    setCreating(true);
    try {
      let lastSetsByExercise = {};
      try {
        const res = await api.getAllLastSets();
        lastSetsByExercise = res.byExercise || {};
      } catch {
        /* no history yet */
      }

      const plan = generateWorkoutPlan({
        goal: profile?.goal || "maintain",
        level: profile?.fitnessLevel || "beginner",
        daysPerWeek: profile?.daysPerWeek || 3,
        equipment: profile?.equipment || "home-none",
        duration: profile?.sessionDuration || "60",
        injuries: profile?.injuries || "",
        weightKg: profile?.weightKg || 70,
        lastSetsByExercise,
        focusMuscles: profile?.focusMuscles || [],
      });
      await saveWorkoutPlan(plan);
      haptic("success");
      showToast(t("workout.planReady"), "success");
    } catch (e) {
      showToast(e.message || t("common.error"), "error");
    } finally {
      setCreating(false);
    }
  }

  /**
   * Free path: same engine, seeded from the program's own preset instead of a
   * personalized read of the user's answers. Weight/injuries still apply.
   *
   * The muscle focus deliberately does not: a preset's whole value is its fixed
   * structure, and rebuilding its split around personal targets would make it a
   * personalized plan wearing a program's name.
   */
  async function pickProgram(program) {
    setCreating(true);
    try {
      const plan = generateWorkoutPlan({
        goal: program.goal,
        level: program.level,
        daysPerWeek: program.days,
        equipment: program.equipment,
        duration: profile?.sessionDuration || "60",
        injuries: profile?.injuries || "",
        weightKg: profile?.weightKg || 70,
      });
      await saveWorkoutPlan(plan);
      haptic("success");
      showToast(t("workout.planReady"), "success");
    } catch (e) {
      showToast(e.message || t("common.error"), "error");
    } finally {
      setCreating(false);
    }
  }

  async function loadTips() {
    if (!subscription?.isPremium) {
      setPremiumOpen(true);
      return;
    }
    setTipsBusy(true);
    setTipsError(null);
    try {
      const res = await api.enhanceWorkoutPlan(workoutPlan);
      setTips(res.enhancement);
    } catch (e) {
      if (e.status === 402) setPremiumOpen(true);
      else setTipsError(e.message || t("workout.tipsFailed"));
    } finally {
      setTipsBusy(false);
    }
  }

  return (
    <Screen topPad>
      {!workoutPlan ? (
        <>
          <Section>
            <EmptyState
              Icon={subscription?.isPremium ? Sparkles : Crown}
              title={t("workout.noPlan")}
              desc={subscription?.isPremium ? t("workout.noPlanDesc") : t("workout.noPlanDescLocked")}
              action={
                <Button full loading={creating} onClick={createPlan}>
                  {subscription?.isPremium ? <Sparkles size={15} /> : <Crown size={15} />} {t("workout.createPlan")}
                </Button>
              }
            />
          </Section>

          <Section title={t("workout.readyPrograms")}>
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
              {PROGRAMS.map((p) => (
                <ProgramCard key={p.id} program={p} t={t} onClick={() => pickProgram(p)} />
              ))}
            </div>
          </Section>
        </>
      ) : (
        <>
          <div className="card card-lit mb-4 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="shrink-0 text-neon" />
                  <h2 className="font-display text-[15px] font-bold text-ink">{planTitle(workoutPlan, t)}</h2>
                  <span className="rounded-md bg-neon/15 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-neon">
                    {t("workout.active")}
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] text-muted">
                  {t("workout.planMeta", {
                    days: workoutPlan.daysPerWeek,
                    reps: workoutPlan.rules?.reps,
                    rest: workoutPlan.rules?.rest,
                  })}
                </p>
              </div>
              <button
                onClick={() => setRegenOpen(true)}
                aria-label={t("workout.regenerate")}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surfaceAlt active:scale-95"
              >
                <RefreshCw size={15} className="text-muted" />
              </button>
            </div>

            {workoutPlan.injuryNotes && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber/10 px-3 py-2.5">
                <ShieldAlert size={14} className="mt-0.5 shrink-0 text-amber" />
                <p className="text-[11.5px] leading-relaxed text-amber">{workoutPlan.injuryNotes}</p>
              </div>
            )}
          </div>

          <Section title={t("workout.weeklySchedule")}>
            <div className="flex flex-col gap-2">
              {workoutPlan.days.map((d) => (
                <PlanDayCard
                  key={d.day}
                  item={d}
                  doneCount={doneByDay[d.day] || 0}
                  t={t}
                  onOpen={() => setSessionDay(d)}
                />
              ))}
            </div>
          </Section>

          <Section title={t("workout.cardioTitle")}>
            <CardioCard
              cardio={workoutPlan.cardio}
              t={t}
              onStart={(activityId, durationMin) => setCardioSeed({ activityId, durationMin })}
            />
          </Section>

          <Section
            title={t("workout.aiTips")}
            action={
              !subscription?.isPremium && (
                <span className="flex items-center gap-1 rounded-full bg-amber/12 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber">
                  <Crown size={11} /> {t("profile.premium")}
                </span>
              )
            }
          >
            {tips ? (
              <div className="card flex flex-col gap-3 px-4 py-4">
                <p className="text-[13px] leading-relaxed text-ink">{tips.advice}</p>
                {tips.progressionTip && (
                  <div className="rounded-xl bg-neon/8 px-3 py-2.5">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-neon">{t("workout.progression")}</p>
                    <p className="text-[12px] leading-relaxed text-muted">{tips.progressionTip}</p>
                  </div>
                )}
                {tips.warmup?.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-faint">{t("workout.warmup")}</p>
                    <ul className="flex flex-col gap-1">
                      {tips.warmup.map((w, i) => (
                        <li key={i} className="text-[12px] text-muted">• {w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <>
                {tipsError && <div className="mb-2"><ErrorNote onRetry={loadTips}>{tipsError}</ErrorNote></div>}
                <Button full variant="ghost" loading={tipsBusy} onClick={loadTips}>
                  {subscription?.isPremium ? <Lightbulb size={15} /> : <Crown size={15} />} {t("workout.getTips")}
                </Button>
              </>
            )}
          </Section>
        </>
      )}

      {/* Outside the branch on purpose: this section used to render only for
          users who already had a plan, and the header icon was the sole route
          for everyone else. With that icon gone it has to be reachable here. */}
      <Section title={t("workout.library")}>
        <ListRow
          Icon={BookOpen}
          title={t("workout.libraryAll")}
          subtitle={t("workout.libraryDesc")}
          onClick={() => setView("library")}
        />
      </Section>

      <RegenerateSheet
        open={regenOpen}
        onClose={() => setRegenOpen(false)}
        onLocked={() => setPremiumOpen(true)}
      />
      <PremiumSheet open={premiumOpen} onClose={() => setPremiumOpen(false)} />
      <ActivitySheet
        open={Boolean(cardioSeed)}
        onClose={() => setCardioSeed(null)}
        initialActivityId={cardioSeed?.activityId}
        initialDurationMin={cardioSeed?.durationMin}
      />
    </Screen>
  );
}
