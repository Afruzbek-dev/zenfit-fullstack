import { Check } from "lucide-react";
import BodyMap from "./BodyMap.jsx";
import { groupsForSide } from "../data/muscleTargets.js";
import { haptic } from "../telegram.js";
import { useApp } from "../store.jsx";

/**
 * Target-muscle picker: side toggle, pill list, and a body diagram that
 * highlights what is picked.
 *
 * The pills and the figure are two views of one selection, both writable. A
 * group belongs to one side, but the selection spans both — switching to the
 * back does not clear what was chosen on the front, and the counter reflects
 * the whole thing so the user can see they have picked six without flipping
 * back and forth.
 */
export default function MuscleTargetPicker({ side, onSide, picked, onChange, max = 6 }) {
  const { t } = useApp();
  const groups = groupsForSide(side);
  const label = (id) => (id === "figure" ? t("muscles.figure") : t(`muscles.${id}`));

  const atLimit = picked.length >= max;

  function toggle(id) {
    const has = picked.includes(id);
    if (!has && atLimit) {
      haptic("error");
      return;
    }
    haptic("light");
    onChange(has ? picked.filter((x) => x !== id) : [...picked, id]);
  }

  return (
    <div>
      <div className="mb-4 flex gap-2 rounded-2xl border border-borderSoft bg-surfaceAlt p-1">
        {["front", "back"].map((s) => (
          <button
            key={s}
            onClick={() => {
              haptic("light");
              onSide(s);
            }}
            className={`flex-1 rounded-xl py-2.5 text-[12.5px] font-bold transition-colors ${
              side === s ? "bg-neon text-neonOn" : "text-muted"
            }`}
          >
            {t(s === "front" ? "muscles.sideFront" : "muscles.sideBack")}
          </button>
        ))}
      </div>

      <div className="flex items-stretch gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {groups.map((g) => {
            const active = picked.includes(g.id);
            return (
              <button
                key={g.id}
                onClick={() => toggle(g.id)}
                aria-pressed={active}
                disabled={!active && atLimit}
                className={`flex items-center gap-2.5 rounded-full border px-3 py-2.5 text-left transition-colors ${
                  active
                    ? "border-neon bg-neon/12 text-neon"
                    : atLimit
                    ? "border-borderSoft bg-surface text-faint opacity-50"
                    : "border-borderSoft bg-surface text-muted"
                }`}
              >
                <span
                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                    active ? "border-neon bg-neon" : "border-border"
                  }`}
                >
                  {active && <Check size={12} strokeWidth={3} className="text-neonOn" />}
                </span>
                <span className="truncate text-[12.5px] font-bold">{t(`muscles.${g.id}`)}</span>
              </button>
            );
          })}
        </div>

        <div className="w-[42%] shrink-0">
          <BodyMap side={side} picked={picked} onToggle={toggle} label={label} />
        </div>
      </div>

      <p className="mt-3 text-center text-[11.5px] text-faint">
        {picked.length > 0
          ? t("muscles.picked", { n: picked.length, max })
          : t("muscles.noneHint")}
      </p>
    </div>
  );
}
