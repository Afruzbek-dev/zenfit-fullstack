import { useEffect, useState } from "react";
import { Crown, Camera, Sparkles, Dumbbell, BarChart3, Zap } from "lucide-react";
import { Sheet, Button, ErrorNote } from "../../components/ui.jsx";
import { api } from "../../api.js";
import { openLink } from "../../telegram.js";
import { uzNumber } from "../../lib/format.js";
import { useApp } from "../../store.jsx";

const FEATURES = [
  { Icon: Camera, title: "Cheksiz AI skaner", desc: "Taom rasmini istagancha skanerlang" },
  { Icon: Sparkles, title: "Cheksiz AI trener", desc: "Suhbat limitisiz, istalgan vaqtda savol bering" },
  { Icon: Dumbbell, title: "Barcha trener dasturlari", desc: "Top murabbiylarning tayyor rejalari" },
  { Icon: BarChart3, title: "Kengaytirilgan tahlil", desc: "Oylik progress va batafsil hisobotlar" },
  { Icon: Zap, title: "Reklamasiz tajriba", desc: "Yangi imkoniyatlardan birinchi bo'lib foydalanish" },
];

export default function PremiumSheet({ open, onClose }) {
  const { setSubscription, showToast, t } = useApp();
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
    <Sheet open={open} onClose={onClose} title={t("profile.premium")}>
      <div className="mb-5 flex flex-col gap-2">
        {FEATURES.map((f) => (
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

      {error && (
        <div className="mb-3">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

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
