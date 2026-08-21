/**
 * Hand-mirrored subset of the frontend's diet-style catalogue dishes
 * (frontend/src/data/foods.js) — the ones that are real, cookable recipes
 * (not heavy national dishes) rather than raw products.
 *
 * The AI diet-plan prompt offers these to the model as known-good recipes it
 * can pick instead of inventing a meal from scratch. Only what the prompt and
 * the response-validation need lives here — macros, portion and ingredients
 * for pantry matching — never the full multi-language recipe (steps,
 * composition), which stays frontend-only and is what the app actually shows
 * once a meal carries this id.
 *
 * Nothing enforces this list staying in sync with foods.js — same hazard as
 * lib/goalPlan.js. Adding a diet-style recipe there and forgetting it here
 * just means the AI never offers it; forgetting the reverse (an id here with
 * no matching dish in foods.js) means a plan could reference a recipe the
 * app can't render — keep the ids identical to foods.js's dish ids.
 */
export const RECIPE_BANK = [
  { id: "tovuq-guruch", nameUz: "Grilangan tovuq + guruch", emoji: "🍗", slot: "Tushlik", portionG: 250, kcal: 370, carbs: 26, protein: 49, fat: 6, ingredients: ["tovuq ko'krak", "jigarrang guruch", "limon"] },
  { id: "omlet-avokado", nameUz: "Omlet + avokado", emoji: "🥑", slot: "Nonushta", portionG: 220, kcal: 390, carbs: 8, protein: 21, fat: 32, ingredients: ["tuxum", "avokado", "zaytun moyi"] },
  { id: "baliq-sabzavot", nameUz: "Pechda baliq + sabzavot", emoji: "🐟", slot: "Kechki ovqat", portionG: 380, kcal: 340, carbs: 14, protein: 36, fat: 15, ingredients: ["baliq filesi", "brokkoli", "sabzi", "qalampir", "zaytun moyi"] },
  { id: "tvorog-asal", nameUz: "Tvorog + asal", emoji: "🥣", slot: "Gazak", portionG: 165, kcal: 225, carbs: 17, protein: 25, fat: 7, ingredients: ["tvorog", "asal"] },
  { id: "qatiq-meva", nameUz: "Qatiq + meva + yong'oq", emoji: "🫐", slot: "Gazak", portionG: 315, kcal: 260, carbs: 26, protein: 12, fat: 12, ingredients: ["qatiq", "meva", "yong'oq"] },
  { id: "tuna-loviya-salat", nameUz: "Tunets va loviya salati", emoji: "🥗", slot: "Tushlik", portionG: 300, kcal: 280, carbs: 13, protein: 29, fat: 12, ingredients: ["tunets", "yashil loviya", "pomidor", "zaytun moyi"] },
  { id: "noxat-salat", nameUz: "O'rta yer dengizi noxat salati", emoji: "🫘", slot: "Tushlik", portionG: 380, kcal: 440, carbs: 48, protein: 19, fat: 20, ingredients: ["no'xat", "bodring", "pomidor", "pishloq", "zaytun moyi"] },
  { id: "tovuq-salat-orash", nameUz: "Salat bargida tovuq", emoji: "🥬", slot: "Kechki ovqat", portionG: 280, kcal: 320, carbs: 6, protein: 48, fat: 11, ingredients: ["tovuq ko'krak", "ko'k salat bargi", "sabzi", "bodring", "soya sousi"] },
  { id: "mol-sabzavot-qovurma", nameUz: "Mol go'shti va sabzavot qovurma", emoji: "🥩", slot: "Kechki ovqat", portionG: 400, kcal: 450, carbs: 17, protein: 50, fat: 21, ingredients: ["mol go'shti", "brokkoli", "bolgar qalampiri", "sarimsoq"] },
  { id: "yasmiq-shorva", nameUz: "Yasmiq sho'rva", emoji: "🍲", slot: "Tushlik", portionG: 400, kcal: 350, carbs: 51, protein: 19, fat: 9, ingredients: ["yasmiq", "sabzi", "pomidor", "piyoz", "zaytun moyi"] },
  { id: "tuxum-oqi-ismaloq", nameUz: "Tuxum oqi va ismaloq", emoji: "🍳", slot: "Nonushta", portionG: 250, kcal: 145, carbs: 7, protein: 22, fat: 4, ingredients: ["tuxum oqi", "ismaloq", "pomidor"] },
  { id: "tungi-suli", nameUz: "Tungi suli bo'tqasi", emoji: "🥣", slot: "Nonushta", portionG: 320, kcal: 350, carbs: 48, protein: 15, fat: 12, ingredients: ["suli yormasi", "kefir", "sut", "qulupnay", "yong'oq"] },
  { id: "krevetka-qovurma", nameUz: "Krevetka va sabzavot qovurma", emoji: "🍤", slot: "Kechki ovqat", portionG: 390, kcal: 330, carbs: 12, protein: 52, fat: 9, ingredients: ["krevetka", "brokkoli", "bolgar qalampiri", "sarimsoq"] },
  { id: "shakarsiz-limonad", nameUz: "Shakarsiz limonad", emoji: "🍋", slot: "Gazak", portionG: 1000, kcal: 95, carbs: 25, protein: 1, fat: 0, ingredients: ["limon", "asal", "suv"] },
  { id: "vazn-oshirish-kokteyli", nameUz: "Vazn oshirish kokteyli", emoji: "🥤", slot: "Gazak", portionG: 480, kcal: 480, carbs: 50, protein: 20, fat: 16, ingredients: ["sut", "banan", "suli yormasi", "chia urug'i", "yeryong'oq ezmasi", "kakao"] },
  { id: "suvli-tovuq-kokragi", nameUz: "Suvli va yumshoq tovuq ko'kragi", emoji: "🍗", slot: "Tushlik", portionG: 500, kcal: 630, carbs: 2, protein: 114, fat: 18, ingredients: ["tovuq ko'kragi", "soya sousi", "paprika", "zaytun moyi"] },
  { id: "tvorogdan-grek-yogurt", nameUz: "Tvorogdan uy grek yogurti", emoji: "🥣", slot: "Gazak", portionG: 350, kcal: 300, carbs: 7, protein: 34, fat: 15, ingredients: ["tvorog", "sut", "zaytun moyi"] },
  { id: "fit-pankek", nameUz: "Oqsilga boy fit pankek", emoji: "🥞", slot: "Nonushta", portionG: 250, kcal: 730, carbs: 52, protein: 69, fat: 27, ingredients: ["tuxum", "suli yormasi", "tvorog", "protein kukuni"] },
  { id: "fit-tiramisu", nameUz: "Fit tiramisu", emoji: "🍮", slot: "Gazak", portionG: 300, kcal: 253, carbs: 58, protein: 5, fat: 1, ingredients: ["guruchli non", "qahva", "yogurt", "asal", "kakao"] },
  { id: "shaftoli-puding", nameUz: "Shaftolili tvorog puding", emoji: "🍑", slot: "Gazak", portionG: 150, kcal: 147, carbs: 28, protein: 5, fat: 2, ingredients: ["shaftoli", "suzma", "suli yormasi"] },
];

export const RECIPE_BY_ID = Object.fromEntries(RECIPE_BANK.map((r) => [r.id, r]));

/** One line per recipe, for the diet-plan prompt. */
export function recipeBankLines() {
  return RECIPE_BANK.map(
    (r) => `- id="${r.id}" | ${r.nameUz} | ${r.slot} | ${r.kcal} kcal, oqsil ${r.protein}g, uglevod ${r.carbs}g, yog' ${r.fat}g | tarkibi: ${r.ingredients.join(", ")}`
  ).join("\n");
}
