import { Router } from "express";
import multer from "multer";
import { query, queryOne, daysAgoIso, parseJsonColumn } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { mapChatMessage, mapSubscription } from "../lib/mappers.js";
import { buildTrainerContext, dayRange } from "../lib/stats.js";
import {
  analyzeFoodImage,
  askFoodQuestion,
  trainerChat,
  generateDietPlan,
  enhanceDietPlan,
  enhanceWorkoutPlan,
  translateDishName,
} from "../lib/aiFeatures.js";
import { logmealConfigured, recognizeWithLogMeal } from "../lib/logmeal.js";

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

/**
 * Today's budget, for the Premium-only "is this right for me" sentence.
 *
 * Read server-side rather than taken from the request: the client already
 * computes the suitability *percentage* locally, but these figures end up
 * inside an AI prompt, and a number that reaches a prompt should not be one the
 * caller chose. Returns null when there is nothing to compare against, which
 * makes the scan fall back to its plain nutrition answer.
 */
async function buildFitContext(userId, tz) {
  const profile = await queryOne(
    "SELECT goal, daily_calorie_target, protein_target_g FROM profiles WHERE user_id = $1",
    [userId]
  );
  if (!profile?.daily_calorie_target) return null;

  const { start, end } = dayRange(null, tz);
  const today = await queryOne(
    `SELECT COALESCE(SUM(kcal), 0) AS kcal, COALESCE(SUM(protein), 0) AS protein
       FROM meals WHERE user_id = $1 AND logged_at >= $2 AND logged_at < $3`,
    [userId, start, end]
  );

  const target = Number(profile.daily_calorie_target);
  const eaten = Number(today?.kcal) || 0;
  return {
    goal: profile.goal || "maintain",
    target,
    eaten,
    // Exercise is never credited back into the budget — see lib/calorie.js.
    remaining: target - eaten,
    proteinTarget: Number(profile.protein_target_g) || 0,
    proteinEaten: Number(today?.protein) || 0,
  };
}

/* ------------------------------ AI Scan ------------------------------ */

/**
 * Recognises a food photo, preferring LogMeal and falling back to the vision
 * model.
 *
 * LogMeal goes first because it looks nutrition up in a food database rather
 * than estimating it, so when it recognises a dish its numbers are the better
 * answer. It falls through for three separate reasons, all of them normal
 * rather than exceptional: no key configured, nothing recognised confidently,
 * or the request failed outright. Only the last one is worth a log line.
 *
 * The vision model stays the fallback rather than being retired because it is
 * the half of this that knows what osh, norin and chuchvara are — LogMeal's
 * training set does not cover Central Asian cooking, and its language list has
 * neither Uzbek nor Russian in it.
 *
 * The premium `fit` note is only ever produced by the AI path: it is written
 * by the same call that does the recognition, and LogMeal has no equivalent.
 * A LogMeal result therefore arrives without one, which the client already
 * handles — `fitNote` has always been optional.
 */
async function scanFood(buffer, mediaType, { userId, fit }) {
  const profile = await queryOne("SELECT language FROM profiles WHERE user_id = $1", [userId]);
  const lang = profile?.language || "uz";

  if (logmealConfigured()) {
    try {
      const hit = await recognizeWithLogMeal(buffer, mediaType, lang);
      if (hit) return { ...hit, name: await translateDishName(hit.name, lang) };
    } catch (err) {
      // A LogMeal outage must not take the scan down with it — the fallback
      // below is a complete answer on its own.
      console.error("[scan] logmeal ishlamadi, AI'ga o'tildi:", err.message);
    }
  }

  const result = await analyzeFoodImage(buffer.toString("base64"), mediaType, fit);
  return { ...result, provider: "ai" };
}

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

      // Premium buys the personal read on top of the numbers; the percentage
      // itself is computed client-side and everyone gets that.
      const fit = gate.premium ? await buildFitContext(req.userId, Number(req.body?.tz) || 0) : null;
      const result = await scanFood(req.file.buffer, mediaType, { userId: req.userId, fit });
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

    const fit = gate.premium ? await buildFitContext(req.userId, Number(req.body?.tz) || 0) : null;
    const result = await askFoodQuestion(q.trim().slice(0, 300), fit);
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

/** Pantry entries the prompt may name; see PANTRY_MAX for why it is bounded. */
const PANTRY_PROMPT_MAX = 60;

/**
 * Scrubs the client's pantry before it reaches a prompt.
 *
 * The food catalogue lives in the client, so the *values* have to come from
 * there — but that means this array is attacker-shaped by definition, and it is
 * interpolated straight into an AI request. Names are flattened to a single
 * line and truncated so nothing in them can pose as a new instruction block,
 * and every number is forced back into a plausible per-serving range.
 */
function sanitizePantry(input) {
  if (!Array.isArray(input)) return [];

  const num = (v, max) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
  return input
    .filter((f) => f && typeof f.name === "string" && f.name.trim())
    .slice(0, PANTRY_PROMPT_MAX)
    .map((f) => ({
      name: f.name.replace(/\s+/g, " ").trim().slice(0, 48),
      kcal: num(f.kcal, 1200),
      carbs: num(f.carbs, 200),
      protein: num(f.protein, 200),
      fat: num(f.fat, 200),
      unit: String(f.unit || "100g").replace(/\s+/g, " ").trim().slice(0, 16),
    }));
}

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

    // Read from the stored profile, not the request body — the questionnaire
    // (DietPrefsSheet) saves through PATCH /api/profile like everything else,
    // so this is always whatever was last confirmed, never trusted from the
    // generate call itself.
    const preferences = parseJsonColumn(profile.diet_prefs);
    // A pure generator — only POST /api/plans (routes/plans.js) persists,
    // which is also what keeps the previous week around as history.
    const { plan } = await generateDietPlan({ profile, pantry: sanitizePantry(req.body?.pantry), preferences });

    res.json({ plan });
  } catch (err) {
    handleAiError(err, res);
  }
});

/** Adds AI commentary on top of whichever diet plan the client currently has open. */
router.post("/diet-plan/enhance", requireAuth, rateLimit({ key: "enhance", windowMs: 300_000, max: 4 }), async (req, res) => {
  try {
    const { plan } = req.body || {};
    // Weekly plans carry days[], older/preset plans carry meals[].
    const hasMeals = plan?.meals?.length > 0 || plan?.days?.some?.((d) => d?.meals?.length > 0);
    if (!hasMeals) return res.status(400).json({ error: "plan_required" });

    const profile = await queryOne("SELECT * FROM profiles WHERE user_id = $1", [req.userId]);
    if (!profile) return res.status(400).json({ error: "onboarding_required" });

    if (!(await isPremium(req.userId))) {
      return res.status(402).json({
        error: "premium_required",
        message: "AI ovqatlanish maslahatlari Premium imkoniyati. Premium'ni faollashtiring.",
      });
    }

    const enhancement = await enhanceDietPlan({ profile, plan });
    res.json({ enhancement });
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

    // A real AI call, unlike the deterministic plan itself — premium-gated the
    // same way as the diet plan, and for the same reason (see /diet-plan above).
    if (!(await isPremium(req.userId))) {
      return res.status(402).json({
        error: "premium_required",
        message: "AI murabbiy maslahatlari Premium imkoniyati. Premium'ni faollashtiring.",
      });
    }

    const enhancement = await enhanceWorkoutPlan({ profile, plan });
    res.json({ enhancement });
  } catch (err) {
    handleAiError(err, res);
  }
});

export default router;
