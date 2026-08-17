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
 * The gate lives here rather than in the routes so that no caller can produce
 * a deficit by accident: computeTargets() itself downgrades an unsafe goal
 * before it does any arithmetic. The routes do not refuse the request on top
 * of that — they store the downgraded goal and return `safety` so the client
 * can say what changed and why (see routes/onboarding.js and routes/profile.js).
 * A 400 would leave the user on a screen offering only the choice just
 * rejected; the explanation is the useful half of a refusal, the dead end is not.
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

/**
 * How many times the user's own TDEE a single day of logged exercise may add
 * back to the budget.
 *
 * A flat 1.0× was the first attempt and it was too tight: a 70 kg user on a
 * light NEAT level has a TDEE of 2168, and a marathon nets around 2600, so the
 * cap silently ate 430 kcal off a real one. 1.5× clears a marathon for every
 * bodyweight in range — including a 45 kg woman, whose cap lands at ~2040
 * against a net cost near 1400 — while still cutting the 600-minute MET-12.8
 * typo from 9,900 to about 3,200.
 */
export const EXERCISE_CREDIT_TDEE_MULTIPLE = 1.5;

/**
 * Absolute ceiling, applied on top of the multiple.
 *
 * The multiple alone scales badly at the top end: a 120 kg very-active user has
 * a TDEE near 4,000, so 1.5× let the same typo through at 6,000 — a claimed
 * 10,000 kcal day. This clamps that to 4,000, which is still above what any
 * marathon in the range above costs (the heaviest case nets ~3,200), so it
 * binds on data-entry errors and on nothing a recreational user actually did.
 */
export const EXERCISE_CREDIT_MAX_KCAL = 4000;

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
 * Every reason and advisory carries a stable `code`, an Uzbek `message` and the
 * numbers that message quotes in `vars`. The client translates by code and
 * interpolates `vars`, falling back to `message` when it has no string for that
 * code — so a new code reaches the user as a real sentence on the day it ships,
 * and no figure has to be duplicated into three dictionaries where it could drift.
 *
 * @returns {{
 *   requestedGoal: string, goal: string, blocked: boolean, goalAdjusted: boolean,
 *   reasons: Array<{code: string, message: string, vars?: object}>,
 *   advisories: Array<{code: string, message: string, vars?: object}>,
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
          `Kunlik normangiz +${PREGNANCY_SURPLUS_KCAL} kkal bilan hisoblanadi. ` +
          "Aniq ko'rsatma uchun shifokoringiz bilan maslahatlashing.",
        // This reason is the only place the surplus gets mentioned when the
        // request was "lose" — the pregnancy_surplus_applied advisory is
        // suppressed in that case to avoid saying it twice.
        vars: { kcal: PREGNANCY_SURPLUS_KCAL },
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
        vars: { bmi: Math.round(bmiRaw * 10) / 10, minBmi: MIN_HEALTHY_BMI, minKg: floorKg },
      });
    }
    if (Number.isFinite(age) && age < LOSE_MIN_AGE) {
      reasons.push({
        code: "lose_blocked_minor",
        message:
          "18 yoshgacha kaloriya cheklovini ilova orqali mustaqil belgilash tavsiya etilmaydi. " +
          "«Saqlash» maqsadini tanlang — ovqatlanish va mashg'ulotlarni kuzatib borishingiz mumkin. " +
          "Vazn kamaytirish kerak bo'lsa, shifokor yoki nutritsiolog bilan maslahatlashing.",
        vars: { minAge: LOSE_MIN_AGE },
      });
    }
  }

  /* ----- cautions: shown, never enforced ------------------------------- */
  if (isPregnant && requestedGoal !== "lose") {
    advisories.push({
      code: "pregnancy_surplus_applied",
      message: `Homiladorlik uchun kunlik normaga +${PREGNANCY_SURPLUS_KCAL} kkal qo'shildi (2-trimestr me'yori) va oqsil oshirildi.`,
      vars: { kcal: PREGNANCY_SURPLUS_KCAL, proteinPerKg: PREGNANCY_PROTEIN_G_PER_KG },
    });
  }
  if (Number.isFinite(age) && age < LOSE_MIN_AGE) {
    // Mifflin-St Jeor was derived on adults; see calculateBMR().
    advisories.push({
      code: "age_minor_estimate",
      message: "18 yoshgacha bo'lganlar uchun hisob-kitob taxminiy. Ko'rsatkichlarni shifokor bilan tekshiring.",
      vars: { minAge: LOSE_MIN_AGE },
    });
  }
  if (Number.isFinite(age) && age >= SENIOR_AGE) {
    advisories.push({
      code: "age_senior_caution",
      message:
        "65 yoshdan keyin kaloriya va oqsil me'yorlari taxminiy bo'ladi. " +
        "Yangi ovqatlanish yoki mashg'ulot rejasini boshlashdan oldin shifokor bilan maslahatlashing.",
      vars: { age: SENIOR_AGE },
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
 * kcal per kg of bodyweight change per week, from the standard ~7700 kcal/kg
 * energy-density assumption spread over 7 days. Turns a chosen weekly rate
 * (lib/goalPlan.js's rateForWeeks/estimateGoalAtRate) into a daily
 * deficit/surplus, in the same units the flat 500/400 figures below were.
 */
const RATE_KCAL_PER_KG = 1100;

/**
 * @param {{gender:'male'|'female', age:number, heightCm:number, weightKg:number,
 *          activityLevel: keyof typeof ACTIVITY_MULTIPLIERS, goal:'lose'|'maintain'|'gain',
 *          pregnant?: boolean, weeklyRateKg?: number}} input
 *          weeklyRateKg: when the user picked their own pace instead of the
 *          default, the deficit/surplus below scales to match it rather than
 *          using the flat figure. Omit to keep today's behaviour exactly.
 */
export function computeTargets({ gender, age, heightCm, weightKg, activityLevel, goal, pregnant = false, weeklyRateKg }) {
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

  const hasCustomRate = Number.isFinite(weeklyRateKg) && weeklyRateKg > 0;

  let target;
  if (effectiveGoal === "lose") {
    /*
     * Four floors, whichever binds hardest:
     *   - a flat 500 kcal cut is the starting point (or, with a chosen pace,
     *     that pace's own deficit — still just the starting point);
     *   - 1200 (women) / 1500 (men) as an absolute minimum. The old code used
     *     1200 for both, which is the female figure;
     *   - the user's own BMR. A 62 kg man used to be handed 1345 kcal against a
     *     BMR of 1537 — a target below the energy his body burns at rest;
     *   - 75% of TDEE, so the deficit scales with body size. A flat 500 is 14%
     *     of a large man's TDEE but 36% of a small woman's.
     * A faster chosen pace cannot push below these — it just narrows the gap
     * to whichever floor was already binding.
     */
    const dailyDeficit = hasCustomRate ? weeklyRateKg * RATE_KCAL_PER_KG : 500;
    const absoluteFloor = gender === "female" ? 1200 : 1500;
    target = Math.max(tdee - dailyDeficit, absoluteFloor, bmr, tdee * 0.75);
  } else if (effectiveGoal === "gain") {
    // muskul massasi uchun mo''tadil ortiqcha — yoki tanlangan sur'atga mos ortiqcha
    const dailySurplus = hasCustomRate ? weeklyRateKg * RATE_KCAL_PER_KG : 400;
    target = tdee + dailySurplus;
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
 * The cap is a multiple of the user's own TDEE rather than a flat number, so it
 * scales with body size the way the effort does — see
 * EXERCISE_CREDIT_TDEE_MULTIPLE for why the multiple is 1.5 and not 1.
 *
 * When the profile is too incomplete to have a TDEE the flat fallback applies.
 * That one CAN clip a genuine endurance day, and is left tight on purpose: a
 * user with no age, height or weight on file has no real calorie target either,
 * so the credit is being subtracted from a guess in the first place.
 *
 * @param {number} rawKcal  summed credit before capping
 * @param {{tdee?: number}} ctx
 * @returns {{kcal: number, rawKcal: number, cap: number, capped: boolean}}
 */
export function capExerciseCredit(rawKcal, { tdee } = {}) {
  const raw = Number.isFinite(rawKcal) && rawKcal > 0 ? Math.round(rawKcal) : 0;
  const cap =
    Number.isFinite(tdee) && tdee > 0
      ? Math.min(Math.round(tdee * EXERCISE_CREDIT_TDEE_MULTIPLE), EXERCISE_CREDIT_MAX_KCAL)
      : EXERCISE_CREDIT_FALLBACK_KCAL;
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
