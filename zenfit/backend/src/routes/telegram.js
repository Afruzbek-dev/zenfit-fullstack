import { Router } from "express";
import crypto from "node:crypto";
import { handleUpdate } from "../bot.js";

const router = Router();

/**
 * Telegram webhook.
 *
 * Serverless hosts cannot run the long-polling loop, so production receives
 * updates here instead. Telegram echoes the `secret_token` given to setWebhook
 * back in this header, which is the only thing proving the caller is Telegram —
 * without it configured the endpoint stays closed.
 */
router.post("/webhook", async (req, res) => {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) {
    console.error("[telegram] TELEGRAM_WEBHOOK_SECRET o'rnatilmagan — webhook o'chirilgan.");
    return res.status(503).json({ error: "webhook_not_configured" });
  }

  const provided = req.headers["x-telegram-bot-api-secret-token"];
  if (typeof provided !== "string" || provided.length !== expected.length) {
    return res.status(401).json({ error: "unauthorized" });
  }
  if (!crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
    return res.status(401).json({ error: "unauthorized" });
  }

  // The update must be handled BEFORE responding: a serverless function can be
  // frozen the moment the response is sent, so anything awaited afterwards may
  // silently never run.
  try {
    await handleUpdate(req.body);
  } catch (err) {
    console.error("[telegram] update ishlov berishda xato:", err);
  }

  // Always 200, even on failure — Telegram retries any non-2xx, so a single
  // poison update would otherwise be replayed indefinitely.
  res.status(200).json({ ok: true });
});

export default router;
