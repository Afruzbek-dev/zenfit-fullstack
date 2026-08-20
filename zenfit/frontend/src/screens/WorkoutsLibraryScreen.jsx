import { useState } from "react";
import { BookOpen } from "lucide-react";
import { Screen, ScreenHeader, Section, ListRow } from "../components/ui.jsx";
import ExerciseLibrary from "./ExerciseLibrary.jsx";
import { PROGRAMS } from "../data/programs.js";
import { generateWorkoutPlan } from "../lib/aiPlanEngine.js";
import { haptic } from "../telegram.js";
import { useApp } from "../store.jsx";

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

/**
 * "Mashqlar" — ready-made programmes plus the full exercise library, split out
 * from the plan screen (WorkoutsScreen.jsx) so the bottom-nav "Mashq" tab is
 * unambiguously the user's own plan, and this is the separate browsing
 * surface, matching the Dieta rejasi / Retsept split.
 */
export default function WorkoutsLibraryScreen({ onBack, onNavigate }) {
  const { profile, saveWorkoutPlan, showToast, t } = useApp();
  const [view, setView] = useState("hub"); // hub | library

  if (view === "library") {
    return <ExerciseLibrary onBack={() => setView("hub")} />;
  }

  /**
   * Free path: same engine, seeded from the program's own preset instead of a
   * personalized read of the user's answers. Weight/injuries still apply.
   *
   * The muscle focus deliberately does not: a preset's whole value is its
   * fixed structure, and rebuilding its split around personal targets would
   * make it a personalized plan wearing a program's name.
   */
  async function pickProgram(program) {
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
      onNavigate?.("workouts");
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
            <ProgramCard key={p.id} program={p} t={t} onClick={() => pickProgram(p)} />
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
