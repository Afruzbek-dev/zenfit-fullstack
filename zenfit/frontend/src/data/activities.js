/**
 * Activity catalogue for the logging sheet.
 *
 * The MET numbers mirror backend/src/lib/activities.js so the sheet can show a
 * live calorie estimate while the user adjusts duration. The server recomputes
 * the value on save and that figure is the one stored — this table only drives
 * the preview.
 */

export const ACTIVITIES = [
  { id: "running", emoji: "🏃", distance: true },
  { id: "walking", emoji: "🚶", distance: true },
  { id: "cycling", emoji: "🚴", distance: true },
  { id: "swimming", emoji: "🏊" },
  { id: "jump-rope", emoji: "🪢" },
  { id: "hiit", emoji: "🔥" },
  { id: "gym", emoji: "🏋️" },
  { id: "football", emoji: "⚽" },
  { id: "basketball", emoji: "🏀" },
  { id: "tennis", emoji: "🎾" },
  { id: "volleyball", emoji: "🏐" },
  { id: "boxing", emoji: "🥊" },
  { id: "dancing", emoji: "💃" },
  { id: "hiking", emoji: "🥾" },
  { id: "stairs", emoji: "🪜" },
  { id: "yoga", emoji: "🧘" },
  { id: "stretching", emoji: "🤸" },
  { id: "custom", emoji: "✨" },
];

export const ACTIVITY_BY_ID = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a]));

const METS = {
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

function metFor(activityId, intensity, durationMin, distanceKm) {
  const row = METS[activityId] || METS.custom;
  const byIntensity = row[Math.max(0, INTENSITIES.indexOf(intensity))] ?? row[1];

  if (!distanceKm || !durationMin || !["running", "walking", "cycling"].includes(activityId)) return byIntensity;

  const kmh = distanceKm / (durationMin / 60);
  if (activityId === "running") {
    if (kmh < 7) return 6.5;
    if (kmh < 8.5) return 8.3;
    if (kmh < 10.5) return 9.8;
    if (kmh < 12) return 11.0;
    return 12.8;
  }
  if (activityId === "walking") {
    if (kmh < 4) return 2.8;
    if (kmh < 5.5) return 3.5;
    if (kmh < 6.5) return 5.0;
    return 6.3;
  }
  if (kmh < 16) return 4.0;
  if (kmh < 20) return 6.8;
  if (kmh < 25) return 8.0;
  return 10.0;
}

export function estimateKcal({ activityId, intensity, durationMin, distanceKm, weightKg }) {
  const weight = Number(weightKg) > 0 ? Number(weightKg) : 70;
  const met = metFor(activityId, intensity, durationMin, distanceKm);
  return Math.max(0, Math.round(((met * 3.5 * weight) / 200) * durationMin));
}
