import { useEffect, useState } from "react";
import {
  Crown, Scale, Droplets, ShieldAlert, LogOut, Check, Sparkles, Camera,
  Dumbbell, BarChart3, Zap, ChevronRight, User2,
} from "lucide-react";
import { Screen, ScreenHeader, Section, ListRow, Sheet, Button, ErrorNote } from "../components/ui.jsx";
import { api, setToken } from "../api.js";
import { haptic, openLink, showConfirm } from "../telegram.js";
import { uzNumber } from "../lib/format.js";
import { useApp } from "../store.jsx";

const PREMIUM_FEATURES = [
  { Icon: Camera, title: "Cheksiz AI skaner", desc: "Taom rasmini istagancha skanerlang" },
  { Icon: Sparkles, title: "Cheksiz AI trener", desc: "Suhbat limitisiz, istalgan vaqtda savol bering" },
  { Icon: Dumbbell, title: "Barcha trener dasturlari", desc: "Top murabbiylarning tayyor rejalari" },
  { Icon: BarChart3, title: "Kengaytirilgan tahlil", desc: "Oylik progress va batafsil hisobotlar" },
  { Icon: Zap, title: "Reklamasiz tajriba", desc: "Yangi imkoniyatlardan birinchi bo'lib foydalanish" },
];

function PremiumSheet({ open, onClose }) {
  const { subscription, setSubscription, showToast } = useApp();
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState("monthly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getPaymentPlans().then((r) => setPlans(r.plans)).catch(() => {});
  }, []);

  async function buy() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.checkout(selected);
      openLink(res.checkoutUrl);
      onClose();
    } catch (e) {
      // Payments are not wired to a live merchant account yet; say so plainly
      // rather than faking a successful purchase.
      setError(
        e.status === 503
          ? "To'lov tizimi hali ulanmagan. Tez orada Payme va Click orqali to'lov qo'shiladi."
          : e.message || "To'lovni boshlab bo'lmadi"
      );
    } finally {
      setBusy(false);
    }
  }

  async function devActivate() {
    try {
      const res = await api.devActivate(selected);
      setSubscription(res.subscription);
      showToast("Premium faollashtirildi (test rejimi)", "success");
      onClose();
    } catch {
      showToast("Test rejimi o'chirilgan", "error");
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="ZenFit Premium">
      <div className="mb-5 flex flex-col gap-2">
        {PREMIUM_FEATURES.map((f) => (
          <div key={f.title} className="flex items-start gap-3 rounded-xl bg-surfaceAlt px-3.5 py-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-neon/12">
              <f.Icon size={16} className="text-neon" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-ink">{f.title}</p>
              <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">Rejani tanlang</p>
      <div className="mb-4 flex flex-col gap-2">
        {plans.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            className={`flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left ${
              selected === p.id ? "border-neon bg-neon/[0.1]" : "border-borderSoft bg-surfaceAlt"
            }`}
          >
            <div>
              <p className="text-[13.5px] font-bold text-ink">{p.title}</p>
              <p className="mt-0.5 text-[11.5px] text-muted">{p.days} kun</p>
            </div>
            <div className="text-right">
              <p className="tabular text-[15px] font-bold text-neon">{uzNumber(p.amountUzs)}</p>
              <p className="text-[10.5px] text-faint">so'm</p>
            </div>
          </button>
        ))}
      </div>

      {error && <div className="mb-3"><ErrorNote>{error}</ErrorNote></div>}

      <Button full size="lg" loading={busy} onClick={buy}>
        <Crown size={17} /> Premium'ni faollashtirish
      </Button>

      {import.meta.env.DEV && (
        <button onClick={devActivate} className="mt-3 w-full text-center text-[11.5px] font-semibold text-faint underline">
          Test rejimida faollashtirish (dev)
        </button>
      )}
    </Sheet>
  );
}

function EditWeightSheet({ open, onClose }) {
  const { profile, setProfile, showToast } = useApp();
  const [value, setValue] = useState(String(profile?.weightKg ?? ""));
  const [busy, setBusy] = useState(false);

  const n = Number(value);
  const valid = n >= 30 && n <= 300;

  async function save() {
    setBusy(true);
    try {
      const res = await api.patchProfile({ weightKg: n });
      setProfile(res.profile);
      haptic("success");
      showToast("Vazn yangilandi — me'yor qayta hisoblandi", "success");
      onClose();
    } catch (e) {
      showToast(e.message || "Xatolik", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Vaznni yangilash">
      <p className="mb-4 text-[12.5px] leading-relaxed text-muted">
        Vazn o'zgarganda kunlik kaloriya me'yoringiz avtomatik qayta hisoblanadi.
      </p>
      <div className="mb-4 flex items-center gap-2 rounded-2xl border border-borderSoft bg-surfaceAlt px-4 py-3.5 focus-within:border-neon/50">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="tabular w-full bg-transparent text-[20px] font-bold text-ink outline-none"
        />
        <span className="text-[13px] font-semibold text-faint">kg</span>
      </div>
      <Button full size="lg" disabled={!valid} loading={busy} onClick={save}>
        <Check size={17} /> Saqlash
      </Button>
    </Sheet>
  );
}

export default function ProfileScreen() {
  const { profile, user, subscription, summary } = useApp();
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [weightOpen, setWeightOpen] = useState(false);

  const goalLabel = { lose: "Ozish", maintain: "Vaznni saqlash", gain: "Massa yig'ish" }[profile?.goal] || "—";
  const levelLabel = { beginner: "Yangi boshlovchi", intermediate: "O'rta daraja", advanced: "Tajribali" }[profile?.fitnessLevel] || "—";

  async function logout() {
    if (!(await showConfirm("Hisobdan chiqasizmi?"))) return;
    setToken("");
    window.location.reload();
  }

  return (
    <Screen>
      <ScreenHeader title="Profil" subtitle={user?.firstName ? `Salom, ${user.firstName}` : undefined} />

      <div className="card card-lit mb-4 px-5 py-5">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-neon/12 ring-1 ring-neon/20">
            <User2 size={26} className="text-neon" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[17px] font-bold text-ink">{user?.firstName || "Foydalanuvchi"}</p>
            <p className="mt-0.5 text-[12px] text-muted">{goalLabel} • {levelLabel}</p>
            {subscription?.isPremium && (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-amber/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber">
                <Crown size={10} /> Premium
              </span>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {[
            { l: "Yosh", v: profile?.age ?? "—" },
            { l: "Bo'y", v: profile?.heightCm ? `${profile.heightCm}` : "—" },
            { l: "Vazn", v: profile?.weightKg ? `${profile.weightKg}` : "—" },
            { l: "Streak", v: summary?.streak ?? 0 },
          ].map((s) => (
            <div key={s.l} className="rounded-xl bg-surfaceAlt px-2 py-2.5 text-center">
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-faint">{s.l}</p>
              <p className="tabular mt-0.5 text-[15px] font-bold text-ink">{s.v}</p>
            </div>
          ))}
        </div>
      </div>

      {!subscription?.isPremium && (
        <Section>
          <button
            onClick={() => setPremiumOpen(true)}
            className="card card-lit flex w-full items-center gap-3 px-4 py-4 text-left active:scale-[0.99]"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber/12">
              <Crown size={19} className="text-amber" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-bold text-ink">ZenFit Premium</span>
              <span className="mt-0.5 block text-[11.5px] text-muted">Cheksiz AI skaner va AI trener</span>
            </span>
            <ChevronRight size={16} className="shrink-0 text-faint" />
          </button>
        </Section>
      )}

      <Section title="Kunlik me'yor">
        <div className="card grid grid-cols-4 gap-2 px-4 py-3.5">
          {[
            { l: "Kaloriya", v: profile?.dailyCalorieTarget ?? "—", c: "text-neon" },
            { l: "Oqsil", v: profile?.proteinTargetG ?? "—", c: "text-neon" },
            { l: "Uglevod", v: profile?.carbsTargetG ?? "—", c: "text-cyan" },
            { l: "Yog'", v: profile?.fatTargetG ?? "—", c: "text-amber" },
          ].map((m) => (
            <div key={m.l} className="text-center">
              <p className="text-[9.5px] font-bold uppercase tracking-wider text-faint">{m.l}</p>
              <p className={`tabular mt-0.5 text-[15px] font-bold ${m.c}`}>{m.v}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Sozlamalar">
        <div className="flex flex-col gap-2">
          <ListRow Icon={Scale} title="Vaznni yangilash" subtitle={profile?.weightKg ? `Joriy: ${profile.weightKg} kg` : "—"} onClick={() => setWeightOpen(true)} />
          <ListRow Icon={Droplets} title="Suv me'yori" subtitle={`${profile?.waterTargetMl ?? 2500} ml / kun`} />
          {profile?.injuries && (
            <ListRow Icon={ShieldAlert} title="Jarohat/cheklov" subtitle={profile.injuries} />
          )}
        </div>
      </Section>

      <Section>
        <ListRow Icon={LogOut} title="Hisobdan chiqish" onClick={logout} danger />
      </Section>

      <p className="pb-2 text-center text-[11px] text-faint">ZenFit v0.2 — Telegram Mini App</p>

      <PremiumSheet open={premiumOpen} onClose={() => setPremiumOpen(false)} />
      <EditWeightSheet open={weightOpen} onClose={() => setWeightOpen(false)} />
    </Screen>
  );
}
