import { useState } from "react";
import { Check, Info, Timer, TrendingUp, ChevronRight } from "lucide-react";
import { Screen, ScreenHeader } from "../components/ui.jsx";
import ExerciseRunner from "./ExerciseRunner.jsx";
import ExerciseGuide from "../components/ExerciseGuide.jsx";
import { localizeExercise } from "../data/exerciseText.js";
import { estimateSessionKcal } from "../lib/aiPlanEngine.js";
import { haptic } from "../telegram.js";
import { useBackButton } from "../lib/useBackButton.js";
import { useApp } from "../store.jsx";

/** One row in the day's plan. Tapping it opens the exercise's own screen. */
function ExerciseRow({ exercise: planned, logged, onOpen, onGuide }) {
  const { t, lang } = useApp();
  const exercise = localizeExercise(planned, lang);
  const bodyweight = exercise.weightType === "bodyweight";

  return (
    <div className={`card overflow-hidden transition-opacity ${logged ? "opacity-55" : ""}`}>
      <div className="flex items-center gap-3 px-3.5 py-3.5">
        <button
          onClick={() => {
            haptic("light");
            onGuide(exercise.id);
          }}
          aria-label={`${exercise.name} — ${t("workout.guide")}`}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-neon/10 active:scale-95"
        >
          <Info size={17} className="text-neon" />
        </button>

        <button onClick={() => onOpen(exercise)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="min-w-0 flex-1">
            <span className={`block truncate text-[13.5px] font-bold ${logged ? "text-muted line-through" : "text-ink"}`}>
              {exercise.name}
            </span>
            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-muted">
              <span className="tabular">
                {exercise.sets}×{exercise.reps}
              </span>
              {exercise.suggestedWeightKg ? (
                <span className="tabular font-semibold text-neon">
                  {exercise.suggestedWeightKg} {t("common.kg")}
                </span>
              ) : bodyweight ? (
                <span className="text-faint">{t("workout.bodyweight")}</span>
              ) : (
                <span className="text-faint">{t("workout.lightWeight")}</span>
              )}
              <span className="flex items-center gap-1 text-faint">
                <Timer size={10} /> {exercise.rest}
              </span>
            </span>
            {exercise.progressed && (
              <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-cyan">
                <TrendingUp size={11} /> {t("workout.progressed")}
              </span>
            )}
          </span>

          {logged ? (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-neon/15">
              <Check size={16} className="text-neon" />
            </span>
          ) : (
            <ChevronRight size={17} className="shrink-0 text-faint" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function WorkoutSession({ day, onBack }) {
  const { logWorkout, profile, showToast, workoutHistory, t } = useApp();
  const [running, setRunning] = useState(null);
  const [guideId, setGuideId] = useState(null);

  // Only own the back button when no child screen is showing.
  useBackButton(running || guideId ? null : onBack);

  // A plan-day exercise counts as done if it was logged today.
  const today = new Date().toISOString().slice(0, 10);
  const loggedIds = new Set(
    workoutHistory
      .filter((w) => String(w.loggedAt).slice(0, 10) === today && w.planDay === day.day)
      .map((w) => w.exerciseId)
  );

  async function finishExercise(exercise, sets) {
    try {
      await logWorkout({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        emoji: "🏋️",
        kcal: estimateSessionKcal(exercise, profile?.weightKg || 70),
        setsCompleted: sets.length,
        planDay: day.day,
        sets: sets.map((s) => ({ reps: Number(s.reps) || null, weightKg: Number(s.weightKg) || null })),
      });
      haptic("success");
      showToast(t("workout.exerciseDone"), "success");
      setRunning(null);
    } catch (e) {
      showToast(e.message || t("workout.saveFailed"), "error");
    }
  }

  if (guideId) return <ExerciseGuide exerciseId={guideId} onBack={() => setGuideId(null)} />;

  if (running) {
    return (
      <ExerciseRunner
        exercise={running}
        planDay={day.day}
        onBack={() => setRunning(null)}
        onFinish={finishExercise}
      />
    );
  }

  const doneCount = day.exercises.filter((e) => loggedIds.has(e.id)).length;
  const total = day.exercises.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <Screen>
      <ScreenHeader
        title={`${day.day} — ${day.label}`}
        subtitle={`${total} ${t("home.ta")} • ${doneCount} ${t("common.done").toLowerCase()}`}
        onBack={onBack}
      />

      <div className="card mb-4 px-4 py-3.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint">{t("workout.dayProgress")}</span>
          <span className="tabular text-[13px] font-bold text-neon">{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-borderSoft">
          <div className="h-full rounded-full bg-neon transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
        {doneCount === total && total > 0 && (
          <p className="mt-2.5 text-center text-[12.5px] font-bold text-neon">{t("workout.dayDone")}</p>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {day.exercises.map((e) => (
          <ExerciseRow
            key={e.id}
            exercise={e}
            logged={loggedIds.has(e.id)}
            onOpen={setRunning}
            onGuide={setGuideId}
          />
        ))}
      </div>
    </Screen>
  );
}
