import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

if (SECRET === "dev-secret-change-me") {
  console.warn("[zenfit] WARNING: JWT_SECRET is not set — using an insecure default. Set it in .env before deploying.");
}

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: "30d" });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}
