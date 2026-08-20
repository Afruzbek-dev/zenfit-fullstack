import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Screen, ScreenHeader, Section, ListRow } from "../components/ui.jsx";
import ProgramCard from "../components/ProgramCard.jsx";
import ExerciseLibrary from "./ExerciseLibrary.jsx";
import { PROGRAMS } from "../data/programs.js";
import { generateWorkoutPlan } from "../lib/aiPlanEngine.js";
import { api } from "../api.js";
import { haptic } from "../telegram.js";
import { useApp } from "../store.jsx";

/**
 * "Mashqlar bazasi" — ready-made programmes plus the full exercise library.
 *
 * Reached from the plan screen rather than the bottom nav: the nav tab is the
 * user's own plan, and this is the browsing surface next to it.
 */
export default function WorkoutsLibraryScreen({ onBack, onNavigate }) {
  const { profile, saveProgram, showToast, t } = useApp();
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
    <Screen>
      <ScreenHeader title={t("workout.title")} onBack={onBack} />

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
        <ListRow
          Icon={BookOpen}
          title={t("workout.libraryAll")}
          subtitle={t("workout.libraryDesc")}
          onClick={() => setView("library")}
        />
      </Section>
    </Screen>
  );
}
