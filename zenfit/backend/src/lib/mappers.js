import { parseJsonColumn } from "../db.js";

/** SQLite stores booleans as 0/1; Postgres returns real booleans. */
const bool = (v) => v === true || v === 1;

export function mapProfile(p) {
  if (!p) return null;
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
    onboardingCompleted: bool(p.onboarding_completed),
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

export function mapSubscription(s) {
  if (!s) return { plan: "free", status: "inactive", isPremium: false };
  const active = s.status === "active" && (!s.expires_at || new Date(s.expires_at) > new Date());
  return {
    plan: s.plan,
    status: s.status,
    startedAt: s.started_at,
    expiresAt: s.expires_at,
    isPremium: active,
  };
}
