/**
 * One-time Telegram wiring: webhook, menu button and command list.
 *
 *   node --env-file=.env scripts/setup-bot.js                 # show current state
 *   node --env-file=.env scripts/setup-bot.js --apply         # apply everything
 *   node --env-file=.env scripts/setup-bot.js --delete-webhook  # back to polling
 *
 * Requires BOT_TOKEN, API_BASE_URL (deployed backend), MINI_APP_URL and
 * TELEGRAM_WEBHOOK_SECRET in the environment.
 */

import { setWebhook, deleteWebhook, getWebhookInfo, setMenuButton, setCommands } from "../src/bot.js";

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const remove = args.has("--delete-webhook");

const required = ["BOT_TOKEN", "API_BASE_URL", "MINI_APP_URL", "TELEGRAM_WEBHOOK_SECRET"];
const missing = required.filter((k) => !process.env[k]);

function show(label, res) {
  if (!res) return console.log(`${label}: javob yo'q (BOT_TOKEN tekshiring)`);
  console.log(`${label}: ${res.ok ? "OK" : `XATO — ${res.description || JSON.stringify(res)}`}`);
}

if (remove) {
  show("deleteWebhook", await deleteWebhook());
  console.log("\nBot endi polling rejimida ishlatilishi mumkin (lokal).");
  process.exit(0);
}

const info = await getWebhookInfo();
console.log("=== Hozirgi webhook holati ===");
if (info?.ok) {
  const r = info.result;
  console.log("  URL:", r.url || "(o'rnatilmagan)");
  console.log("  Kutilayotgan update:", r.pending_update_count);
  if (r.last_error_message) console.log("  Oxirgi xato:", r.last_error_message, "@", new Date(r.last_error_date * 1000).toISOString());
} else {
  console.log("  o'qib bo'lmadi:", info?.description || "javob yo'q");
}

if (!apply) {
  console.log("\nO'zgartirish uchun --apply bilan qayta ishga tushiring.");
  if (missing.length) console.log("Yetishmayotgan env:", missing.join(", "));
  process.exit(0);
}

if (missing.length) {
  console.error("\nXATO — quyidagi env o'zgaruvchilar yo'q:", missing.join(", "));
  process.exit(1);
}

const webhookUrl = `${process.env.API_BASE_URL.replace(/\/$/, "")}/api/telegram/webhook`;
console.log("\n=== Qo'llanmoqda ===");
console.log("  Webhook URL:", webhookUrl);
console.log("  Mini App URL:", process.env.MINI_APP_URL);

show("setWebhook", await setWebhook(webhookUrl, process.env.TELEGRAM_WEBHOOK_SECRET));
show("setChatMenuButton", await setMenuButton(process.env.MINI_APP_URL));
show("setMyCommands", await setCommands());

const after = await getWebhookInfo();
if (after?.ok) console.log("\nTasdiqlandi — webhook:", after.result.url || "(bo'sh)");
