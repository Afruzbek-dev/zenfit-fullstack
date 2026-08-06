import { Router } from "express";
import { queryOne } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { sendMarketingPush } from "../bot.js";

const router = Router();

/** Sends the current user a sample push. Rate limited so it cannot be abused. */
router.post("/test-push", requireAuth, rateLimit({ key: "push", windowMs: 300_000, max: 3 }), async (req, res, next) => {
  try {
    const user = await queryOne("SELECT telegram_id FROM users WHERE id = $1", [req.userId]);
    if (!user?.telegram_id) return res.status(400).json({ error: "user_not_found" });

    const ok = await sendMarketingPush(user.telegram_id, req.body?.type || "streak");
    res.json({ ok });
  } catch (err) {
    next(err);
  }
});

export default router;
