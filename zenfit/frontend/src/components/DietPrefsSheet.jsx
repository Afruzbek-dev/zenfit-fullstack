import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Sheet, Button, Chip } from "./ui.jsx";
import { haptic } from "../telegram.js";
import { useApp } from "../store.jsx";

/**
 * Short, one-time questionnaire before the first AI diet plan — allergies/
 * restrictions, meals per day, home vs eating out. Fixed chip choices rather
 * than free text, same reasoning as the pantry picker (../components/PantrySheet.jsx):
 * the model gets something it can trust instead of a phrase it has to guess at.
 * `note` is the one free-text field, for whatever the fixed set doesn't cover.
 *
 * Saved to profiles.diet_prefs and reused on every regeneration — RecipesScreen
 * only opens this the first time (profile.dietPrefs is unset) or when the user
 * asks to edit it.
 */
const RESTRICTIONS = ["vegetarian", "lactose", "gluten"];
const MEALS_PER_DAY = [3, 4, 5];

export default function DietPrefsSheet({ open, onClose, onSaved }) {
  const { profile, updateProfile, showToast, t } = useApp();
  const [restrictions, setRestrictions] = useState([]);
  const [mealsPerDay, setMealsPerDay] = useState(4);
  const [eatsOut, setEatsOut] = useState(false);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Re-seed on the transition to open, same reasoning as PantrySheet: an
  // abandoned edit should not survive as a pending change.
  useEffect(() => {
    if (!open) return;
    const prefs = profile?.dietPrefs;
    setRestrictions(Array.isArray(prefs?.restrictions) ? prefs.restrictions : []);
    setMealsPerDay(Number.isFinite(prefs?.mealsPerDay) ? prefs.mealsPerDay : 4);
    setEatsOut(prefs?.eatsOut === true);
    setNote(typeof prefs?.note === "string" ? prefs.note : "");
  }, [open]);

  function toggleRestriction(id) {
    haptic("light");
    setRestrictions((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function save() {
    setSaving(true);
    try {
      await updateProfile({ dietPrefs: { restrictions, mealsPerDay, eatsOut, note: note.trim().slice(0, 140) } });
      haptic("success");
      // The caller (DietPlanCard) resumes generation on save rather than on
      // close, so a plain dismiss (backdrop/X) does not accidentally trigger
      // a generate with prefs the user never confirmed.
      onSaved ? onSaved() : onClose();
    } catch (e) {
      showToast(e.message || t("common.error"), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={t("dietPrefs.title")}>
      <p className="mb-4 text-[12px] leading-relaxed text-muted">{t("dietPrefs.subtitle")}</p>

      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-faint">{t("dietPrefs.restrictionsTitle")}</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {RESTRICTIONS.map((id) => (
          <Chip key={id} active={restrictions.includes(id)} onClick={() => toggleRestriction(id)}>
            {t(`dietPrefs.restrictions.${id}`)}
          </Chip>
        ))}
      </div>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t("dietPrefs.notePlaceholder")}
        maxLength={140}
        className="mb-5 w-full rounded-2xl border border-borderSoft bg-surface px-3.5 py-2.5 text-[13px] text-ink outline-none placeholder:text-faint focus:border-neon/50"
      />

      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-faint">{t("dietPrefs.mealsTitle")}</p>
      <div className="mb-5 flex gap-2">
        {MEALS_PER_DAY.map((n) => (
          <button
            key={n}
            onClick={() => {
              haptic("select");
              setMealsPerDay(n);
            }}
            className={`flex-1 rounded-xl border px-2 py-2.5 text-[13px] font-bold transition-colors ${
              mealsPerDay === n ? "border-neon bg-neon/10 text-neon" : "border-borderSoft bg-surfaceAlt text-muted"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-faint">{t("dietPrefs.eatsOutTitle")}</p>
      <div className="mb-5 flex gap-2">
        {[false, true].map((v) => (
          <button
            key={String(v)}
            onClick={() => {
              haptic("select");
              setEatsOut(v);
            }}
            className={`flex-1 rounded-xl border px-3 py-2.5 text-[12.5px] font-semibold transition-colors ${
              eatsOut === v ? "border-neon bg-neon/10 text-neon" : "border-borderSoft bg-surfaceAlt text-muted"
            }`}
          >
            {t(v ? "dietPrefs.eatsOutTrue" : "dietPrefs.eatsOutFalse")}
          </button>
        ))}
      </div>

      <Button full size="lg" loading={saving} onClick={save}>
        <Check size={17} /> {t("dietPrefs.save")}
      </Button>
    </Sheet>
  );
}
