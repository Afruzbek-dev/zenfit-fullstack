import { Router } from "express";
import { query, queryOne } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { mapSubscription, mapChallenge } from "../lib/mappers.js";

const router = Router();

/**
 * Active challenges this user's audience covers — 'all', their current
 * premium/free bucket, or an explicit invite via challenge_recipients.
 * Simple announcements only (see routes/admin.js for creation) — nothing
 * here computes progress toward anything, by design.
 */
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const sub = await queryOne("SELECT * FROM subscriptions WHERE user_id = $1", [req.userId]);
    const isPremium = mapSubscription(sub).isPremium;

    const rows = await query(
      `SELECT c.* FROM challenges c
        WHERE (c.ends_at IS NULL OR c.ends_at > now())
          AND ( c.audience = 'all'
             OR (c.audience = 'premium' AND $2 = true)
             OR (c.audience = 'free' AND $2 = false)
             OR (c.audience = 'selected' AND EXISTS (
                   SELECT 1 FROM challenge_recipients cr
                    WHERE cr.challenge_id = c.id AND cr.user_id = $1)) )
        ORDER BY c.created_at DESC`,
      [req.userId, isPremium]
    );

    res.json({ challenges: rows.map(mapChallenge) });
  } catch (err) {
    next(err);
  }
});

export default router;
