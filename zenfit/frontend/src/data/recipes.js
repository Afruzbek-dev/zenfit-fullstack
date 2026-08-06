/**
 * Recipe data. Values for national dishes vary widely between household
 * recipes (oil and meat quantity), so each entry carries an explicit portion
 * weight and an `isApprox` flag rather than pretending to a precision the
 * numbers do not have.
 */

export const RECIPES = [
  {
    id: "osh", name: "Osh (Palov)", emoji: "🍚", portion: "1 porsiya, ~350g (guruch + go'sht)",
    kcal: 480, carbs: 55, protein: 24, fat: 18, minutes: 90,
    tags: ["Milliy taom", "Kechki ovqat"], isApprox: true,
    note: "Uy retseptiga qarab 350-550 kcal oralig'ida bo'lishi mumkin — yog' va go'sht miqdoriga bog'liq.",
    ingredients: ["Guruch 120g", "Mol yoki qo'y go'shti 100g", "Sabzi 100g", "Piyoz, sarimsoq, ziravorlar"],
  },
  {
    id: "lagmon", name: "Qovurma lag'mon", emoji: "🍜", portion: "1 kosa, ~400g",
    kcal: 420, carbs: 45, protein: 24, fat: 14, minutes: 60,
    tags: ["Milliy taom", "Kechki ovqat"], isApprox: true,
    note: "Qo'lda tortilgan xamir va go'sht miqdoriga qarab ±80 kcal farq qilishi mumkin.",
    ingredients: ["Lag'mon xamiri 150g", "Mol go'shti 100g", "Bolgar qalampiri, pomidor, sabzi"],
  },
  {
    id: "somsa", name: "Go'shtli somsa", emoji: "🥟", portion: "1 dona, ~120g (tandirda)",
    kcal: 280, carbs: 26, protein: 13, fat: 16, minutes: 45,
    tags: ["Milliy taom", "500 kcal dan kam"], isApprox: true,
    note: "Moyda qovurilgan versiyasi 350+ kcal bo'lishi mumkin — tandirdagisi yengilroq.",
    ingredients: ["Xamir 60g", "Mol/qo'y fars 50g", "Piyoz", "Ziravorlar"],
  },
  {
    id: "manti", name: "Manti", emoji: "🥟", portion: "5-6 dona (~280g), qatiq bilan",
    kcal: 380, carbs: 40, protein: 20, fat: 15, minutes: 90,
    tags: ["Milliy taom", "Kechki ovqat"], isApprox: true,
    note: "Bug'da pishirilgani (an'anaviy) qovurilganidan yengilroq.",
    ingredients: ["Xamir", "Mol fars yoki qovoq+go'sht", "Piyoz", "Qatiq"],
  },
  {
    id: "shurpa", name: "Shurpa", emoji: "🍲", portion: "1 kosa, ~350ml",
    kcal: 320, carbs: 20, protein: 22, fat: 16, minutes: 120,
    tags: ["Milliy taom", "500 kcal dan kam", "Oqsilga boy"], isApprox: true,
    note: "Yog'siz go'sht bilan ~250 kcal, yog'li qo'y go'shti bilan 450+ kcal.",
    ingredients: ["Mol/qo'y go'shti (suyakli) 150g", "Kartoshka", "Sabzi", "Pomidor"],
  },
  {
    id: "tandir-non", name: "Tandir non", emoji: "🍞", portion: "100g bo'lak (~1/6 non)",
    kcal: 290, carbs: 50, protein: 9, fat: 7, minutes: 180,
    tags: ["Milliy taom", "Nonushta"], isApprox: false,
    note: "Oddiy bug'doy noni uchun barqaror qiymat.",
    ingredients: ["Bug'doy uni", "Achitqi", "Tuz", "Suv"],
  },
  {
    id: "tuxum", name: "Qaynatilgan tuxum (2 dona)", emoji: "🥚", portion: "2 ta katta tuxum, ~100g",
    kcal: 156, carbs: 1, protein: 13, fat: 11, minutes: 10,
    tags: ["Nonushta", "Oqsilga boy", "500 kcal dan kam"], isApprox: false,
    note: "USDA ma'lumotlariga asoslangan barqaror qiymat.",
    ingredients: ["Tuxum 2 dona", "Tuz (ixtiyoriy)"],
  },
  {
    id: "tvorog", name: "Tvorog + asal", emoji: "🥣", portion: "150g tvorog (5%) + 1 osh qoshiq asal",
    kcal: 180, carbs: 10, protein: 24, fat: 5, minutes: 2,
    tags: ["Nonushta", "Oqsilga boy", "500 kcal dan kam"], isApprox: false,
    note: "Past yog'li tvorog uchun barqaror qiymat.",
    ingredients: ["Tvorog 150g", "Asal 1 osh qoshiq"],
  },
  {
    id: "tovuq-guruch", name: "Grilangan tovuq + jigarrang guruch", emoji: "🍗", portion: "Tovuq 150g + guruch 100g",
    kcal: 420, carbs: 45, protein: 40, fat: 8, minutes: 30,
    tags: ["Kechki ovqat", "Oqsilga boy"], isApprox: false,
    note: "Moysiz pishirilgan variant uchun barqaror qiymat.",
    ingredients: ["Tovuq ko'krak 150g", "Jigarrang guruch 100g (pishgan)", "Limon, ziravorlar"],
  },
  {
    id: "banan-yeryongoq", name: "Banan + yeryong'oq moyi", emoji: "🍌", portion: "1 banan + 1 osh qoshiq moy",
    kcal: 280, carbs: 30, protein: 8, fat: 14, minutes: 2,
    tags: ["Nonushta", "500 kcal dan kam"], isApprox: false,
    note: "Mashqdan oldingi tezkor tamaddi uchun mos.",
    ingredients: ["Banan 1 dona", "Yeryong'oq moyi 1 osh qoshiq"],
  },
  {
    id: "qatiq-mevali", name: "Qatiq + meva + yong'oq", emoji: "🫐", portion: "200g qatiq + 100g meva + 15g yong'oq",
    kcal: 260, carbs: 26, protein: 12, fat: 12, minutes: 3,
    tags: ["Nonushta", "500 kcal dan kam"], isApprox: false,
    note: "Shirinsiz tabiiy qatiq uchun. Shakarli yogurt bilan +80 kcal.",
    ingredients: ["Tabiiy qatiq 200g", "Meva (olma, rezavor) 100g", "Yong'oq 15g"],
  },
  {
    id: "tuxum-avokado", name: "Omlet + avokado", emoji: "🥑", portion: "3 tuxum + 1/2 avokado",
    kcal: 390, carbs: 8, protein: 21, fat: 32, minutes: 12,
    tags: ["Nonushta", "Oqsilga boy"], isApprox: false,
    note: "Kam uglevodli nonushta uchun mos.",
    ingredients: ["Tuxum 3 dona", "Avokado 1/2 dona", "Zaytun moyi 1 choy qoshiq", "Ko'katlar"],
  },
  {
    id: "baliq-sabzavot", name: "Pechda baliq + sabzavot", emoji: "🐟", portion: "Baliq 180g + sabzavot 200g",
    kcal: 340, carbs: 14, protein: 36, fat: 15, minutes: 35,
    tags: ["Kechki ovqat", "Oqsilga boy", "500 kcal dan kam"], isApprox: false,
    note: "Losos bilan ~420 kcal, oq baliq bilan ~290 kcal.",
    ingredients: ["Baliq filesi 180g", "Brokkoli, sabzi, qalampir 200g", "Zaytun moyi", "Limon"],
  },
  {
    id: "mastava", name: "Mastava", emoji: "🍜", portion: "1 kosa, ~350ml",
    kcal: 290, carbs: 34, protein: 15, fat: 11, minutes: 60,
    tags: ["Milliy taom", "500 kcal dan kam"], isApprox: true,
    note: "Guruch va go'sht miqdoriga qarab farq qiladi.",
    ingredients: ["Guruch 50g", "Mol go'shti 80g", "Kartoshka, sabzi, pomidor"],
  },
];

export const RECIPE_TAGS = [
  "Barchasi",
  "Milliy taom",
  "Oqsilga boy",
  "Nonushta",
  "500 kcal dan kam",
  "Kechki ovqat",
];

export function filterRecipes(tag, search) {
  const q = (search || "").trim().toLowerCase();
  return RECIPES.filter(
    (r) =>
      (tag === "Barchasi" || r.tags.includes(tag)) &&
      (!q || r.name.toLowerCase().includes(q) || r.ingredients.some((i) => i.toLowerCase().includes(q)))
  );
}
