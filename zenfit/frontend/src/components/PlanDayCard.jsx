import { Coffee, Dumbbell, Check, Play } from "lucide-react";
import { dayLabel, localizeDay } from "../lib/aiPlanEngine.js";

/**
 * One day of a weekly schedule.
 *
 * Shared by the AI workout plan (WorkoutsScreen) and a running ready-made
 * programme (ProgramScreen) — both render the same `days[]` shape from
 * generateWorkoutPlan(), so they render it the same way.
 */
export default function PlanDayCard({ item, doneCount, onOpen, t }) {
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
