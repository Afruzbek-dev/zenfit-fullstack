/**
 * Target muscle groups.
 *
 * The picker's vocabulary is anatomical ("chest", "biceps") because that is how
 * someone thinks about what they want to grow. The plan engine's vocabulary is
 * movement patterns ("pushH", "biceps") because that is how exercises are
 * classified. This file is the translation layer between the two, and it is the
 * only place that mapping lives.
 *
 * `patterns` is ordered: the first entry is the group's main movement, and the
 * split builder leads a focused day with it. `compound` marks groups that can
 * anchor a training day on their own — you can build a session around chest or
 * back, but a day built only around calves is not a session.
 */

export const MUSCLE_GROUPS = [
  {
    id: "chest",
    side: "front",
    label: "Ko'krak",
    patterns: ["pushH"],
    compound: true,
  },
  {
    id: "shoulders",
    side: "front",
    label: "Yelka",
    patterns: ["pushV", "delts"],
    compound: true,
  },
  {
    id: "biceps",
    side: "front",
    label: "Bitsep",
    patterns: ["biceps"],
    compound: false,
  },
  {
    id: "abs",
    side: "front",
    label: "Qorin",
    patterns: ["core"],
    compound: false,
  },
  {
    id: "quads",
    side: "front",
    label: "Oyoq (old)",
    patterns: ["squat"],
    compound: true,
  },
  {
    id: "neck",
    side: "front",
    label: "Bo'yin",
    patterns: ["traps"],
    compound: false,
  },
  {
    id: "back",
    side: "back",
    label: "Orqa",
    patterns: ["pullH", "pullV"],
    compound: true,
  },
  {
    id: "triceps",
    side: "back",
    label: "Trisep",
    patterns: ["triceps"],
    compound: false,
  },
  {
    id: "glutes",
    side: "back",
    label: "Dumba, son orqasi",
    patterns: ["hinge"],
    compound: true,
  },
  {
    id: "calves",
    side: "back",
    label: "Boldir",
    patterns: ["calves"],
    compound: false,
  },
];

export const GROUP_BY_ID = Object.fromEntries(MUSCLE_GROUPS.map((g) => [g.id, g]));

export const groupsForSide = (side) => MUSCLE_GROUPS.filter((g) => g.side === side);

/** Ids the picker offers, used to drop anything stale coming back from storage. */
export const VALID_GROUP_IDS = new Set(MUSCLE_GROUPS.map((g) => g.id));

export const sanitizeFocus = (ids) =>
  Array.isArray(ids) ? [...new Set(ids.filter((id) => VALID_GROUP_IDS.has(id)))] : [];

/** Every movement pattern the picked groups cover, in picker order. */
export function focusPatterns(ids) {
  const out = [];
  for (const g of MUSCLE_GROUPS) {
    if (!ids?.includes(g.id)) continue;
    for (const p of g.patterns) if (!out.includes(p)) out.push(p);
  }
  return out;
}

/**
 * The groups a day should be built around, biggest first.
 *
 * A day needs an anchor that can carry compound work; isolation-only groups
 * (biceps, calves, neck) ride along with one rather than owning a day. Sorting
 * compounds first means `buildFocusSplit` can pair them off in order and every
 * day ends up with something substantial in it.
 */
export function focusGroups(ids) {
  const picked = MUSCLE_GROUPS.filter((g) => ids?.includes(g.id));
  return [...picked].sort((a, b) => Number(b.compound) - Number(a.compound));
}

export const focusLabel = (ids, t) =>
  (ids || [])
    .map((id) => (t ? t(`muscles.${id}`) : GROUP_BY_ID[id]?.label))
    .filter(Boolean)
    .join(" + ");
