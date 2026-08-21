import { query, queryOne, parseJsonColumn } from "./db.js";
import { getDayStats, getStreak } from "./lib/stats.js";

const BOT_TOKEN = process.env.BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || "https://frontend-kappa-vert-24.vercel.app";
// No @ prefix stored — callers add it where Telegram's API wants a chat_id
// and leave it off where a t.me link or display text wants a bare handle.
const REQUIRED_CHANNEL = (process.env.REQUIRED_CHANNEL_USERNAME || "zenfituz").replace(/^@/, "");
export const REQUIRED_CHANNEL_USERNAME = REQUIRED_CHANNEL;
export const REQUIRED_CHANNEL_URL = `https://t.me/${REQUIRED_CHANNEL}`;

async function tgApi(method, payload = {}) {
  if (!BOT_TOKEN) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error(`Telegram API xatosi [${method}]:`, err.message);
    return null;
  }
}

/**
 * Whether `telegramId` currently belongs to REQUIRED_CHANNEL.
 *
 * Fails OPEN on anything that isn't a definitive "not a member" — no
 * BOT_TOKEN, a network error, or the bot itself lacking access to the
 * channel (getChatMember needs the bot to be a member, in practice an admin,
 * of the channel it's asked about). A misconfigured gate should never lock
 * out the whole user base; it should just not gate anyone until fixed.
 */
export async function isChannelMember(telegramId) {
  if (!BOT_TOKEN || !telegramId) return true;
  // Local/dev logins use fake ids ("dev-1") that Telegram's API rejects
  // outright — this flag is never set in production, so skipping the gate
  // here can't skip it for a real user.
  if (process.env.ALLOW_DEV_LOGIN === "1") return true;
  const res = await tgApi("getChatMember", { chat_id: `@${REQUIRED_CHANNEL}`, user_id: telegramId });
  if (!res || res.ok === false) {
    if (res) console.error(`[channel-gate] getChatMember failed: ${res.description}`);
    return true;
  }
  const status = res.result?.status;
  return status ? !["left", "kicked"].includes(status) : true;
}

/**
 * Creates the user and an empty profile. The profile is deliberately left
 * incomplete so the Mini App still runs the person through onboarding instead
 * of silently assigning made-up defaults.
 */
async function ensureUser(from) {
  if (!from?.id) return null;
  const telegramId = String(from.id);

  await query(
    `INSERT INTO users (telegram_id, first_name, username, language_code)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (telegram_id) DO UPDATE SET first_name = $2, username = $3, last_seen_at = now()`,
    [telegramId, from.first_name || null, from.username || null, from.language_code || "uz"]
  );

  const user = await queryOne("SELECT * FROM users WHERE telegram_id = $1", [telegramId]);
  await query("INSERT INTO profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [user.id]);
  await query("INSERT INTO subscriptions (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [user.id]);
  return user;
}

const webAppButton = { text: "🥗 ZenFit ilovasini ochish", web_app: { url: MINI_APP_URL } };

const mainReplyKeyboard = {
  keyboard: [
    [webAppButton],
    [{ text: "📊 Profilim" }, { text: "🍎 Bugun" }],
    [{ text: "🏋️ Rejam" }, { text: "🔥 Streak" }],
    [{ text: "🤖 AI Trener" }, { text: "📸 AI Skaner" }],
    [{ text: "👑 Premium" }, { text: "❓ Yordam" }],
  ],
  resize_keyboard: true,
};

const inlineAppButton = { reply_markup: { inline_keyboard: [[webAppButton]] } };

const send = (chatId, text, extra = {}) =>
  tgApi("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", ...extra });

const GOAL_LABELS = { lose: "Ozish 📉", maintain: "Vazn saqlash ⚖️", gain: "Massa yig'ish 📈" };
const LEVEL_LABELS = { beginner: "Yangi boshlovchi", intermediate: "O'rta daraja", advanced: "Tajribali" };
const EQUIPMENT_LABELS = {
  "home-none": "Uyda, jihozsiz",
  "home-dumbbell": "Uyda, gantel bilan",
  gym: "Sport zali",
  outdoor: "Ochiq havo",
};

/** Nudges people who opened the bot but never finished the questionnaire. */
function onboardingPrompt(chatId) {
  return send(
    chatId,
    "⚠️ Siz hali so'rovnomani to'ldirmagansiz.\n\n" +
      "Ilovani ochib 90 soniyada shaxsiy kaloriya me'yori va mashq rejangizni oling 👇",
    inlineAppButton
  );
}

async function cmdProfile(chatId, user) {
  const p = await queryOne("SELECT * FROM profiles WHERE user_id = $1", [user.id]);
  if (!p?.onboarding_completed) return onboardingPrompt(chatId);

  const lines = [
    "<b>📊 Sizning profilingiz</b>",
    "",
    `👤 ${user.first_name || "-"}`,
    `🎂 ${p.age} yosh • 📏 ${p.height_cm} sm • ⚖️ ${p.weight_kg} kg`,
    `🎯 Maqsad: ${GOAL_LABELS[p.goal] || p.goal}`,
    `🏋️ Daraja: ${LEVEL_LABELS[p.fitness_level] || "-"}`,
  ];
  if (p.equipment) lines.push(`🧰 Jihoz: ${EQUIPMENT_LABELS[p.equipment] || p.equipment}`);
  if (p.injuries) lines.push(`🩹 Cheklov: ${p.injuries}`);
  lines.push(
    "",
    `🔥 Kunlik me'yor: <code>${p.daily_calorie_target} kcal</code>`,
    `🥩 Oqsil ${p.protein_target_g}g • 🍞 Uglevod ${p.carbs_target_g}g • 🥑 Yog' ${p.fat_target_g}g`,
    `💧 Suv me'yori: ${p.water_target_ml || 2500} ml`
  );

  return send(chatId, lines.join("\n"), { reply_markup: mainReplyKeyboard });
}

async function cmdToday(chatId, user) {
  const p = await queryOne("SELECT onboarding_completed FROM profiles WHERE user_id = $1", [user.id]);
  if (!p?.onboarding_completed) return onboardingPrompt(chatId);

  const s = await getDayStats(user.id, null, 0);
  const meals = await query(
    "SELECT emoji, name, kcal FROM meals WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 10",
    [user.id]
  );
  const workouts = await query(
    "SELECT emoji, exercise_name, kcal FROM workout_logs WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 10",
    [user.id]
  );

  const pct = s.target ? Math.round((s.kcal / s.target) * 100) : 0;
  const filled = Math.min(10, Math.round(pct / 10));
  const bar = "█".repeat(filled) + "░".repeat(10 - filled);

  const lines = [
    "<b>🍎 Bugungi statistika</b>",
    "",
    `${bar} ${pct}%`,
    "",
    `📥 Iste'mol: <code>${s.kcal} kcal</code>`,
    `🔥 Sarflandi: <code>${s.burned} kcal</code>`,
    `🎯 Me'yor: <code>${s.target} kcal</code>`,
    `⏳ Qolgan: <code>${Math.max(0, s.remaining)} kcal</code>`,
    `💧 Suv: ${s.waterMl}/${s.waterTargetMl} ml`,
    "",
    `🥩 ${s.protein}g • 🍞 ${s.carbs}g • 🥑 ${s.fat}g`,
    "",
    `<b>Ovqatlar (${meals.length}):</b>`,
    meals.length
      ? meals.map((m) => `${m.emoji || "🍽️"} ${m.name} — ${m.kcal} kcal`).join("\n")
      : "<i>Bugun hali ovqat kiritilmagan.</i>",
    "",
    `<b>Mashqlar (${workouts.length}):</b>`,
    workouts.length
      ? workouts.map((w) => `${w.emoji || "🏋️"} ${w.exercise_name} — ${w.kcal} kcal`).join("\n")
      : "<i>Bugun hali mashq kiritilmagan.</i>",
  ];

  return send(chatId, lines.join("\n"), inlineAppButton);
}

async function cmdWorkout(chatId, user) {
  const p = await queryOne("SELECT onboarding_completed FROM profiles WHERE user_id = $1", [user.id]);
  if (!p?.onboarding_completed) return onboardingPrompt(chatId);

  const totals = await queryOne(
    "SELECT COUNT(*) AS c, COALESCE(SUM(kcal),0) AS k FROM workout_logs WHERE user_id = $1",
    [user.id]
  );
  const planRow = await queryOne(
    `SELECT plan_json FROM ai_plans
      WHERE user_id = $1 AND plan_type = 'workout' AND is_active = true
      ORDER BY created_at DESC LIMIT 1`,
    [user.id]
  );
  const plan = planRow ? parseJsonColumn(planRow.plan_json) : null;

  const lines = ["<b>🏋️ Mashq rejangiz</b>", ""];

  if (plan) {
    lines.push(
      `📌 <b>${plan.title || "AI Shaxsiy Reja"}</b>`,
      `📅 Haftasiga ${plan.daysPerWeek} kun • ${plan.rules?.reps || "-"} takror • ${plan.rules?.rest || "-"} dam`,
      ""
    );
    for (const d of plan.days || []) {
      if (d.rest) {
        lines.push(`☕ <b>${d.day}</b> — Dam olish`);
        continue;
      }
      const names = (d.exercises || [])
        .map((e) => `   • ${e.name}${e.suggestedWeightKg ? ` — ${e.suggestedWeightKg} kg` : ""}`)
        .join("\n");
      lines.push(`💪 <b>${d.day} — ${d.label}</b>\n${names}`);
    }
    if (plan.injuryNotes) lines.push("", `⚠️ <i>${plan.injuryNotes}</i>`);
  } else {
    lines.push(
      "<i>Hali reja tuzilmagan.</i>",
      "",
      "Ilovadagi <b>Mashqlar</b> bo'limidan AI reja tuzing — vazningizga mos og'irliklar (kg) bilan."
    );
  }

  lines.push(
    "",
    `📊 Bajarilgan mashqlar: ${Number(totals?.c || 0)} ta`,
    `🔥 Jami sarflangan: ${Number(totals?.k || 0)} kcal`
  );

  return send(chatId, lines.join("\n"), inlineAppButton);
}

async function cmdStreak(chatId, user) {
  const streak = await getStreak(user.id, 0);
  const text =
    streak > 0
      ? `🔥 <b>${streak} kunlik streak!</b>\n\nDavom eting — bugungi ovqat yoki mashqni belgilashni unutmang.`
      : "Streak hali boshlanmagan.\n\nBugun birinchi ovqat yoki mashqni qo'shing va boshlang 💪";
  return send(chatId, text, inlineAppButton);
}

const TRAINER_TEXT =
  "<b>🤖 AI Trener</b>\n\n" +
  "Ilovadagi <b>Trener</b> bo'limida shaxsiy AI trener bilan suhbatlashasiz. U quruq maslahat bermaydi — " +
  "sizning real ma'lumotlaringizni ko'rib turadi:\n\n" +
  "• Profilingiz (yosh, vazn, maqsad, daraja)\n" +
  "• Bugungi kaloriya balansi va makrolar\n" +
  "• So'nggi mashqlaringiz va og'irliklar\n" +
  "• Faol mashq rejangiz va jarohat cheklovlaringiz\n\n" +
  "<i>Masalan so'rang:</i> «Bugun nima yeyishim kerak?», «Tizzam og'riyapti, qanday mashq qilay?», " +
  "«Og'irliklarni qachon oshiray?»";

const SCANNER_TEXT =
  "<b>📸 AI Skaner</b>\n\n" +
  "Taomni suratga oling — AI taom nomini, kaloriya va makrolarini baholaydi va bitta bosishda dietangizga qo'shadi.\n\n" +
  "<b>Ikki rejim:</b>\n" +
  "• <b>Rasm bilan</b> — kamera yoki galereyadan\n" +
  "• <b>Yozib so'rash</b> — «150g tovuq ko'krak va 100g guruch»\n\n" +
  "<b>Aniqroq natija uchun:</b>\n" +
  "• Taomni tepadan yoki 45° burchakdan oling\n" +
  "• Yoniga qoshiq yoki likopcha kiriting — hajmni yaxshiroq baholaydi\n" +
  "• Bir kadrda bitta taom bo'lsin\n\n" +
  "<i>Milliy taomlar (osh, lag'mon, somsa) uchun qiymat taxminiy — uy retseptiga qarab farq qiladi.</i>";

const PREMIUM_TEXT =
  "<b>👑 ZenFit Premium</b>\n\n" +
  "✅ Cheksiz AI ovqat skaneri\n" +
  "✅ Cheksiz AI trener suhbati\n" +
  "✅ Barcha trener dasturlari\n" +
  "✅ Shaxsiy AI mashq va ovqat rejasi\n" +
  "✅ Kengaytirilgan progress tahlili\n\n" +
  "<i>Faollashtirish uchun ilovaning Profil bo'limini oching:</i>";

const HELP_TEXT =
  "<b>❓ ZenFit yordam</b>\n\n" +
  "<b>Buyruqlar:</b>\n" +
  "/start — Boshlash\n" +
  "/profile — Profil va kunlik me'yorlar\n" +
  "/today — Bugungi kaloriya va mashq statistikasi\n" +
  "/workout — Faol mashq rejangiz\n" +
  "/streak — Streak holati\n" +
  "/trainer — AI trener haqida\n" +
  "/scan — AI skaner haqida\n" +
  "/premium — Premium obuna\n" +
  "/help — Shu yordam\n\n" +
  "Ilovada qo'shgan har bir ovqat va mashq shu yerdagi statistikaga darhol tushadi.";

const channelGateKeyboard = () => ({
  reply_markup: {
    inline_keyboard: [
      [{ text: "📢 Kanalga o'tish", url: REQUIRED_CHANNEL_URL }],
      [{ text: "✅ Obuna bo'ldim, tekshirish", callback_data: "check_sub" }],
    ],
  },
});

async function cmdStart(chatId, from) {
  if (!(await isChannelMember(from?.id))) {
    return send(
      chatId,
      `📢 Ilovadan foydalanish uchun avval <b>@${REQUIRED_CHANNEL}</b> kanaliga obuna bo'ling.\n\n` +
        "Obuna bo'lgach, pastdagi tugmani bosing 👇",
      channelGateKeyboard()
    );
  }

  const name = from?.first_name || "Do'stim";
  await send(
    chatId,
    `Assalomu alaykum, <b>${name}</b>! 👋\n\n` +
      "<b>ZenFit</b> — ovqatlanish va mashqni bitta AI orqali boshqaradigan shaxsiy hamrohingiz.\n\n" +
      "• 🎯 Shaxsiy kaloriya va makro me'yori\n" +
      "• 🏋️ Vazningizga mos og'irliklar (kg) bilan mashq rejasi\n" +
      "• 📸 Taom rasmini skanerlab kaloriya hisoblash\n" +
      "• 🤖 Ma'lumotlaringizni ko'rib turadigan AI trener\n\n" +
      "90 soniyada shaxsiy rejangizni oling 👇",
    inlineAppButton
  );
  return send(chatId, "Menyudan tanlang:", { reply_markup: mainReplyKeyboard });
}

/** Maps both slash commands and reply-keyboard labels to one handler. */
const ROUTES = [
  { match: (t) => t.startsWith("/start"), run: (chatId, user, from) => cmdStart(chatId, from) },
  { match: (t) => t === "/profile" || t === "📊 Profilim", run: cmdProfile },
  { match: (t) => t === "/today" || t === "🍎 Bugun", run: cmdToday },
  { match: (t) => t === "/workout" || t === "🏋️ Rejam", run: cmdWorkout },
  { match: (t) => t === "/streak" || t === "🔥 Streak", run: cmdStreak },
  { match: (t) => t === "/trainer" || t === "🤖 AI Trener", run: (chatId) => send(chatId, TRAINER_TEXT, inlineAppButton) },
  { match: (t) => t === "/scan" || t === "📸 AI Skaner", run: (chatId) => send(chatId, SCANNER_TEXT, inlineAppButton) },
  { match: (t) => t === "/premium" || t === "👑 Premium", run: (chatId) => send(chatId, PREMIUM_TEXT, inlineAppButton) },
  { match: (t) => t === "/help" || t === "❓ Yordam", run: (chatId) => send(chatId, HELP_TEXT, inlineAppButton) },
];

async function handleMessage(msg) {
  if (!msg?.chat?.id) return;
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();
  const user = await ensureUser(msg.from);
  if (!user) return;

  const route = ROUTES.find((r) => r.match(text));
  if (route) return route.run(chatId, user, msg.from);

  return send(chatId, "Menyudan tanlang yoki ilovani oching:", { reply_markup: mainReplyKeyboard });
}

/** The "✅ Obuna bo'ldim, tekshirish" button under the channel-gate message. */
async function handleCallbackQuery(cb) {
  if (cb?.data !== "check_sub") return;
  const chatId = cb.message?.chat?.id;
  if (!chatId) return;

  if (await isChannelMember(cb.from?.id)) {
    await tgApi("answerCallbackQuery", { callback_query_id: cb.id, text: "Obuna tasdiqlandi ✅" });
    await cmdStart(chatId, cb.from);
  } else {
    await tgApi("answerCallbackQuery", {
      callback_query_id: cb.id,
      text: "Hali obuna bo'lmagansiz — kanalga o'tib obuna bo'ling.",
      show_alert: true,
    });
  }
}

/** Single entry point shared by webhook and polling modes. */
export async function handleUpdate(update) {
  if (update?.message) await handleMessage(update.message);
  else if (update?.callback_query) await handleCallbackQuery(update.callback_query);
}

/* ------------------------------------------------------------------ *
 * Local development: long polling.
 * On serverless hosts use the webhook route instead — a long-lived poll
 * loop cannot survive between invocations.
 * ------------------------------------------------------------------ */

let offset = 0;
let isPolling = false;

export function startBotPolling() {
  if (!BOT_TOKEN) {
    console.log("⚠️  BOT_TOKEN topilmadi — bot polling o'tkazib yuborildi.");
    return;
  }
  if (isPolling) return;
  isPolling = true;
  console.log("🤖 Telegram bot polling ishga tushdi");

  const poll = async () => {
    try {
      const res = await tgApi("getUpdates", { offset, timeout: 20 });
      if (res?.ok && Array.isArray(res.result)) {
        for (const update of res.result) {
          offset = update.update_id + 1;
          try {
            await handleUpdate(update);
          } catch (err) {
            console.error("Bot xabar xatosi:", err.message);
          }
        }
      }
    } catch (err) {
      console.error("Bot polling xatosi:", err.message);
    } finally {
      if (isPolling) setTimeout(poll, 1000);
    }
  };
  poll();
}

export async function sendTelegramNotification(chatId, text) {
  return tgApi("sendMessage", { chat_id: chatId, text, parse_mode: "HTML" });
}

/** Resolves a stored file_id to a temporary download URL for the admin panel. */
export async function getTelegramFileUrl(fileId) {
  if (!BOT_TOKEN || !fileId) return null;
  const info = await tgApi("getFile", { file_id: fileId });
  const path = info?.result?.file_path;
  return path ? `https://api.telegram.org/file/bot${BOT_TOKEN}/${path}` : null;
}

export async function sendMarketingPush(telegramId, type = "streak") {
  if (!BOT_TOKEN) return false;
  const user = await queryOne("SELECT * FROM users WHERE telegram_id = $1", [String(telegramId)]);
  if (!user) return false;

  const messages = {
    streak: "🔥 <b>Streak'ingizni yo'qotmang!</b>\n\nBugungi ovqat yoki mashqingizni belgilang va ketma-ketlikni saqlab qoling.",
    motivation: "🎯 <b>Maqsadingiz sari yana bir qadam!</b>\n\nHar bir kichik o'zgarish katta natijaga olib keladi. Bugungi mashqni unutmang.",
    health: "💧 <b>Suv ichishni unutmang!</b>\n\nKun davomida yetarlicha suv iching va yaxshi dam oling — tiklanish shundan boshlanadi.",
  };

  const res = await send(telegramId, messages[type] || messages.streak, inlineAppButton);
  return Boolean(res?.ok);
}

/* ------------------------------------------------------------------ *
 * One-time setup helpers (invoked by scripts/setup-bot.js)
 * ------------------------------------------------------------------ */

export async function setWebhook(url, secretToken) {
  return tgApi("setWebhook", {
    url,
    secret_token: secretToken || undefined,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
}

export const deleteWebhook = () => tgApi("deleteWebhook", { drop_pending_updates: true });
export const getWebhookInfo = () => tgApi("getWebhookInfo");

export async function setMenuButton(url = MINI_APP_URL) {
  return tgApi("setChatMenuButton", {
    menu_button: { type: "web_app", text: "🥗 ZenFit", web_app: { url } },
  });
}

export async function setCommands() {
  return tgApi("setMyCommands", {
    commands: [
      { command: "start", description: "Boshlash" },
      { command: "profile", description: "Profil va kunlik me'yorlar" },
      { command: "today", description: "Bugungi statistika" },
      { command: "workout", description: "Mashq rejam" },
      { command: "streak", description: "Streak holati" },
      { command: "trainer", description: "AI trener haqida" },
      { command: "scan", description: "AI skaner haqida" },
      { command: "premium", description: "Premium obuna" },
      { command: "help", description: "Yordam" },
    ],
  });
}
