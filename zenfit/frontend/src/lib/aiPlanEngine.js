/**
 * Deterministic workout plan engine.
 *
 * Runs entirely on the client so a plan appears instantly and no weight is ever
 * hallucinated by a language model. The AI layer only adds commentary on top.
 *
 * Rules follow docs/superpowers/specs/2026-08-03-ai-workout-generator-design.md.
 */

import { EXERCISES, EX_BY_ID } from "../data/exercises.js";
import { focusGroups, focusLabel, sanitizeFocus } from "../data/muscleTargets.js";

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
 * Progressive overload: earn the next weight by finishing the prescribed reps,
 * then add a step. Compound lifts move faster than isolation.
 *
 * What counts as "finished" depends on the shape of the session that was
 * logged, and the two shapes coexist — plans are stored JSON and are never
 * regenerated, so a user can have a flat plan from before the ramp existed:
 *
 *   - **Ramped** (the weights differ across sets): only the heaviest set is
 *     judged, against the *bottom* of the rep range, because that is what the
 *     ramp asked of it. Requiring every set to hit the top would mean the
 *     weight could never move again — by design the earlier sets are lighter
 *     and longer.
 *   - **Flat** (every set at the same weight): the original rule, every set at
 *     the top of the range.
 */
export function progressWeight({ exerciseId, lastSets, reps, topReps, fallbackKg }) {
  if (!lastSets?.length) return { kg: fallbackKg, progressed: false };

  const weights = lastSets.map((s) => s.weightKg).filter((w) => Number.isFinite(w));
  if (!weights.length) return { kg: fallbackKg, progressed: false };

  const lastKg = Math.max(...weights);
  const ramped = weights.some((w) => w !== weights[0]);

  const earned = ramped
    ? lastSets
        .filter((s) => s.weightKg === lastKg)
        .every((s) => Number.isFinite(s.reps) && s.reps >= repRange(reps)[0])
    : lastSets.every((s) => Number.isFinite(s.reps) && s.reps >= topReps);

  if (!earned) return { kg: lastKg, progressed: false };

  const ex = EX_BY_ID[exerciseId];
  const step = ex?.type === "compound" ? 2.5 : 1;
  return { kg: roundTo(lastKg + step, step), progressed: true };
}

/* ------------------------------ rep rules ------------------------------ */

/**
 * `noteKey` is what the UI translates; `note` stays as the Uzbek fallback so a
 * plan generated before this existed — plans are stored as JSON and are not
 * regenerated on upgrade — still renders a sentence rather than a blank.
 */
export const REP_RULES = {
  lose: { reps: "12-15", topReps: 15, rest: "45-60s", noteKey: "lose", note: "Yuqori takror + mashqdan keyin 15-20 daqiqa kardio qo'shing." },
  maintain: { reps: "8-12", topReps: 12, rest: "60-90s", noteKey: "maintain", note: "Muvozanatli hajm — texnikaga e'tibor bering." },
  gain: { reps: "6-10", topReps: 10, rest: "90-120s", noteKey: "gain", note: "Og'irlikni har hafta asta oshirib boring." },
};

/**
 * Day labels are stored inside the plan JSON as "1-kun", so they cannot simply
 * be re-keyed without invalidating every saved plan. Parsing the number back
 * out localizes old and new plans alike.
 */
export function localizeDay(day, t) {
  const n = parseInt(day, 10);
  return Number.isFinite(n) ? t("workout.dayN", { n }) : day;
}

/** Same fallback rule as rulesNote: stored plans keep their Uzbek title. */
export const planTitle = (plan, t) => (plan?.titleKey ? t("workout.planTitle") : plan?.title || "");

export const rulesNote = (rules, t) =>
  rules?.noteKey ? t(`workout.rulesNote.${rules.noteKey}`) : rules?.note || "";

const setsFor = (level, isCompound) => (level === "beginner" ? 3 : isCompound ? 4 : 3);

/* ------------------------------ set ramp ------------------------------- */

/**
 * Fraction of the top set's load each earlier set carries.
 *
 * A plan that says "3×8-12, 40 kg" leaves the trainee to decide what every
 * individual set actually is, and in practice they do the same number three
 * times — which is neither a warm-up nor a working set. The ramp answers it
 * for them: the last set is the prescribed load, the ones before it are
 * lighter, and the reps come down as the weight goes up.
 *
 * The top of the ramp is the weight the engine already suggested, so this is
 * never heavier than what the plan asked for before — only the earlier sets
 * move, and they move down.
 */
const RAMP_FACTORS = {
  1: [1],
  2: [0.88, 1],
  3: [0.8, 0.9, 1],
  4: [0.75, 0.85, 0.93, 1],
  5: [0.7, 0.8, 0.87, 0.94, 1],
};

/** Smallest plate/dumbbell increment that exists for this kind of load. */
const WEIGHT_STEP = { barbell: 2.5, dumbbell: 2 };

const rampFactors = (count) =>
  RAMP_FACTORS[count] ||
  Array.from({ length: count }, (_, i) => 0.7 + (0.3 * i) / (count - 1));

/** "8-12" → [8, 12]; a bare "10" → [10, 10]. */
export function repRange(reps) {
  const nums = String(reps || "").match(/\d+/g)?.map(Number) ?? [];
  if (!nums.length) return [10, 10];
  return [Math.min(...nums), Math.max(...nums)];
}

/**
 * The per-set targets shown in the plan and pre-filled in the runner.
 *
 * Reps walk from the top of the range down to the bottom, so the first set is
 * the easy one and the last is the hard one. Rounding can make two adjacent
 * weights equal on light loads — a 10 kg dumbbell has no 9 kg — and that is
 * left as is rather than inventing a plate that does not exist.
 */
export function buildSetPlan({ count, reps, topWeightKg, weightType }) {
  const sets = Math.max(1, count || 3);
  const [low, high] = repRange(reps);
  const factors = rampFactors(sets);
  const step = WEIGHT_STEP[weightType] || 1;

  return factors.map((factor, i) => ({
    reps: sets === 1 ? high : Math.round(high - ((high - low) * i) / (sets - 1)),
    weightKg: Number.isFinite(topWeightKg) && topWeightKg > 0
      ? roundTo(topWeightKg * factor, step)
      : null,
  }));
}

/**
 * The ramp as one line: "12×35 · 10×37.5 · 8×40", or just "12 · 10 · 8" when
 * there is no load to name. Returns "" for plans stored before setPlan existed,
 * which is what the callers test to decide whether to fall back.
 */
export function formatSetPlan(setPlan, kg = "kg") {
  if (!setPlan?.length) return "";
  return setPlan
    .map((s) => (Number.isFinite(s.weightKg) && s.weightKg > 0 ? `${s.reps}×${s.weightKg}${kg}` : `${s.reps}`))
    .join(" · ");
}

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

/* --------------------------- focused splits ---------------------------- */

/**
 * One compound pattern per training day that the focus does *not* cover.
 *
 * A plan built purely from what someone asked for is how people end up with
 * shoulders that only ever press and a back that never pulls. Each focused day
 * carries one balancing compound drawn from here, rotating so the week still
 * covers the major patterns even when the focus is narrow.
 */
const BALANCE_ROTATION = ["squat", "pullH", "pushH", "hinge", "pullV", "pushV"];

/**
 * Distributes the picked muscle groups across the training days.
 *
 * Groups that can anchor a day (chest, back, legs…) get one each, in order.
 * Isolation-only groups (biceps, calves, neck) ride along with an anchor rather
 * than owning a day, because three calf exercises is not a training session.
 * With more days than groups the list simply cycles, which is the desired
 * outcome: fewer targets means each one is trained more often.
 */
const RIDER_SESSIONS_PER_WEEK = 2;

function assignFocusDays(trainingDays, groups) {
  const anchors = groups.filter((g) => g.compound);
  const riders = groups.filter((g) => !g.compound);
  // No compound group picked at all (say, just biceps and abs): those groups
  // still need somewhere to live, so they anchor their own days.
  const anchorPool = anchors.length ? anchors : riders;
  const riderPool = anchors.length ? riders : [];

  const days = Array.from({ length: trainingDays }, (_, i) => [anchorPool[i % anchorPool.length]]);

  /*
   * Riders get roughly two sessions a week each, spread across the week —
   * not stapled to every single day. Cycling `i % riderPool.length` put the
   * one picked isolation group on all six days of a six-day week, which is
   * how you turn "I'd like bigger arms" into an elbow injury.
   */
  const slots = riderPool.flatMap((g) => Array(RIDER_SESSIONS_PER_WEEK).fill(g));
  slots.forEach((group, j) => {
    const dayIndex = Math.floor((j * trainingDays) / slots.length);
    const day = days[Math.min(dayIndex, trainingDays - 1)];
    if (!day.some((g) => g.id === group.id)) day.push(group);
  });

  return days;
}

/**
 * Training day indices, evenly spaced across the week.
 *
 * Spacing by proportion rather than "fill from the front" is what keeps four
 * sessions landing as Mon/Tue/Thu/Sat instead of Mon-Thu with a three-day
 * weekend of nothing.
 */
const trainingDayIndices = (trainingDays) =>
  new Set(Array.from({ length: trainingDays }, (_, i) => Math.floor((i * 7) / trainingDays)));

/**
 * A week built around the picked muscles instead of a fixed template.
 *
 * Rest days are spread by walking the week and placing a training day every
 * `gap` days, so four training days land as train/train/rest/train/train/rest
 * rather than four in a row followed by three off.
 */
export function buildFocusSplit(days, groups) {
  const trainingDays = Math.max(1, Math.min(6, days));
  const assignments = assignFocusDays(trainingDays, groups);
  const trainOn = trainingDayIndices(trainingDays);

  let placed = 0;
  return Array.from({ length: 7 }, (_, i) => {
    if (!trainOn.has(i)) return { day: `${i + 1}-kun`, label: "Dam olish" };

    const groupsForDay = assignments[placed];
    const slot = {
      day: `${i + 1}-kun`,
      label: groupsForDay.map((g) => g.label).join(" + "),
      focusIds: groupsForDay.map((g) => g.id),
      balance: BALANCE_ROTATION[placed % BALANCE_ROTATION.length],
    };
    placed += 1;
    return slot;
  });
}

/**
 * Movement patterns for a focused day: the picked groups' own patterns first,
 * then one balancing compound, then core as the tail filler.
 */
function focusDayTemplate(slot, groups) {
  const picked = slot.focusIds
    .map((id) => groups.find((g) => g.id === id))
    .filter(Boolean)
    .flatMap((g) => g.patterns);

  const main = [...new Set(picked)];
  /*
   * Walk the rotation for a compound the day does not already cover. Taking
   * `slot.balance` blindly meant a hinge-focused day whose balance slot was
   * also "hinge" simply lost it, and came out two exercises long.
   */
  const start = BALANCE_ROTATION.indexOf(slot.balance);
  for (let i = 0; i < BALANCE_ROTATION.length; i += 1) {
    const candidate = BALANCE_ROTATION[(start + i) % BALANCE_ROTATION.length];
    if (!main.includes(candidate)) {
      main.push(candidate);
      break;
    }
  }

  // Core is the default finisher, but not when the day already trains it —
  // "abs" as a focus plus "abs" as the accessory put the same exercise in the
  // list twice.
  const filler = main.includes("core") ? ["calves"] : ["core"];
  return { main, acc: [filler, filler] };
}

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
  focusMuscles = [],
}) {
  const rules = REP_RULES[goal] || REP_RULES.maintain;
  const injuryText = String(injuries || "").toLowerCase();
  const activeInjuries = INJURY_RULES.filter((r) => injuryText.includes(r.key));
  const avoidMap = {};
  activeInjuries.forEach((r) => r.avoid.forEach((p) => (avoidMap[p] = r.swapTo)));

  // Session length caps how many exercises fit.
  const maxExercises = duration === "30" ? 5 : duration === "90" ? 7 : 6;

  // A picked focus replaces the fixed template entirely: the days are named
  // after the muscles and built from their movement patterns. With nothing
  // picked this is exactly the plan the app produced before the picker existed.
  const groups = focusGroups(sanitizeFocus(focusMuscles));
  const focused = groups.length > 0;
  const split = focused ? buildFocusSplit(daysPerWeek, groups) : buildSplit(daysPerWeek);
  const seen = {};

  const days = split.map((slot) => {
    if (slot.label === "Dam olish") return { ...slot, rest: true, exercises: [] };

    /*
     * Counts how many times this day's *anchor* has come round, not the full
     * label — that is what rotates the exercise picked for a pattern.
     *
     * Keying on the label meant "Chest + Biceps" and "Chest" were different
     * days as far as the counter was concerned, so both opened with the same
     * bench press on consecutive days.
     */
    const rotationKey = slot.focusIds?.[0] || slot.label;
    const occurrence = seen[rotationKey] || 0;
    seen[rotationKey] = occurrence + 1;

    const template = focused
      ? focusDayTemplate(slot, groups)
      : DAY_PATTERNS[slot.label] || DAY_PATTERNS["Full Body"];

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

    /*
     * Two patterns can resolve to the same exercise — a deadlift covers both
     * the hinge focus and the hinge balance slot, and the sparse-equipment
     * fallback in `poolFor` can land two patterns on the same movement. Listing
     * it twice would have the trainee do it, rest, and do it again as if it
     * were something new.
     */
    const seenIds = new Set();
    const chosen = [...mainSlots, ...accSlots]
      .filter((s) => s.ex && !seenIds.has(s.ex.id) && seenIds.add(s.ex.id))
      .slice(0, maxExercises);

    const exercises = chosen.map(({ ex, adjusted, accessory }) => {
      const base = suggestedWeight(ex.id, { weightKg, level });
      const sets = setsFor(level, ex.type === "compound" && !accessory);
      const reps = accessory ? "10-15" : rules.reps;

      const progressed = progressWeight({
        exerciseId: ex.id,
        lastSets: lastSetsByExercise[ex.id],
        reps,
        topReps: rules.topReps,
        fallbackKg: base.suggestedWeightKg,
      });

      const topWeightKg = progressed.kg ?? base.suggestedWeightKg;

      return {
        id: ex.id,
        name: ex.name,
        nameEn: ex.nameEn,
        muscle: ex.muscle,
        sets,
        reps,
        rest: rules.rest,
        weightType: base.weightType,
        suggestedWeightKg: topWeightKg,
        // Each set spelled out, so the trainee is never left deciding what
        // "3×8-12" means in practice. Editable in the runner; this is the
        // default they start from.
        setPlan: buildSetPlan({ count: sets, reps, topWeightKg, weightType: base.weightType }),
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
    titleKey: "planTitle",
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
    focusMuscles: focused ? groups.map((g) => g.id) : null,
    cardio: cardioRecommendation({ goal, level, equipment }),
    days,
  };
}

/* -------------------------- cardio recommendation ------------------------ */

/**
 * How much cardio/HIIT a week to layer on top of the strength split, and how
 * hard.
 *
 * Deliberately advisory, not scheduled into a specific day: `days` above is
 * already the strength split, and activity logging (ActivitySheet) is
 * free-form by design — a session slotted into "day 3" would just get skipped
 * the moment a real week does not match the template. The frequency below is
 * a target for the week as a whole.
 *
 * The three goals pull in different directions on purpose:
 * - "lose" needs the extra deficit cardio buys, so it gets the most volume and
 *   a HIIT session for the higher afterburn.
 * - "maintain" gets enough for cardiovascular health without eating into
 *   recovery from the strength days.
 * - "gain" is deliberately light. Cardio competes with a surplus for calories
 *   and with strength work for recovery, so this is framed as heart health,
 *   not a fat-loss tool — pushing more here would work against the goal the
 *   trainee actually picked.
 */
const CARDIO_RULES = {
  lose: { sessionsPerWeek: 4, durationMin: 30, intensity: "vigorous", noteKey: "lose", includeHiit: true },
  maintain: { sessionsPerWeek: 2, durationMin: 25, intensity: "moderate", noteKey: "maintain", includeHiit: false },
  gain: { sessionsPerWeek: 1, durationMin: 20, intensity: "light", noteKey: "gain", includeHiit: false },
};

/** No-equipment options first — a cardio suggestion useless without a treadmill helps no one. */
const CARDIO_POOL = {
  "home-none": ["jump-rope", "hiit", "stairs", "running"],
  "home-dumbbell": ["jump-rope", "hiit", "running", "boxing"],
  gym: ["running", "cycling", "hiit", "swimming"],
  outdoor: ["running", "cycling", "hiking", "jump-rope"],
};

export function cardioRecommendation({ goal = "maintain", level = "beginner", equipment = "home-none" }) {
  const rules = CARDIO_RULES[goal] || CARDIO_RULES.maintain;
  const pool = CARDIO_POOL[equipment] || CARDIO_POOL["home-none"];

  // Beginners get one fewer session and a lighter step than the table above —
  // this is where cardio volume actually meets someone's current capacity;
  // the goal table only says how hard the *direction* should push.
  const sessionsPerWeek = level === "beginner" ? Math.max(1, rules.sessionsPerWeek - 1) : rules.sessionsPerWeek;
  const intensity = level === "beginner" && rules.intensity === "vigorous" ? "moderate" : rules.intensity;

  const activities = rules.includeHiit ? [...new Set(["hiit", ...pool])] : pool;

  return {
    sessionsPerWeek,
    durationMin: rules.durationMin,
    intensity,
    activities: activities.slice(0, 3),
    noteKey: rules.noteKey,
  };
}

/**
 * Day heading. Focused days carry their group ids so the name follows the
 * reader's language; plans generated before the picker existed only have the
 * stored label, which is what they fall back to.
 */
export function dayLabel(day, t) {
  if (day?.focusIds?.length) return focusLabel(day.focusIds, t);
  if (day?.rest) return t("workout.restDay");
  return day?.label || "";
}

export const isCompound = (exerciseId) => EX_BY_ID[exerciseId]?.type === "compound";

/**
 * Preview only — the stored figure is recomputed by the server (see
 * backend/src/lib/activities.js) so the two must agree. Net of the ~1 MET the
 * body spends anyway during those minutes, which the daily target already
 * covers.
 */
export function estimateSessionKcal(exercise, weightKg = 70) {
  const met = isCompound(exercise.id) ? 6 : 5;
  const minutes = (exercise.sets || 3) * 1.6;
  return Math.round(((met - 1) * 3.5 * weightKg) / 200 * minutes);
}
