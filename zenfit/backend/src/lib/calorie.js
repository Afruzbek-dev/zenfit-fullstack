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

  let target;
  let macroSplit; // fraction of total kcal
  if (goal === "lose") {
    target = Math.max(1200, tdee - 500); // ~0.5 kg/hafta arıqlash uchun tipik defitsit
    macroSplit = { carbs: 0.35, protein: 0.35, fat: 0.3 };
  } else if (goal === "gain") {
    target = tdee + 400; // muskul massasi uchun mo''tadil ortiqcha
    macroSplit = { carbs: 0.45, protein: 0.25, fat: 0.3 };
  } else {
    target = tdee;
    macroSplit = { carbs: 0.4, protein: 0.3, fat: 0.3 };
  }

  target = Math.round(target);
  const carbsTargetG = Math.round((target * macroSplit.carbs) / 4); // 4 kcal/g
  const proteinTargetG = Math.round((target * macroSplit.protein) / 4); // 4 kcal/g
  const fatTargetG = Math.round((target * macroSplit.fat) / 9); // 9 kcal/g

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    dailyCalorieTarget: target,
    carbsTargetG,
    proteinTargetG,
    fatTargetG,
  };
}
