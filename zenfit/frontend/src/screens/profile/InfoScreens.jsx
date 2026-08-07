import { useState } from "react";
import { ChevronDown, MessageCircle, Check, FileText, Send, Info } from "lucide-react";
import { Screen, ScreenHeader, Section, BackButton } from "../../components/ui.jsx";
import { useApp } from "../../store.jsx";
import { useBackButton } from "../../lib/useBackButton.js";
import { haptic, openLink } from "../../telegram.js";

const SUPPORT_URL = "https://t.me/zenfituz_bot";
const APP_VERSION = "0.3.0";

/* --------------------------------- help --------------------------------- */

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => {
          haptic("light");
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className="min-w-0 flex-1 text-[13.5px] font-bold text-ink">{q}</span>
        <ChevronDown size={16} className={`shrink-0 text-faint transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <p className="animate-fade-up border-t border-borderSoft px-4 py-3.5 text-[12.5px] leading-relaxed text-muted">
          {a}
        </p>
      )}
    </div>
  );
}

export function HelpScreen({ onBack }) {
  const { t } = useApp();
  useBackButton(onBack);
  const faq = t("help.faq");

  return (
    <Screen>
      <ScreenHeader title={t("help.title")} right={<BackButton onBack={onBack} />} />

      <div className="mb-5 flex flex-col gap-2">
        {(Array.isArray(faq) ? faq : []).map((item, i) => (
          <FaqItem key={i} q={item.q} a={item.a} />
        ))}
      </div>

      <button
        onClick={() => openLink(SUPPORT_URL)}
        className="card card-lit flex w-full items-center gap-3 px-4 py-4 text-left active:scale-[0.99]"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan/12">
          <MessageCircle size={19} className="text-cyan" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-bold text-ink">{t("help.contact")}</span>
          <span className="mt-0.5 block text-[11.5px] text-muted">{t("help.contactDesc")}</span>
        </span>
        <Send size={16} className="shrink-0 text-faint" />
      </button>
    </Screen>
  );
}

/* -------------------------------- about --------------------------------- */

export function AboutScreen({ onBack }) {
  const { t } = useApp();
  useBackButton(onBack);
  const features = t("about.features");

  return (
    <Screen>
      <ScreenHeader title={t("about.title")} right={<BackButton onBack={onBack} />} />

      <div className="card card-lit mb-5 px-5 py-6 text-center">
        <p className="font-display text-[28px] font-bold tracking-tight text-neon">ZenFit</p>
        <p className="mx-auto mt-2 max-w-[300px] text-[13px] leading-relaxed text-muted">{t("about.tagline")}</p>
      </div>

      <Section>
        <p className="text-[13px] leading-relaxed text-ink">{t("about.body")}</p>
      </Section>

      <Section title={t("about.whatWeDo")}>
        <div className="flex flex-col gap-2">
          {(Array.isArray(features) ? features : []).map((f, i) => (
            <div key={i} className="flex items-start gap-3 rounded-2xl border border-borderSoft bg-surface px-3.5 py-3">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md bg-neon/15">
                <Check size={12} className="text-neon" strokeWidth={3} />
              </span>
              <span className="text-[12.5px] leading-relaxed text-ink">{f}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t("about.contact")}>
        <button
          onClick={() => openLink(SUPPORT_URL)}
          className="card flex w-full items-center gap-3 px-4 py-3.5 text-left active:scale-[0.99]"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan/12">
            <Send size={18} className="text-cyan" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-bold text-ink">{t("about.telegram")}</span>
            <span className="mt-0.5 block text-[11.5px] text-muted">@zenfituz_bot</span>
          </span>
        </button>
      </Section>

      <p className="pb-2 text-center text-[11px] text-faint">
        {t("about.version")} {APP_VERSION}
      </p>
    </Screen>
  );
}

/* -------------------------------- offer --------------------------------- */

export function OfferScreen({ onBack }) {
  const { t } = useApp();
  useBackButton(onBack);
  const sections = t("offer.sections");

  return (
    <Screen>
      <ScreenHeader title={t("offer.title")} right={<BackButton onBack={onBack} />} />

      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-borderSoft bg-surfaceAlt px-4 py-3.5">
        <FileText size={16} className="mt-0.5 shrink-0 text-faint" />
        <p className="text-[12.5px] leading-relaxed text-muted">{t("offer.intro")}</p>
      </div>

      <div className="flex flex-col gap-3">
        {(Array.isArray(sections) ? sections : []).map((s, i) => (
          <section key={i} className="card px-4 py-3.5">
            <h3 className="mb-1.5 text-[13px] font-bold text-ink">{s.h}</h3>
            <p className="text-[12.5px] leading-relaxed text-muted">{s.p}</p>
          </section>
        ))}
      </div>

      <p className="mt-5 flex items-center justify-center gap-1.5 pb-2 text-[11px] text-faint">
        <Info size={12} />
        {t("offer.updated")}: 07.08.2026
      </p>
    </Screen>
  );
}
