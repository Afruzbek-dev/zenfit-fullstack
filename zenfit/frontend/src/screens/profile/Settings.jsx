import { useState } from "react";
import { Languages, Moon, Sun, MonitorSmartphone, Bell, Dumbbell, UtensilsCrossed, Droplets, Sparkles, Info } from "lucide-react";
import { Screen, ScreenHeader, Section, BackButton } from "../../components/ui.jsx";
import { LANGUAGES } from "../../lib/i18n.js";
import { useApp } from "../../store.jsx";
import { useBackButton } from "../../lib/useBackButton.js";
import { haptic } from "../../telegram.js";

const THEME_ICONS = { dark: Moon, light: Sun, system: MonitorSmartphone };

function Toggle({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => {
        haptic("select");
        onChange(!checked);
      }}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? "bg-neon" : "bg-borderSoft"}`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-surface shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function ToggleRow({ Icon, title, desc, checked, onChange }) {
  return (
    <div className="card flex items-center gap-3 px-3.5 py-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surfaceAlt">
        <Icon size={18} className="text-muted" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-bold text-ink">{title}</p>
        <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{desc}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

function SegmentedRow({ options, value, onChange }) {
  return (
    <div className="flex gap-2">
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => {
              haptic("select");
              onChange(o.id);
            }}
            className={`flex flex-1 flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 transition-colors ${
              on ? "border-neon bg-neon/[0.12]" : "border-borderSoft bg-surfaceAlt"
            }`}
          >
            {o.Icon && <o.Icon size={18} className={on ? "text-neon" : "text-muted"} />}
            <span className={`text-[12px] font-bold ${on ? "text-neon" : "text-muted"}`}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function Settings({ onBack }) {
  const { profile, updateProfile, lang, setLanguage, theme, setTheme, showToast, t } = useApp();
  useBackButton(onBack);

  // Toggles flip immediately and reconcile with the server afterwards; a
  // settings switch that waits on a round trip feels broken.
  const [notif, setNotif] = useState(
    profile?.notifications || { workout: true, meal: true, water: false, tips: true }
  );

  async function toggle(key, value) {
    const previous = notif;
    const next = { ...notif, [key]: value };
    setNotif(next);
    try {
      await updateProfile({ notifications: { [key]: value } });
    } catch (e) {
      setNotif(previous);
      showToast(e.message || t("common.error"), "error");
    }
  }

  return (
    <Screen>
      <ScreenHeader title={t("profile.settings")} right={<BackButton onBack={onBack} />} />

      <Section title={t("profile.language")}>
        <SegmentedRow
          options={LANGUAGES.map((l) => ({ id: l.id, label: l.native, Icon: Languages }))}
          value={lang}
          onChange={setLanguage}
        />
      </Section>

      <Section title={t("profile.theme")}>
        <SegmentedRow
          options={["dark", "light", "system"].map((id) => ({
            id,
            label: t(`profile.themes.${id}`),
            Icon: THEME_ICONS[id],
          }))}
          value={theme}
          onChange={setTheme}
        />
      </Section>

      <Section title={t("profile.notifications")}>
        <div className="flex flex-col gap-2">
          <ToggleRow
            Icon={Dumbbell}
            title={t("profile.notifWorkout")}
            desc={t("profile.notifWorkoutDesc")}
            checked={Boolean(notif.workout)}
            onChange={(v) => toggle("workout", v)}
          />
          <ToggleRow
            Icon={UtensilsCrossed}
            title={t("profile.notifMeal")}
            desc={t("profile.notifMealDesc")}
            checked={Boolean(notif.meal)}
            onChange={(v) => toggle("meal", v)}
          />
          <ToggleRow
            Icon={Droplets}
            title={t("profile.notifWater")}
            desc={t("profile.notifWaterDesc")}
            checked={Boolean(notif.water)}
            onChange={(v) => toggle("water", v)}
          />
          <ToggleRow
            Icon={Sparkles}
            title={t("profile.notifTips")}
            desc={t("profile.notifTipsDesc")}
            checked={Boolean(notif.tips)}
            onChange={(v) => toggle("tips", v)}
          />
        </div>

        <div className="mt-2.5 flex items-start gap-2 rounded-2xl border border-borderSoft bg-surfaceAlt px-3.5 py-3">
          <Bell size={15} className="mt-0.5 shrink-0 text-faint" />
          <p className="text-[11.5px] leading-relaxed text-muted">{t("profile.notifHint")}</p>
        </div>
      </Section>

      <div className="flex items-start gap-2 px-1 text-[11.5px] leading-relaxed text-faint">
        <Info size={13} className="mt-0.5 shrink-0" />
        <span>ZenFit v0.3</span>
      </div>
    </Screen>
  );
}
