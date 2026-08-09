import { Router } from "express";
import multer from "multer";
import { query, queryOne, daysAgoIso } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { mapChatMessage, mapSubscription } from "../lib/mappers.js";
import { buildTrainerContext } from "../lib/stats.js";
import {
  analyzeFoodImage,
  askFoodQuestion,
  trainerChat,
  generateDietPlan,
  enhanceWorkoutPlan,
} from "../lib/aiFeatures.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const router = Router();

// Free tier allowances, per the launch plan: let people feel the value before
// the paywall rather than blocking the very first scan.
//
// These are per ROLLING 24 HOURS, not per lifetime. Counting for ever meant a
// user got three photo scans and ten chat messages in total — they hit the wall
// during the very days they were forming the habit, which is the opposite of
// what a free tier is for. A rolling window also needs no timezone and has no
// midnight cliff to game.
const FREE_SCANS = 3;
const FREE_CHAT_MESSAGES = 10;
const QUOTA_WINDOW_DAYS = 1;

function handleAiError(err, res) {
  if (err.code === "NO_API_KEY") {
    return res.status(503).json({
      error: "ai_not_configured",
      message: "AI hali sozlanmagan. Backend .env fayliga ANTHROPIC_API_KEY yoki GEMINI_API_KEY qo'shing.",
    });
  }
  if (err instanceof SyntaxError) {
    return res.status(502).json({ error: "ai_bad_response", message: "AI javobini o'qib bo'lmadi, qayta urinib ko'ring." });
  }
  console.error("[ai]", err);
  return res.status(502).json({ error: "ai_request_failed", message: "AI javob bera olmadi, qayta urinib ko'ring." });
}

async function isPremium(userId) {
  const row = await queryOne("SELECT * FROM subscriptions WHERE user_id = $1", [userId]);
  return mapSubscription(row).isPremium;
}

async function usageCount(userId, feature) {
  const row = await queryOne(
    "SELECT COUNT(*) AS c FROM ai_usage WHERE user_id = $1 AND feature = $2 AND used_at >= $3",
    [userId, feature, daysAgoIso(QUOTA_WINDOW_DAYS)]
  );
  return Number(row?.c || 0);
}

async function recordUsage(userId, feature) {
  await query("INSERT INTO ai_usage (user_id, feature) VALUES ($1, $2)", [userId, feature]);
}

/**
 * Returns `{ premium, used }` when the call may proceed, or null after sending
 * a 402. Callers reuse `used` to report the remaining allowance instead of
 * asking the database the same two questions a second time.
 */
async function checkQuota(req, res, feature, freeLimit) {
  const premium = await isPremium(req.userId);
  if (premium) return { premium, used: 0 };

  const used = await usageCount(req.userId, feature);
  if (used >= freeLimit) {
    res.status(402).json({
      error: "quota_exceeded",
      feature,
      used,
      limit: freeLimit,
      message: "Bugungi bepul limit tugadi. Cheksiz foydalanish uchun ZenFit Premium'ni faollashtiring.",
    });
    return null;
  }
  return { premium, used };
}

/* ------------------------------ AI Scan ------------------------------ */

router.post(
  "/scan",
  requireAuth,
  rateLimit({ key: "scan", windowMs: 60_000, max: 6 }),
  upload.single("image"),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "image_required" });

    const mediaType = req.file.mimetype;
    if (!["image/jpeg", "image/png", "image/webp"].includes(mediaType)) {
      return res.status(400).json({ error: "unsupported_image_type", message: "Faqat JPEG, PNG yoki WebP rasm yuboring." });
    }

    try {
      const gate = await checkQuota(req, res, "scan", FREE_SCANS);
      if (!gate) return;

      const result = await analyzeFoodImage(req.file.buffer.toString("base64"), mediaType);
      // A photo the model could not read is not worth an allowance unit. Two bad
      // shots of home cooking used to spend most of the free tier.
      if (result.recognized) await recordUsage(req.userId, "scan");

      res.json({
        result,
        freeScansLeft: gate.premium ? null : Math.max(0, FREE_SCANS - gate.used - (result.recognized ? 1 : 0)),
      });
    } catch (err) {
      handleAiError(err, res);
    }
  }
);

router.post("/ask", requireAuth, rateLimit({ key: "ask", windowMs: 60_000, max: 10 }), async (req, res) => {
  const { query: q } = req.body || {};
  if (!q || typeof q !== "string" || q.trim().length < 2) {
    return res.status(400).json({ error: "query_required" });
  }
  try {
    const gate = await checkQuota(req, res, "scan", FREE_SCANS);
    if (!gate) return;

    const result = await askFoodQuestion(q.trim().slice(0, 300));
    if (result.recognized) await recordUsage(req.userId, "scan");

    res.json({
      result,
      freeScansLeft: gate.premium ? null : Math.max(0, FREE_SCANS - gate.used - (result.recognized ? 1 : 0)),
    });
  } catch (err) {
    handleAiError(err, res);
  }
});

/* --------------------------- Trainer chat --------------------------- */

router.get("/chat/history", requireAuth, async (req, res, next) => {
  try {
    const rows = await query(
      "SELECT * FROM chat_messages WHERE user_id = $1 ORDER BY created_at ASC LIMIT 100",
      [req.userId]
    );
    const premium = await isPremium(req.userId);
    const used = await usageCount(req.userId, "chat");
    res.json({
      messages: rows.map(mapChatMessage),
      freeMessagesLeft: premium ? null : Math.max(0, FREE_CHAT_MESSAGES - used),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/chat", requireAuth, rateLimit({ key: "chat", windowMs: 60_000, max: 12 }), async (req, res) => {
  const { message } = req.body || {};
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "message_required" });
  }

  try {
    const gate = await checkQuota(req, res, "chat", FREE_CHAT_MESSAGES);
    if (!gate) return;

    const text = message.trim().slice(0, 1000);

    // Recent turns only — keeps token cost predictable while staying coherent.
    // The new message is appended in memory rather than persisted up front, so a
    // failed AI call does not leave an unanswered user message in the history.
    const historyRows = await query(
      "SELECT role, content FROM chat_messages WHERE user_id = $1 ORDER BY created_at DESC LIMIT 12",
      [req.userId]
    );
    const messages = [
      ...historyRows.reverse().map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: text },
    ];

    const context = await buildTrainerContext(req.userId, Number(req.body?.tz) || 0);
    const reply = await trainerChat({ messages, context });

    await query("INSERT INTO chat_messages (user_id, role, content) VALUES ($1, 'user', $2)", [req.userId, text]);
    await query("INSERT INTO chat_messages (user_id, role, content) VALUES ($1, 'assistant', $2)", [req.userId, reply]);
    await recordUsage(req.userId, "chat");

    res.json({
      reply,
      freeMessagesLeft: gate.premium ? null : Math.max(0, FREE_CHAT_MESSAGES - gate.used - 1),
    });
  } catch (err) {
    handleAiError(err, res);
  }
});

router.delete("/chat", requireAuth, async (req, res, next) => {
  try {
    await query("DELETE FROM chat_messages WHERE user_id = $1", [req.userId]);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

/* ---------------------------- Diet plan ---------------------------- */

router.post("/diet-plan", requireAuth, rateLimit({ key: "diet", windowMs: 300_000, max: 4 }), async (req, res) => {
  try {
    const profile = await queryOne("SELECT * FROM profiles WHERE user_id = $1", [req.userId]);
    if (!profile?.daily_calorie_target) {
      return res.status(400).json({ error: "onboarding_required", message: "Avval profilni to'ldiring." });
    }

    // A generated meal plan is a premium feature. 402 is what the client already
    // maps to the upgrade prompt, so this reuses the existing quota path.
    if (!(await isPremium(req.userId))) {
      return res.status(402).json({
        error: "premium_required",
        message: "Ovqatlanish rejasi Premium imkoniyati. Premium'ni faollashtiring va shaxsiy reja oling.",
      });
    }

    const plan = await generateDietPlan({ profile });

    await query("UPDATE ai_plans SET is_active = false WHERE user_id = $1 AND plan_type = 'diet'", [req.userId]);
    const rows = await query(
      "INSERT INTO ai_plans (user_id, plan_type, plan_json) VALUES ($1, 'diet', $2) RETURNING *",
      [req.userId, JSON.stringify(plan)]
    );

    res.json({ plan, id: rows[0]?.id });
  } catch (err) {
    handleAiError(err, res);
  }
});

/** Adds AI commentary on top of the deterministic client-side workout plan. */
router.post("/workout-plan/enhance", requireAuth, rateLimit({ key: "enhance", windowMs: 300_000, max: 4 }), async (req, res) => {
  try {
    const { plan } = req.body || {};
    if (!plan?.days?.length) return res.status(400).json({ error: "plan_required" });

    const profile = await queryOne("SELECT * FROM profiles WHERE user_id = $1", [req.userId]);
    if (!profile) return res.status(400).json({ error: "onboarding_required" });

    const enhancement = await enhanceWorkoutPlan({ profile, plan });
    res.json({ enhancement });
  } catch (err) {
    handleAiError(err, res);
  }
});

export default router;
