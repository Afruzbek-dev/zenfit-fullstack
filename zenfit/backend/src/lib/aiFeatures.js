/**
 * The AI features: prompts and response shapes.
 *
 * Which model answers is decided in aiProvider.js — nothing here is written
 * against a particular vendor, so adding a provider does not mean rewriting
 * the prompts.
 */

import { callModel } from "./aiProvider.js";
import { RECIPE_BY_ID, recipeBankLines } from "./recipeBank.js";

/**
 * The features that are plain text generation — trainer answers and the two
 * plan builders — go to OpenRouter first when a key is set there, since a free
 * model handles them well enough and they are the chattiest calls in the app.
 * Recognition stays on the main provider: it reads photos and its numbers end
 * up in the user's diary, so it is the wrong place to save money.
 */
const TEXT_PROVIDER = { prefer: "openrouter" };

function extractJson(text) {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  // Models occasionally add a sentence before the object — grab the outermost braces.
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(slice);
}

/* ------------------------------------------------------------------ *
 * AI Scan — food photo and text lookup
 * ------------------------------------------------------------------ */

const SCAN_PROMPT = `Sen ovqat tan olish (food recognition) yordamchisisan. Rasmdagi taomni tahlil qil.
O'zbek va Markaziy Osiyo taomlarini (osh, lag'mon, somsa, manti, shurpa, norin, chuchvara) yaxshi bilasan.
FAQAT quyidagi JSON formatda javob ber — boshqa hech qanday matn, izoh yoki markdown qo'shma:
{"name": "taom nomi (o'zbek tilida)", "kcalPerServing": number, "carbs": number, "protein": number, "fat": number, "confidence": number (0-100), "servingDescription": "masalan '1 porsiya (~350g)'", "isApprox": boolean, "note": "qisqa izoh — nima uchun qiymat farq qilishi mumkin"}
Milliy taomlar uchun isApprox=true qo'y (uy retsepti bo'yicha farq katta).
Agar rasmda ovqat aniq ko'rinmasa, "name" maydoniga "Aniqlanmadi" yoz va confidence 0 qo'y.`;

/**
 * The Premium-only commentary layered on top of the raw numbers: whether this
 * food fits *today's* budget, and what its composition itself is worth
 * knowing regardless of who is eating it.
 *
 * The macros and the suitability percentage are computed without any of this
 * — the percentage on the client (lib/foodFit.js), the macros by the model's
 * base recognition — and are the same for every scan, free or Premium. This
 * only buys the narrative on top, so a free user is never left without an
 * answer, just without the write-up. Both fields ride the same request as the
 * recognition itself, so gating them costs nothing beyond a longer prompt.
 */
function fitInstruction(fit) {
  if (!fit) return "";
  const goalUz = { lose: "ozish", maintain: "vaznni saqlash", gain: "massa yig'ish" }[fit.goal] || fit.goal;
  return `

FOYDALANUVCHI HOLATI: maqsad — ${goalUz}, kunlik me'yor ${fit.target} kcal, bugun ${fit.eaten} kcal yeyilgan (qolgan ${fit.remaining} kcal), oqsil ${fit.proteinEaten}/${fit.proteinTarget} g.
JSON'ga ikkita qo'shimcha maydon qo'sh:
1) "fitNote": 1 qisqa gap — shu taom AYNAN shu foydalanuvchiga bugun mos keladimi yoki yo'qmi, qolgan kaloriya va oqsilga tayanib. Aniq raqam ayt.
2) "composition": {"benefits": [...], "harms": [...]} — taomning tarkibi (yog' turi, tolasi, qand miqdori, ishlov darajasi kabi) haqida 1-3 tadan QISQA (5-9 so'z) foyda va ehtiyot bo'lish kerak bo'lgan jihat. Umumiy gap emas — shu taomga xos bo'lsin (masalan "to'yingan yog' yuqori" "somsa" uchun, "sog'lom uglevod manbai" "osh"dagi guruch uchun). Hech qanday zarar yo'q bo'lsa harms bo'sh massiv qoldir.
Tibbiy tashxis qo'yma.`;
}

/**
 * The prompt asks the model to answer "Aniqlanmadi" with confidence 0 when it
 * cannot see food. That sentinel is Uzbek, so the client used to detect it by
 * comparing against a *translated* label — which never matched for Russian or
 * English users, who were shown a 0 kcal result card instead of the retry
 * prompt. Deciding it here gives both the client and the quota check one
 * language-independent answer.
 */
function withRecognition(result) {
  const confidence = Number(result?.confidence);
  const name = String(result?.name || "").trim().toLowerCase();
  const recognized =
    Boolean(name) && name !== "aniqlanmadi" && (!Number.isFinite(confidence) || confidence > 0);
  return { ...result, recognized };
}

export async function analyzeFoodImage(base64Image, mediaType, fit = null) {
  const text = await callModel(
    [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64Image } },
          { type: "text", text: SCAN_PROMPT + fitInstruction(fit) },
        ],
      },
    ],
    { maxTokens: fit ? 900 : 600, json: true }
  );
  return withRecognition(extractJson(text));
}

export async function askFoodQuestion(query, fit = null) {
  const prompt = `Sen ovqat va kaloriya bo'yicha yordamchisisan. Foydalanuvchi so'ragan taom haqida taxminiy ozuqaviy qiymatlarni ber.
FAQAT quyidagi JSON formatda javob ber — boshqa hech qanday matn qo'shma:
{"name": "taom nomi", "kcalPerServing": number, "carbs": number, "protein": number, "fat": number, "servingDescription": "porsiya tavsifi", "isApprox": boolean, "note": "qisqa izoh"}${fitInstruction(fit)}

Savol: ${query}`;
  const text = await callModel([{ role: "user", content: prompt }], { maxTokens: fit ? 700 : 400, json: true });
  return withRecognition(extractJson(text));
}

/**
 * Turns a LogMeal dish name into the user's language.
 *
 * LogMeal supports ten languages and neither Uzbek nor Russian is one of them,
 * so a recognised dish arrives as "french fries" no matter who is reading. A
 * translation is a much smaller ask than recognition, so this is a short,
 * cheap call rather than a second vision request.
 *
 * Returns the original name unchanged on any failure — a scan that shows the
 * English name is a minor wart, a scan that fails because a translation did is
 * a broken feature.
 */
export async function translateDishName(name, lang) {
  if (!name || lang === "en") return name;

  const target = { uz: "o'zbek", ru: "rus" }[lang];
  if (!target) return name;

  try {
    const text = await callModel(
      [
        {
          role: "user",
          content: `Quyidagi taom nomini ${target} tiliga tarjima qil. FAQAT tarjimani yoz — izoh, tirnoq yoki qo'shimcha matn qo'shma. Taom nomi mahalliy nom bilan atalsa (masalan "pilaf" → "osh"), o'sha mahalliy nomni ishlat.\n\n${name}`,
        },
      ],
      { maxTokens: 40 }
    );
    const cleaned = String(text || "").trim().replace(/^["']|["']$/g, "").split("\n")[0];
    // A model that answers with a sentence has misunderstood; keep the original
    // rather than putting an explanation where a dish name goes.
    return cleaned && cleaned.length <= 60 ? cleaned : name;
  } catch {
    return name;
  }
}

/* ------------------------------------------------------------------ *
 * AI Personal Trainer chat
 * ------------------------------------------------------------------ */

function buildTrainerSystemPrompt(ctx) {
  const { profile, todayStats, recentWorkouts, activePlan } = ctx;

  // The trainer answers in whatever language the user picked in settings.
  const langInstruction = {
    ru: "Всегда отвечай НА РУССКОМ ЯЗЫКЕ, дружелюбно и кратко (2-5 предложений, при необходимости список).",
    en: "Always answer IN ENGLISH, friendly and concise (2-5 sentences, a list where useful).",
  }[profile?.language] || "Doim O'ZBEK TILIDA, samimiy va qisqa javob ber (2-5 gap, kerak bo'lsa ro'yxat).";

  const lines = [
    "Sen ZenFit ilovasining shaxsiy AI treneri va nutritsiologisisan.",
    langInstruction,
    "Sen foydalanuvchining real ma'lumotlarini ko'rib turibsan — javoblaringda aniq raqamlarga tayan.",
    "",
    "MUHIM QOIDALAR:",
    "- Tibbiy tashxis qo'yma. Jarohat/og'riq haqida gap ketsa, shifokorga murojaat qilishni maslahat ber.",
    "- Ekstremal dieta (kuniga 1200 kcal dan past) yoki xavfli mashqni tavsiya qilma.",
    "- Aniq, bajarilishi mumkin bo'lgan maslahat ber — umumiy gap emas.",
    "- Og'irlik tavsiya qilsang, foydalanuvchi tana vazniga asoslan va 2.5 kg ga yaxlitlab ayt.",
    "",
    "FOYDALANUVCHI MA'LUMOTLARI:",
  ];

  if (profile) {
    const goalUz = { lose: "ozish", maintain: "vaznni saqlash", gain: "massa yig'ish" }[profile.goal] || profile.goal;
    lines.push(
      `- Jins: ${profile.gender === "female" ? "ayol" : "erkak"}, yosh: ${profile.age}, bo'y: ${profile.height_cm} sm, vazn: ${profile.weight_kg} kg`,
      `- Maqsad: ${goalUz}, tajriba: ${profile.fitness_level || "noma'lum"}`,
      `- Kunlik me'yor: ${profile.daily_calorie_target} kcal (oqsil ${profile.protein_target_g}g, uglevod ${profile.carbs_target_g}g, yog' ${profile.fat_target_g}g)`
    );
    if (profile.injuries) lines.push(`- Jarohat/cheklov: ${profile.injuries}`);
    if (profile.equipment) lines.push(`- Jihoz: ${profile.equipment}`);
  } else {
    lines.push("- Profil hali to'ldirilmagan.");
  }

  if (todayStats) {
    lines.push(
      "",
      "BUGUNGI HOLAT:",
      `- Iste'mol: ${todayStats.kcal} kcal (oqsil ${todayStats.protein}g, uglevod ${todayStats.carbs}g, yog' ${todayStats.fat}g)`,
      `- Sarflandi: ${todayStats.burned} kcal, suv: ${todayStats.waterMl} ml`,
      `- Qolgan kaloriya: ${todayStats.remaining} kcal`
    );
  }

  if (recentWorkouts?.length) {
    lines.push("", "SO'NGGI MASHQLAR:");
    recentWorkouts.slice(0, 8).forEach((w) => {
      lines.push(`- ${w.exercise_name}${w.sets_completed ? ` (${w.sets_completed} set)` : ""} — ${String(w.logged_at).slice(0, 10)}`);
    });
  }

  if (activePlan) {
    lines.push("", `FAOL REJA: ${activePlan.title || "AI reja"}, haftasiga ${activePlan.daysPerWeek || "?"} kun.`);
  }

  return lines.join("\n");
}

export async function trainerChat({ messages, context }) {
  const system = buildTrainerSystemPrompt(context);
  const text = await callModel(messages, { maxTokens: 900, system, ...TEXT_PROVIDER });
  return text;
}

/* ------------------------------------------------------------------ *
 * AI plan generation
 * ------------------------------------------------------------------ */

/**
 * One pantry line for the prompt.
 *
 * The caller hands over the food catalogue rows the user ticked, so the model
 * is told what each ingredient actually costs instead of guessing — the whole
 * point of picking from a catalogue rather than typing free text. Everything
 * interpolated here is re-validated in the route; this only decides the shape.
 */
const pantryLine = (f) =>
  `- ${f.name}: ${f.kcal} kcal, oqsil ${f.protein}g, uglevod ${f.carbs}g, yog' ${f.fat}g (${f.unit})`;

/** Meal slot labels per chosen count — the JSON "slot" field the client keys its icons off (RecipesScreen.jsx's SLOT_KEYS). */
// Exported so routes/dietPlan.js can resolve the same slot labels for the
// user-editable custom plan — slot_index there is a position into this array,
// not a re-worded copy of it.
export const MEAL_SLOT_SETS = {
  3: ["Nonushta", "Tushlik", "Kechki ovqat"],
  4: ["Nonushta", "Tushlik", "Kechki ovqat", "Gazak"],
  5: ["Nonushta", "Gazak", "Tushlik", "Kechki ovqat", "Gazak"],
};

const RESTRICTION_UZ = {
  vegetarian: "vegetarian (go'sht va baliqsiz)",
  lactose: "laktozasiz (sut mahsulotlari o'rniga laktozasiz yoki o'simlik asosidagilar)",
  gluten: "glyutensiz (bug'doy, arpa, javdar mahsulotlarisiz)",
};

/**
 * The diet-plan questionnaire's answers (DietPrefsSheet.jsx), folded into the
 * prompt the same way pantryBlock folds in the catalogue — restrictions as a
 * hard constraint, everything else as a steer rather than a rule, since a
 * meal-count and an eating-out habit are preferences, not allergies.
 */
function prefsInstruction(preferences) {
  if (!preferences) return "";
  const lines = [];
  const restrictions = Array.isArray(preferences.restrictions)
    ? preferences.restrictions.map((r) => RESTRICTION_UZ[r]).filter(Boolean)
    : [];
  if (restrictions.length) {
    lines.push(`- Ovqatlanish cheklovi: ${restrictions.join(", ")}. Rejada bularga zid taom bo'lmasin.`);
  }
  const note = String(preferences.note || "").trim().slice(0, 140);
  if (note) lines.push(`- Qo'shimcha (allergiya yoki yoqtirmaydigan taom): ${note}. Bularni ishlatma.`);
  if (preferences.eatsOut) {
    lines.push("- Foydalanuvchi ko'pincha tashqarida ovqatlanadi — taomlar oddiy va tashqarida topish oson bo'lsin.");
  }
  return lines.length ? `\n\nFOYDALANUVCHI TANLOVLARI:\n${lines.join("\n")}` : "";
}

/**
 * A meal naming a `foodId` from the recipe bank gets its macros, name and
 * emoji snapped to the catalogue's own values — the model's guess can drift
 * from the real recipe, and the app renders that same id's actual steps once
 * this reaches the client, so the two must agree. `howTo` is dropped: the
 * real recipe already has real steps, an AI-invented one would just be wrong.
 *
 * An id the model invented (not in the bank) is stripped rather than trusted
 * — the meal still stands on its own numbers, it just isn't linked to a
 * recipe that doesn't exist.
 */
export function resolveMeal(meal) {
  const recipe = meal?.foodId ? RECIPE_BY_ID[meal.foodId] : null;
  if (!recipe) {
    if (!meal?.foodId) return meal;
    const { foodId, ...rest } = meal;
    return rest;
  }
  return {
    ...meal,
    foodId: recipe.id,
    name: recipe.nameUz,
    emoji: recipe.emoji,
    portion: `${recipe.portionG} g`,
    kcal: recipe.kcal,
    carbs: recipe.carbs,
    protein: recipe.protein,
    fat: recipe.fat,
    howTo: undefined,
  };
}

export async function generateDietPlan(ctx) {
  const { profile, pantry, preferences } = ctx;
  const goalUz = { lose: "ozish", maintain: "vaznni saqlash", gain: "massa yig'ish" }[profile.goal] || profile.goal;
  const fromPantry = Array.isArray(pantry) && pantry.length > 0;
  const slots = MEAL_SLOT_SETS[preferences?.mealsPerDay] || MEAL_SLOT_SETS[4];

  const system = `Sen sog'lom va sodda diet-retseptlarga ixtisoslashgan nutritsiologsan — oz sonli ingredient, tez tayyorlanadigan, protein-boy taomlar (Mob Kitchen uslubidagi diet oshxona). Foydalanuvchiga real, arzon va O'zbekistonda topish oson mahsulotlardan kunlik ovqatlanish rejasi tuzasan.
Asosiy tanlov: grilda/pechda pishirilgan tovuq/baliq/mol go'shti, sabzavotli salat va sho'rvalar, tuxum taomlari, tvorog/yogurt asosidagi taomlar, guruch/bulg'ur/yasmiq kabi sodda garnirlar.
Og'ir va yog'li milliy taomlarni (osh, lag'mon, manti, somsa, norin, dimlama kabi qovurilgan/dimlangan taomlarni) rejaga asosiy ovqat sifatida QO'SHMA — ular diet uchun mos emas. Bir kunlik rejada ulardan birortasi ham bo'lmasligi kerak.

QUYIDA ilovaning o'zida tayyor, sinovdan o'tgan retseptlar ro'yxati bor. Mumkin bo'lgan joyda — ayniqsa foydalanuvchining mavjud mahsulotlariga yoki maqsadiga mos kelsa — yangi taom o'ylab topish o'rniga shulardan birini tanla. Shu retseptni tanlasang, "howTo" YOZMA — o'rniga "foodId" maydoniga uning id sini yoz (masalan "foodId": "tuna-loviya-salat"), ilova to'liq tayyorlash tartibini o'zi ko'rsatadi. Mos retsept bo'lmasa, odatdagidek o'zing taom o'ylab top va "howTo" bilan yoz, "foodId" qo'shma.

TAYYOR RETSEPTLAR:
${recipeBankLines()}

Har bir taom uchun "howTo" maydoniga (agar "foodId" ishlatmasang) 2-3 ta juda qisqa (6-10 so'zdan oshmasin) tayyorlash bosqichini yoz.
FAQAT JSON qaytar, markdown yoki izoh qo'shma. Qisqa yoz — javob to'liq JSON bo'lishi shart.`;

  // With a pantry the job changes from "compose a sensible day" to "compose a
  // sensible day out of exactly these things", so the constraint is stated
  // twice — once as a rule and once as the list — and the model is told what to
  // do when the list cannot cover a meal, rather than being left to invent an
  // ingredient the user does not have.
  const pantryBlock = fromPantry
    ? `

FOYDALANUVCHIDA MAVJUD MAHSULOTLAR (uyida bor, sotib olish shart emas):
${pantry.map(pantryLine).join("\n")}

QAT'IY QOIDA: rejadagi har bir taom FAQAT yuqoridagi mahsulotlardan tuzilsin. Ro'yxatda yo'q mahsulot qo'shma.
Istisno: tuz, ziravor, suv, choy — bularni erkin ishlatishing mumkin.
Agar ro'yxatdagi mahsulotlar kunlik me'yorni to'ldirishga yetmasa, "missing" maydoniga yetishmayotgan 1-3 ta mahsulot nomini yoz va rejani bor narsadan tuz.`
    : "";

  // A full week in one call. Variants used to be the shape here (three
  // one-day plans to pick between), but a week the user actually eats through
  // is worth more than a choice between three versions of one day.
  const prompt = `Quyidagi foydalanuvchi uchun 7 KUNLIK (1 haftalik) ovqatlanish rejasi tuz:
- Jins: ${profile.gender === "female" ? "ayol" : "erkak"}, yosh ${profile.age}, bo'y ${profile.height_cm}sm, vazn ${profile.weight_kg}kg
- Maqsad: ${goalUz}
- Kunlik me'yor: ${profile.daily_calorie_target} kcal
- Makro: oqsil ${profile.protein_target_g}g, uglevod ${profile.carbs_target_g}g, yog' ${profile.fat_target_g}g${pantryBlock}${prefsInstruction(preferences)}

JSON format:
{
  "summary": "1-2 gap umumiy tavsiya",
  "days": [
    {
      "day": 1,
      "meals": [
        {"slot": "Nonushta", "name": "taom nomi", "portion": "porsiya tavsifi", "kcal": number, "carbs": number, "protein": number, "fat": number, "emoji": "emoji", "foodId": "tayyor retseptdan foydalansang uning id si, aks holda qo'shma", "howTo": ["bosqich 1", "bosqich 2"]}
      ]
    }
  ],
  "tips": ["qisqa maslahat 1", "qisqa maslahat 2"]${fromPantry ? ',\n  "missing": ["yetishmayotgan mahsulot nomi"]' : ""}
}
"days" massivida aniq 7 ta kun bo'lsin (day: 1 dan 7 gacha). Har bir kunning "meals" massivida ${slots.length} ta ovqat bo'lsin: ${slots.join(", ")}.
Kunlar bir-biridan farq qilsin — bir xil taomni ketma-ket ikki kun takrorlama. Har bir kunning jami kaloriyasi me'yorga yaqin bo'lsin (±100 kcal).`;

  async function requestPlan(options) {
    const text = await callModel([{ role: "user", content: prompt }], {
      maxTokens: 7000,
      system,
      json: true,
      ...options,
    });
    return extractJson(text);
  }

  // No TEXT_PROVIDER here, unlike the other text features. That option prefers
  // a free model to save cost, but free models commonly cap output around 4k
  // tokens — and a week of meals runs past that. Truncated output parses as a
  // SyntaxError, which surfaces to the user as a 502 on a Premium-only feature.
  // Paying for the tokens is the cheaper trade. The retry stays as the net for
  // an ordinary bad response.
  let parsed;
  try {
    parsed = await requestPlan({});
  } catch (err) {
    if (!(err instanceof SyntaxError)) throw err;
    parsed = await requestPlan({});
  }

  // Older shapes and short answers both land here: a bare `meals` array becomes
  // a one-day week, and five days beats failing outright over the missing two.
  const days = Array.isArray(parsed.days) && parsed.days.length > 0
    ? parsed.days
        .filter((d) => Array.isArray(d?.meals) && d.meals.length > 0)
        .map((d, i) => ({ day: Number(d.day) || i + 1, meals: d.meals.map(resolveMeal) }))
    : [{ day: 1, meals: (Array.isArray(parsed.meals) ? parsed.meals : []).map(resolveMeal) }];

  return {
    plan: {
      summary: parsed.summary || null,
      days,
      tips: Array.isArray(parsed.tips) ? parsed.tips : [],
      missing: Array.isArray(parsed.missing) ? parsed.missing : undefined,
      source: fromPantry ? "pantry" : "ai",
      createdAt: new Date().toISOString(),
    },
  };
}

/**
 * Optional AI layer on top of the deterministic client-side plan: variation
 * tips and personal advice. The plan itself stays rule-based so it is instant
 * and never hallucinates a weight.
 */
export async function enhanceWorkoutPlan({ profile, plan }) {
  const system = `Sen sertifikatlangan kuch trenerisan. Tayyor mashq rejasiga qisqa, amaliy maslahat berasan.
FAQAT JSON qaytar, markdown qo'shma. O'zbek tilida yoz.`;

  const dayList = (plan.days || [])
    .map((d) => `${d.day} — ${d.label}: ${(d.exercises || []).map((e) => e.name).join(", ")}`)
    .join("\n");

  const prompt = `Foydalanuvchi: ${profile.gender === "female" ? "ayol" : "erkak"}, ${profile.age} yosh, ${profile.weight_kg}kg, maqsad: ${profile.goal}, daraja: ${profile.fitness_level || "beginner"}${profile.injuries ? `, jarohat: ${profile.injuries}` : ""}.

Haftalik reja:
${dayList}

JSON format:
{
  "advice": "2-3 gap shaxsiy maslahat",
  "progressionTip": "og'irlikni qanday oshirish bo'yicha 1-2 gap",
  "warmup": ["isinish harakati 1", "isinish harakati 2", "isinish harakati 3"],
  "focusPoints": ["diqqat qaratish kerak bo'lgan nuqta 1", "nuqta 2"]
}`;

  const text = await callModel([{ role: "user", content: prompt }], {
    maxTokens: 900,
    system,
    json: true,
    ...TEXT_PROVIDER,
  });
  return extractJson(text);
}

/** Adds AI commentary on top of whichever diet plan (AI-generated, preset, or custom) is currently active. */
export async function enhanceDietPlan({ profile, plan }) {
  const system = `Sen sertifikatlangan nutritsiologsan. Tayyor ovqatlanish rejasiga qisqa, amaliy maslahat berasan.
FAQAT JSON qaytar, markdown qo'shma. O'zbek tilida yoz.`;

  // Weekly plans carry `days[]`; presets and pre-weekly AI plans carry a bare
  // `meals[]`. Advice is about one day either way, so take the first.
  const meals = Array.isArray(plan.days) && plan.days.length > 0 ? plan.days[0].meals || [] : plan.meals || [];
  const mealList = meals
    .map((m) => `${m.slot || ""}: ${m.name} (${m.kcal} kkal)`.trim())
    .join("\n");

  const prompt = `Foydalanuvchi: ${profile.gender === "female" ? "ayol" : "erkak"}, ${profile.age} yosh, ${profile.weight_kg}kg, maqsad: ${profile.goal}, kunlik kaloriya me'yori: ${profile.daily_calorie_target || "-"}.

Kunlik ovqatlanish rejasi:
${mealList}

JSON format:
{
  "advice": "2-3 gap shaxsiy maslahat",
  "swapTip": "rejadagi bitta taomni sog'lomroq muqobiliga almashtirish bo'yicha 1 gap",
  "hydrationTip": "suv ichish yoki ovqatlanish tartibi bo'yicha 1 gap"
}`;

  const text = await callModel([{ role: "user", content: prompt }], {
    maxTokens: 700,
    system,
    json: true,
    ...TEXT_PROVIDER,
  });
  return extractJson(text);
}
