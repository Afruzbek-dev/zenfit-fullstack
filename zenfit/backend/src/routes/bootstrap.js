import { Router } from "express";
import { query, queryOne } from "../db.js";
import { validateTelegramInitData } from "../lib/telegramAuth.js";
import { signToken, verifyToken } from "../lib/jwt.js";
import { upsertUser } from "../lib/users.js";
import { getDayStats, getStreak, dayRange } from "../lib/stats.js";
import { mapProfile, mapSubscription, mapMeal, mapPlan, mapWorkoutLog, mapActivity } from "../lib/mappers.js";

const router = Router();

/**
 * Everything the app needs to render its first screen, in one round trip.
 *
 * Boot previously cost six sequential requests (login, then summary + meals +
 * plans + history + activities). Against a database in another region that
 * added up to seconds of blank screen, so the whole session is assembled here
 * and every query inside runs concurrently.
 */
router.post("/", async (req, res, next) => {
  try {
    const tz = Number(req.body?.tz) || 0;

    // Either an existing session token or a fresh Telegram login.
    let userId = null;
    let issuedToken = null;

    const header = req.headers.authorization || "";
    if (header.startsWith("Bearer ")) {
      const payload = verifyToken(header.slice(7));
      if (payload?.sub) userId = payload.sub;
    }

    if (!userId) {
      const { initData } = req.body || {};
      if (!initData) return res.status(401).json({ error: "auth_required" });

      const botToken = process.env.BOT_TOKEN;
      if (!botToken) return res.status(500).json({ error: "bot_token_not_configured" });

      const result = validateTelegramInitData(initData, botToken);
      if (!result?.user?.id) return res.status(401).json({ error: "invalid_init_data" });

      const user = await upsertUser(result.user);
      userId = user.id;
      issuedToken = signToken({ sub: user.id });
    }

    const [user, profile, subscription] = await Promise.all([
      queryOne("SELECT id, first_name, username, avatar_url FROM users WHERE id = $1", [userId]),
      queryOne("SELECT * FROM profiles WHERE user_id = $1", [userId]),
      queryOne("SELECT * FROM subscriptions WHERE user_id = $1", [userId]),
    ]);

    if (!user) return res.status(401).json({ error: "user_not_found" });

    const session = {
      token: issuedToken || undefined,
      user: { id: user.id, firstName: user.first_name, username: user.username, avatarUrl: user.avatar_url },
      profile: mapProfile(profile),
      subscription: mapSubscription(subscription),
    };

    // A user who has not finished onboarding has nothing to show yet, so the
    // dashboard queries are skipped entirely.
    if (!profile || !(profile.onboarding_completed === true || profile.onboarding_completed === 1)) {
      return res.json({ ...session, onboarding: true });
    }

    const { start, end } = dayRange(null, tz);
    const [stats, streak, meals, workoutPlan, dietPlan, workoutLogs, activities] = await Promise.all([
      getDayStats(userId, null, tz),
      getStreak(userId, tz),
      query(
        `SELECT * FROM meals WHERE user_id = $1 AND logged_at >= $2 AND logged_at < $3 ORDER BY logged_at ASC`,
        [userId, start, end]
      ),
      queryOne(
        `SELECT * FROM ai_plans WHERE user_id = $1 AND plan_type = 'workout' AND is_active = true
          ORDER BY created_at DESC LIMIT 1`,
        [userId]
      ),
      queryOne(
        `SELECT * FROM ai_plans WHERE user_id = $1 AND plan_type = 'diet' AND is_active = true
          ORDER BY created_at DESC LIMIT 1`,
        [userId]
      ),
      query(`SELECT * FROM workout_logs WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 300`, [userId]),
      query(
        `SELECT * FROM activities WHERE user_id = $1 AND logged_at >= $2 AND logged_at < $3 ORDER BY logged_at DESC`,
        [userId, start, end]
      ),
    ]);

    res.json({
      ...session,
      onboarding: false,
      summary: { ...stats, streak },
      meals: meals.map(mapMeal),
      workoutPlan: mapPlan(workoutPlan)?.plan ?? null,
      dietPlan: mapPlan(dietPlan)?.plan ?? null,
      workoutLogs: workoutLogs.map(mapWorkoutLog),
      activities: activities.map(mapActivity),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
