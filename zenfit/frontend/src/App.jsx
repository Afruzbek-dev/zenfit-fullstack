import { useEffect, useState } from "react";
import { Home, Dumbbell, Camera, User2, MessageSquare, Loader2, WifiOff } from "lucide-react";
import { useApp } from "./store.jsx";
import { initTelegram, haptic, setBackButton } from "./telegram.js";
import { Toast, Button } from "./components/ui.jsx";
import Onboarding from "./screens/Onboarding.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import WorkoutsScreen from "./screens/WorkoutsScreen.jsx";
import ScanScreen from "./screens/ScanScreen.jsx";
import RecipesScreen from "./screens/RecipesScreen.jsx";
import ChatScreen from "./screens/ChatScreen.jsx";
import ProgressScreen from "./screens/ProgressScreen.jsx";
import ProfileScreen from "./screens/ProfileScreen.jsx";

const TABS = [
  { id: "home", label: "Bosh", Icon: Home },
  { id: "workouts", label: "Mashq", Icon: Dumbbell },
  { id: "scan", label: "Skan", Icon: Camera, primary: true },
  { id: "chat", label: "Trener", Icon: MessageSquare },
  { id: "profile", label: "Profil", Icon: User2 },
];

const SECONDARY = ["recipes", "progress"];

function BottomNav({ active, onChange }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-borderSoft bg-bg/92 backdrop-blur-xl"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="mx-auto flex h-[68px] w-full max-w-lg items-center justify-around px-2">
        {TABS.map((t) => {
          const on = active === t.id;

          if (t.primary) {
            return (
              <button
                key={t.id}
                onClick={() => {
                  haptic("light");
                  onChange(t.id);
                }}
                aria-label={t.label}
                aria-current={on ? "page" : undefined}
                className="-mt-6 flex flex-col items-center gap-1"
              >
                <span
                  className={`grid h-14 w-14 place-items-center rounded-2xl shadow-lg transition-transform active:scale-95 ${
                    on ? "bg-neon shadow-neon/25" : "bg-neon/90"
                  }`}
                >
                  <t.Icon size={23} className="text-neonOn" />
                </span>
                <span className={`text-[10px] font-bold ${on ? "text-neon" : "text-muted"}`}>{t.label}</span>
              </button>
            );
          }

          return (
            <button
              key={t.id}
              onClick={() => {
                haptic("light");
                onChange(t.id);
              }}
              aria-label={t.label}
              aria-current={on ? "page" : undefined}
              className="flex flex-1 flex-col items-center gap-1 py-2"
            >
              <t.Icon size={20} className={on ? "text-neon" : "text-faint"} />
              <span className={`text-[10px] font-semibold ${on ? "text-neon" : "text-faint"}`}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function BootScreen({ error, onRetry }) {
  return (
    <div className="app-atmosphere flex min-h-screen items-center justify-center px-8">
      <div className="relative z-10 flex flex-col items-center text-center">
        {error ? (
          <>
            <span className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-rose/12">
              <WifiOff size={26} className="text-rose" />
            </span>
            <h1 className="font-display text-[19px] font-bold text-ink">Ulanib bo'lmadi</h1>
            <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-muted">
              {error.message || "Serverga ulanishda muammo yuz berdi."}
            </p>
            <Button className="mt-5" onClick={onRetry}>Qayta urinish</Button>
          </>
        ) : (
          <>
            <Loader2 size={30} className="animate-spin text-neon" />
            <p className="mt-4 font-display text-[15px] font-bold text-ink">ZenFit</p>
            <p className="mt-1 text-[12px] text-muted">Yuklanmoqda…</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const { status, error, profile, boot, toast, refresh } = useApp();
  const [tab, setTab] = useState("home");
  // Decided once when the session first loads. Onboarding saves the profile
  // partway through (to compute targets), so this must not be derived from
  // `onboardingCompleted` on every render or the flow would exit early.
  const [inOnboarding, setInOnboarding] = useState(null);

  useEffect(() => {
    initTelegram();
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
  if (status === "error") return <BootScreen error={error} onRetry={boot} />;
  if (status === "loading" || inOnboarding === null) return <BootScreen />;
  if (inOnboarding) return <Onboarding onFinish={() => setInOnboarding(false)} />;

  const screens = {
    home: <HomeScreen onNavigate={setTab} />,
    workouts: <WorkoutsScreen />,
    scan: <ScanScreen onNavigate={setTab} />,
    chat: <ChatScreen onNavigate={setTab} />,
    profile: <ProfileScreen />,
    recipes: <RecipesScreen onBack={() => setTab("home")} />,
    progress: <ProgressScreen onBack={() => setTab("home")} />,
  };

  return (
    <div className="app-atmosphere min-h-screen">
      {screens[tab] ?? screens.home}

      <Toast message={toast?.message} tone={toast?.tone} />
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
