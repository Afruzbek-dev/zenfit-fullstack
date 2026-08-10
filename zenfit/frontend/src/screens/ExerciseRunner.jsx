import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Info, Timer, TrendingUp, Minus, Plus, X, ChevronDown } from "lucide-react";
import { Screen, ScreenHeader, Button, IconButton } from "../components/ui.jsx";
import ExerciseGuide from "../components/ExerciseGuide.jsx";
import { localizeExercise } from "../data/exerciseText.js";
import { api } from "../api.js";
import { haptic } from "../telegram.js";
import { useBackButton } from "../lib/useBackButton.js";
import { useApp } from "../store.jsx";

/** "60-90s" → 90, "2 daq" → 120. The upper bound is the one worth resting. */
export function parseRestSeconds(rest) {
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
 * Pinned above the bottom nav so the countdown stays visible while scrolling
 * the set list. Driven by a target timestamp rather than a decrementing
 * counter, so it stays truthful if the webview throttles timers.
 */
function RestTimer({ seconds, label, onDismiss }) {
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
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, []);

  const add = (extra) => {
    endRef.current += extra * 1000;
    firedRef.current = false;
    setTotal((v) => v + extra);
    setLeft(Math.max(0, Math.round((endRef.current - Date.now()) / 1000)));
    haptic("light");
  };

  const pct = total > 0 ? (left / total) * 100 : 0;
  const done = left === 0;

  return createPortal(
    <div
      className="fixed inset-x-0 z-[45] flex justify-center px-4"
      style={{ bottom: "calc(var(--nav-h) + var(--safe-bottom) + 12px)" }}
    >
      <div
        className={`animate-fade-up w-full max-w-lg overflow-hidden rounded-xl2 border bg-surfaceHi shadow-2xl ${
          done ? "border-neon/40" : "border-cyan/30"
        }`}
      >
        <div className="h-1 bg-borderSoft">
          <div
            className={`h-full transition-[width] duration-300 ease-linear ${done ? "bg-neon" : "bg-cyan"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${done ? "bg-neon/15" : "bg-cyan/15"}`}>
            <Timer size={19} className={done ? "text-neon" : "text-cyan"} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint">
              {done ? t("workout.restDone") : t("workout.restNow")}
            </p>
            <p className="tabular text-[22px] font-bold leading-tight text-ink">{mmss(left)}</p>
            {label && <p className="truncate text-[11px] text-muted">{label}</p>}
          </div>
          <button
            onClick={() => add(15)}
            className="shrink-0 rounded-xl border border-borderSoft bg-surface px-3 py-2 text-[12px] font-bold text-muted active:scale-95"
          >
            {t("workout.addTime")}
          </button>
          <IconButton Icon={X} label={t("workout.skipRest")} onClick={onDismiss} />
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ------------------------------ one set ------------------------------ */

function Stepper({ label, value, unit, step, min, max, onChange, decimals = 0 }) {
  const show = decimals ? String(Number(value).toFixed(1)).replace(/\.0$/, "") : String(value);
  // The unit rides in the label ("Og'irlik, kg") instead of sitting inside the
  // box, so the box holds only the number being typed into it.
  const fullLabel = unit ? `${label}, ${unit}` : label;
  return (
    <div className="flex-1">
      <p className="mb-1.5 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-faint">{fullLabel}</p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => {
            haptic("light");
            onChange(clamp(Number(value) - step, min, max));
          }}
          aria-label={`${fullLabel} −${step}`}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-borderSoft bg-surface active:scale-95"
        >
          <Minus size={15} className="text-muted" />
        </button>
        <div className="flex min-w-0 flex-1 items-center justify-center rounded-xl border border-borderSoft bg-surface px-1 py-2">
          <input
            type="number"
            inputMode="decimal"
            value={show}
            onChange={(e) => onChange(e.target.value === "" ? min : clamp(Number(e.target.value), min, max))}
            aria-label={fullLabel}
            className="tabular w-full bg-transparent text-center text-[19px] font-bold text-ink outline-none"
          />
        </div>
        <button
          onClick={() => {
            haptic("light");
            onChange(clamp(Number(value) + step, min, max));
          }}
          aria-label={`${fullLabel} +${step}`}
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
        className="flex w-full items-center gap-3 rounded-2xl border border-neon/25 bg-neon/[0.08] px-3.5 py-3.5 text-left active:scale-[0.99]"
      >
        <span className="tabular grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-neon/20 text-[12px] font-bold text-neon">
          {index + 1}
        </span>
        <span className="tabular min-w-0 flex-1 text-[14px] font-bold text-ink">
          {bodyweight ? t("workout.bodyweight") : `${set.weightKg} ${t("common.kg")}`}
          <span className="text-faint"> × </span>
          {set.reps}
          <span className="text-[11.5px] font-semibold text-faint"> {t("workout.reps")}</span>
        </span>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-neon">
          <Check size={15} className="text-neonOn" strokeWidth={3} />
        </span>
      </button>
    );
  }

  if (!active) {
    return (
      <button
        onClick={onOpen}
        className="flex w-full items-center gap-3 rounded-2xl border border-borderSoft bg-surfaceAlt px-3.5 py-3.5 text-left active:scale-[0.99]"
      >
        <span className="tabular grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface text-[12px] font-bold text-faint">
          {index + 1}
        </span>
        <span className="tabular min-w-0 flex-1 text-[13.5px] font-semibold text-muted">
          {bodyweight ? t("workout.bodyweight") : `${set.weightKg} ${t("common.kg")}`}
          <span className="text-faint"> × </span>
          {set.reps}
        </span>
        <ChevronDown size={16} className="shrink-0 text-faint" />
      </button>
    );
  }

  return (
    <div className="animate-fade-up rounded-2xl border border-neon/35 bg-surfaceAlt px-3.5 py-4">
      <div className="mb-3.5 flex items-center gap-2">
        <span className="tabular grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-neon text-[12px] font-bold text-neonOn">
          {index + 1}
        </span>
        <span className="text-[13px] font-bold text-ink">
          {t("workout.set")} {index + 1}
        </span>
      </div>

      <div className="mb-4 flex gap-2.5">
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

      <Button full size="lg" onClick={onComplete}>
        <Check size={17} strokeWidth={3} /> {t("workout.setDone")}
      </Button>
    </div>
  );
}

/* ------------------------------- screen ------------------------------ */

/** Everything for one exercise: its sets, the rest timer and the how-to. */
export default function ExerciseRunner({ exercise: planned, planDay, onBack, onFinish }) {
  const { t, lang } = useApp();
  // Plans store the name as it was when generated, so the display name is
  // resolved from the exercise id each render instead.
  const exercise = useMemo(() => localizeExercise(planned, lang), [planned, lang]);
  const [showGuide, setShowGuide] = useState(false);
  const [sets, setSets] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lastHint, setLastHint] = useState(null);
  const [rest, setRest] = useState(null);
  const [saving, setSaving] = useState(false);

  // While the guide is open it owns the back button; the runner takes it back
  // on return.
  useBackButton(showGuide ? null : onBack);

  const bodyweight = exercise.weightType === "bodyweight";
  const restSeconds = useMemo(() => parseRestSeconds(exercise.rest), [exercise.rest]);

  useEffect(() => {
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
  }, [exercise]);

  if (showGuide) return <ExerciseGuide exerciseId={exercise.id} onBack={() => setShowGuide(false)} />;

  const update = (i, patch) => setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  function completeSet(i) {
    haptic("success");
    const next = sets.map((s, idx) => (idx === i ? { ...s, done: true } : s));
    setSets(next);

    const after = next.findIndex((s, idx) => !s.done && idx > i);
    const upcoming = after >= 0 ? after : next.findIndex((s) => !s.done);
    setActiveIndex(upcoming);

    // No rest is owed after the final set — the exercise is over.
    if (upcoming >= 0) {
      setRest({ seconds: restSeconds, label: `${t("workout.set")} ${upcoming + 1}`, key: Date.now() });
    } else {
      setRest(null);
    }
  }

  async function finish() {
    setSaving(true);
    try {
      const completed = sets.filter((s) => s.done);
      await onFinish(exercise, completed.length ? completed : sets, planDay);
    } finally {
      setSaving(false);
    }
  }

  const doneCount = sets?.filter((s) => s.done).length ?? 0;
  const totalSets = sets?.length ?? exercise.sets ?? 3;
  const allDone = Boolean(sets?.length) && doneCount === totalSets;
  const pct = totalSets ? Math.round((doneCount / totalSets) * 100) : 0;

  return (
    <Screen>
      <ScreenHeader
        title={exercise.name}
        subtitle={`${doneCount}/${totalSets} ${t("workout.sets")}`}
        onBack={onBack}
        action={<IconButton Icon={Info} label={t("workout.guide")} tone="neon" active onClick={() => setShowGuide(true)} />}
      />

      {/* Target for this exercise */}
      <div className="card mb-3 px-4 py-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint">{t("workout.target")}</p>
            <p className="tabular mt-0.5 text-[14px] font-bold text-ink">
              {exercise.sets}×{exercise.reps}
              {exercise.suggestedWeightKg ? (
                <span className="text-neon">
                  {" "}
                  · {exercise.suggestedWeightKg} {t("common.kg")}
                </span>
              ) : bodyweight ? (
                <span className="text-faint"> · {t("workout.bodyweight")}</span>
              ) : null}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-borderSoft bg-surfaceAlt px-3 py-1.5 text-[11.5px] font-semibold text-muted">
            <Timer size={12} className="text-faint" /> {exercise.rest}
          </span>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-borderSoft">
          <div className="h-full rounded-full bg-neon transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>

        {exercise.progressed && (
          <p className="mt-2.5 flex items-center gap-1 text-[11.5px] font-semibold text-cyan">
            <TrendingUp size={12} /> {t("workout.progressed")}
          </p>
        )}
      </div>

      {/* How-to entry point, spelled out rather than hidden behind the icon */}
      <button
        onClick={() => {
          haptic("light");
          setShowGuide(true);
        }}
        className="card card-lit mb-4 flex w-full items-center gap-3 px-4 py-3.5 text-left active:scale-[0.99]"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-neon/12">
          <Info size={19} className="text-neon" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-bold text-ink">{t("workout.guide")}</span>
          <span className="mt-0.5 block text-[11.5px] text-muted">{t("workout.guideDesc")}</span>
        </span>
      </button>

      {exercise.note && <p className="mb-3 px-1 text-[11.5px] leading-relaxed text-faint">{exercise.note}</p>}
      {lastHint && (
        <p className="mb-3 px-1 text-[11.5px] text-cyan">
          {t("workout.lastTime")}: {lastHint.map((s) => `${s.weightKg ?? "—"}kg×${s.reps ?? "—"}`).join(", ")}
        </p>
      )}

      {/* Sets */}
      <h2 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-faint">{t("workout.setsTitle")}</h2>
      <div className="mb-3 flex flex-col gap-2">
        {(sets || []).map((s, i) => (
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

      <div className="mb-5 flex items-center gap-2">
        <button
          onClick={() => {
            if (!sets || sets.length <= 1) return;
            setSets((p) => p.slice(0, -1));
            setActiveIndex((i) => Math.min(i, sets.length - 2));
          }}
          aria-label={t("workout.removeSet")}
          className="grid h-8 w-8 place-items-center rounded-lg border border-borderSoft bg-surfaceAlt"
        >
          <Minus size={13} className="text-muted" />
        </button>
        <span className="text-[11.5px] text-faint">
          {totalSets} {t("workout.sets")}
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

      {allDone && <p className="mb-2.5 text-center text-[12.5px] font-bold text-neon">{t("workout.allDone")}</p>}

      <Button full size="lg" loading={saving} disabled={doneCount === 0} onClick={finish}>
        <Check size={17} /> {t("workout.finish")}
      </Button>

      {rest && (
        <RestTimer key={rest.key} seconds={rest.seconds} label={rest.label} onDismiss={() => setRest(null)} />
      )}
    </Screen>
  );
}
