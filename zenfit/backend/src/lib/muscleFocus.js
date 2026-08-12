/**
 * Target muscle groups the workout split can be built around.
 *
 * Mirrors `frontend/src/data/muscleTargets.js` by hand — the two live in
 * separate packages with no shared build, the same arrangement as
 * `lib/goalPlan.js`. Adding a group there means adding its id here, or the
 * write silently drops it and the user's pick never sticks.
 *
 * Both write paths (onboarding and PATCH /profile) go through this file rather
 * than repeating the check, so the two cannot drift apart.
 */

const FOCUS_MUSCLE_IDS = new Set([
  "chest", "shoulders", "biceps", "abs", "quads", "neck",
  "back", "triceps", "glutes", "calves",
]);

/** Matches the picker's own cap; more than six targets is not a focus. */
const FOCUS_MAX = 6;

/**
 * Returns the column value for a submitted focus list: a JSON array, or null
 * for "no focus, build a balanced plan".
 *
 * An empty array is a real instruction — it is how someone goes back to
 * balanced after picking — so it clears the column rather than being treated
 * as "field not sent". Callers that must distinguish the two check
 * `Array.isArray` before calling.
 */
export function sanitizeFocusMuscles(input) {
  if (!Array.isArray(input)) return null;
  const ids = [...new Set(input.filter((id) => FOCUS_MUSCLE_IDS.has(id)))].slice(0, FOCUS_MAX);
  return ids.length ? JSON.stringify(ids) : null;
}
