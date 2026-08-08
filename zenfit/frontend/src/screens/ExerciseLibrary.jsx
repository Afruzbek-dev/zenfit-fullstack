import { useState } from "react";
import { Search, Play, AlertTriangle, ListChecks, Dumbbell } from "lucide-react";
import { Screen, ScreenHeader, Chip, EmptyState, ListRow, Button } from "../components/ui.jsx";
import { VideoPlayer } from "../components/ExerciseGuide.jsx";
import { EXERCISES, MUSCLE_GROUPS, EQUIPMENT_LABELS, filterExercises, youtubeSearchUrl } from "../data/exercises.js";
import { localizeExercise } from "../data/exerciseText.js";
import { useApp } from "../store.jsx";

/** Detail view: how to perform the movement, plus video. */
export function ExerciseDetail({ exercise, onBack, onAdd }) {
  const { t } = useApp();
  return (
    <Screen>
      <ScreenHeader
        title={exercise.name}
        subtitle={`${exercise.muscle} • ${t(`equipment.${exercise.equipment}`)}`}
        onBack={onBack}
      />

      {/* Plays in place — the player only mounts once the poster is tapped. */}
      <div className="mb-5">
        <VideoPlayer
          videoId={exercise.youtubeId}
          title={`${exercise.name} — ${t("workout.technique")}`}
          searchUrl={youtubeSearchUrl(exercise)}
        />
      </div>

      <section className="mb-5">
        <div className="mb-2.5 flex items-center gap-2">
          <ListChecks size={14} className="text-neon" />
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">{t("workout.howTo")}</h2>
        </div>
        <ol className="flex flex-col gap-2">
          {exercise.steps.map((s, i) => (
            <li key={i} className="flex gap-3 rounded-2xl border border-borderSoft bg-surface px-3.5 py-3">
              <span className="tabular grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-neon/15 text-[11px] font-bold text-neon">
                {i + 1}
              </span>
              <span className="text-[13px] leading-relaxed text-ink">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-5">
        <div className="mb-2.5 flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber" />
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">{t("workout.mistakes")}</h2>
        </div>
        <div className="rounded-2xl border border-amber/20 bg-amber/[0.07] px-4 py-3">
          <ul className="flex flex-col gap-2">
            {exercise.mistakes.map((m, i) => (
              <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-amber">
                <span className="shrink-0">✕</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {onAdd && (
        <Button full size="lg" onClick={() => onAdd(exercise)}>
          <Dumbbell size={17} /> {t("workout.addToToday")}
        </Button>
      )}
    </Screen>
  );
}

export default function ExerciseLibrary({ onBack, onAdd }) {
  const { t, lang } = useApp();
  const [group, setGroup] = useState("all");
  const [equipment, setEquipment] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  if (selected) {
    return <ExerciseDetail exercise={localizeExercise(selected, lang)} onBack={() => setSelected(null)} onAdd={onAdd} />;
  }

  // Filtering runs on the Uzbek source so ids and patterns stay stable; only
  // what is rendered gets swapped into the active language.
  const list = filterExercises({ group, equipment, search }).map((e) => localizeExercise(e, lang));

  return (
    <Screen>
      <ScreenHeader
        title={t("workout.library")}
        subtitle={t("workout.librarySubtitle", { count: EXERCISES.length })}
        onBack={onBack}
      />

      <div className="mb-3 flex items-center gap-2 rounded-2xl border border-borderSoft bg-surface px-3.5 py-3 focus-within:border-neon/50">
        <Search size={16} className="shrink-0 text-faint" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("workout.searchPlaceholder")}
          className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-faint"
        />
      </div>

      <div className="no-scrollbar -mx-5 mb-2.5 flex gap-2 overflow-x-auto px-5 pb-1">
        {MUSCLE_GROUPS.map((g) => (
          <Chip key={g.id} active={group === g.id} onClick={() => setGroup(g.id)}>
            {t(`muscleGroups.${g.id}`)}
          </Chip>
        ))}
      </div>

      <div className="no-scrollbar -mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1">
        <Chip active={!equipment} onClick={() => setEquipment(null)}>{t(`equipment.any`)}</Chip>
        {Object.keys(EQUIPMENT_LABELS).map((k) => (
          <Chip key={k} active={equipment === k} onClick={() => setEquipment(equipment === k ? null : k)}>
            {t(`equipment.${k}`)}
          </Chip>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState Icon={Search} title={t("workout.nothingFound")} desc={t("workout.nothingFoundDesc")} />
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((e) => (
            <ListRow
              key={e.id}
              Icon={Dumbbell}
              title={e.name}
              subtitle={`${e.muscle} • ${t(`equipment.${e.equipment}`)}`}
              onClick={() => setSelected(e)}
              right={
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-rose/10">
                  <Play size={12} fill="currentColor" className="text-rose" />
                </span>
              }
            />
          ))}
        </div>
      )}
    </Screen>
  );
}
