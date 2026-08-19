import crypto from "node:crypto";

/**
 * Verifies the `initData` string Telegram passes to a Mini App.
 * Spec: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * Returns { user, authDate, startParam } if valid, or null if the signature is
 * bad, missing, or too old. `startParam` is whatever followed `?startapp=` on
 * the link the user opened the app with (e.g. a referral code) — it rides
 * inside the same HMAC-signed query string as `user`, so it is exactly as
 * tamper-resistant, with no extra verification needed.
 */
export function validateTelegramInitData(initData, botToken, maxAgeSeconds = 86400) {
  if (!initData || !botToken) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const pairs = [];
  for (const [key, value] of params.entries()) pairs.push(`${key}=${value}`);
  pairs.sort();
  const dataCheckString = pairs.join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  // timing-safe compare
  const a = Buffer.from(computedHash, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const authDate = Number(params.get("auth_date") || 0);
  const ageSeconds = Date.now() / 1000 - authDate;
  if (!authDate || ageSeconds > maxAgeSeconds) return null;

  const userJson = params.get("user");
  const user = userJson ? JSON.parse(userJson) : null;

  return { user, authDate, startParam: params.get("start_param") || null };
}
