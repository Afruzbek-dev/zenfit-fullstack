import { Router } from "express";
import { query, queryOne } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { mapSubscription, mapChallenge } from "../lib/mappers.js";
import { CHALLENGE_METRICS, isMetric, metricTotals } from "../lib/challengeStats.js";

const router = Router();

/** Premium users get their own challenges, but not an unlimited broadcast surface. */
const MAX_OWN_ACTIVE = 3;
const LEADERBOARD_LIMIT = 100;

const isPremiumUser = async (userId) => {
  const sub = await queryOne("SELECT * FROM subscriptions WHERE user_id = $1", [userId]);
  return mapSubscription(sub).isPremium;
};

/**
 * Challenges this user can see.
 *
 * Two sources in one list: admin-authored ones filtered by their audience, and
 * Premium-user-authored ones, which are open to everybody — a leaderboard only
 * means something with people on it, and a challenge only its author's friends
 * could find would mostly have nobody.
 */
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const tz = Number(req.query.tz) || 0;
    const isPremium = await isPremiumUser(req.userId);

    const rows = await query(
      `SELECT c.* FROM challenges c
        WHERE (c.ends_at IS NULL OR c.ends_at > now())
          AND ( c.created_by_user_id IS NOT NULL
             OR c.audience = 'all'
             OR (c.audience = 'premium' AND $2 = true)
             OR (c.audience = 'free' AND $2 = false)
             OR (c.audience = 'selected' AND EXISTS (
                   SELECT 1 FROM challenge_recipients cr
                    WHERE cr.challenge_id = c.id AND cr.user_id = $1)) )
        ORDER BY c.created_at DESC`,
      [req.userId, isPremium]
    );

    if (rows.length === 0) return res.json({ challenges: [] });

    const [counts, mine, creators] = await Promise.all([
      query(`SELECT challenge_id, COUNT(*) AS n FROM challenge_participants GROUP BY challenge_id`),
      query(`SELECT challenge_id FROM challenge_participants WHERE user_id = $1`, [req.userId]),
      query(`SELECT id, first_name, username FROM users WHERE id IN (
               SELECT created_by_user_id FROM challenges WHERE created_by_user_id IS NOT NULL)`),
    ]);
    const countBy = new Map(counts.map((r) => [String(r.challenge_id), Number(r.n) || 0]));
    const joined = new Set(mine.map((r) => String(r.challenge_id)));
    const creatorBy = new Map(creators.map((u) => [String(u.id), u.first_name || u.username || null]));

    // One metric query per challenge, but only ever for this one user — the
    // full participant scan is the leaderboard's job, not this list's.
    const values = await Promise.all(
      rows.map((c) => (joined.has(String(c.id)) ? metricTotals(c, [req.userId], tz) : Promise.resolve(null)))
    );

    res.json({
      challenges: rows.map((c, i) => ({
        ...mapChallenge(c),
        participantCount: countBy.get(String(c.id)) || 0,
        joined: joined.has(String(c.id)),
        myValue: values[i]?.get(String(req.userId)) ?? 0,
        isMine: String(c.created_by_user_id || "") === String(req.userId),
        creatorName: c.created_by_user_id ? creatorBy.get(String(c.created_by_user_id)) || null : null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

/** Signing up. Idempotent — a double tap must not enter anyone twice. */
router.post("/:id/join", requireAuth, async (req, res, next) => {
  try {
    const challenge = await queryOne("SELECT * FROM challenges WHERE id = $1", [req.params.id]);
    if (!challenge) return res.status(404).json({ error: "not_found" });
    if (challenge.ends_at && new Date(challenge.ends_at) <= new Date()) {
      return res.status(400).json({ error: "challenge_ended", message: "Bu challenge tugagan." });
    }

    const existing = await queryOne(
      "SELECT id FROM challenge_participants WHERE challenge_id = $1 AND user_id = $2",
      [challenge.id, req.userId]
    );
    if (!existing) {
      await query("INSERT INTO challenge_participants (challenge_id, user_id) VALUES ($1, $2)", [
        challenge.id,
        req.userId,
      ]);
    }
    res.status(201).json({ joined: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id/join", requireAuth, async (req, res, next) => {
  try {
    await query("DELETE FROM challenge_participants WHERE challenge_id = $1 AND user_id = $2", [
      req.params.id,
      req.userId,
    ]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

/**
 * The ranking. Capped, but the caller's own row is always included — being
 * 140th is still worth seeing, and a leaderboard that hides you is demoralising.
 */
router.get("/:id/leaderboard", requireAuth, async (req, res, next) => {
  try {
    const tz = Number(req.query.tz) || 0;
    const challenge = await queryOne("SELECT * FROM challenges WHERE id = $1", [req.params.id]);
    if (!challenge) return res.status(404).json({ error: "not_found" });

    const people = await query(
      `SELECT u.id, u.first_name, u.username, u.avatar_url
         FROM challenge_participants cp JOIN users u ON u.id = cp.user_id
        WHERE cp.challenge_id = $1`,
      [challenge.id]
    );
    if (people.length === 0) return res.json({ entries: [], me: null, metric: challenge.metric });

    const totals = await metricTotals(challenge, people.map((p) => p.id), tz);
    const ranked = people
      .map((p) => ({
        userId: p.id,
        firstName: p.first_name,
        username: p.username,
        avatarUrl: p.avatar_url,
        value: totals.get(String(p.id)) || 0,
      }))
      .sort((a, b) => b.value - a.value)
      .map((entry, i) => ({ ...entry, rank: i + 1 }));

    const me = ranked.find((r) => String(r.userId) === String(req.userId)) || null;
    res.json({
      entries: ranked.slice(0, LEADERBOARD_LIMIT),
      me,
      metric: challenge.metric || "active_days",
      goalTarget: challenge.goal_target == null ? null : Number(challenge.goal_target),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * A Premium user starting their own challenge.
 *
 * No Telegram broadcast, unlike the admin route: letting any subscriber push a
 * notification to every user is a spam vector, and the challenge shows up in
 * everyone's list on its own anyway.
 */
router.post("/", requireAuth, async (req, res, next) => {
  try {
    if (!(await isPremiumUser(req.userId))) {
      return res.status(402).json({
        error: "premium_required",
        message: "Challenge yaratish Premium imkoniyati. Premium'ni faollashtiring.",
      });
    }

    const title = typeof req.body?.title === "string" ? req.body.title.trim().slice(0, 140) : "";
    const description = typeof req.body?.description === "string" ? req.body.description.trim().slice(0, 2000) : "";
    const metric = isMetric(req.body?.metric) ? req.body.metric : null;
    const durationDays =
      Number.isFinite(req.body?.durationDays) && req.body.durationDays >= 1 && req.body.durationDays <= 365
        ? Math.round(req.body.durationDays)
        : null;
    const goalTarget =
      Number.isFinite(req.body?.goalTarget) && req.body.goalTarget > 0
        ? Math.min(req.body.goalTarget, 10_000_000)
        : null;

    if (!title) return res.status(400).json({ error: "title_required" });
    if (!metric) {
      return res.status(400).json({ error: "invalid_metric", message: `Metrika: ${CHALLENGE_METRICS.join(", ")}` });
    }

    const active = await queryOne(
      `SELECT COUNT(*) AS n FROM challenges
        WHERE created_by_user_id = $1 AND (ends_at IS NULL OR ends_at > now())`,
      [req.userId]
    );
    if ((Number(active?.n) || 0) >= MAX_OWN_ACTIVE) {
      return res.status(400).json({
        error: "challenge_limit",
        message: `Bir vaqtda ${MAX_OWN_ACTIVE} tagacha challenge yuritish mumkin.`,
      });
    }

    // Computed here, never in SQL — the SQLite rewriter has no date math.
    const now = new Date();
    const endsAt = durationDays ? new Date(now.getTime() + durationDays * 86_400_000).toISOString() : null;

    const rows = await query(
      `INSERT INTO challenges (title, description, audience, duration_days, ends_at, created_by,
                               metric, goal_target, starts_at, created_by_user_id)
       VALUES ($1, $2, 'all', $3, $4, 'user', $5, $6, $7, $8) RETURNING *`,
      [title, description || null, durationDays, endsAt, metric, goalTarget, now.toISOString(), req.userId]
    );
    const challenge = rows[0];

    // The author is in it by definition — asking them to join their own
    // challenge as a second step would just be a step to forget.
    await query("INSERT INTO challenge_participants (challenge_id, user_id) VALUES ($1, $2)", [
      challenge.id,
      req.userId,
    ]);

    res.status(201).json({ challenge: { ...mapChallenge(challenge), joined: true, isMine: true, participantCount: 1, myValue: 0 } });
  } catch (err) {
    next(err);
  }
});

/** Only the author can pull their own challenge; admin deletion is separate. */
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const challenge = await queryOne("SELECT * FROM challenges WHERE id = $1", [req.params.id]);
    if (!challenge) return res.status(404).json({ error: "not_found" });
    if (String(challenge.created_by_user_id || "") !== String(req.userId)) {
      return res.status(403).json({ error: "forbidden" });
    }
    await query("DELETE FROM challenges WHERE id = $1", [challenge.id]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
