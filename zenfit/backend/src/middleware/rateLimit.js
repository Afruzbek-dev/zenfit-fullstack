/**
 * Small in-memory rate limiter for the AI routes, which cost real money per
 * call. Per-process only — good enough for a single backend instance; move to
 * Redis if the API is ever scaled horizontally.
 */
const buckets = new Map();

export function rateLimit({ windowMs = 60_000, max = 10, key = "default" } = {}) {
  return (req, res, next) => {
    const id = `${key}:${req.userId || req.ip}`;
    const now = Date.now();
    const entry = buckets.get(id);

    if (!entry || now > entry.resetAt) {
      buckets.set(id, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: "rate_limited",
        message: `Juda ko'p so'rov. ${retryAfter} soniyadan keyin qayta urinib ko'ring.`,
      });
    }

    entry.count += 1;
    next();
  };
}

// Keeps the map from growing without bound in a long-lived process.
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of buckets) if (now > entry.resetAt) buckets.delete(id);
}, 300_000).unref?.();
