import { useEffect, useState } from "react";
import { CreditCard, Plus, ShieldCheck, Crown, Receipt, Trash2, Loader2 } from "lucide-react";
import { Screen, ScreenHeader, Section, EmptyState, ListRow, Button, ErrorNote } from "../../components/ui.jsx";
import { api } from "../../api.js";
import { useApp } from "../../store.jsx";
import { useBackButton } from "../../lib/useBackButton.js";
import { haptic, openLink, showConfirm } from "../../telegram.js";
import { uzNumber } from "../../lib/format.js";

const STATUS_KEY = { paid: "statusPaid", pending: "statusPending", failed: "statusFailed", canceled: "statusFailed" };
const STATUS_TONE = { paid: "text-neon", pending: "text-amber", failed: "text-rose", canceled: "text-rose" };

const BRAND_LABEL = { uzcard: "UzCard", humo: "Humo", visa: "Visa", mastercard: "Mastercard" };

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export default function Billing({ onBack, onOpenPremium }) {
  const { subscription, showToast, t } = useApp();
  useBackButton(onBack);

  const [cards, setCards] = useState(null);
  const [payments, setPayments] = useState(null);
  const [binding, setBinding] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([api.getCards(), api.getPaymentHistory()]).then(([c, p]) => {
      if (!alive) return;
      setCards(c.status === "fulfilled" ? c.value.cards : []);
      setPayments(p.status === "fulfilled" ? p.value.payments : []);
    });
    return () => {
      alive = false;
    };
  }, []);

  async function addCard() {
    setBinding(true);
    setError(null);
    try {
      const res = await api.bindCard();
      openLink(res.bindUrl);
    } catch (e) {
      // Card binding happens on the provider's page; until a merchant account
      // is configured there is nothing to open, and saying so beats a dead tap.
      setError(
        e.status === 503
          ? e.message || t("profile.cardsEmptyDesc")
          : e.message || t("common.error")
      );
    } finally {
      setBinding(false);
    }
  }

  async function removeCard(id) {
    if (!(await showConfirm(t("common.delete") + "?"))) return;
    try {
      await api.deleteCard(id);
      setCards((prev) => prev.filter((c) => c.id !== id));
      haptic("success");
      showToast(t("common.deleted"), "success");
    } catch (e) {
      showToast(e.message || t("common.error"), "error");
    }
  }

  return (
    <Screen>
      <ScreenHeader title={t("profile.billing")} onBack={onBack} />

      {/* Subscription state */}
      <Section title={t("profile.subscription")}>
        <div className="card card-lit flex items-center gap-3 px-4 py-4">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${subscription?.isPremium ? "bg-amber/12" : "bg-surfaceAlt"}`}>
            <Crown size={19} className={subscription?.isPremium ? "text-amber" : "text-faint"} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-bold text-ink">
              {subscription?.isPremium ? t("profile.premium") : t("profile.freePlan")}
            </p>
            <p className="mt-0.5 text-[11.5px] text-muted">
              {subscription?.isPremium && subscription.expiresAt
                ? `${t("profile.expires")}: ${fmtDate(subscription.expiresAt)}`
                : t("profile.premiumDesc")}
            </p>
          </div>
          {!subscription?.isPremium && (
            <button onClick={onOpenPremium} className="shrink-0 rounded-xl bg-neon px-3 py-2 text-[12px] font-bold text-neonOn active:scale-95">
              {t("common.add")}
            </button>
          )}
        </div>
      </Section>

      {/* Cards */}
      <Section
        title={t("profile.cards")}
        action={
          <button onClick={addCard} disabled={binding} className="flex items-center gap-1 text-[12px] font-bold text-neon disabled:opacity-50">
            {binding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={13} />}
            {t("profile.addCard")}
          </button>
        }
      >
        {cards === null ? (
          <div className="card h-16 animate-pulse" />
        ) : cards.length === 0 ? (
          <EmptyState Icon={CreditCard} title={t("profile.cardsEmpty")} desc={t("profile.cardsEmptyDesc")} />
        ) : (
          <div className="flex flex-col gap-2">
            {cards.map((c) => (
              <ListRow
                key={c.id}
                Icon={CreditCard}
                title={`${BRAND_LABEL[c.brand] || c.brand || "Karta"} •••• ${c.last4 || "____"}`}
                subtitle={c.isDefault ? t("common.done") : c.expiry || c.provider}
                right={
                  <button
                    onClick={() => removeCard(c.id)}
                    aria-label={t("common.delete")}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surfaceAlt active:scale-95"
                  >
                    <Trash2 size={13} className="text-faint" />
                  </button>
                }
              />
            ))}
          </div>
        )}

        {error && (
          <div className="mt-2">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}

        <div className="mt-2.5 flex items-start gap-2 rounded-2xl border border-borderSoft bg-surfaceAlt px-3.5 py-3">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-neon" />
          <p className="text-[11.5px] leading-relaxed text-muted">{t("profile.cardsSecurity")}</p>
        </div>
      </Section>

      {/* Purchase history */}
      <Section title={t("profile.purchases")}>
        {payments === null ? (
          <div className="card h-16 animate-pulse" />
        ) : payments.length === 0 ? (
          <EmptyState Icon={Receipt} title={t("profile.purchasesEmpty")} desc={t("profile.purchasesEmptyDesc")} />
        ) : (
          <div className="flex flex-col gap-2">
            {payments.map((p) => (
              <ListRow
                key={p.id}
                Icon={Receipt}
                title={p.planTitle || p.planId}
                subtitle={`${fmtDate(p.createdAt)} · ${p.provider}`}
                right={
                  <span className="shrink-0 text-right">
                    <span className="tabular block text-[13px] font-bold text-ink">{uzNumber(p.amountUzs)}</span>
                    <span className={`block text-[10.5px] font-semibold ${STATUS_TONE[p.status] || "text-faint"}`}>
                      {t(`profile.${STATUS_KEY[p.status] || "statusPending"}`)}
                    </span>
                  </span>
                }
              />
            ))}
          </div>
        )}
      </Section>

      {!subscription?.isPremium && (
        <Button full size="lg" onClick={onOpenPremium}>
          <Crown size={17} /> {t("profile.premium")}
        </Button>
      )}
    </Screen>
  );
}
