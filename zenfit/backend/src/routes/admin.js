import { Router } from "express";
import crypto from "node:crypto";
import { query, queryOne, daysAgoIso } from "../db.js";

const router = Router();

/**
 * Admin auth. Fails closed: with no ADMIN_SECRET configured the whole admin
 * surface is disabled rather than falling back to a guessable default.
 */
router.use((req, res, next) => {
  const expected = process.env.ADMIN_SECRET;
  if (!expected || expected.length < 16) {
    console.error("[admin] ADMIN_SECRET o'rnatilmagan (yoki juda qisqa) — admin API o'chirilgan.");
    return res.status(503).json({ error: "admin_disabled", message: "ADMIN_SECRET sozlanmagan." });
  }

  const provided = req.headers["x-admin-key"];
  if (typeof provided !== "string" || provided.length !== expected.length) {
    return res.status(401).json({ error: "unauthorized" });
  }
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (!crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ error: "unauthorized" });
  }
  next();
});

const num = (v) => Number(v || 0);

router.get("/stats", async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();
    const weekAgo = daysAgoIso(7);
    const monthAgo = daysAgoIso(30);

    const [
      totalUsers, activeToday, totalMeals, totalWorkouts,
      consumed, burned, newToday, newWeek, avgTarget,
      goalDist, genderDist, levelDist, signups,
    ] = await Promise.all([
      queryOne("SELECT COUNT(*) AS c FROM users"),
      queryOne(
        `SELECT COUNT(DISTINCT user_id) AS c FROM (
           SELECT user_id FROM meals WHERE logged_at >= $1
           UNION SELECT user_id FROM workout_logs WHERE logged_at >= $1
         ) t`,
        [todayIso]
      ),
      queryOne("SELECT COUNT(*) AS c FROM meals"),
      queryOne("SELECT COUNT(*) AS c FROM workout_logs"),
      queryOne("SELECT COALESCE(SUM(kcal),0) AS c FROM meals"),
      queryOne("SELECT COALESCE(SUM(kcal),0) AS c FROM workout_logs"),
      queryOne("SELECT COUNT(*) AS c FROM users WHERE created_at >= $1", [todayIso]),
      queryOne("SELECT COUNT(*) AS c FROM users WHERE created_at >= $1", [weekAgo]),
      queryOne("SELECT COALESCE(AVG(daily_calorie_target),0) AS c FROM profiles WHERE daily_calorie_target IS NOT NULL"),
      query("SELECT goal, COUNT(*) AS count FROM profiles WHERE goal IS NOT NULL GROUP BY goal"),
      query("SELECT gender, COUNT(*) AS count FROM profiles WHERE gender IS NOT NULL GROUP BY gender"),
      query("SELECT fitness_level, COUNT(*) AS count FROM profiles WHERE fitness_level IS NOT NULL GROUP BY fitness_level"),
      query("SELECT created_at FROM users WHERE created_at >= $1", [monthAgo]),
    ]);

    const byDay = new Map();
    signups.forEach((u) => {
      const d = String(new Date(u.created_at).toISOString()).slice(0, 10);
      byDay.set(d, (byDay.get(d) || 0) + 1);
    });

    res.json({
      totalUsers: num(totalUsers?.c),
      activeToday: num(activeToday?.c),
      totalMeals: num(totalMeals?.c),
      totalWorkouts: num(totalWorkouts?.c),
      totalCaloriesConsumed: num(consumed?.c),
      totalCaloriesBurned: num(burned?.c),
      newUsersToday: num(newToday?.c),
      newUsersThisWeek: num(newWeek?.c),
      avgCalorieTarget: num(avgTarget?.c),
      goalDistribution: goalDist,
      genderDistribution: genderDist,
      fitnessLevelDistribution: levelDist,
      dailySignups: [...byDay.entries()].sort().map(([date, count]) => ({ date, count })),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const search = `%${req.query.search || ""}%`;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = parseInt(req.query.offset, 10) || 0;

    const total = await queryOne(
      `SELECT COUNT(*) AS c FROM users u
        WHERE u.first_name LIKE $1 OR u.username LIKE $1 OR u.telegram_id LIKE $1`,
      [search]
    );

    const users = await query(
      `SELECT u.id, u.telegram_id, u.first_name, u.username, u.created_at,
              p.gender, p.age, p.height_cm, p.weight_kg, p.activity_level, p.goal,
              p.daily_calorie_target, p.onboarding_completed
         FROM users u
         LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.first_name LIKE $1 OR u.username LIKE $1 OR u.telegram_id LIKE $1
        ORDER BY u.created_at DESC
        LIMIT $2 OFFSET $3`,
      [search, limit, offset]
    );

    res.json({ total: num(total?.c), limit, offset, users });
  } catch (err) {
    next(err);
  }
});

router.get("/users/:id", async (req, res, next) => {
  try {
    const user = await queryOne(
      `SELECT u.*, p.gender, p.age, p.height_cm, p.weight_kg, p.activity_level, p.goal,
              p.daily_calorie_target, p.fitness_level, p.onboarding_completed
         FROM users u LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.id = $1`,
      [req.params.id]
    );
    if (!user) return res.status(404).json({ error: "not_found" });

    const [recentMeals, recentWorkouts, mealCount, workoutCount, consumed, burned] = await Promise.all([
      query("SELECT * FROM meals WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 10", [req.params.id]),
      query("SELECT * FROM workout_logs WHERE user_id = $1 ORDER BY logged_at DESC LIMIT 10", [req.params.id]),
      queryOne("SELECT COUNT(*) AS c FROM meals WHERE user_id = $1", [req.params.id]),
      queryOne("SELECT COUNT(*) AS c FROM workout_logs WHERE user_id = $1", [req.params.id]),
      queryOne("SELECT COALESCE(SUM(kcal),0) AS c FROM meals WHERE user_id = $1", [req.params.id]),
      queryOne("SELECT COALESCE(SUM(kcal),0) AS c FROM workout_logs WHERE user_id = $1", [req.params.id]),
    ]);

    res.json({
      user,
      recentMeals,
      recentWorkouts,
      stats: {
        totalMeals: num(mealCount?.c),
        totalWorkouts: num(workoutCount?.c),
        totalCaloriesConsumed: num(consumed?.c),
        totalCaloriesBurned: num(burned?.c),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/meals", async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = parseInt(req.query.offset, 10) || 0;
    const total = await queryOne("SELECT COUNT(*) AS c FROM meals");
    const meals = await query(
      `SELECT m.*, u.first_name, u.username FROM meals m
         JOIN users u ON m.user_id = u.id
        ORDER BY m.logged_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ total: num(total?.c), limit, offset, meals });
  } catch (err) {
    next(err);
  }
});

router.get("/workouts", async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const offset = parseInt(req.query.offset, 10) || 0;
    const total = await queryOne("SELECT COUNT(*) AS c FROM workout_logs");
    const workouts = await query(
      `SELECT w.*, u.first_name, u.username FROM workout_logs w
         JOIN users u ON w.user_id = u.id
        ORDER BY w.logged_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    res.json({ total: num(total?.c), limit, offset, workouts });
  } catch (err) {
    next(err);
  }
});

router.get("/activity", async (req, res, next) => {
  try {
    const since = daysAgoIso(30);
    const [meals, workouts] = await Promise.all([
      query("SELECT user_id, kcal, logged_at FROM meals WHERE logged_at >= $1", [since]),
      query("SELECT user_id, kcal, logged_at FROM workout_logs WHERE logged_at >= $1", [since]),
    ]);

    const days = new Map();
    for (let i = 29; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.set(key, { date: key, meals_count: 0, workouts_count: 0, total_kcal_consumed: 0, total_kcal_burned: 0, _users: new Set() });
    }
    const put = (rows, countKey, kcalKey) =>
      rows.forEach((r) => {
        const key = new Date(r.logged_at).toISOString().slice(0, 10);
        const b = days.get(key);
        if (!b) return;
        b[countKey] += 1;
        b[kcalKey] += r.kcal || 0;
        b._users.add(r.user_id);
      });
    put(meals, "meals_count", "total_kcal_consumed");
    put(workouts, "workouts_count", "total_kcal_burned");

    res.json([...days.values()].map(({ _users, ...rest }) => ({ ...rest, active_users: _users.size })));
  } catch (err) {
    next(err);
  }
});

export default router;
