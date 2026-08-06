/**
 * Deterministic workout plan engine.
 *
 * Runs entirely on the client so a plan appears instantly and no weight is ever
 * hallucinated by a language model. The AI layer only adds commentary on top.
 *
 * Rules follow docs/superpowers/specs/2026-08-03-ai-workout-generator-design.md.
 */

import { EXERCISES, EX_BY_ID } from "../data/exercises.js";

/* --------------------------- starting loads --------------------------- */

// Fraction of bodyweight per level. A 0.8 safety factor is applied on top so a
// first session is deliberately conservative.
const BW_TABLE = {
  "barbell-back-squat": { beginner: 0.4, intermediate: 0.6, advanced: 0.8 },
  "barbell-deadlift": { beginner: 0.6, intermediate: 0.8, advanced: 1.1 },
  "romanian-deadlift": { beginner: 0.45, intermediate: 0.6, advanced: 0.8 },
  "barbell-bench-press": { beginner: 0.32, intermediate: 0.48, advanced: 0.72 },
  "overhead-press": { beginner: 0.2, intermediate: 0.32, advanced: 0.44 },
  "barbell-row": { beginner: 0.32, intermediate: 0.44, advanced: 0.6 },
};

const SAFETY = 0.8;
const roundTo = (v, step) => Math.max(step, Math.round(v / step) * step);

export function suggestedWeight(exerciseId, { weightKg, level = "beginner" }) {
  const ex = EX_BY_ID[exerciseId];
  if (!ex) return { weightType: "rpe_guided", suggestedWeightKg: null };

  const row = BW_TABLE[exerciseId];
  if (row) {
    const kg = roundTo(weightKg * (row[level] ?? row.beginner) * SAFETY, 2.5);
    return { weightType: "barbell", suggestedWeightKg: kg };
  }

  if (ex.equipment === "home-dumbbell" && ex.type === "compound") {
    // Dumbbell compounds sit around 40% of the barbell baseline, per hand.
    const base = weightKg * 0.32 * SAFETY * 0.4;
    return { weightType: "dumbbell", suggestedWeightKg: roundTo(base, 2) };
  }

  // Pull-ups, dips and holds are bodyweight even when they live in a gym.
  if (ex.bodyweight || ex.equipment === "home-none" || ex.isTime) {
    return { weightType: "bodyweight", suggestedWeightKg: null };
  }

  return {
    weightType: "rpe_guided",
    suggestedWeightKg: null,
    note: "Yengil vazndan boshlang — oxirgi 2-3 takror qiyin, lekin bajarilishi mumkin bo'lsin.",
  };
}

/**
 * Progressive overload: if every set in the last session hit the top of the rep
 * range, add weight; otherwise hold. Compound lifts move faster than isolation.
 */
export function progressWeight({ exerciseId, lastSets, topReps, fallbackKg }) {
  if (!lastSets?.length) return { kg: fallbackKg, progressed: false };

  const weights = lastSets.map((s) => s.weightKg).filter((w) => Number.isFinite(w));
  if (!weights.length) return { kg: fallbackKg, progressed: false };

  const lastKg = Math.max(...weights);
  const allHitTop = lastSets.every((s) => Number.isFinite(s.reps) && s.reps >= topReps);
  if (!allHitTop) return { kg: lastKg, progressed: false };

  const ex = EX_BY_ID[exerciseId];
  const step = ex?.type === "compound" ? 2.5 : 1;
  return { kg: roundTo(lastKg + step, step), progressed: true };
}

/* ------------------------------ rep rules ------------------------------ */

export const REP_RULES = {
  lose: { reps: "12-15", topReps: 15, rest: "45-60s", note: "Yuqori takror + mashqdan keyin 15-20 daqiqa kardio qo'shing." },
  maintain: { reps: "8-12", topReps: 12, rest: "60-90s", note: "Muvozanatli hajm — texnikaga e'tibor bering." },
  gain: { reps: "6-10", topReps: 10, rest: "90-120s", note: "Og'irlikni har hafta asta oshirib boring." },
};

const setsFor = (level, isCompound) => (level === "beginner" ? 3 : isCompound ? 4 : 3);

/* ------------------------------- splits -------------------------------- */

export function buildSplit(days) {
  if (days <= 3) {
    return [
      { day: "1-kun", label: "Full Body" },
      { day: "2-kun", label: "Dam olish" },
      { day: "3-kun", label: "Full Body" },
      { day: "4-kun", label: "Dam olish" },
      { day: "5-kun", label: "Full Body" },
      { day: "6-kun", label: "Dam olish" },
      { day: "7-kun", label: "Dam olish" },
    ];
  }
  if (days === 4) {
    return [
      { day: "1-kun", label: "Upper" },
      { day: "2-kun", label: "Lower" },
      { day: "3-kun", label: "Dam olish" },
      { day: "4-kun", label: "Upper" },
      { day: "5-kun", label: "Lower" },
      { day: "6-kun", label: "Dam olish" },
      { day: "7-kun", label: "Dam olish" },
    ];
  }
  return [
    { day: "1-kun", label: "Push" },
    { day: "2-kun", label: "Pull" },
    { day: "3-kun", label: "Legs" },
    { day: "4-kun", label: "Dam olish" },
    { day: "5-kun", label: "Push" },
    { day: "6-kun", label: "Pull" },
    { day: "7-kun", label: "Legs" },
  ];
}

const DAY_PATTERNS = {
  "Full Body": { main: ["squat", "hinge", "pushH", "pullH"], acc: [["biceps", "calves"], ["triceps", "core"], ["delts", "core"]] },
  Upper: { main: ["pushH", "pullH", "pushV", "pullV"], acc: [["biceps", "triceps"], ["delts", "biceps"]] },
  Lower: { main: ["squat", "hinge"], acc: [["calves", "core"], ["calves", "core"]] },
  Push: { main: ["pushH", "pushV"], acc: [["triceps", "delts"], ["triceps", "core"]] },
  Pull: { main: ["pullH", "pullV"], acc: [["biceps", "delts"], ["biceps", "core"]] },
  Legs: { main: ["squat", "hinge"], acc: [["calves", "core"], ["calves", "core"]] },
};

/* ------------------------------ injuries ------------------------------- */

export const INJURY_RULES = [
  { key: "tizza", label: "Tizza", avoid: ["squat"], swapTo: "glute-bridge" },
  { key: "bel", label: "Bel", avoid: ["hinge"], swapTo: "seated-cable-row" },
  { key: "yelka", label: "Yelka", avoid: ["pushV"], swapTo: "lateral-raise" },
];

const SAFETY_NOTE = "Og'riq sezsangiz mashqni to'xtating va shifokorga murojaat qiling.";

/* ------------------------------ selection ------------------------------ */

/** Exercises matching a movement pattern for the available equipment. */
function poolFor(pattern, equipment) {
  const exact = EXERCISES.filter((e) => e.pattern === pattern && e.equipment === equipment);
  if (exact.length) return exact;

  // Graceful fallback so every slot fills even for sparse equipment sets.
  const order =
    equipment === "gym"
      ? ["gym", "home-dumbbell", "home-none"]
      : equipment === "home-dumbbell"
      ? ["home-dumbbell", "home-none", "gym"]
      : ["home-none", "home-dumbbell", "gym"];

  for (const eq of order) {
    const found = EXERCISES.filter((e) => e.pattern === pattern && e.equipment === eq);
    if (found.length) return found;
  }
  return EXERCISES.filter((e) => e.pattern === pattern);
}

const pick = (list, i) => list[i % list.length];

/**
 * Builds the weekly plan.
 * `lastSetsByExercise` is optional; when present the engine applies
 * progressive overload instead of the first-session baseline.
 */
export function generateWorkoutPlan({
  goal = "maintain",
  level = "beginner",
  daysPerWeek = 3,
  equipment = "home-none",
  duration = "60",
  injuries = "",
  weightKg = 70,
  lastSetsByExercise = {},
}) {
  const rules = REP_RULES[goal] || REP_RULES.maintain;
  const injuryText = String(injuries || "").toLowerCase();
  const activeInjuries = INJURY_RULES.filter((r) => injuryText.includes(r.key));
  const avoidMap = {};
  activeInjuries.forEach((r) => r.avoid.forEach((p) => (avoidMap[p] = r.swapTo)));

  // Session length caps how many exercises fit.
  const maxExercises = duration === "30" ? 5 : duration === "90" ? 7 : 6;

  const split = buildSplit(daysPerWeek);
  const seen = {};

  const days = split.map((slot) => {
    if (slot.label === "Dam olish") return { ...slot, rest: true, exercises: [] };

    const occurrence = seen[slot.label] || 0;
    seen[slot.label] = occurrence + 1;

    const template = DAY_PATTERNS[slot.label] || DAY_PATTERNS["Full Body"];

    const mainSlots = template.main.map((pattern) => {
      const swapId = avoidMap[pattern];
      if (swapId && EX_BY_ID[swapId]) return { ex: EX_BY_ID[swapId], adjusted: true, pattern };
      return { ex: pick(poolFor(pattern, equipment), occurrence), adjusted: false, pattern };
    });

    const accPatterns = pick(template.acc, occurrence);
    const accSlots = accPatterns.map((pattern) => ({
      ex: pick(poolFor(pattern, equipment), occurrence),
      adjusted: false,
      pattern,
      accessory: true,
    }));

    const chosen = [...mainSlots, ...accSlots].filter((s) => s.ex).slice(0, maxExercises);

    const exercises = chosen.map(({ ex, adjusted, accessory }) => {
      const base = suggestedWeight(ex.id, { weightKg, level });
      const progressed = progressWeight({
        exerciseId: ex.id,
        lastSets: lastSetsByExercise[ex.id],
        topReps: rules.topReps,
        fallbackKg: base.suggestedWeightKg,
      });

      return {
        id: ex.id,
        name: ex.name,
        nameEn: ex.nameEn,
        muscle: ex.muscle,
        sets: setsFor(level, ex.type === "compound" && !accessory),
        reps: accessory ? "10-15" : rules.reps,
        rest: rules.rest,
        weightType: base.weightType,
        suggestedWeightKg: progressed.kg ?? base.suggestedWeightKg,
        progressed: progressed.progressed,
        note: base.note,
        adjusted,
        isTime: Boolean(ex.isTime),
      };
    });

    return { ...slot, rest: false, exercises };
  });

  return {
    title: "AI Shaxsiy Reja",
    createdAt: new Date().toISOString(),
    goal,
    level,
    daysPerWeek,
    equipment,
    duration,
    injuries: injuries || null,
    rules,
    injuryNotes: activeInjuries.length
      ? `${activeInjuries.map((r) => r.label).join(", ")} uchun mashqlar xavfsiz almashtirildi. ${SAFETY_NOTE}`
      : null,
    days,
  };
}

/** Rough energy estimate so logging a session moves the calorie balance. */
export function estimateSessionKcal(exercise, weightKg = 70) {
  const ex = EX_BY_ID[exercise.id];
  const met = ex?.type === "compound" ? 6 : 4;
  const minutes = (exercise.sets || 3) * 1.6;
  return Math.round((met * 3.5 * weightKg) / 200 * minutes);
}
