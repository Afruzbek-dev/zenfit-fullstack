const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,     // deyarli harakatsiz, ofis ishi
  light: 1.375,       // haftasiga 1-3 marta yengil mashq
  moderate: 1.55,     // haftasiga 3-5 marta mashq
  active: 1.725,      // haftasiga 6-7 marta mashq
  very_active: 1.9,   // fizik og'ir ish + kundalik mashq
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
