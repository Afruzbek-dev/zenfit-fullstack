/**
 * "Is this food right for me, right now?" — as a percentage.
 *
 * Deliberately a formula and not an AI call. It runs on every catalogue row the
 * user opens and on every scan result, needs to be on screen before they decide
 * whether to eat the thing, and must not spend a request or a quota unit to say
 * something as ordinary as "that is most of your remaining calories". Premium
 * gets a sentence of AI commentary layered on top of this number, never instead
 * of it.
 *
 * The score answers a question about *today*: the same bar of chocolate is a
 * reasonable snack at 09:00 with the whole day left and a bad idea at 21:00
 * with 150 kcal to spare. So it reads the day's running totals, not just the
 * food.
 *
 * What it is not: a judgement about the food in the abstract, and not medical
 * advice. There is no "bad food" list here — only how a serving lands against
 * this person's remaining budget, their macro gaps and their goal.
 */

/** Score bands. Above `good` is green, below `warn` is red, between is amber. */
const GOOD = 70;
const WARN = 45;

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const pct = (part, whole) => (whole > 0 ? part / whole : 0);

/**
 * @param {{kcal:number, carbs:number, protein:number, fat:number}} food
 *   The serving being considered — already scaled to the portion on screen.
 * @param {object} ctx
 * @param {object} ctx.profile  goal + daily targets
 * @param {object} [ctx.summary] today's running totals; absent during onboarding
 * @param {string} [ctx.category] catalogue category, when the food came from it
 * @returns {{percent:number, tone:"good"|"ok"|"warn", reasons:string[]}|null}
 */
export function foodFit(food, { profile, summary, category } = {}) {
  const kcal = Number(food?.kcal) || 0;
  const target = Number(profile?.dailyCalorieTarget) || 0;
  // Nothing meaningful to say about a zero-calorie item (tea, water) or before
  // the calorie engine has a target to compare against.
  if (!kcal || !target) return null;

  const protein = Number(food?.protein) || 0;
  const carbs = Number(food?.carbs) || 0;
  const fat = Number(food?.fat) || 0;
  const goal = profile?.goal || "maintain";

  // Without a summary (onboarding preview) assume a fresh day rather than
  // pretending the budget is already spent.
  const eaten = Number(summary?.kcal) || 0;
  const remaining = summary ? Number(summary.remaining) : target - eaten;

  const reasons = [];
  let score = 78;

  /* ----- how much of what is left does this eat? ----------------------- */

  /*
   * How many of these calories land outside the budget.
   *
   * Being already over and going further over are the same event, so they share
   * one term. Handled as two branches they disagreed: eating 248 kcal with 150
   * left scored *worse* than eating the same 248 kcal while already 150 over,
   * which told the user the day got safer the more they exceeded it.
   *
   * Sized by the overshoot rather than by the serving, so a cucumber eaten past
   * the budget is not rated like a plate of plov.
   */
  const overshoot = Math.max(0, kcal - Math.max(0, remaining));
  if (overshoot > 0) {
    score -= clamp(20 + pct(overshoot, target) * 150, 20, 65);
    reasons.push("overBudget");
  } else {
    const share = pct(kcal, remaining);
    if (share > 0.6) {
      score -= (share - 0.6) * 55;
      reasons.push("bigShare");
    } else if (share < 0.3) {
      score += 8;
      reasons.push("fitsWell");
    }
  }

  /* ----- macro composition -------------------------------------------- */

  // Shares of the serving's own energy. Composition tables do not always
  // reconcile exactly (fibre, rounding), so these are indicative, not exact.
  const fromProtein = pct(protein * 4, kcal);
  const fromFat = pct(fat * 9, kcal);
  const fromCarbs = pct(carbs * 4, kcal);

  const proteinGap = Math.max(0, (Number(profile?.proteinTargetG) || 0) - (Number(summary?.protein) || 0));
  const fatLeft = (Number(profile?.fatTargetG) || 0) - (Number(summary?.fat) || 0);

  const shareOfDay = pct(kcal, target);

  if (fromProtein >= 0.3) {
    score += 12;
    // Only worth calling out when it actually fills a gap they still have.
    reasons.push(proteinGap >= protein * 0.5 && proteinGap > 10 ? "proteinGap" : "highProtein");
  } else if (fromProtein < 0.08 && kcal > 150) {
    // Scaled by size: 150 kcal of something protein-free is a snack, 600 kcal
    // of it is most of a meal that did nothing for the day's protein.
    score -= clamp(6 + shareOfDay * 60, 6, 30);
    reasons.push("lowProtein");
  }

  /*
   * Calories carrying almost nothing with them: little protein, and the energy
   * arriving as fat or as sugar/refined carbohydrate. This is the one place the
   * score judges the food itself rather than the fit — because "it fits in your
   * remaining budget" is a genuinely misleading thing to say about chips.
   */
  const nutrientPoor = fromProtein < 0.12 && (fromFat > 0.35 || fromCarbs > 0.7);
  if (nutrientPoor && kcal > 120) {
    score -= goal === "lose" ? 12 : 7;
    if (!reasons.includes("lowProtein")) reasons.push("lowProtein");
  }

  /*
   * What macros cannot see.
   *
   * A burger's protein-to-fat ratio is unremarkable, so on numbers alone it
   * scored as well as a chicken breast — but the sodium, the refined flour and
   * how little of it registers as a meal are all real and none of them appear
   * in four figures. The catalogue already sorts these into `fast` and `sweet`,
   * so the category carries the part the arithmetic misses. Scan results have
   * no category and simply skip this.
   */
  if ((category === "fast" || category === "sweet") && kcal > 120) {
    score -= goal === "lose" ? 14 : 9;
    if (!reasons.includes("lowProtein") && !reasons.includes("highFat")) reasons.push("processed");
  }

  if (fromFat > 0.5) {
    score -= goal === "lose" ? 16 : 10;
    reasons.push("highFat");
  }
  // Fat is the macro people blow past without noticing, because it is dense and
  // arrives inside things that read as savoury rather than as fat.
  if (fatLeft > 0 && fat > fatLeft) {
    score -= 8;
    if (!reasons.includes("highFat")) reasons.push("highFat");
  }

  /* ----- goal ---------------------------------------------------------- */

  if (goal === "lose") {
    // On a deficit a single serving costs proportionally more of the day, and
    // there are fewer meals left to absorb it. A quarter of the day in one
    // sitting is the point where that starts to bite.
    if (shareOfDay > 0.28) {
      score -= (shareOfDay - 0.28) * 110;
      if (!reasons.includes("bigShare") && !reasons.includes("overBudget")) reasons.push("bigShare");
    }
    if (fromProtein >= 0.25 && shareOfDay < 0.3) score += 6;
  } else if (goal === "gain") {
    // The failure mode here is the opposite one: not eating enough.
    if (shareOfDay >= 0.15 && fromProtein >= 0.15) {
      score += 10;
      reasons.push("goodForGain");
    }
    if (shareOfDay < 0.05) score -= 6;
  }

  const percent = Math.round(clamp(score, 5, 99));
  const tone = percent >= GOOD ? "good" : percent >= WARN ? "ok" : "warn";

  return {
    percent,
    tone,
    // "Fits your remaining calories" is true of a chocolate bar at breakfast and
    // reads as approval next to a 33% verdict, so the reassuring notes are
    // dropped once the verdict stops being reassuring. Two is as many as fits on
    // one line and as many as anyone reads.
    reasons: reasons.filter((r) => tone === "good" || r !== "fitsWell").slice(0, 2),
  };
}
