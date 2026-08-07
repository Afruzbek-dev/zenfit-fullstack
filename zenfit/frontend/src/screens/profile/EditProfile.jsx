import { useState } from "react";
import { Check, User2, Ruler, Scale, ShieldAlert, Droplets } from "lucide-react";
import { Screen, ScreenHeader, Section, Button, Chip, ErrorNote } from "../../components/ui.jsx";
import Avatar from "../../components/Avatar.jsx";
import { useApp } from "../../store.jsx";
import { useBackButton } from "../../lib/useBackButton.js";
import { haptic } from "../../telegram.js";

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function Field({ Icon, label, children }) {
  return (
    <div className="card flex items-center gap-3 px-4 py-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surfaceAlt">
        <Icon size={17} className="text-muted" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10.5px] font-bold uppercase tracking-[0.12em] text-faint">{label}</span>
        {children}
      </span>
    </div>
  );
}

function NumberInput({ value, onChange, unit, min, max, step = 1 }) {
  return (
    <span className="flex items-baseline gap-1">
      <input
        type="number"
        inputMode="decimal"
        value={value}
        step={step}
        onChange={(e) => onChange(e.target.value === "" ? "" : clamp(Number(e.target.value), min, max))}
        className="tabular w-full bg-transparent text-[16px] font-bold text-ink outline-none"
      />
      <span className="shrink-0 text-[11.5px] font-semibold text-faint">{unit}</span>
    </span>
  );
}

export default function EditProfile({ onBack }) {
  const { profile, user, updateProfile, showToast, t } = useApp();
  useBackButton(onBack);

  const [form, setForm] = useState({
    displayName: profile?.displayName || user?.firstName || "",
    gender: profile?.gender || "male",
    age: profile?.age ?? 25,
    heightCm: profile?.heightCm ?? 175,
    weightKg: profile?.weightKg ?? 70,
    activityLevel: profile?.activityLevel || "light",
    fitnessLevel: profile?.fitnessLevel || "beginner",
    injuries: profile?.injuries || "",
    waterTargetMl: profile?.waterTargetMl ?? 2500,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const patch = (p) => setForm((prev) => ({ ...prev, ...p }));

  const valid =
    form.displayName.trim().length > 0 &&
    form.age >= 12 && form.age <= 100 &&
    form.heightCm >= 100 && form.heightCm <= 250 &&
    form.weightKg >= 30 && form.weightKg <= 300;

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await updateProfile({
        displayName: form.displayName.trim(),
        gender: form.gender,
        age: Number(form.age),
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        activityLevel: form.activityLevel,
        fitnessLevel: form.fitnessLevel,
        injuries: form.injuries.trim(),
        waterTargetMl: Number(form.waterTargetMl),
      });
      haptic("success");
      showToast(t("profile.targetsRecalc"), "success");
      onBack();
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <ScreenHeader title={t("profile.editProfile")} onBack={onBack} />

      <div className="mb-6 flex flex-col items-center">
        <Avatar size={104} editable />
        <p className="mt-3 text-[11.5px] text-faint">{t("profile.photoHint")}</p>
      </div>

      <Section title={t("profile.name")}>
        <div className="card px-4 py-3">
          <input
            value={form.displayName}
            onChange={(e) => patch({ displayName: e.target.value })}
            placeholder={t("profile.namePlaceholder")}
            maxLength={60}
            className="w-full bg-transparent text-[16px] font-bold text-ink outline-none placeholder:font-normal placeholder:text-faint"
          />
        </div>
      </Section>

      <Section title={t("profile.gender")}>
        <div className="flex gap-2">
          <Chip active={form.gender === "male"} onClick={() => patch({ gender: "male" })}>{t("profile.male")}</Chip>
          <Chip active={form.gender === "female"} onClick={() => patch({ gender: "female" })}>{t("profile.female")}</Chip>
        </div>
      </Section>

      <Section title={t("profile.bodyMetrics")}>
        <div className="flex flex-col gap-2">
          <Field Icon={User2} label={t("profile.age")}>
            <NumberInput value={form.age} onChange={(v) => patch({ age: v })} unit="" min={12} max={100} />
          </Field>
          <Field Icon={Ruler} label={t("profile.height")}>
            <NumberInput value={form.heightCm} onChange={(v) => patch({ heightCm: v })} unit={t("common.cm")} min={100} max={250} />
          </Field>
          <Field Icon={Scale} label={t("profile.weight")}>
            <NumberInput value={form.weightKg} onChange={(v) => patch({ weightKg: v })} unit={t("common.kg")} min={30} max={300} step={0.1} />
          </Field>
          <Field Icon={Droplets} label={t("profile.waterTarget")}>
            <NumberInput value={form.waterTargetMl} onChange={(v) => patch({ waterTargetMl: v })} unit="ml" min={500} max={6000} step={100} />
          </Field>
        </div>
      </Section>

      <Section title={t("profile.activityLevel")}>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          {["sedentary", "light", "moderate", "active", "very_active"].map((id) => (
            <Chip key={id} active={form.activityLevel === id} onClick={() => patch({ activityLevel: id })}>
              {t(`profile.activityLevels.${id}`)}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title={t("profile.level")}>
        <div className="flex flex-wrap gap-2">
          {["beginner", "intermediate", "advanced"].map((id) => (
            <Chip key={id} active={form.fitnessLevel === id} onClick={() => patch({ fitnessLevel: id })}>
              {t(`profile.levels.${id}`)}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title={t("profile.injuries")}>
        <div className="card flex items-center gap-3 px-4 py-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surfaceAlt">
            <ShieldAlert size={17} className="text-muted" />
          </span>
          <input
            value={form.injuries}
            onChange={(e) => patch({ injuries: e.target.value })}
            placeholder={t("common.optional")}
            maxLength={300}
            className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-faint"
          />
        </div>
      </Section>

      {error && (
        <div className="mb-4">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      <Button full size="lg" disabled={!valid} loading={busy} onClick={save}>
        <Check size={17} /> {t("common.save")}
      </Button>
    </Screen>
  );
}
