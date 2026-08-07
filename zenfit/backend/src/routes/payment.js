import { Router } from "express";
import crypto from "node:crypto";
import { query, queryOne } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { mapSubscription, mapPayment, mapCard } from "../lib/mappers.js";

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

/* ------------------------- purchase history ------------------------- */

router.get("/history", requireAuth, async (req, res, next) => {
  try {
    const rows = await query(
      "SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100",
      [req.userId]
    );
    res.json({ payments: rows.map(mapPayment) });
  } catch (err) {
    next(err);
  }
});

/* ---------------------------- saved cards --------------------------- *
 * Cards are stored as a provider token plus the masked tail only. There is
 * deliberately no endpoint that accepts a card number: binding a card happens
 * on the provider's own page, and the token comes back over the webhook.
 * ------------------------------------------------------------------- */

router.get("/cards", requireAuth, async (req, res, next) => {
  try {
    const rows = await query(
      "SELECT * FROM payment_cards WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC",
      [req.userId]
    );
    res.json({ cards: rows.map(mapCard) });
  } catch (err) {
    next(err);
  }
});

/** Starts card binding on the provider's hosted page. */
router.post("/cards/bind", requireAuth, async (req, res) => {
  const merchantId = process.env.PAYME_MERCHANT_ID;
  if (!merchantId) {
    return res.status(503).json({
      error: "payments_not_configured",
      message: "Karta biriktirish hali ulanmagan. To'lov provayderi sozlangach ishlaydi.",
    });
  }
  const paramString = `m=${merchantId};ac.user_id=${req.userId}`;
  res.json({ bindUrl: `https://checkout.paycom.uz/${Buffer.from(paramString).toString("base64")}` });
});

router.delete("/cards/:id", requireAuth, async (req, res, next) => {
  try {
    const rows = await query("DELETE FROM payment_cards WHERE id = $1 AND user_id = $2 RETURNING id", [
      req.params.id,
      req.userId,
    ]);
    if (!rows.length) return res.status(404).json({ error: "not_found" });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

async function activateSubscription(userId, planId, { provider = "manual", externalId = null } = {}) {
  const plan = PLANS[planId] || PLANS.monthly;
  const expires = new Date();
  expires.setDate(expires.getDate() + plan.days);
  await query(
    `UPDATE subscriptions
        SET plan = $1, status = 'active', started_at = now(), expires_at = $2, updated_at = now()
      WHERE user_id = $3`,
    [plan.id, expires.toISOString(), userId]
  );
  // Every activation leaves a receipt, so the purchase history in the profile
  // reflects reality rather than being reconstructed from the subscription row.
  await query(
    `INSERT INTO payments (user_id, provider, plan_id, plan_title, amount_uzs, status, external_id, paid_at)
     VALUES ($1, $2, $3, $4, $5, 'paid', $6, now())`,
    [userId, provider, plan.id, plan.title, plan.amountUzs, externalId]
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

    // Recorded as pending; the provider webhook is what flips it to paid.
    await query(
      `INSERT INTO payments (user_id, provider, plan_id, plan_title, amount_uzs, status)
       VALUES ($1, 'payme', $2, $3, $4, 'pending')`,
      [req.userId, plan.id, plan.title, plan.amountUzs]
    );

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
    const plan = await activateSubscription(req.userId, req.body?.planId, { provider: "dev" });
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
