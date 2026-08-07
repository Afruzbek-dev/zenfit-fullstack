import { useState } from "react";
import { Search, Play, ChevronLeft, AlertTriangle, ListChecks, Dumbbell } from "lucide-react";
import { Screen, ScreenHeader, Chip, EmptyState, ListRow, Button } from "../components/ui.jsx";
import { VideoPlayer } from "../components/ExerciseGuide.jsx";
import { EXERCISES, MUSCLE_GROUPS, EQUIPMENT_LABELS, filterExercises, youtubeSearchUrl } from "../data/exercises.js";

/** Detail view: how to perform the movement, plus video. */
export function ExerciseDetail({ exercise, onBack, onAdd }) {
  return (
    <Screen>
      <ScreenHeader
        title={exercise.name}
        subtitle={`${exercise.muscle} • ${EQUIPMENT_LABELS[exercise.equipment] || exercise.equipment}`}
        right={
          <button onClick={onBack} aria-label="Orqaga" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surfaceAlt">
            <ChevronLeft size={17} className="text-muted" />
          </button>
        }
      />

      {/* Plays in place — the player only mounts once the poster is tapped. */}
      <div className="mb-5">
        <VideoPlayer
          videoId={exercise.youtubeId}
          title={`${exercise.name} — bajarish texnikasi`}
          searchUrl={youtubeSearchUrl(exercise)}
        />
      </div>

      <section className="mb-5">
        <div className="mb-2.5 flex items-center gap-2">
          <ListChecks size={14} className="text-neon" />
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">Bajarish tartibi</h2>
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
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">Tez uchraydigan xatolar</h2>
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
          <Dumbbell size={17} /> Bugungi mashqqa qo'shish
        </Button>
      )}
    </Screen>
  );
}

export default function ExerciseLibrary({ onBack, onAdd }) {
  const [group, setGroup] = useState("all");
  const [equipment, setEquipment] = useState(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  if (selected) {
    return <ExerciseDetail exercise={selected} onBack={() => setSelected(null)} onAdd={onAdd} />;
  }

  const list = filterExercises({ group, equipment, search });

  return (
    <Screen>
      <ScreenHeader
        title="Mashqlar bazasi"
        subtitle={`${EXERCISES.length} ta mashq — texnika va video bilan`}
        right={
          onBack && (
            <button onClick={onBack} aria-label="Orqaga" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surfaceAlt">
              <ChevronLeft size={17} className="text-muted" />
            </button>
          )
        }
      />

      <div className="mb-3 flex items-center gap-2 rounded-2xl border border-borderSoft bg-surface px-3.5 py-3 focus-within:border-neon/50">
        <Search size={16} className="shrink-0 text-faint" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Mashq qidirish…"
          className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-faint"
        />
      </div>

      <div className="no-scrollbar -mx-5 mb-2.5 flex gap-2 overflow-x-auto px-5 pb-1">
        {MUSCLE_GROUPS.map((g) => (
          <Chip key={g.id} active={group === g.id} onClick={() => setGroup(g.id)}>
            {g.label}
          </Chip>
        ))}
      </div>

      <div className="no-scrollbar -mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1">
        <Chip active={!equipment} onClick={() => setEquipment(null)}>Har qanday jihoz</Chip>
        {Object.entries(EQUIPMENT_LABELS).map(([k, label]) => (
          <Chip key={k} active={equipment === k} onClick={() => setEquipment(equipment === k ? null : k)}>
            {label}
          </Chip>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState Icon={Search} title="Hech narsa topilmadi" desc="Filtr yoki qidiruv so'zini o'zgartirib ko'ring." />
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((e) => (
            <ListRow
              key={e.id}
              Icon={Dumbbell}
              title={e.name}
              subtitle={`${e.muscle} • ${EQUIPMENT_LABELS[e.equipment]}`}
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
