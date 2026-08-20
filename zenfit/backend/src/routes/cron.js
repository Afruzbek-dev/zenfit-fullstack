import { Router } from "express";
import crypto from "node:crypto";
import { query } from "../db.js";
import { dayRange } from "../lib/stats.js";
import { sendTelegramNotification } from "../bot.js";
import { runPool, SEND_DEADLINE_MS } from "../lib/pool.js";

const router = Router();

/**
 * Scheduled reminders.
 *
 * Triggered by Vercel Cron, which sends `Authorization: Bearer $CRON_SECRET`.
 * Without a configured secret the endpoint stays closed rather than letting
 * anyone on the internet make the bot message every user.
 */
function authorized(req) {
  const expected = process.env.CRON_SECRET;
  if (!expected || expected.length < 16) return false;
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return false;
  const provided = Buffer.from(header.slice(7));
  const wanted = Buffer.from(expected);
  return provided.length === wanted.length && crypto.timingSafeEqual(provided, wanted);
}

const MESSAGES = {
  meal: {
    uz: "🍽 Bugun hali ovqat belgilamadingiz. Kunlik me'yorni kuzatib borish uchun ZenFit'ni oching.",
    ru: "🍽 Сегодня вы ещё не отмечали приёмы пищи. Откройте ZenFit, чтобы вести дневную норму.",
    en: "🍽 You haven't logged a meal today. Open ZenFit to keep your daily target on track.",
  },
  workout: {
    uz: "💪 Bugun mashq belgilanmagan. 20 daqiqa ham streak'ni saqlab qoladi!",
    ru: "💪 Сегодня тренировка не отмечена. Даже 20 минут сохранят вашу серию!",
    en: "💪 No workout logged today. Even 20 minutes keeps your streak alive!",
  },
  water: {
    uz: "💧 Suv ichishni unutmang — kunlik me'yoringizga yetish uchun ZenFit'da belgilab boring.",
    ru: "💧 Не забывайте пить воду — отмечайте в ZenFit, чтобы дойти до дневной нормы.",
    en: "💧 Don't forget to drink water — log it in ZenFit to reach your daily target.",
  },
  morning: {
    uz: "🌅 <b>Xayrli tong!</b>\n\nBugungi mashq sizni kutmoqda. Ertalabki mashq kun bo'yi energiya beradi — ZenFit'ni oching va boshlang!",
    ru: "🌅 <b>Доброе утро!</b>\n\nСегодняшняя тренировка ждёт вас. Утренняя тренировка заряжает на весь день — откройте ZenFit и начните!",
    en: "🌅 <b>Good morning!</b>\n\nToday's workout is waiting. Training in the morning sets up the whole day — open ZenFit and get started!",
  },
  morningLate: {
    uz: "⏰ <b>Mashqni unutmadingizmi?</b>\n\nHali ham vaqt bor — 20 daqiqalik mashq ham natija beradi. Bugungi kunni bo'sh o'tkazmang!",
    ru: "⏰ <b>Не забыли про тренировку?</b>\n\nВремя ещё есть — даже 20 минут дадут результат. Не пропускайте сегодняшний день!",
    en: "⏰ <b>Forgot your workout?</b>\n\nThere's still time — even 20 minutes counts. Don't let today go by!",
  },
  trialEnding: {
    uz: "⏳ <b>Bepul sinov muddati tugayapti!</b>\n\n3 kunlik Premium sinovingiz 24 soatdan kamroq vaqtda tugaydi. Maqsadingizga erishish uchun vaqtni behuda ketkazmang — rejangizni yo'qotmaslik uchun hozir obuna bo'ling.",
    ru: "⏳ <b>Пробный период скоро закончится!</b>\n\nВаш 3-дневный Premium доступ истекает менее чем через 24 часа. Не теряйте время на пути к цели — оформите подписку сейчас, чтобы не потерять свой план.",
    en: "⏳ <b>Your free trial is ending soon!</b>\n\nYour 3-day Premium trial ends in less than 24 hours. Don't lose momentum toward your goal — subscribe now to keep your plan.",
  },
};

/**
 * Reminder slots.
 *
 * `morning` and `morningLate` are the 06:00 and 08:00 nudges to train; the
 * default slot is the evening catch-all that picks whichever of meal, workout
 * or water is missing. Each slot is a separate cron entry hitting the same
 * endpoint, so adding a time never means adding code.
 */
const SLOTS = new Set(["morning", "morningLate", "evening"]);

/**
 * One nudge per user per run, chosen by what is actually missing today.
 * Users who already logged something are left alone.
 */
async function reminders(req, res, next) {
  if (!authorized(req)) return res.status(401).json({ error: "unauthorized" });

  // `dry=1` reports who would be messaged without sending anything, so the job
  // can be verified against real data safely.
  const dry = req.query.dry === "1";
  const slot = SLOTS.has(req.query.slot) ? req.query.slot : "evening";
  const tz = Number(req.query.tz) || -300; // Uzbekistan is UTC+5

  try {
    const { start, end } = dayRange(null, tz);
    const runStarted = Date.now();

    const rows = await query(
      `SELECT u.id, u.telegram_id, p.language, p.notif_meal, p.notif_workout, p.notif_water, p.notif_tips,
              s.plan AS sub_plan, s.status AS sub_status, s.expires_at AS sub_expires_at,
              (SELECT COUNT(*) FROM meals m WHERE m.user_id = u.id AND m.logged_at >= $1 AND m.logged_at < $2) AS meals,
              (SELECT COUNT(*) FROM workout_logs w WHERE w.user_id = u.id AND w.logged_at >= $1 AND w.logged_at < $2) AS workouts,
              (SELECT COUNT(*) FROM activities a WHERE a.user_id = u.id AND a.logged_at >= $1 AND a.logged_at < $2) AS activities,
              (SELECT COALESCE(SUM(ml), 0) FROM water_logs wl WHERE wl.user_id = u.id AND wl.logged_at >= $1 AND wl.logged_at < $2) AS water
         FROM users u
         JOIN profiles p ON p.user_id = u.id
         LEFT JOIN subscriptions s ON s.user_id = u.id
        WHERE p.onboarding_completed = true`,
      [start, end]
    );

    const planned = [];
    for (const r of rows) {
      const lang = MESSAGES.meal[r.language] ? r.language : "uz";
      const on = (v) => v === true || v === 1;
      const trainedToday = Number(r.workouts) > 0 || Number(r.activities) > 0;

      // Within 24h of the 3-day trial expiring. Only checked in the evening
      // slot, so it fires once — the trial is shorter than the 3 daily slots'
      // combined span, and this is the only slot not already claimed by a
      // time-of-day-specific message.
      const msLeft = r.sub_expires_at ? new Date(r.sub_expires_at).getTime() - runStarted : null;
      const trialEndingSoon =
        slot === "evening" && r.sub_plan === "trial" && r.sub_status === "active" &&
        msLeft != null && msLeft > 0 && msLeft < 24 * 3600 * 1000;

      let kind = null;
      if (slot === "morning" || slot === "morningLate") {
        // Morning slots are only about training, and anyone who already moved
        // today should not be nagged about it.
        if (on(r.notif_workout) && !trainedToday) kind = slot;
      } else if (trialEndingSoon && on(r.notif_tips)) {
        kind = "trialEnding";
      } else if (on(r.notif_meal) && Number(r.meals) === 0) {
        kind = "meal";
      } else if (on(r.notif_workout) && !trainedToday) {
        kind = "workout";
      } else if (on(r.notif_water) && Number(r.water) === 0) {
        kind = "water";
      }
      if (!kind) continue;

      planned.push({ userId: r.id, telegramId: r.telegram_id, kind, lang });
    }

    if (dry) return res.json({ dryRun: true, slot, candidates: planned.length, planned });

    let sent = 0;
    const { started, stopped } = await runPool(
      planned,
      async (p) => {
        // One failure (blocked bot, deleted chat) must not stop the rest.
        try {
          const ok = await sendTelegramNotification(p.telegramId, MESSAGES[p.kind][p.lang]);
          if (ok !== false) sent += 1;
        } catch (err) {
          console.error("[cron] eslatma yuborilmadi:", p.telegramId, err.message);
        }
      },
      { shouldStop: () => Date.now() - runStarted > SEND_DEADLINE_MS }
    );

    res.json({ slot, candidates: planned.length, started, sent, stopped });
  } catch (err) {
    next(err);
  }
}

// Vercel Cron invokes the path with GET; POST is kept for manual runs.
router.get("/reminders", reminders);
router.post("/reminders", reminders);

export default router;
