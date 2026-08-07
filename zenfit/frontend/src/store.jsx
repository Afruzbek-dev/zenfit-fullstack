import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, login, setToken, getToken } from "./api.js";
import { translator, storedLanguage, persistLanguage, DICTS } from "./lib/i18n.js";
import { applyTheme, storedTheme, watchSystemTheme } from "./lib/theme.js";

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
    const [s, m, p, w, a] = await Promise.allSettled([
      api.getSummary(),
      api.getMeals(),
      api.getPlans(),
      api.getWorkoutHistory(),
      api.getActivities(),
    ]);
    if (s.status === "fulfilled") setSummary(s.value);
    if (m.status === "fulfilled") setMeals(m.value.meals || []);
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

  const boot = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      let session;
      if (getToken()) {
        // Reuse the stored session; fall back to a fresh login if it expired.
        try {
          const me = await api.getProfile();
          session = { profile: me.profile, subscription: me.subscription };
          if (me.user) setUser(me.user);
        } catch {
          setToken("");
        }
      }
      if (!session) {
        const fresh = await login();
        setToken(fresh.token);
        setUser(fresh.user);
        session = fresh;
      }
      setProfile(session.profile);
      setSubscription(session.subscription || { isPremium: false, plan: "free" });
      adoptPreferences(session.profile);

      if (session.profile?.onboardingCompleted) await refresh();
      setStatus("ready");
    } catch (e) {
      setError(e);
      setStatus("error");
    }
  }, [refresh, adoptPreferences]);

  useEffect(() => {
    boot();
  }, [boot]);

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
    setWorkoutHistory((prev) => [res.workoutLog, ...prev]);
    setSummary((prev) =>
      prev
        ? { ...prev, burned: prev.burned + (payload.kcal || 0), remaining: prev.remaining + (payload.kcal || 0), workoutCount: prev.workoutCount + 1 }
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

  /** Single entry point for profile edits — keeps profile and user in sync. */
  const updateProfile = useCallback(async (patch) => {
    const res = await api.patchProfile(patch);
    setProfile(res.profile);
    if (res.user) setUser(res.user);
    adoptPreferences(res.profile);
    return res.profile;
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
      summary, meals, activities, workoutPlan, dietPlan, setDietPlan, workoutHistory,
      addMeal, removeMeal, addWater, logWorkout, saveWorkoutPlan, completeOnboarding,
      addActivity, removeActivity, updateProfile,
      lang, setLanguage, theme, setTheme, t,
      toast, showToast,
    }),
    [
      status, error, boot, refresh, user, profile, subscription, summary, meals,
      activities, workoutPlan, dietPlan, workoutHistory, addMeal, removeMeal, addWater,
      logWorkout, saveWorkoutPlan, completeOnboarding, addActivity, removeActivity,
      updateProfile, lang, setLanguage, theme, setTheme, t, toast, showToast,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
