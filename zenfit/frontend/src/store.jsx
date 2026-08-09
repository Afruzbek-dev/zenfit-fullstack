import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, login, setToken } from "./api.js";
import { translator, storedLanguage, persistLanguage, DICTS } from "./lib/i18n.js";
import { applyTheme, storedTheme, watchSystemTheme } from "./lib/theme.js";
import { localDateKey, msUntilLocalMidnight } from "./lib/format.js";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [subscription, setSubscription] = useState({ isPremium: false, plan: "free" });
  const [summary, setSummary] = useState(null);
  const [meals, setMeals] = useState([]);
  const [recentFoods, setRecentFoods] = useState([]);
  const [activities, setActivities] = useState([]);
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [dietPlan, setDietPlan] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [toast, setToast] = useState(null);

  // Both are seeded from localStorage so the very first paint is already in the
  // right language and theme, then reconciled with the server profile on boot.
  const [lang, setLang] = useState(storedLanguage);
  const [theme, setThemeState] = useState(storedTheme);

  const t = useMemo(() => translator(lang), [lang]);

  const themeRef = useRef(theme);
  themeRef.current = theme;
  useEffect(() => watchSystemTheme(() => themeRef.current), []);

  const toastTimer = useRef(null);
  const showToast = useCallback((message, tone = "neutral") => {
    setToast({ message, tone });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /** Refetches everything the shell renders from. */
  const refresh = useCallback(async () => {
    const [s, m, p, w, a, r] = await Promise.allSettled([
      api.getSummary(),
      api.getMeals(),
      api.getPlans(),
      api.getWorkoutHistory(),
      api.getActivities(),
      api.getRecentMeals(),
    ]);
    if (s.status === "fulfilled") setSummary(s.value);
    if (m.status === "fulfilled") setMeals(m.value.meals || []);
    if (r.status === "fulfilled") setRecentFoods(r.value.foods || []);
    if (p.status === "fulfilled") {
      setWorkoutPlan(p.value.workoutPlan?.plan || null);
      setDietPlan(p.value.dietPlan?.plan || null);
    }
    if (w.status === "fulfilled") setWorkoutHistory(w.value.workoutLogs || []);
    if (a.status === "fulfilled") setActivities(a.value.activities || []);
  }, []);

  /** Server preferences win once the profile arrives; local storage is the seed. */
  const adoptPreferences = useCallback((p) => {
    if (!p) return;
    if (p.language && DICTS[p.language]) {
      setLang(p.language);
      persistLanguage(p.language);
    }
    if (p.theme) {
      setThemeState(p.theme);
      applyTheme(p.theme);
    }
  }, []);

  /**
   * One request brings back the session and every collection the shell renders.
   * Falls back to the older login + fan-out path only when bootstrap is not
   * usable — outside Telegram, where dev login is the way in.
   */
  const boot = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      let data;
      try {
        data = await api.bootstrap();
      } catch (e) {
        // A stale token makes bootstrap reject; clear it and log in fresh.
        if (e.status === 401) {
          setToken("");
          const fresh = await login();
          setToken(fresh.token);
          data = { ...fresh, onboarding: !fresh.profile?.onboardingCompleted };
        } else {
          throw e;
        }
      }

      if (data.token) setToken(data.token);
      if (data.user) setUser(data.user);
      setProfile(data.profile);
      setSubscription(data.subscription || { isPremium: false, plan: "free" });
      adoptPreferences(data.profile);

      if (data.onboarding === false) {
        setSummary(data.summary ?? null);
        setMeals(data.meals || []);
        setWorkoutPlan(data.workoutPlan || null);
        setDietPlan(data.dietPlan || null);
        setWorkoutHistory(data.workoutLogs || []);
        setActivities(data.activities || []);
        setRecentFoods(data.recentFoods || []);
      } else if (data.profile?.onboardingCompleted) {
        // The fallback path returns a session only.
        await refresh();
      }

      setStatus("ready");
    } catch (e) {
      setError(e);
      setStatus("error");
    }
  }, [refresh, adoptPreferences]);

  useEffect(() => {
    boot();
  }, [boot]);

  /**
   * Roll the dashboard over at local midnight.
   *
   * Without this an app left open overnight keeps showing yesterday's totals,
   * and a phone that was asleep comes back to a stale day. The timer is
   * re-armed each night rather than using a fixed 24h interval so it stays
   * aligned with the wall clock, and a visibility check covers the case where
   * the timer was frozen while the app was backgrounded.
   */
  const dayKeyRef = useRef(localDateKey());
  useEffect(() => {
    if (status !== "ready") return undefined;

    let timer;
    const rollover = () => {
      const now = localDateKey();
      if (now !== dayKeyRef.current) {
        dayKeyRef.current = now;
        refresh();
      }
    };

    const arm = () => {
      clearTimeout(timer);
      // A second past midnight, so the new date has definitely ticked over.
      timer = setTimeout(() => {
        rollover();
        arm();
      }, msUntilLocalMidnight() + 1000);
    };
    arm();

    const onVisible = () => {
      if (document.visibilityState === "visible") rollover();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [status, refresh]);

  /* ---------------------------- mutations ---------------------------- */

  const addMeal = useCallback(
    async (meal) => {
      const res = await api.addMeal(meal);
      setMeals((prev) => [...prev, res.meal]);
      setSummary((prev) =>
        prev
          ? {
              ...prev,
              kcal: prev.kcal + (res.meal.kcal || 0),
              carbs: prev.carbs + (res.meal.carbs || 0),
              protein: prev.protein + (res.meal.protein || 0),
              fat: prev.fat + (res.meal.fat || 0),
              remaining: prev.remaining - (res.meal.kcal || 0),
              mealCount: prev.mealCount + 1,
            }
          : prev
      );

      // Keep Home's one-tap strip current without another round trip — the food
      // just logged is by definition the most recent one. The server reorders by
      // frequency on the next refresh.
      setRecentFoods((prev) => {
        const m = res.meal;
        const key = (f) => `${f.name}|${f.kcal}|${f.portionG ?? ""}`;
        const entry = {
          name: m.name, emoji: m.emoji, kcal: m.kcal, carbs: m.carbs,
          protein: m.protein, fat: m.fat, portionG: m.portionG, times: 1,
        };
        const seen = prev.find((f) => key(f) === key(entry));
        return [
          seen ? { ...seen, times: seen.times + 1 } : entry,
          ...prev.filter((f) => key(f) !== key(entry)),
        ].slice(0, 8);
      });

      return res.meal;
    },
    []
  );

  const removeMeal = useCallback(async (id) => {
    const meal = await new Promise((resolve) => {
      setMeals((prev) => {
        resolve(prev.find((m) => m.id === id));
        return prev.filter((m) => m.id !== id);
      });
    });
    try {
      await api.deleteMeal(id);
      setSummary((prev) =>
        prev && meal
          ? {
              ...prev,
              kcal: prev.kcal - (meal.kcal || 0),
              carbs: prev.carbs - (meal.carbs || 0),
              protein: prev.protein - (meal.protein || 0),
              fat: prev.fat - (meal.fat || 0),
              remaining: prev.remaining + (meal.kcal || 0),
              mealCount: Math.max(0, prev.mealCount - 1),
            }
          : prev
      );
    } catch (e) {
      if (meal) setMeals((prev) => [...prev, meal].sort((a, b) => a.id - b.id));
      throw e;
    }
  }, []);

  const addWater = useCallback(async (ml) => {
    const res = await api.addWater(ml);
    setSummary((prev) => (prev ? { ...prev, waterMl: res.waterMl } : prev));
  }, []);

  const logWorkout = useCallback(async (payload) => {
    const res = await api.logWorkout(payload);
    // The server owns the burn figure, so credit what it stored rather than
    // what was sent — otherwise the ring drifts from the day's real total.
    const kcal = res.workoutLog?.kcal || 0;
    setWorkoutHistory((prev) => [res.workoutLog, ...prev]);
    setSummary((prev) =>
      prev
        ? { ...prev, burned: prev.burned + kcal, remaining: prev.remaining + kcal, workoutCount: prev.workoutCount + 1 }
        : prev
    );
    return res.workoutLog;
  }, []);

  const addActivity = useCallback(async (payload) => {
    const res = await api.addActivity(payload);
    const a = res.activity;
    setActivities((prev) => [a, ...prev]);
    setSummary((prev) =>
      prev
        ? {
            ...prev,
            burned: prev.burned + (a.kcal || 0),
            activityKcal: (prev.activityKcal || 0) + (a.kcal || 0),
            activityCount: (prev.activityCount || 0) + 1,
            activityMinutes: (prev.activityMinutes || 0) + (a.durationMin || 0),
            remaining: prev.remaining + (a.kcal || 0),
          }
        : prev
    );
    return a;
  }, []);

  const removeActivity = useCallback(async (id) => {
    const removed = activities.find((a) => a.id === id);
    setActivities((prev) => prev.filter((a) => a.id !== id));
    try {
      await api.deleteActivity(id);
      setSummary((prev) =>
        prev && removed
          ? {
              ...prev,
              burned: Math.max(0, prev.burned - (removed.kcal || 0)),
              activityKcal: Math.max(0, (prev.activityKcal || 0) - (removed.kcal || 0)),
              activityCount: Math.max(0, (prev.activityCount || 0) - 1),
              activityMinutes: Math.max(0, (prev.activityMinutes || 0) - (removed.durationMin || 0)),
              remaining: prev.remaining - (removed.kcal || 0),
            }
          : prev
      );
    } catch (e) {
      if (removed) setActivities((prev) => [removed, ...prev]);
      throw e;
    }
  }, [activities]);

  /**
   * Single entry point for profile edits — keeps profile and user in sync.
   *
   * Returns the whole response, not just the profile: a body-metric edit can
   * come back with `safety`, explaining that the calorie engine refused the
   * goal it was handed. Callers that only care about success can keep ignoring
   * the return value.
   */
  const updateProfile = useCallback(async (patch) => {
    const res = await api.patchProfile(patch);
    setProfile(res.profile);
    if (res.user) setUser(res.user);
    adoptPreferences(res.profile);
    return res;
  }, [adoptPreferences]);

  const setLanguage = useCallback(async (next) => {
    setLang(next);
    persistLanguage(next);
    // Written through so the AI trainer and the bot answer in the same language.
    try {
      const res = await api.patchProfile({ language: next });
      setProfile(res.profile);
    } catch {
      /* the local switch already took effect */
    }
  }, []);

  const setTheme = useCallback(async (next) => {
    setThemeState(next);
    applyTheme(next);
    try {
      const res = await api.patchProfile({ theme: next });
      setProfile(res.profile);
    } catch {
      /* the local switch already took effect */
    }
  }, []);

  const saveWorkoutPlan = useCallback(async (plan) => {
    await api.savePlan("workout", plan);
    setWorkoutPlan(plan);
  }, []);

  const completeOnboarding = useCallback(async (data) => {
    const res = await api.submitOnboarding(data);
    setProfile(res.profile);
    await refresh();
    return res;
  }, [refresh]);

  const value = useMemo(
    () => ({
      status, error, boot, refresh,
      user, profile, setProfile, subscription, setSubscription,
      summary, meals, recentFoods, activities, workoutPlan, dietPlan, setDietPlan, workoutHistory,
      addMeal, removeMeal, addWater, logWorkout, saveWorkoutPlan, completeOnboarding,
      addActivity, removeActivity, updateProfile,
      lang, setLanguage, theme, setTheme, t,
      toast, showToast,
    }),
    [
      status, error, boot, refresh, user, profile, subscription, summary, meals, recentFoods,
      activities, workoutPlan, dietPlan, workoutHistory, addMeal, removeMeal, addWater,
      logWorkout, saveWorkoutPlan, completeOnboarding, addActivity, removeActivity,
      updateProfile, lang, setLanguage, theme, setTheme, t, toast, showToast,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
