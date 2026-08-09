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
 * Sends in flight at once.
 *
 * The loop used to be serial: at ~200 ms a Telegram call that is five users a
 * second, and vercel.json caps the function at 30 s, so the run died at roughly
 * 150 users with the tail of the list silently getting nothing.
 *
 * Not "fire them all at once", though. Telegram's bulk guidance is about 30
 * messages a second, and a few hundred simultaneous requests earn 429s instead
 * of delivery. Sixteen lanes is the compromise the send budget is sized around;
 * note that the resulting dispatch rate is a function of Telegram's latency
 * (sixteen lanes at 200 ms is ~80/s), so if 429s ever show up in the per-user
 * logs this is the number to lower.
 */
const SEND_CONCURRENCY = 16;

/**
 * Stop dispatching this far into the run.
 *
 * vercel.json allows 30 s. Being killed at the limit is exactly the failure
 * being fixed — no response, no record of where it stopped. Stopping at 24 s
 * leaves room for the sends still in flight to land and for the handler to
 * return a count that admits it did not finish.
 */
const SEND_DEADLINE_MS = 24_000;

/**
 * Runs `worker` over `items` with at most `concurrency` in flight, abandoning
 * the rest when `shouldStop()` turns true.
 *
 * Lanes pull from a shared cursor instead of being handed a fixed slice, so one
 * slow send does not leave the other lanes idle waiting for it at the end of a
 * run. Nothing here knows about reminders or Telegram — it is exported so the
 * pacing can be tested against a fake task, with no token and no network.
 *
 * `worker` is expected to handle its own failures: a throw propagates and takes
 * the pool down with it. The reminder worker below wraps its whole body.
 *
 * @returns {Promise<{started: number, stopped: boolean}>} how many items were
 *   handed to a worker, and whether the deadline cut the run short.
 */
export async function runPool(items, worker, { concurrency = SEND_CONCURRENCY, shouldStop = () => false } = {}) {
  const lanes = Math.max(1, Math.min(concurrency, items.length));
  let cursor = 0;
  let started = 0;
  let stopped = false;

  async function lane() {
    for (;;) {
      if (shouldStop()) {
        stopped = true;
        return;
      }
      const index = cursor++;
      if (index >= items.length) return;
      started += 1;
      await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: lanes }, lane));
  return { started, stopped };
}

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
      const lang = MESSAGES.meal[r.language] ? r.language : "uz";
      const on = (v) => v === true || v === 1;
      const trainedToday = Number(r.workouts) > 0 || Number(r.activities) > 0;

      let kind = null;
      if (slot === "morning" || slot === "morningLate") {
        // Morning slots are only about training, and anyone who already moved
        // today should not be nagged about it.
        if (on(r.notif_workout) && !trainedToday) kind = slot;
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
    for (const p of planned) {
      // One failure (blocked bot, deleted chat) must not stop the rest.
      try {
        const ok = await sendTelegramNotification(p.telegramId, MESSAGES[p.kind][p.lang]);
        if (ok !== false) sent += 1;
      } catch (err) {
        console.error("[cron] eslatma yuborilmadi:", p.telegramId, err.message);
      }
    }

    res.json({ slot, candidates: planned.length, sent });
  } catch (err) {
    next(err);
  }
}

// Vercel Cron invokes the path with GET; POST is kept for manual runs.
router.get("/reminders", reminders);
router.post("/reminders", reminders);

export default router;
