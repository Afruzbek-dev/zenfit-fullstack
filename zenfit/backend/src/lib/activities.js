/**
 * Cardio / free-activity calorie model.
 *
 * MET values come from the Compendium of Physical Activities. Burn is the
 * standard formula:
 *
 *   kcal = MET × 3.5 × weightKg / 200 × minutes
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
  return Math.max(0, Math.round((met * 3.5 * weight) / 200 * durationMin));
}
