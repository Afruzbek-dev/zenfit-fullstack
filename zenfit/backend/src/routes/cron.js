import { Router } from "express";
import crypto from "node:crypto";
import { query } from "../db.js";
import { dayRange } from "../lib/stats.js";
import { sendTelegramNotification } from "../bot.js";

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
  },
  workout: {
    uz: "💪 Bugun mashq belgilanmagan. 20 daqiqa ham streak'ni saqlab qoladi!",
    ru: "💪 Сегодня тренировка не отмечена. Даже 20 минут сохранят вашу серию!",
  },
  water: {
    uz: "💧 Suv ichishni unutmang — kunlik me'yoringizga yetish uchun ZenFit'da belgilab boring.",
    ru: "💧 Не забывайте пить воду — отмечайте в ZenFit, чтобы дойти до дневной нормы.",
  },
};

/**
 * One nudge per user per run, chosen by what is actually missing today.
 * Users who already logged something are left alone.
 */
async function reminders(req, res, next) {
  if (!authorized(req)) return res.status(401).json({ error: "unauthorized" });

  // `dry=1` reports who would be messaged without sending anything, so the job
  // can be verified against real data safely.
  const dry = req.query.dry === "1";
  const tz = Number(req.query.tz) || -300; // Uzbekistan is UTC+5

  try {
    const { start, end } = dayRange(null, tz);

    const rows = await query(
      `SELECT u.id, u.telegram_id, p.language, p.notif_meal, p.notif_workout, p.notif_water,
              (SELECT COUNT(*) FROM meals m WHERE m.user_id = u.id AND m.logged_at >= $1 AND m.logged_at < $2) AS meals,
              (SELECT COUNT(*) FROM workout_logs w WHERE w.user_id = u.id AND w.logged_at >= $1 AND w.logged_at < $2) AS workouts,
              (SELECT COUNT(*) FROM activities a WHERE a.user_id = u.id AND a.logged_at >= $1 AND a.logged_at < $2) AS activities,
              (SELECT COALESCE(SUM(ml), 0) FROM water_logs wl WHERE wl.user_id = u.id AND wl.logged_at >= $1 AND wl.logged_at < $2) AS water
         FROM users u
         JOIN profiles p ON p.user_id = u.id
        WHERE p.onboarding_completed = true`,
      [start, end]
    );

    const planned = [];
    for (const r of rows) {
      const lang = r.language === "ru" ? "ru" : "uz";
      const on = (v) => v === true || v === 1;

      let kind = null;
      if (on(r.notif_meal) && Number(r.meals) === 0) kind = "meal";
      else if (on(r.notif_workout) && Number(r.workouts) === 0 && Number(r.activities) === 0) kind = "workout";
      else if (on(r.notif_water) && Number(r.water) === 0) kind = "water";
      if (!kind) continue;

      planned.push({ userId: r.id, telegramId: r.telegram_id, kind, lang });
    }

    if (dry) return res.json({ dryRun: true, candidates: planned.length, planned });

    let sent = 0;
    for (const p of planned) {
      // One failure (blocked bot, deleted chat) must not stop the rest.
      try {
        const ok = await sendTelegramNotification(p.telegramId, MESSAGES[p.kind][p.lang]);
        if (ok !== false) sent += 1;
      } catch (err) {
        console.error("[cron] eslatma yuborilmadi:", p.telegramId, err.message);
      }
    }

    res.json({ candidates: planned.length, sent });
  } catch (err) {
    next(err);
  }
}

// Vercel Cron invokes the path with GET; POST is kept for manual runs.
router.get("/reminders", reminders);
router.post("/reminders", reminders);

export default router;
