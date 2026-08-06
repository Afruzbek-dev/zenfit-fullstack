import { Router } from "express";
import { query, queryOne } from "../db.js";
import { validateTelegramInitData } from "../lib/telegramAuth.js";
import { signToken } from "../lib/jwt.js";
import { mapProfile, mapSubscription } from "../lib/mappers.js";

const router = Router();

/** Creates the user row (and empty profile/subscription) on first sight. */
async function upsertUser({ id, first_name, username, language_code }) {
  const telegramId = String(id);

  await query(
    `INSERT INTO users (telegram_id, first_name, username, language_code)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (telegram_id) DO UPDATE
       SET first_name = $2, username = $3, last_seen_at = now()`,
    [telegramId, first_name || null, username || null, language_code || "uz"]
  );

  const user = await queryOne("SELECT * FROM users WHERE telegram_id = $1", [telegramId]);

  // A blank profile is created so the client always has a row to read; the
  // onboarding flow fills it in and flips onboarding_completed.
  await query(
    `INSERT INTO profiles (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [user.id]
  );
  await query(
    `INSERT INTO subscriptions (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO NOTHING`,
    [user.id]
  );

  return user;
}

async function sessionPayload(user) {
  const profile = await queryOne("SELECT * FROM profiles WHERE user_id = $1", [user.id]);
  const subscription = await queryOne("SELECT * FROM subscriptions WHERE user_id = $1", [user.id]);
  return {
    token: signToken({ sub: user.id }),
    user: { id: user.id, firstName: user.first_name, username: user.username },
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
