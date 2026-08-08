import { useMemo, useState } from "react";
import { Sparkles, Dumbbell, Coffee, Check, Play, RefreshCw, BookOpen, ShieldAlert, Lightbulb } from "lucide-react";
import { Screen, ScreenHeader, Section, Button, Sheet, EmptyState, ListRow, ErrorNote, IconButton } from "../components/ui.jsx";
import WorkoutSession from "./WorkoutSession.jsx";
import ExerciseLibrary from "./ExerciseLibrary.jsx";
import { generateWorkoutPlan, localizeDay, planTitle } from "../lib/aiPlanEngine.js";
import { PROGRAMS } from "../data/programs.js";
import { api } from "../api.js";
import { haptic } from "../telegram.js";
import { useApp } from "../store.jsx";
import { localDateKey } from "../lib/format.js";

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
        <span className="block text-[13.5px] font-bold text-ink">{day} — {item.label}</span>
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

function RegenerateSheet({ open, onClose, onDone }) {
  const { profile, saveWorkoutPlan, showToast, t } = useApp();
  const [days, setDays] = useState(profile?.daysPerWeek || 3);
  const [equipment, setEquipment] = useState(profile?.equipment || "home-none");
  const [busy, setBusy] = useState(false);

  const dayOptions = [3, 4, 5];
  const eqOptions = ["home-none", "home-dumbbell", "gym", "outdoor"];

  async function regenerate() {
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
      });
      await saveWorkoutPlan(plan);
      await api.patchProfile({ daysPerWeek: days, equipment });
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
    setTipsBusy(true);
    setTipsError(null);
    try {
      const res = await api.enhanceWorkoutPlan(workoutPlan);
      setTips(res.enhancement);
    } catch (e) {
      setTipsError(e.message || t("workout.tipsFailed"));
    } finally {
      setTipsBusy(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader
        title={t("workout.title")}
        subtitle={workoutPlan ? t("workout.subtitlePlan") : t("workout.subtitleNoPlan")}
        action={<IconButton Icon={BookOpen} label={t("workout.library")} onClick={() => setView("library")} />}
      />

      {!workoutPlan ? (
        <>
          <Section>
            <EmptyState
              Icon={Sparkles}
              title={t("workout.noPlan")}
              desc={t("workout.noPlanDesc")}
              action={<Button full loading={creating} onClick={createPlan}><Sparkles size={15} /> {t("workout.createPlan")}</Button>}
            />
          </Section>

          <Section title={t("workout.readyPrograms")}>
            <div className="flex flex-col gap-2">
              {PROGRAMS.map((p) => (
                <ListRow
                  key={p.id}
                  emoji={p.emoji}
                  title={p.title}
                  subtitle={`${p.trainer} • ${t("workout.programMeta", { days: p.days, weeks: p.weeks })}`}
                  onClick={() => showToast(t("workout.programsSoon"), "neutral")}
                />
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

          <Section title={t("workout.aiTips")}>
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
                  <Lightbulb size={15} /> {t("workout.getTips")}
                </Button>
              </>
            )}
          </Section>

          <Section title={t("workout.library")}>
            <ListRow
              Icon={BookOpen}
              title={t("workout.libraryAll")}
              subtitle={t("workout.libraryDesc")}
              onClick={() => setView("library")}
            />
          </Section>
        </>
      )}

      <RegenerateSheet open={regenOpen} onClose={() => setRegenOpen(false)} />
    </Screen>
  );
}
