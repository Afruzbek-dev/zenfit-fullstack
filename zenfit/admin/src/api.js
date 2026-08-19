const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8787").replace(/\/$/, "");
const TOKEN_KEY = "zenfit_admin_token";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
};

export const setToken = (t) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode */
  }
};

export class ApiError extends Error {
  constructor(status, payload) {
    super(payload?.message || payload?.error || `HTTP ${status}`);
    this.status = status;
    this.code = payload?.error;
  }
}

async function request(method, path, body) {
  const headers = {};
  const token = getToken();
  if (token) headers.authorization = `Bearer ${token}`;
  if (body) headers["content-type"] = "application/json";

  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, { message: "Serverga ulanib bo'lmadi." });
  }

  if (res.status === 204) return null;
  const text = await res.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { message: text };
  }

  if (!res.ok) {
    // An expired admin token should drop straight back to the login screen.
    if (res.status === 401) setToken("");
    throw new ApiError(res.status, payload);
  }
  return payload;
}

/**
 * Receipt image as an object URL.
 *
 * Fetched with the auth header and wrapped in a blob rather than pointed at
 * directly: an <img src> cannot send headers, and putting the admin token in a
 * query string would leak it into referrers and server logs.
 */
export async function fetchReceipt(paymentId) {
  const res = await fetch(`${BASE}/api/admin/payments/${paymentId}/receipt`, {
    headers: { authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new ApiError(res.status, { message: "Chekni yuklab bo'lmadi" });
  return URL.createObjectURL(await res.blob());
}

export const api = {
  login: (secret) => request("POST", "/api/admin/login", { secret }),

  finance: () => request("GET", "/api/admin/finance"),
  stats: () => request("GET", "/api/admin/stats"),

  users: ({ search = "", limit = 50, offset = 0 } = {}) =>
    request("GET", `/api/admin/users?search=${encodeURIComponent(search)}&limit=${limit}&offset=${offset}`),
  user: (id) => request("GET", `/api/admin/users/${id}`),
  grantPremium: (id, body) => request("POST", `/api/admin/users/${id}/premium`, body),
  grantTrialOffer: (id) => request("POST", `/api/admin/users/${id}/trial-offer`, {}),

  payments: (status) => request("GET", `/api/admin/payments${status ? `?status=${status}` : ""}`),
  approvePayment: (id) => request("POST", `/api/admin/payments/${id}/approve`, {}),
  rejectPayment: (id, reason) => request("POST", `/api/admin/payments/${id}/reject`, { reason }),

  settings: () => request("GET", "/api/admin/settings"),
  saveSettings: (patch) => request("PUT", "/api/admin/settings", patch),
};
