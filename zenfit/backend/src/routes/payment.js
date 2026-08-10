import { Router } from "express";
import crypto from "node:crypto";
import { query, queryOne } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { mapSubscription, mapPayment, mapCard } from "../lib/mappers.js";
import { getSettings, getAdminChatId, getAdminUsername, manualPaymentReady } from "../lib/settings.js";
import { sendTelegramNotification } from "../bot.js";

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

/* --------------------- manual card transfer ------------------------- *
 * Used until a payment provider is connected: the user transfers to the
 * card shown here, uploads a screenshot, and an admin confirms it. Nothing
 * is granted automatically — only an admin review activates a subscription.
 * ------------------------------------------------------------------- */

/** Card details plus a freshly created pending order for the chosen plan. */
router.post("/manual/start", requireAuth, async (req, res, next) => {
  try {
    const plan = PLANS[req.body?.planId];
    if (!plan) return res.status(400).json({ error: "invalid_plan" });

    if (!(await manualPaymentReady())) {
      return res.status(503).json({
        error: "manual_payment_not_configured",
        message: "To'lov kartasi hali sozlanmagan. Iltimos, keyinroq urinib ko'ring.",
      });
    }

    const settings = await getSettings();

    // Reuse an order the user already started for this plan rather than
    // stacking up pending rows every time they reopen the sheet.
    let order = await queryOne(
      `SELECT * FROM payments
        WHERE user_id = $1 AND plan_id = $2 AND method = 'manual' AND status = 'pending'
        ORDER BY created_at DESC LIMIT 1`,
      [req.userId, plan.id]
    );

    if (!order) {
      order = await queryOne(
        `INSERT INTO payments (user_id, provider, plan_id, plan_title, amount_uzs, status, method)
         VALUES ($1, 'card', $2, $3, $4, 'pending', 'manual')
         RETURNING *`,
        [req.userId, plan.id, plan.title, plan.amountUzs]
      );
    }

    res.json({
      payment: mapPayment(order),
      plan,
      card: {
        number: settings.payment_card_number,
        holder: settings.payment_card_holder,
        bank: settings.payment_card_bank,
        instructions: settings.payment_instructions,
      },
      adminUsername: await getAdminUsername(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Marks an order as sent to the admin. The receipt itself now travels
 * user-to-admin directly inside Telegram (opened client-side via a
 * t.me deep link) rather than through an in-app upload, so this just
 * queues the order for review and gives the admin a heads-up — the
 * admin panel's approve/reject flow doesn't need a receipt image to work.
 */
router.post(
  "/manual/:id/mark-sent",
  requireAuth,
  rateLimit({ key: "mark-sent", windowMs: 600_000, max: 10 }),
  async (req, res, next) => {
    try {
      const order = await queryOne(
        "SELECT * FROM payments WHERE id = $1 AND user_id = $2 AND method = 'manual'",
        [req.params.id, req.userId]
      );
      if (!order) return res.status(404).json({ error: "not_found" });
      if (order.status === "paid") return res.status(409).json({ error: "already_paid" });

      const [user, adminChatId] = await Promise.all([
        queryOne("SELECT telegram_id, first_name, username FROM users WHERE id = $1", [req.userId]),
        getAdminChatId(),
      ]);

      if (adminChatId) {
        const who = user?.username ? `@${user.username}` : user?.first_name || `ID ${req.userId}`;
        // Best-effort heads-up only — the user's own Telegram message to the
        // admin is the actual delivery, so a push failure here must not block
        // the order from queuing for review.
        await sendTelegramNotification(
          adminChatId,
          `💳 <b>To'lov: Telegramda yuborildi</b>\n` +
            `Foydalanuvchi: ${who}\n` +
            `Reja: ${order.plan_title} — ${order.amount_uzs} so'm\n` +
            `Buyurtma: #${order.id}\n\n` +
            `Chek foydalanuvchidan to'g'ridan-to'g'ri Telegramda keladi. Tekshirib, admin panelda tasdiqlang.`
        ).catch(() => {});
      }

      const updated = await queryOne(
        `UPDATE payments SET status = 'awaiting_review' WHERE id = $1 RETURNING *`,
        [order.id]
      );

      res.status(201).json({ payment: mapPayment(updated) });
    } catch (err) {
      next(err);
    }
  }
);

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
