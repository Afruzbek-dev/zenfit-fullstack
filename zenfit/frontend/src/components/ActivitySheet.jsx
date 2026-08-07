import { useMemo, useState } from "react";
import { Flame, Check, Minus, Plus } from "lucide-react";
import { Sheet, Button, Chip, ErrorNote } from "./ui.jsx";
import { ACTIVITIES, INTENSITIES, ACTIVITY_BY_ID, estimateKcal } from "../data/activities.js";
import { haptic } from "../telegram.js";
import { useApp } from "../store.jsx";

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function NumberField({ label, value, unit, step, min, max, onChange, decimals = 0 }) {
  const show = decimals ? String(Number(value).toFixed(1)).replace(/\.0$/, "") : String(value);
  return (
    <div className="flex-1">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-faint">{label}</p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => {
            haptic("light");
            onChange(clamp(Number(value) - step, min, max));
          }}
          aria-label={`${label} −`}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-borderSoft bg-surfaceAlt active:scale-95"
        >
          <Minus size={15} className="text-muted" />
        </button>
        <div className="flex min-w-0 flex-1 items-baseline justify-center gap-1 rounded-xl border border-borderSoft bg-surfaceAlt px-1 py-2">
          <input
            type="number"
            inputMode="decimal"
            value={show}
            onChange={(e) => onChange(e.target.value === "" ? min : clamp(Number(e.target.value), min, max))}
            aria-label={label}
            className="tabular w-full bg-transparent text-center text-[19px] font-bold text-ink outline-none"
          />
          <span className="shrink-0 text-[11px] font-semibold text-faint">{unit}</span>
        </div>
        <button
          onClick={() => {
            haptic("light");
            onChange(clamp(Number(value) + step, min, max));
          }}
          aria-label={`${label} +`}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-borderSoft bg-surfaceAlt active:scale-95"
        >
          <Plus size={15} className="text-muted" />
        </button>
      </div>
    </div>
  );
}

/** Logs a cardio session or any self-directed workout against the day's burn. */
export default function ActivitySheet({ open, onClose }) {
  const { t, profile, addActivity, showToast } = useApp();
  const [activityId, setActivityId] = useState("running");
  const [durationMin, setDurationMin] = useState(30);
  const [distanceKm, setDistanceKm] = useState(0);
  const [intensity, setIntensity] = useState("moderate");
  const [customName, setCustomName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const meta = ACTIVITY_BY_ID[activityId];
  const showsDistance = Boolean(meta?.distance);

  const kcal = useMemo(
    () =>
      estimateKcal({
        activityId,
        intensity,
        durationMin,
        distanceKm: showsDistance && distanceKm > 0 ? distanceKm : null,
        weightKg: profile?.weightKg,
      }),
    [activityId, intensity, durationMin, distanceKm, showsDistance, profile?.weightKg]
  );

  const valid = durationMin >= 1 && (activityId !== "custom" || customName.trim().length > 0);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await addActivity({
        activityId,
        name: activityId === "custom" ? customName.trim() : undefined,
        emoji: meta?.emoji,
        durationMin,
        distanceKm: showsDistance && distanceKm > 0 ? distanceKm : undefined,
        intensity,
        note: note.trim() || undefined,
      });
      haptic("success");
      showToast(t("activity.saved"), "success");
      // Reset so the next log starts clean rather than inheriting this one.
      setDistanceKm(0);
      setNote("");
      setCustomName("");
      onClose();
    } catch (e) {
      setError(e.message || t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={t("activity.logTitle")} maxHeight="92vh">
      <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-faint">{t("activity.pick")}</p>
      <div className="mb-5 grid grid-cols-4 gap-2">
        {ACTIVITIES.map((a) => {
          const on = a.id === activityId;
          return (
            <button
              key={a.id}
              onClick={() => {
                haptic("select");
                setActivityId(a.id);
                if (!ACTIVITY_BY_ID[a.id]?.distance) setDistanceKm(0);
              }}
              className={`flex flex-col items-center gap-1 rounded-2xl border px-1 py-2.5 transition-colors ${
                on ? "border-neon bg-neon/[0.12]" : "border-borderSoft bg-surfaceAlt"
              }`}
            >
              <span className="text-[20px] leading-none">{a.emoji}</span>
              <span className={`w-full truncate text-center text-[10px] font-bold ${on ? "text-neon" : "text-muted"}`}>
                {t(`activity.names.${a.id}`)}
              </span>
            </button>
          );
        })}
      </div>

      {activityId === "custom" && (
        <div className="mb-4">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-faint">{t("activity.customName")}</p>
          <input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder={t("activity.customPlaceholder")}
            maxLength={60}
            className="w-full rounded-2xl border border-borderSoft bg-surfaceAlt px-4 py-3 text-[14px] text-ink outline-none placeholder:text-faint focus:border-neon/50"
          />
        </div>
      )}

      <div className="mb-4 flex gap-2.5">
        <NumberField
          label={t("activity.duration")}
          value={durationMin}
          unit={t("common.min")}
          step={5}
          min={1}
          max={600}
          onChange={setDurationMin}
        />
        {showsDistance && (
          <NumberField
            label={t("activity.distance")}
            value={distanceKm}
            unit={t("common.km")}
            step={0.5}
            min={0}
            max={300}
            decimals={1}
            onChange={setDistanceKm}
          />
        )}
      </div>

      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-faint">{t("activity.intensity")}</p>
      <div className="mb-4 flex gap-2">
        {INTENSITIES.map((level) => (
          <Chip key={level} active={intensity === level} onClick={() => setIntensity(level)}>
            {t(`activity.${level}`)}
          </Chip>
        ))}
      </div>

      <div className="mb-4">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-faint">
          {t("activity.note")} <span className="normal-case tracking-normal">({t("common.optional")})</span>
        </p>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("activity.notePlaceholder")}
          maxLength={200}
          className="w-full rounded-2xl border border-borderSoft bg-surfaceAlt px-4 py-3 text-[14px] text-ink outline-none placeholder:text-faint focus:border-neon/50"
        />
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-cyan/25 bg-cyan/[0.08] px-4 py-3.5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan/15">
          <Flame size={19} className="text-cyan" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-faint">{t("activity.estimate")}</p>
          <p className="tabular text-[22px] font-bold leading-tight text-cyan">
            {kcal} <span className="text-[12px] font-semibold text-muted">{t("common.kcal")}</span>
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-3">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      <Button full size="lg" disabled={!valid} loading={busy} onClick={save}>
        <Check size={17} /> {t("activity.save")}
      </Button>
    </Sheet>
  );
}
