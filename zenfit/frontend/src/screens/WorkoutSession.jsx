import { useEffect, useState } from "react";
import { ChevronLeft, Check, Play, Info, Timer, TrendingUp, Minus, Plus } from "lucide-react";
import { Screen, ScreenHeader, Button, Sheet } from "../components/ui.jsx";
import { ExerciseDetail } from "./ExerciseLibrary.jsx";
import { EX_BY_ID } from "../data/exercises.js";
import { estimateSessionKcal } from "../lib/aiPlanEngine.js";
import { api } from "../api.js";
import { haptic } from "../telegram.js";
import { useApp } from "../store.jsx";

/** One exercise card with per-set weight/rep entry. */
function ExerciseCard({ exercise, done, onComplete, onShowInfo }) {
  const [open, setOpen] = useState(false);
  const [sets, setSets] = useState(null);
  const [lastHint, setLastHint] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || sets) return;
    let alive = true;
    (async () => {
      // Pre-fill from the previous session so progressive overload is visible.
      let previous = null;
      try {
        const res = await api.getLastSets(exercise.id);
        previous = res.sets?.length ? res.sets : null;
      } catch {
        previous = null;
      }
      if (!alive) return;
      if (previous) setLastHint(previous);
      const count = exercise.sets || 3;
      setSets(
        Array.from({ length: count }, (_, i) => ({
          reps: previous?.[i]?.reps ?? "",
          weightKg: exercise.suggestedWeightKg ?? previous?.[i]?.weightKg ?? "",
        }))
      );
    })();
    return () => {
      alive = false;
    };
  }, [open, sets, exercise]);

  const update = (i, field, value) =>
    setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));

  async function save() {
    setSaving(true);
    try {
      await onComplete(
        exercise,
        (sets || []).map((s) => ({
          reps: s.reps === "" ? null : Number(s.reps),
          weightKg: s.weightKg === "" ? null : Number(s.weightKg),
        }))
      );
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`card overflow-hidden transition-opacity ${done ? "opacity-55" : ""}`}>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <button
          onClick={() => onShowInfo(exercise.id)}
          aria-label={`${exercise.name} texnikasi`}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surfaceAlt active:scale-95"
        >
          <Info size={17} className="text-muted" />
        </button>

        <div className="min-w-0 flex-1">
          <p className={`truncate text-[13.5px] font-bold ${done ? "text-muted line-through" : "text-ink"}`}>
            {exercise.name}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-muted">
            <span className="tabular">{exercise.sets}×{exercise.reps}</span>
            {exercise.suggestedWeightKg ? (
              <span className="tabular font-semibold text-neon">{exercise.suggestedWeightKg} kg</span>
            ) : exercise.weightType === "bodyweight" ? (
              <span className="text-faint">tana vazni</span>
            ) : (
              <span className="text-faint">yengil vazn</span>
            )}
            <span className="flex items-center gap-1 text-faint">
              <Timer size={10} /> {exercise.rest}
            </span>
          </p>
          {exercise.progressed && (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-cyan">
              <TrendingUp size={11} /> Og'irlik oshirildi
            </p>
          )}
        </div>

        {done ? (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-neon/15">
            <Check size={16} className="text-neon" />
          </span>
        ) : (
          <button
            onClick={() => {
              haptic("light");
              setOpen((v) => !v);
            }}
            className="shrink-0 rounded-xl bg-neon px-3 py-2 text-[12px] font-bold text-neonOn active:scale-95"
          >
            <Play size={12} className="mr-1 inline" fill="currentColor" />
            Setlar
          </button>
        )}
      </div>

      {open && sets && (
        <div className="animate-fade-up border-t border-borderSoft bg-surfaceAlt px-4 py-3.5">
          {exercise.note && <p className="mb-3 text-[11.5px] leading-relaxed text-faint">{exercise.note}</p>}
          {lastHint && (
            <p className="mb-3 text-[11.5px] text-cyan">
              O'tgan safar: {lastHint.map((s) => `${s.weightKg ?? "—"}kg×${s.reps ?? "—"}`).join(", ")}
            </p>
          )}

          <div className="mb-3 flex flex-col gap-2">
            {sets.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="tabular w-7 shrink-0 text-[11px] font-bold text-faint">#{i + 1}</span>

                <span className="flex flex-1 items-center rounded-xl border border-borderSoft bg-surface px-2.5 py-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={s.weightKg}
                    onChange={(e) => update(i, "weightKg", e.target.value)}
                    placeholder="0"
                    aria-label={`${i + 1}-set og'irlik`}
                    className="tabular w-full bg-transparent text-[14px] font-bold text-ink outline-none placeholder:text-faint"
                  />
                  <span className="shrink-0 text-[11px] text-faint">kg</span>
                </span>

                <span className="flex flex-1 items-center rounded-xl border border-borderSoft bg-surface px-2.5 py-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={s.reps}
                    onChange={(e) => update(i, "reps", e.target.value)}
                    placeholder="0"
                    aria-label={`${i + 1}-set takror`}
                    className="tabular w-full bg-transparent text-[14px] font-bold text-ink outline-none placeholder:text-faint"
                  />
                  <span className="shrink-0 text-[11px] text-faint">takror</span>
                </span>
              </div>
            ))}
          </div>

          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={() => setSets((p) => p.slice(0, Math.max(1, p.length - 1)))}
              aria-label="Set kamaytirish"
              className="grid h-8 w-8 place-items-center rounded-lg border border-borderSoft bg-surface"
            >
              <Minus size={13} className="text-muted" />
            </button>
            <span className="text-[11.5px] text-faint">{sets.length} set</span>
            <button
              onClick={() => setSets((p) => [...p, { reps: "", weightKg: p.at(-1)?.weightKg ?? "" }])}
              aria-label="Set qo'shish"
              className="grid h-8 w-8 place-items-center rounded-lg border border-borderSoft bg-surface"
            >
              <Plus size={13} className="text-muted" />
            </button>
          </div>

          <Button full loading={saving} onClick={save}>
            <Check size={16} /> Mashqni yakunlash
          </Button>
        </div>
      )}
    </div>
  );
}

export default function WorkoutSession({ day, onBack }) {
  const { logWorkout, profile, showToast, workoutHistory } = useApp();
  const [infoId, setInfoId] = useState(null);

  // A plan-day exercise counts as done if it was logged today.
  const today = new Date().toISOString().slice(0, 10);
  const doneIds = new Set(
    workoutHistory
      .filter((w) => String(w.loggedAt).slice(0, 10) === today && w.planDay === day.day)
      .map((w) => w.exerciseId)
  );

  async function complete(exercise, sets) {
    try {
      await logWorkout({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        emoji: "🏋️",
        kcal: estimateSessionKcal(exercise, profile?.weightKg || 70),
        setsCompleted: sets.length,
        planDay: day.day,
        sets,
      });
      haptic("success");
      showToast("Mashq yakunlandi 💪", "success");
    } catch (e) {
      showToast(e.message || "Saqlab bo'lmadi", "error");
    }
  }

  const doneCount = day.exercises.filter((e) => doneIds.has(e.id)).length;
  const total = day.exercises.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  if (infoId && EX_BY_ID[infoId]) {
    return <ExerciseDetail exercise={EX_BY_ID[infoId]} onBack={() => setInfoId(null)} />;
  }

  return (
    <Screen>
      <ScreenHeader
        title={`${day.day} — ${day.label}`}
        subtitle={`${total} ta mashq • ${doneCount} bajarildi`}
        right={
          <button onClick={onBack} aria-label="Orqaga" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surfaceAlt">
            <ChevronLeft size={17} className="text-muted" />
          </button>
        }
      />

      <div className="card mb-4 px-4 py-3.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint">Kunlik progress</span>
          <span className="tabular text-[13px] font-bold text-neon">{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-borderSoft">
          <div className="h-full rounded-full bg-neon transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>
        {doneCount === total && total > 0 && (
          <p className="mt-2.5 text-center text-[12.5px] font-bold text-neon">Kun yakunlandi 🎉</p>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {day.exercises.map((e) => (
          <ExerciseCard
            key={e.id}
            exercise={e}
            done={doneIds.has(e.id)}
            onComplete={complete}
            onShowInfo={setInfoId}
          />
        ))}
      </div>
    </Screen>
  );
}
