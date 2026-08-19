import { Router } from "express";
import crypto from "node:crypto";
import { query, queryOne, daysAgoIso } from "../db.js";
import { signToken, verifyToken } from "../lib/jwt.js";
import { getSettings, setSettings, SETTING_KEYS } from "../lib/settings.js";
import { getTelegramFileUrl, sendTelegramNotification } from "../bot.js";
import { PLANS } from "./payment.js";
import { rewardReferralConversion } from "../lib/referrals.js";

const router = Router();

const num = (v) => Number(v || 0);

function adminSecret() {
  const s = process.env.ADMIN_SECRET;
  return s && s.length >= 16 ? s : null;
}

function secretMatches(provided) {
  const expected = adminSecret();
  if (!expected || typeof provided !== "string") return false;
  // Compare BYTES, not characters. timingSafeEqual throws when the two buffers
  // differ in length, and a JS string length is UTF-16 code units — so a guess
  // containing any non-ASCII character passes a character-length check and then
  // makes timingSafeEqual throw. In an async handler that rejection is unhandled
  // and takes the whole process down, which made this an unauthenticated crash.
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Exchanges the admin secret for a short-lived token.
 *
 * Deliberately outside the guard below: the panel logs in once and then sends a
 * bearer token, so the raw secret is not repeated on every request or parked in
 * browser storage. Rate limited by the constant-time compare plus a delay on
 * failure, which is enough for a single-admin surface.
 */
router.post("/login", async (req, res) => {
  if (!adminSecret()) {
    return res.status(503).json({ error: "admin_disabled", message: "ADMIN_SECRET sozlanmagan." });
  }
  if (!secretMatches(req.body?.secret)) {
    await new Promise((r) => setTimeout(r, 600));
    return res.status(401).json({ error: "unauthorized", message: "Parol noto'g'ri." });
  }
  res.json({ token: signToken({ sub: "admin", role: "admin" }), expiresInDays: 30 });
});

/**
 * Admin auth. Fails closed: with no ADMIN_SECRET configured the whole admin
 * surface is disabled rather than falling back to a guessable default.
 * Accepts either the login token or the raw key (for scripts and curl).
 */
router.use((req, res, next) => {
  if (!adminSecret()) {
    console.error("[admin] ADMIN_SECRET o'rnatilmagan (yoki juda qisqa) — admin API o'chirilgan.");
    return res.status(503).json({ error: "admin_disabled", message: "ADMIN_SECRET sozlanmagan." });
  }

  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) {
    const payload = verifyToken(header.slice(7));
    if (payload?.role === "admin") return next();
  }

  if (secretMatches(req.headers["x-admin-key"])) return next();

  return res.status(401).json({ error: "unauthorized" });
});

/* ---------------------------- finance ---------------------------- */

/** Start of the current day/week/month, and of the previous period, in UTC. */
function periods() {
  const now = new Date();

  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);

  // Weeks start Monday, which is how the business reads them locally.
  const weekStart = new Date(dayStart);
  const dow = (weekStart.getUTCDay() + 6) % 7;
  weekStart.setUTCDate(weekStart.getUTCDate() - dow);
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setUTCDate(prevWeekStart.getUTCDate() - 7);

  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const prevMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));

  return {
    day: dayStart.toISOString(),
    week: weekStart.toISOString(),
    prevWeek: prevWeekStart.toISOString(),
    month: monthStart.toISOString(),
    prevMonth: prevMonthStart.toISOString(),
  };
}

/** Percent change, with null when there is no baseline to compare against. */
function delta(current, previous) {
  if (!previous) return current > 0 ? null : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

async function revenueBetween(from, to) {
  const row = await queryOne(
    to
      ? `SELECT COALESCE(SUM(amount_uzs),0) AS total, COUNT(*) AS count FROM payments
          WHERE status = 'paid' AND paid_at >= $1 AND paid_at < $2`
      : `SELECT COALESCE(SUM(amount_uzs),0) AS total, COUNT(*) AS count FROM payments
          WHERE status = 'paid' AND paid_at >= $1`,
    to ? [from, to] : [from]
  );
  return { total: num(row?.total), count: num(row?.count) };
}

router.get("/finance", async (req, res, next) => {
  try {
    const p = periods();

    const [
      thisMonth, prevMonth, thisWeek, prevWeek, today,
      allTime, activePremium, pendingReview, planBreakdown, recent,
    ] = await Promise.all([
      revenueBetween(p.month),
      revenueBetween(p.prevMonth, p.month),
      revenueBetween(p.week),
      revenueBetween(p.prevWeek, p.week),
      revenueBetween(p.day),
      revenueBetween("1970-01-01T00:00:00.000Z"),
      queryOne(
        `SELECT COUNT(*) AS c FROM subscriptions
          WHERE status = 'active' AND (expires_at IS NULL OR expires_at > now())`
      ),
      queryOne("SELECT COUNT(*) AS c FROM payments WHERE status = 'awaiting_review'"),
      query(
        `SELECT plan_id, COUNT(*) AS count, COALESCE(SUM(amount_uzs),0) AS total
           FROM payments WHERE status = 'paid' GROUP BY plan_id`
      ),
      query(
        `SELECT p.*, u.first_name, u.username FROM payments p
           JOIN users u ON u.id = p.user_id
          WHERE p.status = 'paid' ORDER BY p.paid_at DESC LIMIT 10`
      ),
    ]);

    res.json({
      revenue: {
        today: today.total,
        week: thisWeek.total,
        prevWeek: prevWeek.total,
        weekDelta: delta(thisWeek.total, prevWeek.total),
        month: thisMonth.total,
        prevMonth: prevMonth.total,
        monthDelta: delta(thisMonth.total, prevMonth.total),
        allTime: allTime.total,
      },
      sales: {
        week: thisWeek.count,
        prevWeek: prevWeek.count,
        weekDelta: delta(thisWeek.count, prevWeek.count),
        month: thisMonth.count,
        prevMonth: prevMonth.count,
        monthDelta: delta(thisMonth.count, prevMonth.count),
        allTime: allTime.count,
      },
      activePremium: num(activePremium?.c),
      pendingReview: num(pendingReview?.c),
      planBreakdown: planBreakdown.map((r) => ({
        planId: r.plan_id,
        // Admin grants are recorded under a synthetic "manual" plan id.
        title: PLANS[r.plan_id]?.title || (r.plan_id === "manual" ? "Qo'lda berilgan" : r.plan_id),
        count: num(r.count),
        total: num(r.total),
      })),
      recentSales: recent.map((r) => ({
        id: r.id,
        userId: r.user_id,
        name: r.first_name,
        username: r.username,
        planTitle: r.plan_title,
        amountUzs: r.amount_uzs,
        method: r.method,
        paidAt: r.paid_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/* ----------------------- overview statistics ---------------------- */

router.get("/stats", async (req, res, next) => {
  try {
    const p = periods();
    const monthAgo = daysAgoIso(30);

    const [
      totalUsers, activeToday, activeWeek, totalMeals, totalWorkouts, totalActivities,
      newToday, newWeek, prevWeekUsers, avgTarget,
      goalDist, genderDist, levelDist, langDist, signups,
    ] = await Promise.all([
      queryOne("SELECT COUNT(*) AS c FROM users"),
      queryOne(
        `SELECT COUNT(DISTINCT user_id) AS c FROM (
           SELECT user_id FROM meals WHERE logged_at >= $1
           UNION SELECT user_id FROM workout_logs WHERE logged_at >= $1
           UNION SELECT user_id FROM activities WHERE logged_at >= $1
         ) t`,
        [p.day]
      ),
      queryOne(
        `SELECT COUNT(DISTINCT user_id) AS c FROM (
           SELECT user_id FROM meals WHERE logged_at >= $1
           UNION SELECT user_id FROM workout_logs WHERE logged_at >= $1
           UNION SELECT user_id FROM activities WHERE logged_at >= $1
         ) t`,
        [p.week]
      ),
      queryOne("SELECT COUNT(*) AS c FROM meals"),
      queryOne("SELECT COUNT(*) AS c FROM workout_logs"),
      queryOne("SELECT COUNT(*) AS c FROM activities"),
      queryOne("SELECT COUNT(*) AS c FROM users WHERE created_at >= $1", [p.day]),
      queryOne("SELECT COUNT(*) AS c FROM users WHERE created_at >= $1", [p.week]),
      queryOne("SELECT COUNT(*) AS c FROM users WHERE created_at >= $1 AND created_at < $2", [p.prevWeek, p.week]),
      queryOne("SELECT COALESCE(AVG(daily_calorie_target),0) AS c FROM profiles WHERE daily_calorie_target IS NOT NULL"),
      query("SELECT goal, COUNT(*) AS count FROM profiles WHERE goal IS NOT NULL GROUP BY goal"),
      query("SELECT gender, COUNT(*) AS count FROM profiles WHERE gender IS NOT NULL GROUP BY gender"),
      query("SELECT fitness_level, COUNT(*) AS count FROM profiles WHERE fitness_level IS NOT NULL GROUP BY fitness_level"),
      query("SELECT language, COUNT(*) AS count FROM profiles WHERE language IS NOT NULL GROUP BY language"),
      query("SELECT created_at FROM users WHERE created_at >= $1", [monthAgo]),
    ]);

    const byDay = new Map();
    signups.forEach((u) => {
      const d = new Date(u.created_at).toISOString().slice(0, 10);
      byDay.set(d, (byDay.get(d) || 0) + 1);
    });

    res.json({
      totalUsers: num(totalUsers?.c),
      activeToday: num(activeToday?.c),
      activeThisWeek: num(activeWeek?.c),
      totalMeals: num(totalMeals?.c),
      totalWorkouts: num(totalWorkouts?.c),
      totalActivities: num(totalActivities?.c),
      newUsersToday: num(newToday?.c),
      newUsersThisWeek: num(newWeek?.c),
      newUsersPrevWeek: num(prevWeekUsers?.c),
      newUsersWeekDelta: delta(num(newWeek?.c), num(prevWeekUsers?.c)),
      avgCalorieTarget: Math.round(num(avgTarget?.c)),
      goalDistribution: goalDist,
      genderDistribution: genderDist,
      fitnessLevelDistribution: levelDist,
      languageDistribution: langDist,
      dailySignups: [...byDay.entries()].sort().map(([date, count]) => ({ date, count })),
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------ users ----------------------------- */

router.get("/users", async (req, res, next) => {
  try {
    const search = `%${req.query.search || ""}%`;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = parseInt(req.query.offset, 10) || 0;

    const [total, users] = await Promise.all([
      queryOne(
        `SELECT COUNT(*) AS c FROM users u
          WHERE u.first_name LIKE $1 OR u.username LIKE $1 OR u.telegram_id LIKE $1`,
        [search]
      ),
      query(
        `SELECT u.id, u.telegram_id, u.first_name, u.username, u.avatar_url, u.created_at, u.last_seen_at,
                p.gender, p.age, p.height_cm, p.weight_kg, p.goal, p.fitness_level, p.language,
                p.daily_calorie_target, p.onboarding_completed,
                s.plan, s.status AS sub_status, s.expires_at
           FROM users u
           LEFT JOIN profiles p ON u.id = p.user_id
           LEFT JOIN subscriptions s ON u.id = s.user_id
          WHERE u.first_name LIKE $1 OR u.username LIKE $1 OR u.telegram_id LIKE $1
          ORDER BY u.created_at DESC
          LIMIT $2 OFFSET $3`,
        [search, limit, offset]
      ),
    ]);

    res.json({ total: num(total?.c), limit, offset, users });
  } catch (err) {
    next(err);
  }
});

/** Everything known about one user, for the detail card. */
router.get("/users/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await queryOne(
      `SELECT u.*, p.* FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.id = $1`,
      [id]
    );
    if (!user) return res.status(404).json({ error: "not_found" });

    const [
      subscription, recentMeals, recentWorkouts, recentActivities, weightHistory, payments,
      mealCount, workoutCount, activityCount, chatCount, consumed, burned, plans,
    ] = await Promise.all([
      queryOne("SELECT * FROM subscriptions WHERE user_id = $1", [id]),
      query("SELECT * FROM meals WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 15", [id]),
      query("SELECT * FROM workout_logs WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 15", [id]),
      query("SELECT * FROM activities WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 15", [id]),
      query("SELECT weight_kg, recorded_at FROM weight_history WHERE user_id = $1 ORDER BY recorded_at ASC LIMIT 100", [id]),
      query("SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20", [id]),
      queryOne("SELECT COUNT(*) AS c FROM meals WHERE user_id = $1", [id]),
      queryOne("SELECT COUNT(*) AS c FROM workout_logs WHERE user_id = $1", [id]),
      queryOne("SELECT COUNT(*) AS c FROM activities WHERE user_id = $1", [id]),
      queryOne("SELECT COUNT(*) AS c FROM chat_messages WHERE user_id = $1", [id]),
      queryOne("SELECT COALESCE(SUM(kcal),0) AS c FROM meals WHERE user_id = $1", [id]),
      queryOne("SELECT COALESCE(SUM(kcal),0) AS c FROM workout_logs WHERE user_id = $1", [id]),
      query("SELECT plan_type, is_active, created_at FROM ai_plans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5", [id]),
    ]);

    res.json({
      user,
      subscription,
      recentMeals,
      recentWorkouts,
      recentActivities,
      weightHistory,
      payments,
      plans,
      stats: {
        totalMeals: num(mealCount?.c),
        totalWorkouts: num(workoutCount?.c),
        totalActivities: num(activityCount?.c),
        totalChatMessages: num(chatCount?.c),
        totalCaloriesConsumed: num(consumed?.c),
        totalCaloriesBurned: num(burned?.c),
      },
    });
  } catch (err) {
    next(err);
  }
});

/* --------------------- manual premium control --------------------- */

/**
 * Grants or extends premium by hand. This is the only path to premium until a
 * payment provider is live, so it records a payment row too and the finance
 * numbers stay honest about where the money came from.
 */
router.post("/users/:id/premium", async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await queryOne("SELECT id, telegram_id FROM users WHERE id = $1", [id]);
    if (!user) return res.status(404).json({ error: "not_found" });

    const { planId, days, revoke, amountUzs, note } = req.body || {};

    if (revoke) {
      await query(
        `UPDATE subscriptions SET plan = 'free', status = 'inactive', expires_at = NULL, updated_at = now()
          WHERE user_id = $1`,
        [id]
      );
      const sub = await queryOne("SELECT * FROM subscriptions WHERE user_id = $1", [id]);
      return res.json({ subscription: sub, revoked: true });
    }

    const plan = PLANS[planId];
    const grantDays = Number.isFinite(days) && days > 0 && days <= 3650 ? Math.round(days) : plan?.days;
    if (!grantDays) return res.status(400).json({ error: "invalid_plan", message: "Reja yoki kun soni kerak." });

    // Extend from the existing expiry when the subscription is still live, so
    // granting twice adds up instead of overwriting.
    const current = await queryOne("SELECT * FROM subscriptions WHERE user_id = $1", [id]);
    const base =
      current?.expires_at && new Date(current.expires_at) > new Date() ? new Date(current.expires_at) : new Date();
    const expires = new Date(base);
    expires.setDate(expires.getDate() + grantDays);

    await query(
      `UPDATE subscriptions
          SET plan = $1, status = 'active', started_at = COALESCE(started_at, now()), expires_at = $2, updated_at = now()
        WHERE user_id = $3`,
      [plan?.id || "manual", expires.toISOString(), id]
    );

    await query(
      `INSERT INTO payments (user_id, provider, plan_id, plan_title, amount_uzs, status, method, receipt_note, reviewed_by, reviewed_at, paid_at)
       VALUES ($1, 'admin', $2, $3, $4, 'paid', 'manual', $5, 'admin', now(), now())`,
      [
        id,
        plan?.id || "manual",
        plan?.title || `Qo'lda ${grantDays} kun`,
        Number.isFinite(amountUzs) ? Math.round(amountUzs) : plan?.amountUzs || 0,
        typeof note === "string" ? note.slice(0, 300) : null,
      ]
    );

    if (user.telegram_id) {
      sendTelegramNotification(
        user.telegram_id,
        `👑 <b>Premium faollashtirildi!</b>\n\nEndi cheksiz AI skaner va trener sizga ochiq. Amal qiladi: ${expires.toISOString().slice(0, 10)}`
      ).catch(() => {});
    }

    const sub = await queryOne("SELECT * FROM subscriptions WHERE user_id = $1", [id]);
    res.json({ subscription: sub, expiresAt: expires.toISOString(), days: grantDays });
  } catch (err) {
    next(err);
  }
});

/**
 * Unlocks the trial-offer popup for one user. The trial itself stays
 * something the user starts by tapping "activate" — this only grants the
 * *option*, it does not start the trial or touch expires_at.
 */
router.post("/users/:id/trial-offer", async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await queryOne("SELECT id, telegram_id FROM users WHERE id = $1", [id]);
    if (!user) return res.status(404).json({ error: "not_found" });

    const sub = await queryOne("SELECT * FROM subscriptions WHERE user_id = $1", [id]);
    if (sub?.trial_used_at) {
      return res.status(409).json({ error: "trial_already_used", message: "Bu foydalanuvchi sinovni allaqachon ishlatgan." });
    }
    if (sub?.trial_offer_granted_at) {
      return res.status(409).json({ error: "already_granted", message: "Sinov taklifi allaqachon berilgan." });
    }

    const updated = await queryOne(
      `UPDATE subscriptions SET trial_offer_granted_at = now(), updated_at = now()
        WHERE user_id = $1 RETURNING *`,
      [id]
    );

    if (user.telegram_id) {
      sendTelegramNotification(
        user.telegram_id,
        `🎁 <b>Sizga 3 kunlik bepul Premium sinovi taklif qilindi!</b>\n\nUni faollashtirish uchun ilovani oching.`
      ).catch(() => {});
    }

    res.json({ subscription: updated });
  } catch (err) {
    next(err);
  }
});

/* ----------------------- payment review queue --------------------- */

router.get("/payments", async (req, res, next) => {
  try {
    const status = req.query.status;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const rows = await query(
      status
        ? `SELECT p.*, u.first_name, u.username, u.telegram_id FROM payments p
             JOIN users u ON u.id = p.user_id
            WHERE p.status = $1 ORDER BY p.created_at DESC LIMIT $2`
        : `SELECT p.*, u.first_name, u.username, u.telegram_id FROM payments p
             JOIN users u ON u.id = p.user_id
            ORDER BY p.created_at DESC LIMIT $1`,
      status ? [status, limit] : [limit]
    );
    res.json({ payments: rows });
  } catch (err) {
    next(err);
  }
});

/**
 * Streams the receipt image.
 *
 * Proxied rather than redirected: Telegram's file URL embeds the bot token,
 * which must never reach the browser.
 */
router.get("/payments/:id/receipt", async (req, res, next) => {
  try {
    const row = await queryOne("SELECT receipt_file_id FROM payments WHERE id = $1", [req.params.id]);
    if (!row?.receipt_file_id) return res.status(404).json({ error: "no_receipt" });

    const url = await getTelegramFileUrl(row.receipt_file_id);
    if (!url) return res.status(502).json({ error: "file_unavailable" });

    const upstream = await fetch(url);
    if (!upstream.ok) return res.status(502).json({ error: "file_unavailable" });

    res.setHeader("content-type", upstream.headers.get("content-type") || "image/jpeg");
    res.setHeader("cache-control", "private, max-age=300");
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (err) {
    next(err);
  }
});

router.post("/payments/:id/approve", async (req, res, next) => {
  try {
    const payment = await queryOne("SELECT * FROM payments WHERE id = $1", [req.params.id]);
    if (!payment) return res.status(404).json({ error: "not_found" });
    if (payment.status === "paid") return res.status(409).json({ error: "already_paid" });

    const plan = PLANS[payment.plan_id];
    const days = plan?.days || 30;

    const current = await queryOne("SELECT * FROM subscriptions WHERE user_id = $1", [payment.user_id]);
    const base =
      current?.expires_at && new Date(current.expires_at) > new Date() ? new Date(current.expires_at) : new Date();
    const expires = new Date(base);
    expires.setDate(expires.getDate() + days);

    await Promise.all([
      query(
        `UPDATE subscriptions
            SET plan = $1, status = 'active', started_at = COALESCE(started_at, now()), expires_at = $2, updated_at = now()
          WHERE user_id = $3`,
        [payment.plan_id, expires.toISOString(), payment.user_id]
      ),
      query(
        `UPDATE payments SET status = 'paid', paid_at = now(), reviewed_at = now(), reviewed_by = 'admin'
          WHERE id = $1`,
        [payment.id]
      ),
    ]);

    // Best-effort: pays the referrer's conversion bonus if (and only if) this
    // user was referred and this is the first payment ever approved for them —
    // rewardReferralConversion no-ops otherwise. Must not block the approval
    // itself from succeeding.
    rewardReferralConversion(payment.user_id).catch((err) => console.error("[referrals] conversion bonus:", err.message));

    const user = await queryOne("SELECT telegram_id FROM users WHERE id = $1", [payment.user_id]);
    if (user?.telegram_id) {
      sendTelegramNotification(
        user.telegram_id,
        `✅ <b>To'lovingiz tasdiqlandi!</b>\n\n${payment.plan_title} faollashtirildi. Amal qiladi: ${expires
          .toISOString()
          .slice(0, 10)}`
      ).catch(() => {});
    }

    res.json({ ok: true, expiresAt: expires.toISOString() });
  } catch (err) {
    next(err);
  }
});

router.post("/payments/:id/reject", async (req, res, next) => {
  try {
    const payment = await queryOne("SELECT * FROM payments WHERE id = $1", [req.params.id]);
    if (!payment) return res.status(404).json({ error: "not_found" });
    if (payment.status === "paid") return res.status(409).json({ error: "already_paid" });

    const reason = typeof req.body?.reason === "string" ? req.body.reason.trim().slice(0, 300) : null;
    await query(
      `UPDATE payments SET status = 'rejected', reject_reason = $1, reviewed_at = now(), reviewed_by = 'admin'
        WHERE id = $2`,
      [reason, payment.id]
    );

    const user = await queryOne("SELECT telegram_id FROM users WHERE id = $1", [payment.user_id]);
    if (user?.telegram_id) {
      sendTelegramNotification(
        user.telegram_id,
        `❌ <b>To'lov tasdiqlanmadi</b>\n\n${reason || "Chek tekshiruvdan o'tmadi."}\n\nSavolingiz bo'lsa, shu yerga yozing.`
      ).catch(() => {});
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ----------------------------- settings --------------------------- */

router.get("/settings", async (req, res, next) => {
  try {
    res.json({ settings: await getSettings({ fresh: true }), keys: SETTING_KEYS });
  } catch (err) {
    next(err);
  }
});

router.put("/settings", async (req, res, next) => {
  try {
    const settings = await setSettings(req.body || {});
    res.json({ settings });
  } catch (err) {
    next(err);
  }
});

export default router;
