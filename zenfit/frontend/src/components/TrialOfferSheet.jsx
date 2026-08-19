import { useState } from "react";
import { Gift } from "lucide-react";
import { Sheet, Button, ErrorNote } from "./ui.jsx";
import { api } from "../api.js";
import { haptic } from "../telegram.js";
import { useApp } from "../store.jsx";

/**
 * Proactive popup for a trial an admin has specifically unlocked for this
 * user (subscription.trialOfferGranted) — distinct from PremiumSheet's own
 * trial CTA, which only shows once someone has already opened that sheet.
 * This surfaces the offer without the user having to go looking for it.
 *
 * Dismissing just hides it for the rest of this app session (local state,
 * not persisted) — the offer is still there next time the app opens, since
 * it came from an admin picking this user out, not a generic promo to
 * suppress forever.
 */
export default function TrialOfferSheet() {
  const { t, subscription, setSubscription, showToast } = useApp();
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const open =
    !dismissed && !subscription?.isPremium && !subscription?.trialUsed && Boolean(subscription?.trialOfferGranted);

  async function activate() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.startTrial();
      setSubscription(res.subscription);
      haptic("success");
      showToast(t("premium.trialStartedTitle"), "success");
      setDismissed(true);
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={() => setDismissed(true)} title={t("premium.trialOfferTitle")}>
      <div className="flex flex-col items-center pb-2 text-center">
        <span className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-neon/[0.12] ring-1 ring-neon/30">
          <Gift size={26} className="text-neon" />
        </span>
        <p className="max-w-[290px] text-[13px] leading-relaxed text-muted">{t("premium.trialOfferDesc")}</p>

        {error && (
          <div className="mt-4 w-full">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}

        <Button full size="lg" loading={busy} className="mt-5" onClick={activate}>
          <Gift size={16} /> {t("premium.trialStart")}
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="mt-3 text-[12.5px] font-semibold text-faint"
        >
          {t("premium.trialOfferLater")}
        </button>
      </div>
    </Sheet>
  );
}
