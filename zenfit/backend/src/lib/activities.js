/**
 * Cardio / free-activity calorie model.
 *
 * MET values come from the Compendium of Physical Activities. The textbook
 * formula is
 *
 *   gross = MET × 3.5 × weightKg / 200 × minutes
 *
 * but what this module returns is the NET figure:
 *
 *   net = (MET − 1) × 3.5 × weightKg / 200 × minutes
 *
 * The 1 MET removed is the energy the body spends merely existing during those
 * minutes. That share is already paid for by the daily target, which is built
 * on BMR — so crediting the gross number back would count resting metabolism
 * twice. The error is worst exactly where people log the most minutes: an hour
 * of walking at MET 3.5 is 29% too generous gross, an easy run about 10%.
 *
 * The client never sends a calorie figure — it is always computed here from
 * (activity, intensity, duration, bodyweight), so the number cannot be forged
 * and stays consistent if the table is ever tuned.
 */

/** MET per activity at [light, moderate, vigorous] intensity. */
export const ACTIVITY_METS = {
  walking: [2.8, 3.5, 5.0],
  running: [7.0, 9.8, 11.8],
  cycling: [4.0, 8.0, 10.0],
  swimming: [5.8, 8.3, 10.0],
  "jump-rope": [8.8, 11.8, 12.3],
  hiit: [6.0, 8.5, 12.0],
  football: [7.0, 8.5, 10.0],
  basketball: [6.0, 8.0, 9.3],
  tennis: [5.0, 7.3, 8.0],
  volleyball: [3.5, 4.5, 6.0],
  boxing: [5.5, 7.8, 12.8],
  dancing: [4.5, 6.5, 7.8],
  yoga: [2.5, 3.0, 4.0],
  stretching: [2.3, 2.8, 3.5],
  stairs: [4.0, 6.0, 8.8],
  hiking: [5.3, 6.0, 7.8],
  gym: [3.5, 5.0, 6.0],
  custom: [3.5, 5.5, 7.5],
};

export const INTENSITIES = ["light", "moderate", "vigorous"];

export const isKnownActivity = (id) => Object.hasOwn(ACTIVITY_METS, id);

/** Distance-aware for running and walking: pace beats a self-reported guess. */
function metFor(activityId, intensity, durationMin, distanceKm) {
  const row = ACTIVITY_METS[activityId] || ACTIVITY_METS.custom;
  const byIntensity = row[Math.max(0, INTENSITIES.indexOf(intensity))] ?? row[1];

  if (!distanceKm || !durationMin || !["running", "walking", "cycling"].includes(activityId)) {
    return byIntensity;
  }

  const kmh = distanceKm / (durationMin / 60);
  if (activityId === "running") {
    if (kmh < 7) return 6.5;
    if (kmh < 8.5) return 8.3;
    if (kmh < 10.5) return 9.8; // the compendium puts 10 km/h at 9.8 exactly
    if (kmh < 12) return 11.0;
    return 12.8;
  }
  if (activityId === "walking") {
    if (kmh < 4) return 2.8;
    if (kmh < 5.5) return 3.5;
    if (kmh < 6.5) return 5.0;
    return 6.3;
  }
  if (kmh < 16) return 4.0; // cycling
  if (kmh < 20) return 6.8;
  if (kmh < 25) return 8.0;
  return 10.0;
}

export function computeActivityKcal({ activityId, intensity, durationMin, distanceKm, weightKg }) {
  const weight = Number.isFinite(weightKg) && weightKg > 0 ? weightKg : 70;
  const met = metFor(activityId, intensity, durationMin, distanceKm);
  return netKcal(met, weight, durationMin);
}

/** Shared by cardio and strength so both credit the same kind of calorie. */
export function netKcal(met, weightKg, durationMin) {
  return Math.max(0, Math.round((Math.max(0, met - 1) * 3.5 * weightKg) / 200 * durationMin));
}

/**
 * Strength work, computed from the sets actually completed.
 *
 * The compendium puts resistance training at 5.0 MET for a normal session and
 * 6.0 for a hard one; compound lifts move more mass, so they take the higher
 * figure. ~1.6 minutes per set covers the set itself plus the rest that
 * follows it, which is where most of a session's clock actually goes.
 */
export function computeStrengthKcal({ setsCompleted, compound, weightKg }) {
  const weight = Number.isFinite(weightKg) && weightKg > 0 ? weightKg : 70;
  const sets = Number.isFinite(setsCompleted) && setsCompleted > 0 ? Math.min(setsCompleted, 20) : 3;
  return netKcal(compound ? 6.0 : 5.0, weight, sets * 1.6);
}
