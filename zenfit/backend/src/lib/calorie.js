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

/* ------------------------------------------------------------------ *
 * Medical guardrails
 *
 * Everything below is a refusal or a caution, never a lecture. The app is
 * used without a clinician anywhere in the loop, so the three states where
 * self-service calorie restriction does real harm — already underweight,
 * pregnant/breastfeeding, still a child — are the only ones gated. Every
 * other user walks the same path they always did.
 *
 * The gate lives here rather than in the routes so that no caller can
 * produce a deficit by accident: computeTargets() itself downgrades an
 * unsafe goal before it does any arithmetic. Routes layer an HTTP refusal
 * on top of that (see routes/onboarding.js) — the engine is the backstop,
 * not the error message.
 * ------------------------------------------------------------------ */

/** Shared by routes/onboarding.js and routes/profile.js so they cannot drift apart again. */
export const AGE_MIN = 12;
export const AGE_MAX = 100;

/**
 * A calorie deficit chosen by the user, for the user, with nobody checking:
 * that is the classic onset pattern for restrictive eating disorders, and the
 * risk is concentrated in adolescence. Maintenance and gain stay available
 * from AGE_MIN, because tracking food is not the harmful part — restricting is.
 */
export const LOSE_MIN_AGE = 18;

/** Above this the returned payload carries a caution flag; the formula is unchanged. */
export const SENIOR_AGE = 65;

/** WHO underweight threshold. Below it, losing weight is not a goal, it is a symptom. */
export const MIN_HEALTHY_BMI = 18.5;

/**
 * Pregnancy energy allowance.
 *
 * The requirement is not flat across gestation — roughly +0 in the first
 * trimester, +340 in the second, +450 in the third, and +330..400 while
 * exclusively breastfeeding (IOM/DRI). The app deliberately does not ask which
 * trimester (one more question in an onboarding flow people already abandon),
 * so one number has to stand for all of them. +340 is the middle figure: it is
 * the correct second-trimester value, slightly generous in the first, slightly
 * conservative in the third and during lactation. Erring low on a surplus is
 * the safer direction to be wrong in than erring high on a deficit, and the
 * shortfall in late pregnancy is ~110 kcal — inside the noise of self-reported
 * food logging.
 */
export const PREGNANCY_SURPLUS_KCAL = 340;

/**
 * Protein in pregnancy. The old RDA (0.88 g/kg) is now understood to be low;
 * stable-isotope work puts late-gestation requirements near 1.5 g/kg. 1.8 g/kg
 * clears that with margin and matches what this app already gives for a gain
 * phase, so a pregnant user is never handed less protein than a bulking one.
 */
export const PREGNANCY_PROTEIN_G_PER_KG = 1.8;

/** Absolute fallback for the exercise-credit cap when no TDEE is known. */
export const EXERCISE_CREDIT_FALLBACK_KCAL = 1500;

export function bmiFor({ heightCm, weightKg }) {
  if (!Number.isFinite(heightCm) || !Number.isFinite(weightKg) || heightCm <= 0) return null;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

/** The lightest weight that is still a healthy BMI at this height. */
export function minHealthyWeightKg(heightCm) {
  if (!Number.isFinite(heightCm) || heightCm <= 0) return null;
  const m = heightCm / 100;
  return Math.round(MIN_HEALTHY_BMI * m * m * 10) / 10;
}

/**
 * Decides which goal the user may actually be given, and why.
 *
 * Never throws and never returns nothing: an unsafe "lose" always comes back
 * downgraded to "maintain" with the reasons attached, so a caller that ignores
 * `blocked` still cannot hand out a deficit.
 *
 * @returns {{
 *   requestedGoal: string, goal: string, blocked: boolean, goalAdjusted: boolean,
 *   reasons: Array<{code: string, message: string}>,
 *   advisories: Array<{code: string, message: string}>,
 *   allowedGoals: string[], suggestedGoal: string,
 *   bmi: number|null, minHealthyWeightKg: number|null, pregnant: boolean
 * }}
 */
export function assessGoalSafety({ gender, age, heightCm, weightKg, goal, pregnant = false }) {
  const requestedGoal = goal === "lose" || goal === "gain" || goal === "maintain" ? goal : "maintain";
  const isPregnant = pregnant === true || pregnant === 1;
  const bmiRaw = bmiFor({ heightCm, weightKg });
  const floorKg = minHealthyWeightKg(heightCm);

  const reasons = [];
  const advisories = [];

  // Only the deficit path is ever refused. Maintenance and gain stay open to
  // everyone — a user who cannot be given "lose" must still have somewhere to go.
  if (requestedGoal === "lose") {
    if (isPregnant) {
      reasons.push({
        code: "lose_blocked_pregnancy",
        message:
          "Homiladorlik yoki emizish davrida vazn kamaytirish tavsiya etilmaydi. " +
          "«Saqlash» maqsadini tanlang — kunlik normangiz +340 kkal bilan hisoblanadi. " +
          "Aniq ko'rsatma uchun shifokoringiz bilan maslahatlashing.",
      });
    }
    // Strict `<`: exactly 18.5 is not underweight.
    if (bmiRaw !== null && bmiRaw < MIN_HEALTHY_BMI - 1e-9) {
      reasons.push({
        code: "lose_blocked_underweight",
        message:
          `Tana vazni indeksingiz ${Math.round(bmiRaw * 10) / 10} — bu me'yordan past (18.5 dan kam). ` +
          "Vazn kamaytirish rejasi sog'ligingizga zarar yetkazishi mumkin, shuning uchun uni yoqmaymiz. " +
          "«Saqlash» yoki «Vazn olish» maqsadini tanlang, yoki shifokorga murojaat qiling.",
      });
    }
    if (Number.isFinite(age) && age < LOSE_MIN_AGE) {
      reasons.push({
        code: "lose_blocked_minor",
        message:
          "18 yoshgacha kaloriya cheklovini ilova orqali mustaqil belgilash tavsiya etilmaydi. " +
          "«Saqlash» maqsadini tanlang — ovqatlanish va mashg'ulotlarni kuzatib borishingiz mumkin. " +
          "Vazn kamaytirish kerak bo'lsa, shifokor yoki nutritsiolog bilan maslahatlashing.",
      });
    }
  }

  /* ----- cautions: shown, never enforced ------------------------------- */
  if (isPregnant && requestedGoal !== "lose") {
    advisories.push({
      code: "pregnancy_surplus_applied",
      message: `Homiladorlik uchun kunlik normaga +${PREGNANCY_SURPLUS_KCAL} kkal qo'shildi (2-trimestr me'yori) va oqsil oshirildi.`,
    });
  }
  if (Number.isFinite(age) && age < LOSE_MIN_AGE) {
    // Mifflin-St Jeor was derived on adults; see calculateBMR().
    advisories.push({
      code: "age_minor_estimate",
      message: "18 yoshgacha bo'lganlar uchun hisob-kitob taxminiy. Ko'rsatkichlarni shifokor bilan tekshiring.",
    });
  }
  if (Number.isFinite(age) && age >= SENIOR_AGE) {
    advisories.push({
      code: "age_senior_caution",
      message:
        "65 yoshdan keyin kaloriya va oqsil me'yorlari taxminiy bo'ladi. " +
        "Yangi ovqatlanish yoki mashg'ulot rejasini boshlashdan oldin shifokor bilan maslahatlashing.",
    });
  }

  const blocked = reasons.length > 0;
  const allowedGoals = ["maintain", "gain"];
  if (!blocked || requestedGoal !== "lose") allowedGoals.unshift("lose");

  return {
    requestedGoal,
    goal: blocked ? "maintain" : requestedGoal,
    blocked,
    goalAdjusted: blocked,
    reasons,
    advisories,
    allowedGoals: [...new Set(allowedGoals)],
    suggestedGoal: "maintain",
    bmi: bmiRaw === null ? null : Math.round(bmiRaw * 10) / 10,
    minHealthyWeightKg: floorKg,
    pregnant: isPregnant,
  };
}

export function calculateBMR({ gender, age, heightCm, weightKg }) {
  // Mifflin-St Jeor — zamonaviy fitnes ilovalarida standart formula,
  // Harris-Benedict'ga qaraganda aniqroq hisoblanadi.
  //
  // NOTE: the equation was derived and validated on adults (18+). For an
  // under-18 user it is an approximation — growth raises resting expenditure
  // in a way the linear age term does not model, so the figure tends to run
  // low for adolescents. Nothing here corrects for that; the payload carries
  // an `age_minor_estimate` advisory instead (see assessGoalSafety), and the
  // deficit path is closed to minors entirely, which is where being wrong
  // would actually matter.
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === "female" ? base - 161 : base + 5;
}

/**
 * @param {{gender:'male'|'female', age:number, heightCm:number, weightKg:number,
 *          activityLevel: keyof typeof ACTIVITY_MULTIPLIERS, goal:'lose'|'maintain'|'gain',
 *          pregnant?: boolean}} input
 */
export function computeTargets({ gender, age, heightCm, weightKg, activityLevel, goal, pregnant = false }) {
  const safety = assessGoalSafety({ gender, age, heightCm, weightKg, goal, pregnant });
  // From here on the *effective* goal is used, never the requested one.
  const effectiveGoal = safety.goal;
  const isPregnant = safety.pregnant;

  const bmr = calculateBMR({ gender, age, heightCm, weightKg });
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.light;
  const tdee = bmr * multiplier;

  // Macros are anchored to bodyweight, but a very overweight user should not be
  // asked to eat protein for fat mass — so the reference is capped at what they
  // would weigh at BMI 25.
  //
  // In pregnancy the cap is left in place even though gestational weight gain
  // pushes BMI up: it only ever lowers the reference, and the coefficient below
  // is raised enough that the result still clears the requirement.
  const heightM = heightCm / 100;
  const refKg = Math.min(weightKg, 25 * heightM * heightM);

  let target;
  if (effectiveGoal === "lose") {
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
  } else if (effectiveGoal === "gain") {
    target = tdee + 400; // muskul massasi uchun mo''tadil ortiqcha
  } else {
    target = tdee;
  }

  // Pregnancy sets a floor on the surplus rather than stacking on top of one:
  // a pregnant user on "gain" already gets +400, which is above the allowance,
  // so the two are not added together.
  if (isPregnant) target = Math.max(target, tdee + PREGNANCY_SURPLUS_KCAL);

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
  let proteinPerKg = effectiveGoal === "lose" ? 2.0 : effectiveGoal === "gain" ? 1.8 : 1.6;
  if (isPregnant) proteinPerKg = Math.max(proteinPerKg, PREGNANCY_PROTEIN_G_PER_KG);

  const proteinTargetG = Math.round(refKg * proteinPerKg);
  const fatTargetG = Math.max(Math.round(refKg * 0.8), Math.round((target * 0.2) / 9));
  const carbsTargetG = Math.max(0, Math.round((target - proteinTargetG * 4 - fatTargetG * 9) / 4));

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    dailyCalorieTarget: target,
    carbsTargetG,
    proteinTargetG,
    fatTargetG,
    // The goal that was actually used, plus why it may differ from the request.
    goal: effectiveGoal,
    safety,
  };
}

/**
 * How much logged exercise a day is allowed to add back to the budget.
 *
 * One activity entry accepts up to 600 minutes, so boxing at MET 12.8 credits
 * an 80 kg user ~9,900 kcal — which the dashboard then presents as food they
 * are free to eat. Even without a typo, the failure mode of over-crediting is
 * "eat more"; the failure mode of under-crediting is "eat slightly less than
 * you could have", and only one of those is worth defending against.
 *
 * The cap is the user's own TDEE: nobody may claim to have burned, on top of
 * living, more than a second full day of living. That still clears a marathon
 * (~2,600 kcal net at 70 kg) for most users and clips only the absurd.
 *
 * @param {number} rawKcal  summed credit before capping
 * @param {{tdee?: number}} ctx
 * @returns {{kcal: number, rawKcal: number, cap: number, capped: boolean}}
 */
export function capExerciseCredit(rawKcal, { tdee } = {}) {
  const raw = Number.isFinite(rawKcal) && rawKcal > 0 ? Math.round(rawKcal) : 0;
  const cap = Number.isFinite(tdee) && tdee > 0 ? Math.round(tdee) : EXERCISE_CREDIT_FALLBACK_KCAL;
  return { kcal: Math.min(raw, cap), rawKcal: raw, cap, capped: raw > cap };
}

/**
 * TDEE from a stored profile row, for callers that only have the row and need
 * the exercise-credit cap (see capExerciseCredit). Falls back to null when the
 * profile is incomplete, which makes capExerciseCredit use its flat fallback.
 */
export function tdeeFromProfileRow(p) {
  if (!p) return null;
  const age = Number(p.age);
  const heightCm = Number(p.height_cm);
  const weightKg = Number(p.weight_kg);
  if (!Number.isFinite(age) || !Number.isFinite(heightCm) || !Number.isFinite(weightKg)) return null;
  const bmr = calculateBMR({ gender: p.gender, age, heightCm, weightKg });
  return bmr * (ACTIVITY_MULTIPLIERS[p.activity_level] || ACTIVITY_MULTIPLIERS.light);
}
