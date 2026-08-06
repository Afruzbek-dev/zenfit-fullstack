import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, login, setToken, getToken } from "./api.js";

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
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [dietPlan, setDietPlan] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([]);
  const [toast, setToast] = useState(null);

  const toastTimer = useRef(null);
  const showToast = useCallback((message, tone = "neutral") => {
    setToast({ message, tone });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  /** Refetches everything the shell renders from. */
  const refresh = useCallback(async () => {
    const [s, m, p, w] = await Promise.allSettled([
      api.getSummary(),
      api.getMeals(),
      api.getPlans(),
      api.getWorkoutHistory(),
    ]);
    if (s.status === "fulfilled") setSummary(s.value);
    if (m.status === "fulfilled") setMeals(m.value.meals || []);
    if (p.status === "fulfilled") {
      setWorkoutPlan(p.value.workoutPlan?.plan || null);
      setDietPlan(p.value.dietPlan?.plan || null);
    }
    if (w.status === "fulfilled") setWorkoutHistory(w.value.workoutLogs || []);
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

      if (session.profile?.onboardingCompleted) await refresh();
      setStatus("ready");
    } catch (e) {
      setError(e);
      setStatus("error");
    }
  }, [refresh]);

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
      summary, meals, workoutPlan, dietPlan, setDietPlan, workoutHistory,
      addMeal, removeMeal, addWater, logWorkout, saveWorkoutPlan, completeOnboarding,
      toast, showToast,
    }),
    [
      status, error, boot, refresh, user, profile, subscription, summary, meals,
      workoutPlan, dietPlan, workoutHistory, addMeal, removeMeal, addWater,
      logWorkout, saveWorkoutPlan, completeOnboarding, toast, showToast,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
