import { useState } from "react";
import { BookOpen, History, Layers, ChevronRight } from "lucide-react";
import { Screen, Section, ListRow } from "../components/ui.jsx";
import ProgramCard from "../components/ProgramCard.jsx";
import ExerciseLibrary from "./ExerciseLibrary.jsx";
import { PROGRAMS } from "../data/programs.js";
import { generateWorkoutPlan } from "../lib/aiPlanEngine.js";
import { weekIndexOf } from "../lib/planWeek.js";
import { api } from "../api.js";
import { haptic } from "../telegram.js";
import { useApp } from "../store.jsx";

/**
 * The bottom-nav "Mashqlar" tab: ready-made programmes, the full exercise
 * library and history — everything except the user's own AI plan, which
 * lives on its own screen reached from Home's "Mashq rejam" tile. The two
 * used to be the same screen, which meant they were indistinguishable;
 * keeping the plan off this one is deliberate, not an omission.
 */
export default function WorkoutsLibraryScreen({ onNavigate }) {
  const { profile, activeProgram, saveProgram, showToast, t } = useApp();
  const [view, setView] = useState("hub"); // hub | library

  if (view === "library") {
    return <ExerciseLibrary onBack={() => setView("hub")} />;
  }

  /**
   * Starting a programme no longer touches the user's workout plan.
   *
   * It used to overwrite it, which meant browsing this list could quietly wipe
   * weeks of accumulated progression. A programme is now its own plan type
   * running alongside, tracked the same way but never confused for the plan.
   *
   * The muscle focus deliberately does not carry over: a preset's whole value
   * is its fixed structure, and rebuilding its split around personal targets
   * would make it a personalized plan wearing a programme's name. Past sets do
   * carry over, so someone switching to a programme keeps their real weights.
   */
  async function startProgram(program) {
    try {
      let lastSetsByExercise = {};
      try {
        const res = await api.getAllLastSets();
        lastSetsByExercise = res.byExercise || {};
      } catch {
        /* first-time users have no history; the baseline is correct for them */
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

      await saveProgram({
        ...plan,
        programId: program.id,
        programTitle: program.title,
        programWeeks: program.weeks,
        weekIndex: 1,
      });
      haptic("success");
      showToast(t("workout.programStarted"), "success");
      onNavigate?.("program");
    } catch (e) {
      showToast(e.message || t("common.error"), "error");
    }
  }

  return (
    <Screen topPad>
      <div className="mb-4">
        <h1 className="font-display text-[19px] font-bold leading-tight tracking-tight text-ink">
          {t("workout.title")}
        </h1>
        <p className="mt-0.5 text-[12.5px] text-muted">{t("workout.hubSubtitle")}</p>
      </div>

      {activeProgram && (
        <button
          onClick={() => onNavigate?.("program")}
          className="card mb-4 flex w-full items-center gap-3 px-4 py-3.5 text-left active:scale-[0.99]"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan/12">
            <Layers size={18} className="text-cyan" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13.5px] font-bold text-ink">
              {activeProgram.programTitle || t("workout.activeProgram")}
            </span>
            <span className="mt-0.5 block text-[11.5px] text-muted">
              {t("workout.activeProgram")} · {t("workout.weekN", { n: weekIndexOf(activeProgram) })}
            </span>
          </span>
          <ChevronRight size={16} className="shrink-0 text-faint" />
        </button>
      )}

      <Section title={t("workout.readyPrograms")}>
        <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
          {PROGRAMS.map((p) => (
            <ProgramCard
              key={p.id}
              image={p.image}
              emoji={p.emoji}
              title={p.title}
              meta={t("workout.programMeta", { days: p.days, weeks: p.weeks })}
              onClick={() => startProgram(p)}
            />
          ))}
        </div>
      </Section>

      <Section title={t("workout.library")}>
        <div className="flex flex-col gap-2">
          <ListRow
            Icon={BookOpen}
            title={t("workout.libraryAll")}
            subtitle={t("workout.libraryDesc")}
            onClick={() => setView("library")}
          />
          <ListRow
            Icon={History}
            title={t("workout.history")}
            subtitle={t("workout.historyDesc")}
            onClick={() => onNavigate?.("history")}
          />
        </div>
      </Section>
    </Screen>
  );
}
