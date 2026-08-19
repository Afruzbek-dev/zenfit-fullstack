import { query, queryOne } from "../db.js";

/** Days granted to the referrer the moment a friend signs up through their link. */
export const SIGNUP_REWARD_DAYS = 1;

/** Extra days granted to the referrer once — the first time that friend actually buys premium. */
export const CONVERSION_REWARD_DAYS = 7;

/** One-time discount on the referee's first purchase, while they haven't converted yet. */
export const REFEREE_DISCOUNT_PERCENT = 10;

/**
 * Links a brand-new user to whoever referred them, and starts the referrer's
 * signup reward. The referee gets nothing here — their reward is the
 * purchase discount in refereeDiscountPercent(), not a subscription extension.
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
      [referrerId, refereeId, SIGNUP_REWARD_DAYS]
    );
  } catch {
    // referee_id UNIQUE violation — this user was already captured (a race, or
    // a repeat call). Benign: the reward was already granted the first time.
    return;
  }

  await extendSubscription(referrerId, SIGNUP_REWARD_DAYS);
}

/**
 * Pays the referrer's conversion bonus the first (and only) time the referee
 * they brought in actually buys premium — called from routes/admin.js once a
 * manual payment is approved. Guarded by `converted_at` rather than re-deriving
 * "is this their first payment" from the payments table, so a renewal never
 * pays the bonus twice.
 */
export async function rewardReferralConversion(refereeId) {
  const referral = await queryOne(
    "SELECT * FROM referrals WHERE referee_id = $1 AND converted_at IS NULL",
    [refereeId]
  );
  if (!referral) return;

  await query(
    "UPDATE referrals SET converted_at = now(), reward_days = reward_days + $1 WHERE id = $2",
    [CONVERSION_REWARD_DAYS, referral.id]
  );
  await extendSubscription(referral.referrer_id, CONVERSION_REWARD_DAYS);
}

/**
 * The discount this user still qualifies for on a purchase they're about to
 * make: REFEREE_DISCOUNT_PERCENT while they were referred and haven't
 * converted yet, 0 otherwise (never referred, or already bought once before —
 * this is a one-time welcome discount, not a standing one).
 */
export async function refereeDiscountPercent(userId) {
  try {
    const referral = await queryOne("SELECT converted_at FROM referrals WHERE referee_id = $1", [userId]);
    if (!referral || referral.converted_at) return 0;
    return REFEREE_DISCOUNT_PERCENT;
  } catch (err) {
    // Never let a discount lookup break the actual payment-start flow — a
    // missed discount is recoverable (the admin can grant it by hand), a
    // broken checkout for every user is not.
    console.error("[referrals] discount lookup:", err.message);
    return 0;
  }
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
