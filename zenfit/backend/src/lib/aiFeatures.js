/**
 * The AI features: prompts and response shapes.
 *
 * Which model answers is decided in aiProvider.js — nothing here is written
 * against a particular vendor, so adding a provider does not mean rewriting
 * the prompts.
 */

import { callModel } from "./aiProvider.js";

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

export async function analyzeFoodImage(base64Image, mediaType) {
  const text = await callModel(
    [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64Image } },
          { type: "text", text: SCAN_PROMPT },
        ],
      },
    ],
    { maxTokens: 600, json: true }
  );
  return extractJson(text);
}

export async function askFoodQuestion(query) {
  const prompt = `Sen ovqat va kaloriya bo'yicha yordamchisisan. Foydalanuvchi so'ragan taom haqida taxminiy ozuqaviy qiymatlarni ber.
FAQAT quyidagi JSON formatda javob ber — boshqa hech qanday matn qo'shma:
{"name": "taom nomi", "kcalPerServing": number, "carbs": number, "protein": number, "fat": number, "servingDescription": "porsiya tavsifi", "isApprox": boolean, "note": "qisqa izoh"}

Savol: ${query}`;
  const text = await callModel([{ role: "user", content: prompt }], { maxTokens: 400, json: true });
  return extractJson(text);
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
  const text = await callModel(messages, { maxTokens: 900, system });
  return text;
}

/* ------------------------------------------------------------------ *
 * AI plan generation
 * ------------------------------------------------------------------ */

export async function generateDietPlan(ctx) {
  const { profile } = ctx;
  const goalUz = { lose: "ozish", maintain: "vaznni saqlash", gain: "massa yig'ish" }[profile.goal] || profile.goal;

  const system = `Sen o'zbek oshxonasini yaxshi biladigan nutritsiologsan. Foydalanuvchiga real, arzon va topish oson mahsulotlardan kunlik ovqatlanish rejasi tuzasan.
Mahalliy taomlarni (osh, shurpa, non, tvorog, qatiq, somsa) hisobga ol, lekin maqsadga mos porsiyalarda.
FAQAT JSON qaytar, markdown yoki izoh qo'shma.`;

  const prompt = `Quyidagi foydalanuvchi uchun 1 kunlik ovqatlanish rejasi tuz:
- Jins: ${profile.gender === "female" ? "ayol" : "erkak"}, yosh ${profile.age}, bo'y ${profile.height_cm}sm, vazn ${profile.weight_kg}kg
- Maqsad: ${goalUz}
- Kunlik me'yor: ${profile.daily_calorie_target} kcal
- Makro: oqsil ${profile.protein_target_g}g, uglevod ${profile.carbs_target_g}g, yog' ${profile.fat_target_g}g

JSON format:
{
  "summary": "1-2 gap umumiy tavsiya",
  "meals": [
    {"slot": "Nonushta", "name": "taom nomi", "portion": "porsiya tavsifi", "kcal": number, "carbs": number, "protein": number, "fat": number, "emoji": "emoji"}
  ],
  "tips": ["qisqa maslahat 1", "qisqa maslahat 2", "qisqa maslahat 3"]
}
meals massivida 4 ta ovqat bo'lsin: Nonushta, Tushlik, Kechki ovqat, Gazak. Jami kaloriya me'yorga yaqin bo'lsin (±100 kcal).`;

  const text = await callModel([{ role: "user", content: prompt }], { maxTokens: 1600, system, json: true });
  return extractJson(text);
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

  const text = await callModel([{ role: "user", content: prompt }], { maxTokens: 900, system, json: true });
  return extractJson(text);
}
