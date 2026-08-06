import { Router } from "express";
import crypto from "node:crypto";
import { query, queryOne } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { mapSubscription } from "../lib/mappers.js";

const router = Router();

/**
 * NOTE ON CARD DATA
 * -----------------
 * This service never accepts raw card numbers. The previous implementation
 * collected PAN + expiry directly, which puts the whole backend in PCI-DSS
 * scope and stored card data in process memory. Checkout is delegated to the
 * payment provider's own hosted page instead; we only ever see the result.
 */

export const PLANS = {
  weekly: { id: "weekly", title: "7 Kunlik Reja", amountUzs: 15000, days: 7 },
  monthly: { id: "monthly", title: "1 Oylik Reja", amountUzs: 39000, days: 30 },
  annual: { id: "annual", title: "1 Yillik Reja", amountUzs: 179000, days: 365 },
};

router.get("/plans", (req, res) => {
  res.json({ plans: Object.values(PLANS) });
});

router.get("/subscription", requireAuth, async (req, res, next) => {
  try {
    const row = await queryOne("SELECT * FROM subscriptions WHERE user_id = $1", [req.userId]);
    res.json({ subscription: mapSubscription(row) });
  } catch (err) {
    next(err);
  }
});

async function activateSubscription(userId, planId) {
  const plan = PLANS[planId] || PLANS.monthly;
  const expires = new Date();
  expires.setDate(expires.getDate() + plan.days);
  await query(
    `UPDATE subscriptions
        SET plan = $1, status = 'active', started_at = now(), expires_at = $2, updated_at = now()
      WHERE user_id = $3`,
    [plan.id, expires.toISOString(), userId]
  );
  return plan;
}

/**
 * Creates a checkout link for the provider's hosted page.
 * Returns 503 until real merchant credentials are configured, so nothing can
 * silently "succeed" without money actually moving.
 */
router.post("/checkout", requireAuth, async (req, res, next) => {
  try {
    const { planId } = req.body || {};
    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ error: "invalid_plan" });

    const merchantId = process.env.PAYME_MERCHANT_ID;
    if (!merchantId) {
      return res.status(503).json({
        error: "payments_not_configured",
        message: "To'lov tizimi hali ulanmagan. PAYME_MERCHANT_ID sozlanishi kerak.",
      });
    }

    // Payme hosted checkout: base64 of "m=<merchant>;ac.user_id=<id>;a=<amount in tiyin>"
    const paramString = `m=${merchantId};ac.user_id=${req.userId};a=${plan.amountUzs * 100}`;
    const checkoutUrl = `https://checkout.paycom.uz/${Buffer.from(paramString).toString("base64")}`;

    res.json({ checkoutUrl, plan });
  } catch (err) {
    next(err);
  }
});

/**
 * Development-only activation so the premium UI can be exercised without a
 * live merchant account. Shares the ALLOW_DEV_LOGIN gate, which must never be
 * enabled in production.
 */
router.post("/dev-activate", requireAuth, async (req, res, next) => {
  if (process.env.ALLOW_DEV_LOGIN !== "1") return res.status(404).json({ error: "not_found" });
  try {
    const plan = await activateSubscription(req.userId, req.body?.planId);
    const row = await queryOne("SELECT * FROM subscriptions WHERE user_id = $1", [req.userId]);
    res.json({ subscription: mapSubscription(row), plan, devMode: true });
  } catch (err) {
    next(err);
  }
});

/* ----------------------- Provider webhooks ----------------------- */

/**
 * Payme JSON-RPC endpoint. Payme authenticates with HTTP Basic where the
 * password is the merchant key; without a configured key every call is
 * rejected rather than blindly answered with success.
 */
router.post("/payme", async (req, res) => {
  const key = process.env.PAYME_MERCHANT_KEY;
  if (!key) {
    return res.status(503).json({
      error: { code: -32504, message: "Merchant not configured" },
      id: req.body?.id ?? null,
    });
  }

  const header = req.headers.authorization || "";
  if (!header.startsWith("Basic ")) {
    return res.status(200).json({ error: { code: -32504, message: "Insufficient privileges" }, id: req.body?.id ?? null });
  }
  const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
  const providedKey = decoded.split(":")[1] || "";
  const a = Buffer.from(providedKey);
  const b = Buffer.from(key);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(200).json({ error: { code: -32504, message: "Insufficient privileges" }, id: req.body?.id ?? null });
  }

  // Signature verified. Full CheckPerformTransaction/CreateTransaction/
  // PerformTransaction/CancelTransaction state machine still needs to be
  // implemented against a real merchant account before going live.
  return res.status(501).json({
    error: { code: -32504, message: "Payme metodlari hali implement qilinmagan" },
    id: req.body?.id ?? null,
  });
});

/** Click webhook — verifies the documented MD5 signature before acting. */
router.post("/click", async (req, res) => {
  const secret = process.env.CLICK_SECRET_KEY;
  if (!secret) return res.status(503).json({ error: -9, error_note: "Merchant not configured" });

  const { click_trans_id, service_id, merchant_trans_id, amount, action, sign_time, sign_string } = req.body || {};
  const expected = crypto
    .createHash("md5")
    .update(`${click_trans_id}${service_id}${secret}${merchant_trans_id}${amount}${action}${sign_time}`)
    .digest("hex");

  if (expected !== sign_string) {
    return res.json({ error: -1, error_note: "SIGN CHECK FAILED" });
  }

  return res.status(501).json({ error: -9, error_note: "Click metodlari hali implement qilinmagan" });
});

export default router;
