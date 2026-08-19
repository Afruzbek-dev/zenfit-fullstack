import { useEffect, useState } from "react";
import { Home, Dumbbell, Camera, User2, MessageSquare, Loader2, WifiOff } from "lucide-react";
import { useApp } from "./store.jsx";
import { initTelegram, haptic, setBackButton } from "./telegram.js";
import { applyTheme } from "./lib/theme.js";
import { Toast, Button } from "./components/ui.jsx";
import TrialOfferSheet from "./components/TrialOfferSheet.jsx";
import Onboarding from "./screens/Onboarding.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import WorkoutsScreen from "./screens/WorkoutsScreen.jsx";
import ScanScreen from "./screens/ScanScreen.jsx";
import RecipesScreen from "./screens/RecipesScreen.jsx";
import DietPlanScreen from "./screens/DietPlanScreen.jsx";
import ChallengesScreen from "./screens/ChallengesScreen.jsx";
import ChatScreen from "./screens/ChatScreen.jsx";
import ProgressScreen from "./screens/ProgressScreen.jsx";
import ProfileScreen from "./screens/ProfileScreen.jsx";

const TABS = [
  { id: "home", key: "nav.home", Icon: Home },
  { id: "workouts", key: "nav.workouts", Icon: Dumbbell },
  { id: "scan", key: "nav.scan", Icon: Camera, primary: true },
  { id: "chat", key: "nav.trainer", Icon: MessageSquare },
  { id: "profile", key: "nav.profile", Icon: User2 },
];

const SECONDARY = ["recipes", "dietplan", "progress", "challenges"];

function BottomNav({ active, onChange, t }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-borderSoft bg-bg/92 backdrop-blur-xl"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="mx-auto flex h-[68px] w-full max-w-lg items-center justify-around px-2">
        {TABS.map((tab) => {
          const on = active === tab.id;
          const label = t(tab.key);

          if (tab.primary) {
            return (
              <button
                key={tab.id}
                onClick={() => {
                  haptic("light");
                  onChange(tab.id);
                }}
                aria-label={label}
                aria-current={on ? "page" : undefined}
                className="-mt-6 flex flex-col items-center gap-1"
              >
                <span
                  className={`grid h-14 w-14 place-items-center rounded-2xl shadow-lg transition-transform active:scale-95 ${
                    on ? "bg-neon shadow-neon/25" : "bg-neon/90"
                  }`}
                >
                  <tab.Icon size={23} className="text-neonOn" />
                </span>
                <span className={`text-[10px] font-bold ${on ? "text-neon" : "text-muted"}`}>{label}</span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => {
                haptic("light");
                onChange(tab.id);
              }}
              aria-label={label}
              aria-current={on ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-1 py-2"
            >
              <tab.Icon size={20} className={on ? "text-neon" : "text-faint"} />
              <span className={`text-[10px] font-semibold ${on ? "text-neon" : "text-faint"}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function BootScreen({ error, onRetry, t }) {
  return (
    <div className="app-atmosphere flex min-h-screen items-center justify-center px-8">
      <div className="relative z-10 flex flex-col items-center text-center">
        {error ? (
          <>
            <span className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-rose/12">
              <WifiOff size={26} className="text-rose" />
            </span>
            <h1 className="font-display text-[19px] font-bold text-ink">{t("common.connectFailed")}</h1>
            <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-muted">
              {error.message || t("common.connectFailedDesc")}
            </p>
            <Button className="mt-5" onClick={onRetry}>{t("common.retry")}</Button>
          </>
        ) : (
          <>
            <Loader2 size={30} className="animate-spin text-neon" />
            <p className="mt-4 font-display text-[15px] font-bold text-ink">ZenFit</p>
            <p className="mt-1 text-[12px] text-muted">{t("common.loading")}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const { status, error, profile, boot, toast, refresh, theme, t } = useApp();
  const [tab, setTabRaw] = useState("home");
  // Lets a card elsewhere in the app open a specific profile sub-screen rather
  // than dumping the user on the profile menu to find it themselves.
  const [profileView, setProfileView] = useState(null);
  const setTab = (id) => {
    const [target, view] = String(id).split(":");
    setProfileView(view || null);
    setTabRaw(target);
  };
  // Decided once when the session first loads. Onboarding saves the profile
  // partway through (to compute targets), so this must not be derived from
  // `onboardingCompleted` on every render or the flow would exit early.
  const [inOnboarding, setInOnboarding] = useState(null);

  useEffect(() => {
    initTelegram();
    // index.html already painted the stored theme; this re-applies it so the
    // Telegram chrome matches once the WebApp SDK is available.
    applyTheme(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status === "ready" && inOnboarding === null) {
      setInOnboarding(!profile?.onboardingCompleted);
    }
  }, [status, profile, inOnboarding]);

  // Secondary screens get Telegram's native back button.
  useEffect(() => {
    if (SECONDARY.includes(tab)) return setBackButton(() => setTab("home"));
    return setBackButton(null);
  }, [tab]);

  // Keep the dashboard honest when returning to it.
  useEffect(() => {
    if (tab === "home" && status === "ready" && profile?.onboardingCompleted) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Errors must be checked first: `inOnboarding` stays null when boot fails,
  // so the loading guard would otherwise swallow the error and spin forever.
  if (status === "error") return <BootScreen error={error} onRetry={boot} t={t} />;
  if (status === "loading" || inOnboarding === null) return <BootScreen t={t} />;
  if (inOnboarding) return <Onboarding onFinish={() => setInOnboarding(false)} />;

  const screens = {
    home: <HomeScreen onNavigate={setTab} />,
    workouts: <WorkoutsScreen />,
    scan: <ScanScreen onNavigate={setTab} />,
    chat: <ChatScreen onNavigate={setTab} />,
    profile: <ProfileScreen key={profileView || "root"} onNavigate={setTab} initialView={profileView} />,
    recipes: <RecipesScreen onBack={() => setTab("home")} />,
    dietplan: <DietPlanScreen onBack={() => setTab("home")} />,
    progress: <ProgressScreen onBack={() => setTab("home")} />,
    challenges: <ChallengesScreen onBack={() => setTab("home")} />,
  };

  return (
    <div className="app-atmosphere min-h-screen">
      {screens[tab] ?? screens.home}

      <TrialOfferSheet />
      <Toast message={toast?.message} tone={toast?.tone} />
      <BottomNav active={tab} onChange={setTab} t={t} />
    </div>
  );
}
