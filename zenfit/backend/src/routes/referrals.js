import { Router } from "express";
import { query, queryOne } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { getStreak } from "../lib/stats.js";
import { mapReferralSummary, mapFriend } from "../lib/mappers.js";

const router = Router();

/**
 * `t.me/<bot>/<shortname>?startapp=ref_<id>` is the only Telegram deep-link
 * form whose payload rides inside the HMAC-signed initData (see
 * telegramAuth.js) — the bot-chat `?start=` form delivers it as unsigned chat
 * text instead, which is not something lib/referrals.js should trust. Both
 * pieces are Telegram/BotFather configuration, not app logic, so there is
 * nothing to fall back to here besides returning no link.
 */
function buildReferralLink(userId) {
  const botUsername = process.env.BOT_USERNAME;
  const shortName = process.env.MINI_APP_SHORT_NAME;
  if (!botUsername || !shortName) return null;
  return `https://t.me/${botUsername}/${shortName}?startapp=ref_${userId}`;
}

// GET /api/referrals/me
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const row = await queryOne(
      "SELECT COUNT(*) AS count, COALESCE(SUM(reward_days), 0) AS reward_days FROM referrals WHERE referrer_id = $1",
      [req.userId]
    );
    res.json({
      code: `ref_${req.userId}`,
      link: buildReferralLink(req.userId),
      ...mapReferralSummary(row),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/referrals/friends — 1-hop only: people I referred, plus whoever referred me.
router.get("/friends", requireAuth, async (req, res, next) => {
  try {
    const tz = Number(req.query.tz) || 0;
    const rows = await query(
      `SELECT u.id, u.first_name, u.username, u.avatar_url,
              CASE WHEN r.referee_id = $1 THEN true ELSE false END AS is_my_referrer
         FROM referrals r
         JOIN users u ON u.id = CASE WHEN r.referrer_id = $1 THEN r.referee_id ELSE r.referrer_id END
        WHERE r.referrer_id = $1 OR r.referee_id = $1`,
      [req.userId]
    );

    // One small indexed query per friend — realistic friend-list sizes here
    // are tens, not thousands, and getStreak is already bounded/indexed (see
    // its own STREAK_WINDOW_DAYS cap), so this is cheaper than it looks and
    // keeps the streak logic in exactly one place rather than porting its
    // gap-detection into a second, SQL-only implementation.
    const streaks = await Promise.all(rows.map((f) => getStreak(f.id, tz)));

    const friends = rows
      .map((f, i) => mapFriend({ ...f, streak: streaks[i] }))
      .sort((a, b) => b.streak - a.streak);

    res.json({ friends });
  } catch (err) {
    next(err);
  }
});

export default router;
