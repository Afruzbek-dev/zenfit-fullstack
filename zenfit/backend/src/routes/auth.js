import { Router } from "express";
import { queryOne } from "../db.js";
import { validateTelegramInitData } from "../lib/telegramAuth.js";
import { signToken } from "../lib/jwt.js";
import { upsertUser } from "../lib/users.js";
import { mapProfile, mapSubscription } from "../lib/mappers.js";
import { isChannelMember, REQUIRED_CHANNEL_USERNAME, REQUIRED_CHANNEL_URL } from "../bot.js";

const router = Router();

async function sessionPayload(user) {
  const [profile, subscription] = await Promise.all([
    queryOne("SELECT * FROM profiles WHERE user_id = $1", [user.id]),
    queryOne("SELECT * FROM subscriptions WHERE user_id = $1", [user.id]),
  ]);
  return {
    token: signToken({ sub: user.id }),
    user: { id: user.id, firstName: user.first_name, username: user.username, avatarUrl: user.avatar_url },
    profile: mapProfile(profile),
    subscription: mapSubscription(subscription),
  };
}

router.post("/telegram", async (req, res, next) => {
  try {
    const { initData } = req.body || {};
    const botToken = process.env.BOT_TOKEN;

    if (!initData) return res.status(400).json({ error: "initData_required" });
    if (!botToken) return res.status(500).json({ error: "bot_token_not_configured" });

    const result = validateTelegramInitData(initData, botToken);
    if (!result) return res.status(401).json({ error: "invalid_init_data" });
    if (!result.user?.id) return res.status(400).json({ error: "no_user_in_init_data" });

    const user = await upsertUser(result.user);

    // Same gate as /api/bootstrap — this route is only the fallback path
    // (used when a stale token forces a fresh login), but it must not become
    // a way to slip past the requirement.
    if (!(await isChannelMember(user.telegram_id))) {
      return res.status(403).json({
        error: "channel_subscription_required",
        channelUsername: REQUIRED_CHANNEL_USERNAME,
        channelUrl: REQUIRED_CHANNEL_URL,
      });
    }

    res.json(await sessionPayload(user));
  } catch (err) {
    next(err);
  }
});

/**
 * Local development only — lets the app be opened in a normal browser without
 * Telegram. Requires ALLOW_DEV_LOGIN=1, which must never be set in production.
 */
router.post("/dev", async (req, res, next) => {
  if (process.env.ALLOW_DEV_LOGIN !== "1") {
    return res.status(404).json({ error: "not_found" });
  }
  try {
    const user = await upsertUser({
      id: req.body?.telegramId || "dev-1",
      first_name: req.body?.firstName || "Dev",
      username: "dev_user",
      language_code: "uz",
    });
    res.json({ ...(await sessionPayload(user)), devMode: true });
  } catch (err) {
    next(err);
  }
});

export default router;
