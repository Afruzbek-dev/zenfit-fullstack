import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft, Check, Info, Timer, TrendingUp, Minus, Plus, X, ChevronDown,
} from "lucide-react";
import { Screen, ScreenHeader, Button } from "../components/ui.jsx";
import ExerciseGuide from "../components/ExerciseGuide.jsx";
import { estimateSessionKcal } from "../lib/aiPlanEngine.js";
import { api } from "../api.js";
import { haptic } from "../telegram.js";
import { useApp } from "../store.jsx";

/** "60-90s" → 90, "2 daq" → 120. The upper bound is the one worth resting. */
function parseRestSeconds(rest) {
  const text = String(rest || "");
  const nums = text.match(/\d+/g);
  if (!nums) return 60;
  const value = Number(nums[nums.length - 1]);
  return /daq|min/i.test(text) ? value * 60 : value;
}

/** The rep target ("8-12") gives the starting value for a fresh set. */
function defaultReps(reps) {
  const nums = String(reps || "").match(/\d+/g);
  return nums ? Number(nums[0]) : 10;
}

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/* --------------------------- rest countdown --------------------------- */

/**
 * Floats above the bottom nav so the countdown stays visible while the user
 * scrolls to the next exercise. Driven by a target timestamp rather than a
 * decrementing counter, so it stays truthful if the webview throttles timers.
 */
function RestTimer({ seconds, onDone, onDismiss, label }) {
  const { t } = useApp();
  const [total, setTotal] = useState(seconds);
  const [left, setLeft] = useState(seconds);
  const endRef = useRef(Date.now() + seconds * 1000);
  const firedRef = useRef(false);

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.round((endRef.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0 && !firedRef.current) {
        firedRef.current = true;
        haptic("success");
        onDone?.();
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [onDone]);

  const add = (extra) => {
    endRef.current += extra * 1000;
    firedRef.current = false;
    setTotal((v) => v + extra);
    setLeft(Math.max(0, Math.round((endRef.current - Date.now()) / 1000)));
    haptic("light");
  };

  const pct = total > 0 ? (left / total) * 100 : 0;

  return createPortal(
    <div
      className="fixed inset-x-0 z-[45] flex justify-center px-4"
      style={{ bottom: "calc(var(--nav-h) + var(--safe-bottom) + 12px)" }}
    >
      <div className="animate-fade-up w-full max-w-lg overflow-hidden rounded-xl2 border border-cyan/30 bg-surfaceHi shadow-2xl">
        <div className="h-1 bg-borderSoft">
          <div className="h-full bg-cyan transition-[width] duration-300 ease-linear" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan/15">
            <Timer size={19} className="text-cyan" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint">{t("workout.restNow")}</p>
            <p className="tabular text-[22px] font-bold leading-tight text-ink">{mmss(left)}</p>
            {label && <p className="truncate text-[11px] text-muted">{label}</p>}
          </div>
          <button
            onClick={() => add(15)}
            className="shrink-0 rounded-xl border border-borderSoft bg-surface px-3 py-2 text-[12px] font-bold text-muted active:scale-95"
          >
            {t("workout.addTime")}
          </button>
          <button
            onClick={() => {
              haptic("light");
              onDismiss();
            }}
            aria-label={t("workout.skipRest")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surfaceAlt active:scale-95"
          >
            <X size={16} className="text-muted" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ------------------------------ one set ------------------------------ */

function Stepper({ label, value, unit, step, min, max, onChange, decimals = 0 }) {
  const show = decimals ? Number(value).toFixed(1).replace(/\.0$/, "") : String(value);
  return (
    <div className="flex-1">
      <p className="mb-1.5 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-faint">{label}</p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => {
            haptic("light");
            onChange(clamp(Number(value) - step, min, max));
          }}
          aria-label={`${label} −${step}`}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-borderSoft bg-surface active:scale-95"
        >
          <Minus size={15} className="text-muted" />
        </button>
        <div className="flex min-w-0 flex-1 items-baseline justify-center gap-1 rounded-xl border border-borderSoft bg-surface px-1 py-2">
          <input
            type="number"
            inputMode="decimal"
            value={show}
            onChange={(e) => onChange(e.target.value === "" ? min : clamp(Number(e.target.value), min, max))}
            aria-label={label}
            className="tabular w-full bg-transparent text-center text-[19px] font-bold text-ink outline-none"
          />
          <span className="shrink-0 text-[11px] font-semibold text-faint">{unit}</span>
        </div>
        <button
          onClick={() => {
            haptic("light");
            onChange(clamp(Number(value) + step, min, max));
          }}
          aria-label={`${label} +${step}`}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-borderSoft bg-surface active:scale-95"
        >
          <Plus size={15} className="text-muted" />
        </button>
      </div>
    </div>
  );
}

/**
 * A set is either a one-line summary or, when it is the one being worked on,
 * an expanded editor. Only a single set is open at a time so the screen always
 * answers "what am I doing right now".
 */
function SetRow({ index, set, active, bodyweight, onOpen, onChange, onComplete, onUndo }) {
  const { t } = useApp();

  if (set.done) {
    return (
      <button
        onClick={onUndo}
        className="flex w-full items-center gap-3 rounded-2xl border border-neon/25 bg-neon/[0.08] px-3.5 py-3 text-left active:scale-[0.99]"
      >
        <span className="tabular grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-neon/20 text-[11px] font-bold text-neon">
          {index + 1}
        </span>
        <span className="tabular min-w-0 flex-1 text-[13.5px] font-bold text-ink">
          {bodyweight ? t("workout.bodyweight") : `${set.weightKg} ${t("common.kg")}`}
          <span className="text-faint"> × </span>
          {set.reps}
          <span className="text-[11.5px] font-semibold text-faint"> {t("workout.reps")}</span>
        </span>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-neon">
          <Check size={14} className="text-neonOn" strokeWidth={3} />
        </span>
      </button>
    );
  }

  if (!active) {
    return (
      <button
        onClick={onOpen}
        className="flex w-full items-center gap-3 rounded-2xl border border-borderSoft bg-surfaceAlt px-3.5 py-3 text-left active:scale-[0.99]"
      >
        <span className="tabular grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface text-[11px] font-bold text-faint">
          {index + 1}
        </span>
        <span className="tabular min-w-0 flex-1 text-[13px] font-semibold text-muted">
          {bodyweight ? t("workout.bodyweight") : `${set.weightKg} ${t("common.kg")}`}
          <span className="text-faint"> × </span>
          {set.reps}
        </span>
        <ChevronDown size={15} className="shrink-0 text-faint" />
      </button>
    );
  }

  return (
    <div className="animate-fade-up rounded-2xl border border-neon/35 bg-surfaceAlt px-3.5 py-3.5">
      <div className="mb-3 flex items-center gap-2">
        <span className="tabular grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-neon text-[11px] font-bold text-neonOn">
          {index + 1}
        </span>
        <span className="text-[12.5px] font-bold text-ink">
          {t("workout.set")} {index + 1}
        </span>
      </div>

      <div className="mb-3.5 flex gap-2.5">
        {!bodyweight && (
          <Stepper
            label={t("workout.weight")}
            value={set.weightKg}
            unit={t("common.kg")}
            step={2.5}
            min={0}
            max={500}
            decimals={1}
            onChange={(v) => onChange({ weightKg: v })}
          />
        )}
        <Stepper
          label={t("workout.reps")}
          value={set.reps}
          unit=""
          step={1}
          min={1}
          max={100}
          onChange={(v) => onChange({ reps: v })}
        />
      </div>

      <Button full onClick={onComplete}>
        <Check size={16} strokeWidth={3} /> {t("workout.setDone")}
      </Button>
    </div>
  );
}

/* --------------------------- exercise card --------------------------- */

function ExerciseCard({ exercise, logged, onFinish, onShowGuide, onRest }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const [sets, setSets] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lastHint, setLastHint] = useState(null);
  const [saving, setSaving] = useState(false);

  const bodyweight = exercise.weightType === "bodyweight";
  const restSeconds = useMemo(() => parseRestSeconds(exercise.rest), [exercise.rest]);

  useEffect(() => {
    if (!open || sets) return undefined;
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
      const reps = defaultReps(exercise.reps);
      setSets(
        Array.from({ length: count }, (_, i) => ({
          reps: previous?.[i]?.reps ?? reps,
          weightKg: exercise.suggestedWeightKg ?? previous?.[i]?.weightKg ?? 0,
          done: false,
        }))
      );
    })();
    return () => {
      alive = false;
    };
  }, [open, sets, exercise]);

  const update = (i, patch) => setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  function completeSet(i) {
    haptic("success");
    const next = sets.map((s, idx) => (idx === i ? { ...s, done: true } : s));
    setSets(next);

    const nextUndone = next.findIndex((s, idx) => !s.done && idx > i);
    const fallback = next.findIndex((s) => !s.done);
    const upcoming = nextUndone >= 0 ? nextUndone : fallback;
    setActiveIndex(upcoming);

    // No rest is owed after the final set — the exercise is over.
    if (upcoming >= 0) onRest(restSeconds, `${exercise.name} — ${t("workout.set")} ${upcoming + 1}`);
  }

  async function finish() {
    setSaving(true);
    try {
      const completed = sets.filter((s) => s.done);
      await onFinish(exercise, completed.length ? completed : sets);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  const doneCount = sets?.filter((s) => s.done).length ?? 0;
  const allDone = Boolean(sets?.length) && doneCount === sets.length;

  return (
    <div className={`card overflow-hidden transition-opacity ${logged ? "opacity-55" : ""}`}>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <button
          onClick={() => {
            haptic("light");
            onShowGuide(exercise.id);
          }}
          aria-label={`${exercise.name} — ${t("workout.guide")}`}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-neon/10 active:scale-95"
        >
          <Info size={17} className="text-neon" />
        </button>

        <button
          onClick={() => {
            haptic("light");
            if (!logged) setOpen((v) => !v);
          }}
          disabled={logged}
          className="min-w-0 flex-1 text-left disabled:cursor-default"
        >
          <p className={`truncate text-[13.5px] font-bold ${logged ? "text-muted line-through" : "text-ink"}`}>
            {exercise.name}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-muted">
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
          </p>
          {exercise.progressed && (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-cyan">
              <TrendingUp size={11} /> {t("workout.progressed")}
            </p>
          )}
        </button>

        {logged ? (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-neon/15">
            <Check size={16} className="text-neon" />
          </span>
        ) : (
          <span
            className={`tabular shrink-0 rounded-xl px-3 py-2 text-[12px] font-bold ${
              open ? "bg-surfaceAlt text-muted" : "bg-neon text-neonOn"
            }`}
          >
            {open ? `${doneCount}/${sets?.length ?? exercise.sets}` : t("workout.set")}
          </span>
        )}
      </div>

      {open && sets && (
        <div className="animate-fade-up border-t border-borderSoft bg-surface px-4 py-3.5">
          {exercise.note && <p className="mb-3 text-[11.5px] leading-relaxed text-faint">{exercise.note}</p>}
          {lastHint && (
            <p className="mb-3 text-[11.5px] text-cyan">
              {t("workout.lastTime")}: {lastHint.map((s) => `${s.weightKg ?? "—"}kg×${s.reps ?? "—"}`).join(", ")}
            </p>
          )}
          {!allDone && <p className="mb-2.5 text-[11.5px] text-faint">{t("workout.tapSetToStart")}</p>}

          <div className="mb-3 flex flex-col gap-2">
            {sets.map((s, i) => (
              <SetRow
                key={i}
                index={i}
                set={s}
                active={i === activeIndex}
                bodyweight={bodyweight}
                onOpen={() => setActiveIndex(i)}
                onChange={(patch) => update(i, patch)}
                onComplete={() => completeSet(i)}
                onUndo={() => {
                  update(i, { done: false });
                  setActiveIndex(i);
                }}
              />
            ))}
          </div>

          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={() => {
                if (sets.length <= 1) return;
                setSets((p) => p.slice(0, -1));
                setActiveIndex((i) => Math.min(i, sets.length - 2));
              }}
              aria-label={t("workout.removeSet")}
              className="grid h-8 w-8 place-items-center rounded-lg border border-borderSoft bg-surfaceAlt"
            >
              <Minus size={13} className="text-muted" />
            </button>
            <span className="text-[11.5px] text-faint">
              {sets.length} {t("workout.sets")}
            </span>
            <button
              onClick={() =>
                setSets((p) => [...p, { reps: p.at(-1)?.reps ?? 10, weightKg: p.at(-1)?.weightKg ?? 0, done: false }])
              }
              aria-label={t("workout.addSet")}
              className="grid h-8 w-8 place-items-center rounded-lg border border-borderSoft bg-surfaceAlt"
            >
              <Plus size={13} className="text-muted" />
            </button>
          </div>

          {allDone && (
            <p className="mb-2.5 text-center text-[12.5px] font-bold text-neon">{t("workout.allDone")}</p>
          )}
          <Button full loading={saving} disabled={doneCount === 0} onClick={finish}>
            <Check size={16} /> {t("workout.finish")}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- screen ------------------------------ */

export default function WorkoutSession({ day, onBack }) {
  const { logWorkout, profile, showToast, workoutHistory, t } = useApp();
  const [guideId, setGuideId] = useState(null);
  const [rest, setRest] = useState(null);

  const startRest = useCallback((seconds, label) => {
    // Keyed by start time so a new set always remounts a fresh countdown.
    setRest({ seconds, label, key: Date.now() });
  }, []);

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
      setRest(null);
      showToast(t("workout.exerciseDone"), "success");
    } catch (e) {
      showToast(e.message || t("workout.saveFailed"), "error");
    }
  }

  const doneCount = day.exercises.filter((e) => loggedIds.has(e.id)).length;
  const total = day.exercises.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  return (
    <Screen>
      <ScreenHeader
        title={`${day.day} — ${day.label}`}
        subtitle={`${total} ${t("home.ta")} • ${doneCount} ${t("common.done").toLowerCase()}`}
        right={
          <button
            onClick={onBack}
            aria-label={t("common.back")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surfaceAlt"
          >
            <ChevronLeft size={17} className="text-muted" />
          </button>
        }
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
          <ExerciseCard
            key={e.id}
            exercise={e}
            logged={loggedIds.has(e.id)}
            onFinish={finishExercise}
            onShowGuide={setGuideId}
            onRest={startRest}
          />
        ))}
      </div>

      {rest && (
        <RestTimer
          key={rest.key}
          seconds={rest.seconds}
          label={rest.label}
          onDone={() => {}}
          onDismiss={() => setRest(null)}
        />
      )}

      <ExerciseGuide exerciseId={guideId} open={Boolean(guideId)} onClose={() => setGuideId(null)} />
    </Screen>
  );
}
