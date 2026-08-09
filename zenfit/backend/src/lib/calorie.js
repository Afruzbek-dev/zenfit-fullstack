/**
 * These describe daily life WITHOUT training — the job, the walking, the
 * housework. Training is not in here on purpose.
 *
 * The familiar Harris-Benedict ladder (1.2 … 1.9) bakes workouts into the
 * multiplier: 1.55 literally means "moderate exercise 3-5 days a week". This
 * app also logs every session and credits it back to the daily budget, so
 * using that ladder paid for the same workout twice — once in the target and
 * again when it was logged. A user training five times a week could be handed
 * ~700 phantom kcal before eating anything.
 *
 * So the base is now occupational/NEAT only and the top of the ladder is
 * correspondingly lower; what a session costs arrives from lib/activities.js
 * when it actually happens.
 */
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,     // ofis ishi, kuniga ~5000 qadamdan kam
  light: 1.3,         // qisman oyoqda, kuniga 5-8 ming qadam
  moderate: 1.45,     // kun bo'yi yurish — sotuvchi, kuryer, o'qituvchi
  active: 1.6,        // jismoniy ish — quruvchi, omborchi
  very_active: 1.75,  // og'ir jismoniy mehnat, kun bo'yi yuk ko'tarish
};

export function calculateBMR({ gender, age, heightCm, weightKg }) {
  // Mifflin-St Jeor — zamonaviy fitnes ilovalarida standart formula,
  // Harris-Benedict'ga qaraganda aniqroq hisoblanadi.
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "female" ? base - 161 : base + 5;
}

/**
 * @param {{gender:'male'|'female', age:number, heightCm:number, weightKg:number,
 *          activityLevel: keyof typeof ACTIVITY_MULTIPLIERS, goal:'lose'|'maintain'|'gain'}} input
 */
export function computeTargets({ gender, age, heightCm, weightKg, activityLevel, goal }) {
  const bmr = calculateBMR({ gender, age, heightCm, weightKg });
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.light;
  const tdee = bmr * multiplier;

  // Macros are anchored to bodyweight, but a very overweight user should not be
  // asked to eat protein for fat mass — so the reference is capped at what they
  // would weigh at BMI 25.
  const heightM = heightCm / 100;
  const refKg = Math.min(weightKg, 25 * heightM * heightM);

  let target;
  if (goal === "lose") {
    /*
     * Four floors, whichever binds hardest:
     *   - a flat 500 kcal cut is the starting point;
     *   - 1200 (women) / 1500 (men) as an absolute minimum. The old code used
     *     1200 for both, which is the female figure;
     *   - the user's own BMR. A 62 kg man used to be handed 1345 kcal against a
     *     BMR of 1537 — a target below the energy his body burns at rest;
     *   - 75% of TDEE, so the deficit scales with body size. A flat 500 is 14%
     *     of a large man's TDEE but 36% of a small woman's.
     */
    const absoluteFloor = gender === "female" ? 1200 : 1500;
    target = Math.max(tdee - 500, absoluteFloor, bmr, tdee * 0.75);
  } else if (goal === "gain") {
    target = tdee + 400; // muskul massasi uchun mo''tadil ortiqcha
  } else {
    target = tdee;
  }

  target = Math.round(target);

  /*
   * Protein per kilogram, not as a share of calories.
   *
   * Deriving grams from the calorie target meant cutting calories also cut
   * protein: the same 70 kg woman got 128 g to maintain but only 105 g to lose,
   * which is backwards — a deficit is exactly when lean mass needs protecting,
   * and 1.5 g/kg is below the 1.6-2.2 g/kg range the evidence supports.
   *
   * Fat gets a real minimum (0.8 g/kg) rather than an incidental one, since
   * hormone production and fat-soluble vitamin absorption depend on it.
   * Carbohydrate takes whatever energy is left.
   */
  const proteinTargetG = Math.round(refKg * (goal === "lose" ? 2.0 : goal === "gain" ? 1.8 : 1.6));
  const fatTargetG = Math.max(Math.round(refKg * 0.8), Math.round((target * 0.2) / 9));
  const carbsTargetG = Math.max(0, Math.round((target - proteinTargetG * 4 - fatTargetG * 9) / 4));

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    dailyCalorieTarget: target,
    carbsTargetG,
    proteinTargetG,
    fatTargetG,
  };
}
