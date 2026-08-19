import { useState } from "react";
import {
  Crown, LogOut, ChevronRight, UserCog, HeartPulse, CreditCard, Settings2,
  HelpCircle, Building2, FileText, Dumbbell,
} from "lucide-react";
import { Screen, Section } from "../components/ui.jsx";
import Avatar from "../components/Avatar.jsx";
import { setToken } from "../api.js";
import { haptic, showConfirm } from "../telegram.js";
import { useApp } from "../store.jsx";

import EditProfile from "./profile/EditProfile.jsx";
import HealthData, { bmiInfo } from "./profile/HealthData.jsx";
import Billing from "./profile/Billing.jsx";
import SettingsScreen from "./profile/Settings.jsx";
import { HelpScreen, AboutScreen, OfferScreen } from "./profile/InfoScreens.jsx";
import PremiumSheet from "./profile/PremiumSheet.jsx";

/** Menu entry into a sub-screen. */
function MenuRow({ Icon, title, subtitle, onClick, tone = "muted", danger }) {
  const tones = { muted: "text-muted", neon: "text-neon", amber: "text-amber", rose: "text-rose" };
  return (
    <button
      onClick={() => {
        haptic("light");
        onClick();
      }}
      className="flex w-full items-center gap-3 rounded-2xl border border-borderSoft bg-surface px-3.5 py-3 text-left active:scale-[0.99]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surfaceAlt">
        <Icon size={18} className={danger ? "text-rose" : tones[tone]} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-[13.5px] font-bold ${danger ? "text-rose" : "text-ink"}`}>{title}</span>
        {subtitle && <span className="mt-0.5 block truncate text-[11.5px] text-muted">{subtitle}</span>}
      </span>
      <ChevronRight size={16} className="shrink-0 text-faint" />
    </button>
  );
}

export default function ProfileScreen({ onNavigate, initialView = null }) {
  const { profile, user, subscription, summary, t } = useApp();
  const [view, setView] = useState(initialView);
  const [premiumOpen, setPremiumOpen] = useState(false);

  const back = () => setView(null);

  if (view === "edit") return <EditProfile onBack={back} />;
  if (view === "health") return <HealthData onBack={back} onNavigate={onNavigate} />;
  if (view === "billing") return <Billing onBack={back} onOpenPremium={() => setPremiumOpen(true)} />;
  if (view === "settings") return <SettingsScreen onBack={back} />;
  if (view === "help") return <HelpScreen onBack={back} />;
  if (view === "about") return <AboutScreen onBack={back} />;
  if (view === "offer") return <OfferScreen onBack={back} />;

  const displayName = profile?.displayName || user?.firstName || t("profile.user");
  const goalLabel = profile?.goal ? t(`profile.goals.${profile.goal}`) : "—";
  const levelLabel = profile?.fitnessLevel ? t(`profile.levels.${profile.fitnessLevel}`) : "—";
  const bmi = bmiInfo(profile?.weightKg, profile?.heightCm);

  async function logout() {
    if (!(await showConfirm(t("profile.logoutConfirm")))) return;
    setToken("");
    window.location.reload();
  }

  return (
    <Screen topPad>
      {/* Identity — avatar centred, everything else reads beneath it. */}
      <div className="card card-lit mb-4 flex flex-col items-center px-5 py-6">
        <Avatar size={104} editable onChanged={() => {}} />

        <p className="mt-3.5 max-w-full truncate font-display text-[20px] font-bold text-ink">{displayName}</p>
        {user?.username && <p className="mt-0.5 text-[12px] text-faint">@{user.username}</p>}

        <p className="mt-1.5 text-[12.5px] text-muted">
          {goalLabel} • {levelLabel}
        </p>

        {subscription?.isPremium && (
          <span className="mt-2.5 inline-flex items-center gap-1 rounded-md bg-amber/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber">
            <Crown size={11} /> Premium
          </span>
        )}

        <div className="mt-5 grid w-full grid-cols-4 gap-2">
          {[
            { l: t("profile.age"), v: profile?.age ?? "—" },
            { l: t("profile.height"), v: profile?.heightCm ?? "—" },
            { l: t("profile.weight"), v: profile?.weightKg ?? "—" },
            { l: t("profile.streak"), v: summary?.streak ?? 0 },
          ].map((s) => (
            <div key={s.l} className="rounded-xl bg-surfaceAlt px-2 py-2.5 text-center">
              <p className="truncate text-[9.5px] font-bold uppercase tracking-wider text-faint">{s.l}</p>
              <p className="tabular mt-0.5 text-[15px] font-bold text-ink">{s.v}</p>
            </div>
          ))}
        </div>
      </div>

      {!subscription?.isPremium && (
        <Section>
          <button
            onClick={() => {
              haptic("light");
              setPremiumOpen(true);
            }}
            className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-neon px-5 py-5 text-left active:scale-[0.99]"
          >
            {/* Same radial-bleed technique as the app-wide aurora background,
                just brighter and scoped to this card. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(120% 140% at 88% 6%, rgb(var(--c-neonOn) / 0.24), transparent 62%)" }}
            />
            <Dumbbell
              aria-hidden
              size={104}
              strokeWidth={1.5}
              className="pointer-events-none absolute -bottom-6 -right-5 rotate-[-18deg] text-neonOn/20"
            />
            <span className="relative min-w-0 flex-1">
              <span className="block text-[15px] font-bold text-neonOn">{t("profile.premium")}</span>
              <span className="mt-1 block max-w-[215px] text-[12px] leading-relaxed text-neonOn/75">
                {t("profile.premiumDesc")}
              </span>
            </span>
          </button>
        </Section>
      )}

      <Section>
        <div className="flex flex-col gap-2">
          <MenuRow
            Icon={UserCog}
            title={t("profile.editProfile")}
            subtitle={t("profile.editProfileDesc")}
            onClick={() => setView("edit")}
          />
          <MenuRow
            Icon={HeartPulse}
            title={t("profile.health")}
            subtitle={bmi ? `${t("profile.bmi")}: ${bmi.bmi} · ${t(`profile.bmiCats.${bmi.key}`)}` : t("profile.healthDesc")}
            onClick={() => setView("health")}
          />
          <MenuRow
            Icon={CreditCard}
            title={t("profile.billing")}
            subtitle={t("profile.billingDesc")}
            onClick={() => setView("billing")}
          />
          <MenuRow
            Icon={Settings2}
            title={t("profile.settings")}
            subtitle={t("profile.settingsDesc")}
            onClick={() => setView("settings")}
          />
        </div>
      </Section>

      <Section>
        <div className="flex flex-col gap-2">
          <MenuRow Icon={HelpCircle} title={t("profile.help")} subtitle={t("profile.helpDesc")} onClick={() => setView("help")} />
          <MenuRow Icon={Building2} title={t("profile.about")} subtitle={t("profile.aboutDesc")} onClick={() => setView("about")} />
          <MenuRow Icon={FileText} title={t("profile.offer")} subtitle={t("profile.offerDesc")} onClick={() => setView("offer")} />
        </div>
      </Section>

      <Section>
        <MenuRow Icon={LogOut} title={t("profile.logout")} onClick={logout} danger />
      </Section>

      <p className="pb-2 text-center text-[11px] text-faint">ZenFit v0.3 — Telegram Mini App</p>

      <PremiumSheet open={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </Screen>
  );
}
