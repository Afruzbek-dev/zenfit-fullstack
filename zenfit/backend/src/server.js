import express from "express";
import cors from "cors";
import { initDb, usingPostgres } from "./db.js";
import authRoutes from "./routes/auth.js";
import onboardingRoutes from "./routes/onboarding.js";
import profileRoutes from "./routes/profile.js";
import mealsRoutes from "./routes/meals.js";
import workoutLogsRoutes from "./routes/workoutLogs.js";
import trackingRoutes from "./routes/tracking.js";
import plansRoutes from "./routes/plans.js";
import aiRoutes from "./routes/ai.js";
import notificationsRoutes from "./routes/notifications.js";
import adminRoutes from "./routes/admin.js";
import paymentRoutes from "./routes/payment.js";
import telegramRoutes from "./routes/telegram.js";
import { startBotPolling } from "./bot.js";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "*").split(",").map((s) => s.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins.includes("*") ? true : allowedOrigins }));
app.use(express.json({ limit: "2mb" }));

// Connection is established once per process. On Vercel every cold start re-runs
// this module, so requests wait on the same promise instead of racing it.
const ready = initDb().catch((err) => {
  console.error("[db] ulanib bo'lmadi:", err.message);
  throw err;
});

// Without a terminal handler this rejection is "unhandled" until the first
// request awaits it, which crashes the process on a cold start. The middleware
// below still awaits `ready` and turns the failure into a 503 per request.
ready.catch(() => {});

app.get("/api/health", (req, res) =>
  res.json({
    ok: true,
    db: usingPostgres ? "postgres" : "sqlite",
    ai: Boolean(process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.startsWith("sk-ant-your-key")),
  })
);
app.get("/", (req, res) => res.json({ message: "ZenFit Backend API", health: "/api/health" }));

app.use(async (req, res, next) => {
  try {
    await ready;
    next();
  } catch {
    res.status(503).json({ error: "db_unavailable", message: "Ma'lumotlar bazasiga ulanib bo'lmadi." });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/meals", mealsRoutes);
app.use("/api/workout-logs", workoutLogsRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/plans", plansRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/telegram", telegramRoutes);

app.use((req, res) => res.status(404).json({ error: "not_found" }));

// eslint-disable-next-line no-unused-vars -- Express identifies error handlers by arity
app.use((err, req, res, next) => {
  console.error("[error]", err);
  res.status(500).json({ error: "internal_error" });
});

const PORT = process.env.PORT || 8787;
const isServerless = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);

if (!isServerless) {
  ready
    .then(() => {
      app.listen(PORT, () => {
        console.log(`ZenFit backend: http://localhost:${PORT}`);
        if (process.env.ALLOW_DEV_LOGIN === "1") {
          console.log("⚠️  ALLOW_DEV_LOGIN=1 — /api/auth/dev ochiq (production'da o'chiring)");
        }
        // Polling is for local development only. In production Telegram pushes
        // updates to /api/telegram/webhook; running both would double-handle
        // every message, so polling is skipped once a webhook is configured.
        if (process.env.USE_TELEGRAM_WEBHOOK === "1") {
          console.log("🤖 Webhook rejimi — polling ishga tushirilmadi");
        } else {
          try {
            startBotPolling();
          } catch (e) {
            console.log("Bot polling o'tkazib yuborildi:", e.message);
          }
        }
      });
    })
    .catch(() => process.exit(1));
}

export default app;
