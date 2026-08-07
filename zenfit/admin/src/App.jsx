import { useEffect, useState } from "react";
import { LayoutDashboard, Users as UsersIcon, Receipt, Settings as SettingsIcon, LogOut, Menu, X } from "lucide-react";
import { api, getToken, setToken } from "./api.js";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Users from "./pages/Users.jsx";
import Payments from "./pages/Payments.jsx";
import Settings from "./pages/Settings.jsx";

const NAV = [
  { id: "dashboard", label: "Boshqaruv", Icon: LayoutDashboard },
  { id: "users", label: "Foydalanuvchilar", Icon: UsersIcon },
  { id: "payments", label: "To'lovlar", Icon: Receipt },
  { id: "settings", label: "Sozlamalar", Icon: SettingsIcon },
];

export default function App() {
  const [authed, setAuthed] = useState(Boolean(getToken()));
  const [page, setPage] = useState("dashboard");
  const [pending, setPending] = useState(0);
  const [navOpen, setNavOpen] = useState(false);

  // Badge on the payments tab, so a waiting receipt is visible from any page.
  useEffect(() => {
    if (!authed) return undefined;
    let alive = true;
    const load = () =>
      api
        .finance()
        .then((f) => alive && setPending(f.pendingReview))
        .catch(() => {});
    load();
    const id = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [authed, page]);

  if (!authed) return <Login onDone={() => setAuthed(true)} />;

  function logout() {
    setToken("");
    setAuthed(false);
  }

  const Page = { dashboard: Dashboard, users: Users, payments: Payments, settings: Settings }[page] || Dashboard;

  return (
    <div className="flex min-h-screen">
      {/* sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 shrink-0 border-r border-borderSoft bg-surface transition-transform lg:static lg:translate-x-0 ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-borderSoft px-5">
          <span className="font-display text-[18px] font-bold tracking-tight text-neon">ZenFit</span>
          <button onClick={() => setNavOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg bg-surfaceAlt lg:hidden">
            <X size={15} className="text-muted" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {NAV.map((n) => {
            const on = page === n.id;
            return (
              <button
                key={n.id}
                onClick={() => {
                  setPage(n.id);
                  setNavOpen(false);
                }}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13.5px] font-semibold transition-colors ${
                  on ? "bg-neon/12 text-neon" : "text-muted hover:bg-surfaceAlt hover:text-ink"
                }`}
              >
                <n.Icon size={17} />
                <span className="flex-1">{n.label}</span>
                {n.id === "payments" && pending > 0 && (
                  <span className="tabular grid h-5 min-w-5 place-items-center rounded-full bg-amber px-1.5 text-[11px] font-bold text-neonOn">
                    {pending}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="absolute inset-x-0 bottom-0 p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13.5px] font-semibold text-muted transition-colors hover:bg-rose/10 hover:text-rose"
          >
            <LogOut size={17} /> Chiqish
          </button>
        </div>
      </aside>

      {navOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setNavOpen(false)} />}

      {/* content */}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-borderSoft bg-bg/90 px-5 backdrop-blur-xl">
          <button onClick={() => setNavOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg bg-surfaceAlt lg:hidden">
            <Menu size={17} className="text-muted" />
          </button>
          <h1 className="font-display text-[19px] font-bold text-ink">{NAV.find((n) => n.id === page)?.label}</h1>
        </header>

        <main className="p-5 lg:p-7">
          <Page onOpenPayments={() => setPage("payments")} />
        </main>
      </div>
    </div>
  );
}
