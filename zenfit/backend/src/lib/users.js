import { query, queryOne } from "../db.js";

/**
 * Creates the user row (and empty profile/subscription) on first sight.
 * Shared by the login route and the bootstrap route so a session is set up
 * identically whichever door the client comes through.
 */
export async function upsertUser({ id, first_name, username, language_code, photo_url }) {
  const telegramId = String(id);

  await query(
    `INSERT INTO users (telegram_id, first_name, username, language_code)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (telegram_id) DO UPDATE
       SET first_name = $2, username = $3, last_seen_at = now()`,
    [telegramId, first_name || null, username || null, language_code || "uz"]
  );

  // Telegram's avatar seeds the profile picture, but never overwrites one the
  // user uploaded themselves.
  if (photo_url) {
    await query(
      "UPDATE users SET avatar_url = $1 WHERE telegram_id = $2 AND avatar_url IS NULL",
      [photo_url, telegramId]
    );
  }

  const user = await queryOne("SELECT * FROM users WHERE telegram_id = $1", [telegramId]);

  // A blank profile is created so the client always has a row to read; the
  // onboarding flow fills it in and flips onboarding_completed.
  await Promise.all([
    query(`INSERT INTO profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [user.id]),
    query(`INSERT INTO subscriptions (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING`, [user.id]),
  ]);

  return user;
}
