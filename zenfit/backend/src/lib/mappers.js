import { parseJsonColumn } from "../db.js";

/** SQLite stores booleans as 0/1; Postgres returns real booleans. */
const bool = (v) => v === true || v === 1;

export function mapProfile(p) {
  if (!p) return null;
  const pantry = parseJsonColumn(p.pantry);
  const focusMuscles = parseJsonColumn(p.focus_muscles);
  return {
    gender: p.gender,
    age: p.age,
    heightCm: p.height_cm,
    weightKg: p.weight_kg,
    activityLevel: p.activity_level,
    goal: p.goal,
    dailyCalorieTarget: p.daily_calorie_target,
    carbsTargetG: p.carbs_target_g,
    proteinTargetG: p.protein_target_g,
    fatTargetG: p.fat_target_g,
    fitnessLevel: p.fitness_level,
    activeProgramId: p.active_program_id,
    equipment: p.equipment,
    daysPerWeek: p.days_per_week,
    sessionDuration: p.session_duration,
    injuries: p.injuries,
    waterTargetMl: p.water_target_ml ?? 2500,
    targetWeightKg: p.target_weight_kg,
    targetDate: p.target_date,
    targetPaceKgPerWeek: p.target_pace_kg_per_week,
    displayName: p.display_name,
    language: p.language || "uz",
    theme: p.theme || "dark",
    notifications: {
      workout: bool(p.notif_workout),
      meal: bool(p.notif_meal),
      water: bool(p.notif_water),
      tips: bool(p.notif_tips),
    },
    pregnant: bool(p.pregnant),
    // Always an array for the client, whether the column is null, malformed, or
    // somehow holds a non-array — the pantry UI maps over this on every render.
    pantry: Array.isArray(pantry) ? pantry : [],
    focusMuscles: Array.isArray(focusMuscles) ? focusMuscles : [],
    dietPrefs: parseJsonColumn(p.diet_prefs),
    neatConfirmed: bool(p.neat_confirmed),
    onboardingCompleted: bool(p.onboarding_completed),
  };
}

export function mapActivity(a) {
  return {
    id: a.id,
    activityId: a.activity_id,
    name: a.name,
    emoji: a.emoji,
    durationMin: a.duration_min,
    distanceKm: a.distance_km,
    intensity: a.intensity,
    kcal: a.kcal,
    note: a.note,
    loggedAt: a.logged_at,
  };
}

export function mapPayment(p) {
  return {
    id: p.id,
    provider: p.provider,
    planId: p.plan_id,
    planTitle: p.plan_title,
    amountUzs: p.amount_uzs,
    status: p.status,
    method: p.method || "provider",
    cardLast4: p.card_last4,
    // The receipt id itself is not useful to the client; only whether one exists.
    hasReceipt: Boolean(p.receipt_file_id),
    receiptNote: p.receipt_note,
    rejectReason: p.reject_reason,
    reviewedAt: p.reviewed_at,
    createdAt: p.created_at,
    paidAt: p.paid_at,
  };
}

export function mapCard(c) {
  return {
    id: c.id,
    provider: c.provider,
    brand: c.brand,
    last4: c.last4,
    expiry: c.expiry,
    isDefault: bool(c.is_default),
    createdAt: c.created_at,
  };
}

export function mapMeal(m) {
  return {
    id: m.id,
    name: m.name,
    emoji: m.emoji,
    kcal: m.kcal,
    carbs: m.carbs,
    protein: m.protein,
    fat: m.fat,
    portionG: m.portion_g,
    source: m.source,
    loggedAt: m.logged_at,
  };
}

export function mapWorkoutLog(w) {
  return {
    id: w.id,
    exerciseId: w.exercise_id,
    exerciseName: w.exercise_name,
    emoji: w.emoji,
    kcal: w.kcal,
    setsCompleted: w.sets_completed,
    planDay: w.plan_day,
    loggedAt: w.logged_at,
  };
}

export function mapExerciseSet(s) {
  return {
    id: s.id,
    exerciseId: s.exercise_id,
    exerciseName: s.exercise_name,
    setNumber: s.set_number,
    reps: s.reps,
    weightKg: s.weight_kg,
    loggedAt: s.logged_at,
  };
}

export function mapPlan(p) {
  if (!p) return null;
  return {
    id: p.id,
    planType: p.plan_type,
    plan: parseJsonColumn(p.plan_json),
    isActive: bool(p.is_active),
    createdAt: p.created_at,
  };
}

export function mapChatMessage(m) {
  return { id: m.id, role: m.role, content: m.content, createdAt: m.created_at };
}

export function mapCustomDietItem(i) {
  return {
    id: i.id,
    slotIndex: i.slot_index,
    foodId: i.food_id,
    name: i.name,
    emoji: i.emoji,
    portion: i.portion,
    kcal: i.kcal,
    carbs: i.carbs,
    protein: i.protein,
    fat: i.fat,
    createdAt: i.created_at,
  };
}

export function mapReferralSummary(row) {
  return {
    referredCount: Number(row?.count) || 0,
    rewardDaysEarned: Number(row?.reward_days) || 0,
  };
}

export function mapFriend(f) {
  return {
    id: f.id,
    firstName: f.first_name,
    username: f.username,
    avatarUrl: f.avatar_url,
    streak: f.streak || 0,
    isMyReferrer: Boolean(f.is_my_referrer),
  };
}

export function mapChallenge(c) {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    audience: c.audience,
    durationDays: c.duration_days,
    endsAt: c.ends_at,
    metric: c.metric || "active_days",
    goalTarget: c.goal_target == null ? null : Number(c.goal_target),
    // NULL on rows written before the column existed; every consumer treats
    // created_at as the start in that case.
    startsAt: c.starts_at || c.created_at,
    createdByUserId: c.created_by_user_id ?? null,
    createdAt: c.created_at,
  };
}

export function mapSubscription(s) {
  if (!s) return { plan: "free", status: "inactive", isPremium: false, trialUsed: false, trialOfferGranted: false };
  const active = s.status === "active" && (!s.expires_at || new Date(s.expires_at) > new Date());
  return {
    plan: s.plan,
    status: s.status,
    startedAt: s.started_at,
    expiresAt: s.expires_at,
    isPremium: active,
    trialUsed: Boolean(s.trial_used_at),
    trialOfferGranted: Boolean(s.trial_offer_granted_at),
  };
}
