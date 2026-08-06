import { verifyToken } from "../lib/jwt.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "no_token" });

  const payload = verifyToken(token);
  if (!payload?.sub) return res.status(401).json({ error: "invalid_token" });

  req.userId = payload.sub;
  next();
}
