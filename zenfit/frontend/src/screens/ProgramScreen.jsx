import { useMemo, useState } from "react";
import { Layers, RefreshCw, Sparkles, Trophy } from "lucide-react";
import { Screen, ScreenHeader, Section, Button, EmptyState } from "../components/ui.jsx";
import PlanDayCard from "../components/PlanDayCard.jsx";
import WorkoutSession from "./WorkoutSession.jsx";
import { generateWorkoutPlan } from "../lib/aiPlanEngine.js";
import { isStale, nextWeekIndex, weekIndexOf } from "../lib/planWeek.js";
import { PROGRAM_BY_ID } from "../data/programs.js";
import { api } from "../api.js";
import { haptic } from "../telegram.js";
import { useApp } from "../store.jsx";
import { localDateKey } from "../lib/format.js";

/**
 * A ready-made programme the user is following.
 *
 * Deliberately not "the plan": it is tracked exactly like one — same day cards,
 * same session screen, same logging — but it lives in its own slot, so picking
 * a programme never costs the user the plan they already had. Its days are
 * logged under a prefixed key so the two never mark each other complete.
 */
export default function ProgramScreen({ onBack, onNavigate }) {
  const { activeProgram, workoutHistory, profile, saveProgram, clearProgram, showToast, t } = useApp();
  const [sessionDay, setSessionDay] = useState(null);
  const [busy, setBusy] = useState(false);

  const programId = activeProgram?.programId;
  const dayKeyFor = (day) => `${programId}:${day}`;

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
    return (
      <WorkoutSession
        day={sessionDay}
        dayKey={dayKeyFor(sessionDay.day)}
        onBack={() => setSessionDay(null)}
      />
    );
  }

  if (!activeProgram) {
    return (
      <Screen>
        <ScreenHeader title={t("workout.activeProgram")} onBack={onBack} />
        <EmptyState
          Icon={Layers}
          title={t("workout.programsRow")}
          desc={t("workout.programsRowDesc")}
          action={
            <Button full onClick={() => onNavigate?.("exercises")}>
              <Layers size={15} /> {t("workout.seePrograms")}
            </Button>
          }
        />
      </Screen>
    );
  }

  const week = weekIndexOf(activeProgram);
  const totalWeeks = Number(activeProgram.programWeeks) || 0;
  const finished = totalWeeks > 0 && week >= totalWeeks;

  /** Next week of the same programme, with the weights the user actually hit. */
  async function nextWeek() {
    const program = PROGRAM_BY_ID[programId];
    if (!program) return;
    setBusy(true);
    try {
      let lastSetsByExercise = {};
      try {
        const res = await api.getAllLastSets();
        lastSetsByExercise = res.byExercise || {};
      } catch {
        /* no history yet — the baseline weights are correct */
      }

      const plan = generateWorkoutPlan({
        goal: program.goal,
        level: program.level,
        daysPerWeek: program.days,
        equipment: program.equipment,
        duration: profile?.sessionDuration || "60",
        injuries: profile?.injuries || "",
        weightKg: profile?.weightKg || 70,
        lastSetsByExercise,
      });

      const nextIndex = nextWeekIndex(activeProgram);
      await saveProgram({
        ...plan,
        programId,
        programTitle: activeProgram.programTitle,
        programWeeks: activeProgram.programWeeks,
        weekIndex: nextIndex,
      });
      haptic("success");
      showToast(t("workout.weekRefreshed", { n: nextIndex }), "success");
    } catch (e) {
      showToast(e.message || t("common.error"), "error");
    } finally {
      setBusy(false);
    }
  }

  async function endProgram() {
    setBusy(true);
    try {
      await clearProgram();
      haptic("success");
      showToast(t("workout.programEnded"), "success");
      onBack?.();
    } catch (e) {
      showToast(e.message || t("common.error"), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader
        title={activeProgram.programTitle || t("workout.activeProgram")}
        subtitle={t("workout.weekN", { n: week })}
        onBack={onBack}
      />

      {finished ? (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-neon/30 bg-neon/[0.08] px-4 py-3.5">
          <Trophy size={17} className="mt-0.5 shrink-0 text-neon" />
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-bold text-ink">
              {t("workout.programComplete", { weeks: totalWeeks })}
            </p>
            <Button full variant="ghost" className="mt-2.5" loading={busy} onClick={endProgram}>
              {t("workout.endProgram")}
            </Button>
          </div>
        </div>
      ) : (
        isStale(activeProgram) && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber/30 bg-amber/[0.08] px-4 py-3.5">
            <RefreshCw size={17} className="mt-0.5 shrink-0 text-amber" />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-bold text-ink">{t("workout.newWeek")}</p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{t("workout.newWeekDesc")}</p>
              <Button full className="mt-2.5" loading={busy} onClick={nextWeek}>
                <Sparkles size={15} /> {t("workout.refreshWeek")}
              </Button>
            </div>
          </div>
        )
      )}

      <Section title={t("workout.weeklySchedule")}>
        <div className="flex flex-col gap-2">
          {activeProgram.days.map((d) => (
            <PlanDayCard
              key={d.day}
              item={d}
              doneCount={doneByDay[dayKeyFor(d.day)] || 0}
              t={t}
              onOpen={() => setSessionDay(d)}
            />
          ))}
        </div>
      </Section>

      {!finished && (
        <Button full variant="ghost" className="mt-1" loading={busy} onClick={endProgram}>
          {t("workout.endProgram")}
        </Button>
      )}
    </Screen>
  );
}
