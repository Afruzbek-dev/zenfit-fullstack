import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { Sheet, Button, Chip } from "./ui.jsx";
import { CATEGORIES, FOODS, foodName, servingMacros } from "../data/foods.js";
import { haptic } from "../telegram.js";
import { useApp } from "../store.jsx";

/**
 * "Mahsulotlarim" — what the user has in the kitchen.
 *
 * Named apart from meal logging on purpose. Ticking rice here does not mean
 * rice was eaten; it means rice is in the cupboard and the meal plan may use
 * it. The two live one screen apart and would otherwise read as the same
 * action, so nothing in this sheet says "add" or "qo'shish".
 *
 * Selection is by catalogue id, so the plan request carries real reference
 * macros instead of a model's guess at what "guruch" costs.
 */

/** Mirrors PANTRY_MAX in the backend's profile route, which enforces it. */
const MAX_ITEMS = 60;

/** Dishes are meals, not ingredients — nobody has "a plate of plov" in stock. */
const PANTRY_FOODS = FOODS.filter((f) => f.kind === "product");

export default function PantrySheet({ open, onClose }) {
  const { profile, updateProfile, showToast, t, lang } = useApp();
  const [picked, setPicked] = useState([]);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [saving, setSaving] = useState(false);

  // Read through a ref so the effect below can see the saved list without
  // depending on it — see the comment there.
  const storedRef = useRef(profile?.pantry);
  storedRef.current = profile?.pantry;

  /*
   * Re-seed on the *transition* to open, so an abandoned edit does not survive
   * as a pending change the user never confirmed.
   *
   * Keyed on `open` alone on purpose. `profile.pantry` is a fresh array on
   * every profile refresh, so listing it as a dependency would re-run this
   * mid-edit and silently discard whatever the user had ticked so far.
   */
  useEffect(() => {
    if (!open) return;
    setPicked(storedRef.current || []);
    setSearch("");
    setCat("all");
  }, [open]);

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PANTRY_FOODS.filter((f) => {
      if (cat !== "all" && f.cat !== cat) return false;
      if (!q) return true;
      return Object.values(f.n).some((n) => n.toLowerCase().includes(q));
    });
  }, [search, cat]);

  const chosen = new Set(picked);

  function toggle(id) {
    haptic("light");
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_ITEMS) {
        showToast(t("pantry.limit", { n: MAX_ITEMS }), "error");
        return prev;
      }
      return [...prev, id];
    });
  }

  async function save() {
    setSaving(true);
    try {
      await updateProfile({ pantry: picked });
      haptic("success");
      showToast(t("pantry.saved"), "success");
      onClose();
    } catch (e) {
      showToast(e.message || t("common.error"), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={t("pantry.title")}>
      <p className="mb-3 text-[12px] leading-relaxed text-muted">{t("pantry.subtitle")}</p>

      <div className="mb-2.5 flex items-center gap-2 rounded-2xl border border-borderSoft bg-surface px-3.5 py-2.5 focus-within:border-neon/50">
        <Search size={15} className="shrink-0 text-faint" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("pantry.searchPlaceholder")}
          className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-faint"
        />
        {search && (
          <button onClick={() => setSearch("")} aria-label={t("common.close")} className="shrink-0">
            <X size={14} className="text-faint" />
          </button>
        )}
      </div>

      <div className="no-scrollbar -mx-5 mb-3 flex gap-2 overflow-x-auto px-5 pb-1">
        {CATEGORIES.filter((id) => id !== "national").map((id) => (
          <Chip key={id} active={cat === id} onClick={() => setCat(id)}>
            {t(`recipesScreen.cats.${id}`)}
          </Chip>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[11.5px] font-semibold text-muted">
          {t("pantry.selected", { n: picked.length })}
        </span>
        {picked.length > 0 && (
          <button onClick={() => setPicked([])} className="text-[11.5px] font-bold text-rose">
            {t("pantry.clear")}
          </button>
        )}
      </div>

      {/* Two columns: these are one-tap toggles, not rows that open anything,
          so they do not need a full-width target the way the catalogue does. */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        {list.map((food) => {
          const on = chosen.has(food.id);
          return (
            <button
              key={food.id}
              onClick={() => toggle(food.id)}
              aria-pressed={on}
              className={`flex items-center gap-2 rounded-xl border px-2.5 py-2.5 text-left transition-colors active:scale-[0.98] ${
                on ? "border-neon bg-neon/12" : "border-borderSoft bg-surfaceAlt"
              }`}
            >
              <span className="shrink-0 text-lg">{food.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-[12px] font-semibold ${on ? "text-ink" : "text-muted"}`}>
                  {foodName(food, lang)}
                </span>
                <span className="tabular block text-[10px] text-faint">
                  {servingMacros(food).kcal} kcal
                </span>
              </span>
              {on && (
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-neon">
                  <Check size={12} className="text-neonOn" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Button full size="lg" loading={saving} onClick={save}>
        <Check size={17} /> {t("pantry.save")}
      </Button>
    </Sheet>
  );
}

/**
 * The picked rows, shaped for the plan request.
 *
 * Sends reference macros alongside the name so the model composes against real
 * figures rather than its own idea of what a food costs — the reason the pantry
 * is a catalogue picker and not a text box in the first place.
 */
export function pantryPayload(ids, lang) {
  const byId = new Map(FOODS.map((f) => [f.id, f]));
  return (ids || [])
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((food) => {
      const [kcal, carbs, protein, fat] = food.macros;
      return {
        name: foodName(food, lang),
        kcal, carbs, protein, fat,
        unit: food.kind === "dish" ? `${food.portionG}g porsiya` : "100g",
      };
    });
}
