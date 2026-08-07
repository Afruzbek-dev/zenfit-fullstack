import { useEffect, useRef, useState } from "react";
import { Camera, Sparkles, Dumbbell, BarChart3, Zap, CreditCard, Copy, Check, Upload, Clock, ChevronLeft } from "lucide-react";
import { Sheet, Button, ErrorNote } from "../../components/ui.jsx";
import { api } from "../../api.js";
import { haptic } from "../../telegram.js";
import { uzNumber } from "../../lib/format.js";
import { useApp } from "../../store.jsx";

const FEATURES = [
  { Icon: Camera, key: "unlimitedScan" },
  { Icon: Sparkles, key: "unlimitedTrainer" },
  { Icon: Dumbbell, key: "allPrograms" },
  { Icon: BarChart3, key: "analytics" },
  { Icon: Zap, key: "noAds" },
];

/** Card number, copy button and receipt upload. */
function CardStep({ order, card, plan, onBack, onSent }) {
  const { t, showToast } = useApp();
  const fileRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function copyNumber() {
    const plain = String(card.number || "").replace(/\s/g, "");
    try {
      await navigator.clipboard.writeText(plain);
      setCopied(true);
      haptic("success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(plain, "neutral");
    }
  }

  async function upload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    setError(null);
    try {
      await api.uploadReceipt(order.id, file);
      haptic("success");
      onSent();
    } catch (err) {
      setError(err.message || t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button onClick={onBack} className="mb-4 flex items-center gap-1 text-[12.5px] font-semibold text-muted">
        <ChevronLeft size={14} /> {t("common.back")}
      </button>

      <div className="mb-4 rounded-xl2 border border-neon/25 bg-surfaceAlt px-5 py-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-faint">
            <CreditCard size={14} className="text-neon" />
            {card.bank || t("premium.card")}
          </span>
          <span className="tabular text-[15px] font-bold text-neon">{uzNumber(plan.amountUzs)} so'm</span>
        </div>

        <p className="tabular select-all text-[21px] font-bold tracking-wider text-ink">{card.number}</p>
        {card.holder && <p className="mt-1 text-[13px] font-semibold uppercase text-muted">{card.holder}</p>}

        <Button full variant="ghost" className="mt-4" onClick={copyNumber}>
          {copied ? <Check size={16} className="text-neon" /> : <Copy size={16} />}
          {copied ? t("premium.copied") : t("premium.copyCard")}
        </Button>
      </div>

      <ol className="mb-4 flex flex-col gap-2">
        {[t("premium.step1"), t("premium.step2"), t("premium.step3")].map((s, i) => (
          <li key={i} className="flex gap-3 rounded-2xl border border-borderSoft bg-surface px-3.5 py-3">
            <span className="tabular grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-neon/15 text-[11px] font-bold text-neon">
              {i + 1}
            </span>
            <span className="text-[12.5px] leading-relaxed text-ink">{s}</span>
          </li>
        ))}
      </ol>

      {card.instructions && (
        <p className="mb-4 rounded-2xl border border-borderSoft bg-surfaceAlt px-4 py-3 text-[12px] leading-relaxed text-muted">
          {card.instructions}
        </p>
      )}

      {error && (
        <div className="mb-3">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      <Button full size="lg" loading={busy} onClick={() => fileRef.current?.click()}>
        <Upload size={17} /> {t("premium.sendReceipt")}
      </Button>
      <input ref={fileRef} type="file" accept="image/*" onChange={upload} className="hidden" />
    </>
  );
}

function SentStep({ onClose }) {
  const { t } = useApp();
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <span className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-amber/12 ring-1 ring-amber/25">
        <Clock size={26} className="text-amber" />
      </span>
      <p className="font-display text-[17px] font-bold text-ink">{t("premium.sentTitle")}</p>
      <p className="mt-2 max-w-[290px] text-[12.5px] leading-relaxed text-muted">{t("premium.sentDesc")}</p>
      <Button full size="lg" className="mt-6" onClick={onClose}>
        {t("common.close")}
      </Button>
    </div>
  );
}

export default function PremiumSheet({ open, onClose }) {
  const { t } = useApp();
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState("monthly");
  const [step, setStep] = useState("plans"); // plans | card | sent
  const [order, setOrder] = useState(null);
  const [card, setCard] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getPaymentPlans().then((r) => setPlans(r.plans)).catch(() => {});
  }, []);

  // A reopened sheet should start from the plan list, not mid-flow.
  useEffect(() => {
    if (!open) {
      setStep("plans");
      setError(null);
    }
  }, [open]);

  async function startPayment() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.startManualPayment(selected);
      setOrder(res.payment);
      setCard(res.card);
      setStep("card");
    } catch (e) {
      setError(
        e.status === 503
          ? e.message || t("premium.notReady")
          : e.message || t("common.error")
      );
    } finally {
      setBusy(false);
    }
  }

  const plan = plans.find((p) => p.id === selected);
  const title = step === "card" ? t("premium.payTitle") : t("profile.premium");

  return (
    <Sheet open={open} onClose={onClose} title={title} maxHeight="92vh">
      {step === "sent" ? (
        <SentStep onClose={onClose} />
      ) : step === "card" && card && plan ? (
        <CardStep
          order={order}
          card={card}
          plan={plan}
          onBack={() => setStep("plans")}
          onSent={() => setStep("sent")}
        />
      ) : (
        <>
          <div className="mb-5 flex flex-col gap-2">
            {FEATURES.map((f) => (
              <div key={f.key} className="flex items-start gap-3 rounded-xl bg-surfaceAlt px-3.5 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-neon/12">
                  <f.Icon size={16} className="text-neon" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-ink">{t(`premium.features.${f.key}.title`)}</p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{t(`premium.features.${f.key}.desc`)}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">{t("premium.choosePlan")}</p>
          <div className="mb-4 flex flex-col gap-2">
            {plans.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  haptic("select");
                  setSelected(p.id);
                }}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left ${
                  selected === p.id ? "border-neon bg-neon/[0.1]" : "border-borderSoft bg-surfaceAlt"
                }`}
              >
                <div>
                  <p className="text-[13.5px] font-bold text-ink">{p.title}</p>
                  <p className="mt-0.5 text-[11.5px] text-muted">
                    {p.days} {t("home.days")}
                  </p>
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

          <Button full size="lg" loading={busy} onClick={startPayment}>
            <CreditCard size={17} /> {t("premium.payByCard")}
          </Button>
          <p className="mt-3 text-center text-[11.5px] leading-relaxed text-faint">{t("premium.manualHint")}</p>
        </>
      )}
    </Sheet>
  );
}
