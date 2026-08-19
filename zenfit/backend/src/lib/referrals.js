import { query, queryOne } from "../db.js";

/** Bonus days granted to both the referrer and the referee, per successful referral. */
export const REFERRAL_REWARD_DAYS = 5;

/**
 * Links a brand-new user to whoever referred them, and rewards both sides.
 *
 * Only ever called with `isNewUser === true` from lib/users.js, so the
 * referee's subscription cannot already be an active paid one — it was created
 * in the very same call, seconds earlier. Self-referral and unknown referrer
 * codes are silently ignored (not an error the client needs to see); a
 * duplicate capture is caught by `referrals.referee_id`'s UNIQUE constraint,
 * which is the real, race-proof guarantee — this function's own checks are
 * just a fast path in front of it.
 */
export async function captureReferral(refereeId, startParam) {
  const match = /^ref_(\d+)$/.exec(String(startParam || ""));
  if (!match) return;

  const referrerId = Number(match[1]);
  if (!referrerId || referrerId === refereeId) return;

  const referrer = await queryOne("SELECT id FROM users WHERE id = $1", [referrerId]);
  if (!referrer) return;

  try {
    await query(
      "INSERT INTO referrals (referrer_id, referee_id, reward_days) VALUES ($1, $2, $3)",
      [referrerId, refereeId, REFERRAL_REWARD_DAYS]
    );
  } catch {
    // referee_id UNIQUE violation — this user was already captured (a race, or
    // a repeat call). Benign: rewards were already granted the first time.
    return;
  }

  await Promise.all([
    extendSubscription(referrerId, REFERRAL_REWARD_DAYS),
    extendSubscription(refereeId, REFERRAL_REWARD_DAYS),
  ]);
}

/**
 * Pushes `expires_at` out by `days`, from whichever is later: the current
 * expiry or now. Never overwrites downward — stacking a referral bonus onto
 * an already-active trial or paid subscription must extend it, not reset it.
 *
 * The date math happens in JS and is bound as a plain parameter rather than
 * written as SQL (`... + INTERVAL '5 days'` / `GREATEST(...)`) because db.js's
 * SQLite rewriter does not understand either — see lib/referrals.js callers
 * and routes/payment.js's trial-start for the same pattern.
 */
async function extendSubscription(userId, days) {
  const row = await queryOne("SELECT * FROM subscriptions WHERE user_id = $1", [userId]);
  const current = row?.expires_at ? new Date(row.expires_at) : null;
  const base = current && current > new Date() ? current : new Date();
  const expires = new Date(base);
  expires.setDate(expires.getDate() + days);

  await query(
    `UPDATE subscriptions
        SET status = 'active',
            plan = CASE WHEN plan = 'free' THEN 'referral' ELSE plan END,
            started_at = COALESCE(started_at, now()),
            expires_at = $1,
            updated_at = now()
      WHERE user_id = $2`,
    [expires.toISOString(), userId]
  );
}
