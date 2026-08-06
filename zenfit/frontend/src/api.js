import { getInitData, isTelegram } from "./telegram.js";

const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8787").replace(/\/$/, "");
const TOKEN_KEY = "zenfit_token";

export const tz = () => new Date().getTimezoneOffset();

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setToken(t) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode */
  }
}

export class ApiError extends Error {
  constructor(status, payload) {
    super(payload?.message || payload?.error || `HTTP ${status}`);
    this.status = status;
    this.code = payload?.error;
    this.payload = payload;
  }
}

async function request(method, path, { body, isForm, auth = true } = {}) {
  const headers = {};
  if (auth) {
    const t = getToken();
    if (t) headers.authorization = `Bearer ${t}`;
  }
  if (body && !isForm) headers["content-type"] = "application/json";

  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new ApiError(0, { message: "Serverga ulanib bo'lmadi. Internetni tekshiring." });
  }

  if (res.status === 204) return null;

  const text = await res.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { message: text };
  }

  if (!res.ok) {
    // A dead session should send the user back through login, not loop on 401s.
    if (res.status === 401) setToken("");
    throw new ApiError(res.status, payload);
  }
  return payload;
}

export const api = {
  /* auth */
  loginTelegram: () => request("POST", "/api/auth/telegram", { body: { initData: getInitData() }, auth: false }),
  loginDev: () => request("POST", "/api/auth/dev", { body: {}, auth: false }),

  /* profile */
  getProfile: () => request("GET", "/api/profile"),
  patchProfile: (body) => request("PATCH", "/api/profile", { body }),
  submitOnboarding: (body) => request("POST", "/api/onboarding", { body }),

  /* meals */
  getMeals: (date) => request("GET", `/api/meals?tz=${tz()}${date ? `&date=${date}` : ""}`),
  addMeal: (body) => request("POST", "/api/meals", { body }),
  deleteMeal: (id) => request("DELETE", `/api/meals/${id}`),

  /* workouts */
  getWorkoutLogs: (date) => request("GET", `/api/workout-logs?tz=${tz()}${date ? `&date=${date}` : ""}`),
  getWorkoutHistory: () => request("GET", "/api/workout-logs/history"),
  logWorkout: (body) => request("POST", "/api/workout-logs", { body }),
  getLastSets: (exerciseId) => request("GET", `/api/workout-logs/last-sets/${encodeURIComponent(exerciseId)}`),
  getAllLastSets: () => request("GET", "/api/workout-logs/last-sets"),

  /* tracking */
  getSummary: () => request("GET", `/api/tracking/summary?tz=${tz()}`),
  getWeekly: (days = 7) => request("GET", `/api/tracking/weekly?days=${days}&tz=${tz()}`),
  addWater: (ml) => request("POST", "/api/tracking/water", { body: { ml, tz: tz() } }),
  resetWater: () => request("DELETE", `/api/tracking/water/today?tz=${tz()}`),
  getWeightHistory: () => request("GET", "/api/tracking/weight"),

  /* plans */
  getPlans: () => request("GET", "/api/plans"),
  savePlan: (planType, plan) => request("POST", "/api/plans", { body: { planType, plan } }),
  deletePlan: (planType) => request("DELETE", `/api/plans/${planType}`),

  /* ai */
  scanImage: (file) => {
    const fd = new FormData();
    fd.append("image", file);
    return request("POST", "/api/ai/scan", { body: fd, isForm: true });
  },
  askAi: (q) => request("POST", "/api/ai/ask", { body: { query: q } }),
  chat: (message) => request("POST", "/api/ai/chat", { body: { message, tz: tz() } }),
  chatHistory: () => request("GET", "/api/ai/chat/history"),
  clearChat: () => request("DELETE", "/api/ai/chat"),
  generateDietPlan: () => request("POST", "/api/ai/diet-plan", { body: {} }),
  enhanceWorkoutPlan: (plan) => request("POST", "/api/ai/workout-plan/enhance", { body: { plan } }),

  /* payment */
  getSubscription: () => request("GET", "/api/payment/subscription"),
  getPaymentPlans: () => request("GET", "/api/payment/plans"),
  checkout: (planId) => request("POST", "/api/payment/checkout", { body: { planId } }),
  devActivate: (planId) => request("POST", "/api/payment/dev-activate", { body: { planId } }),
};

/** Telegram login when available, dev login as a local fallback. */
export async function login() {
  if (isTelegram()) return api.loginTelegram();
  return api.loginDev();
}
