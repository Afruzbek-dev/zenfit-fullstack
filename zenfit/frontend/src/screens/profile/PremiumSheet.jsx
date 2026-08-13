import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Sparkles, Dumbbell, BarChart3, Zap, CreditCard, Copy, Check, Send, Clock, ChevronLeft, Gift, PartyPopper } from "lucide-react";
import { Screen, ScreenHeader, Button, ErrorNote } from "../../components/ui.jsx";
import { api } from "../../api.js";
import { haptic, openTelegramLink } from "../../telegram.js";
import { uzNumber } from "../../lib/format.js";
import { useApp } from "../../store.jsx";
import { useBackButton } from "../../lib/useBackButton.js";

const FEATURES = [
  { Icon: Camera, key: "unlimitedScan" },
  { Icon: Sparkles, key: "unlimitedTrainer" },
  { Icon: Dumbbell, key: "allPrograms" },
  { Icon: BarChart3, key: "analytics" },
  { Icon: Zap, key: "noAds" },
];

/** Card number, copy button and the Telegram hand-off to the admin. */
function CardStep({ order, card, plan, adminUsername, onBack, onSent }) {
  const { t, showToast } = useApp();
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

  async function sendToAdmin() {
    setBusy(true);
    setError(null);
    try {
      await api.markPaymentSent(order.id);
      haptic("success");
      const message = t("premium.telegramMessage", { plan: plan.title, amount: uzNumber(plan.amountUzs) });
      openTelegramLink(`https://t.me/${adminUsername}?text=${encodeURIComponent(message)}`);
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

      <Button full size="lg" loading={busy} onClick={sendToAdmin}>
        <Send size={17} /> {t("premium.sendReceipt")}
      </Button>
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

function TrialStartedStep({ onClose }) {
  const { t } = useApp();
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <span className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-neon/[0.12] ring-1 ring-neon/30">
        <PartyPopper size={26} className="text-neon" />
      </span>
      <p className="font-display text-[17px] font-bold text-ink">{t("premium.trialStartedTitle")}</p>
      <p className="mt-2 max-w-[290px] text-[12.5px] leading-relaxed text-muted">{t("premium.trialStartedDesc")}</p>
      <Button full size="lg" className="mt-6" onClick={onClose}>
        {t("common.close")}
      </Button>
    </div>
  );
}

/**
 * Full page, not a bottom sheet: a purchase decision — reading what Premium
 * includes, picking a plan, copying a card number — is the kind of thing
 * someone reads top to bottom, not a quick action to glance at and dismiss.
 * A sheet that only shows the top third of that content invites scrolling
 * inside a half-height box, which is a worse reading experience than the
 * whole screen every other destination in this app already gets.
 *
 * Kept mounted at every call site behind the same `open`/`onClose` pair a
 * `Sheet` used to be — this only changes what renders when `open` is true,
 * not how any of the four screens that open it decide to.
 */
export default function PremiumSheet({ open, onClose }) {
  const { t, subscription, setSubscription } = useApp();
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState("monthly");
  const [step, setStep] = useState("plans"); // plans | card | sent | trialStarted
  const [order, setOrder] = useState(null);
  const [card, setCard] = useState(null);
  const [adminUsername, setAdminUsername] = useState(null);
  const [busy, setBusy] = useState(false);
  const [trialBusy, setTrialBusy] = useState(false);
  const [error, setError] = useState(null);

  useBackButton(open ? onClose : null);

  useEffect(() => {
    api.getPaymentPlans().then((r) => setPlans(r.plans)).catch(() => {});
  }, []);

  // A reopened page should start from the plan list, not mid-flow.
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
      setAdminUsername(res.adminUsername);
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

  async function startTrial() {
    setTrialBusy(true);
    setError(null);
    try {
      const res = await api.startTrial();
      setSubscription(res.subscription);
      haptic("success");
      setStep("trialStarted");
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setTrialBusy(false);
    }
  }

  const plan = plans.find((p) => p.id === selected);
  const title = step === "card" ? t("premium.payTitle") : t("profile.premium");
  const trialAvailable = !subscription?.isPremium && !subscription?.trialUsed;

  if (!open) return null;

  // Portalled to <body>, same as Sheet used to be: every call site opens this
  // from inside a normally-flowing screen, and only a portal can cover the
  // bottom nav bar those screens render alongside.
  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-bg">
      <Screen topPad>
        <ScreenHeader title={title} onBack={onClose} />
        {step === "trialStarted" ? (
        <TrialStartedStep onClose={onClose} />
      ) : step === "sent" ? (
        <SentStep onClose={onClose} />
      ) : step === "card" && card && plan ? (
        <CardStep
          order={order}
          card={card}
          plan={plan}
          adminUsername={adminUsername}
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

          {trialAvailable && (
            <div className="mb-5 rounded-2xl border border-neon/30 bg-neon/[0.07] px-4 py-4">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-neon/[0.15]">
                  <Gift size={16} className="text-neon" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-ink">{t("premium.trialCtaTitle")}</p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{t("premium.trialCtaDesc")}</p>
                </div>
              </div>
              <Button full variant="ghost" className="mt-3" loading={trialBusy} onClick={startTrial}>
                <Gift size={16} /> {t("premium.trialStart")}
              </Button>
            </div>
          )}

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
      </Screen>
    </div>,
    document.body
  );
}
