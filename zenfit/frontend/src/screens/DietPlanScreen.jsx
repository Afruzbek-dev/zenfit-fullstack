import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sparkles, Loader2, Crown, ChevronRight, ShoppingBasket, AlertTriangle,
  Plus, Trash2, Lightbulb, Search, History, UtensilsCrossed,
} from "lucide-react";
import { Screen, ScreenHeader, Section, Sheet, Button, ErrorNote } from "../components/ui.jsx";
import PantrySheet, { pantryPayload } from "../components/PantrySheet.jsx";
import DietPrefsSheet from "../components/DietPrefsSheet.jsx";
import DietPresetSheet from "../components/DietPresetSheet.jsx";
import { filterFoods, foodName, macros, servingMacros } from "../data/foods.js";
import { sortPlansForGoal } from "../data/dietPlans.js";
import { dayTotals, groupBySlot, planDays, todayDayIndex } from "../lib/planMeals.js";
import { MealSlotAccordion } from "../components/PlanMealRow.jsx";
import { api } from "../api.js";
import { haptic } from "../telegram.js";
import { useApp } from "../store.jsx";
import PremiumSheet from "./profile/PremiumSheet.jsx";
import RecipeGuide from "./RecipeGuide.jsx";
import DietDayScreen from "./DietDayScreen.jsx";

/** Entry point to "Mahsulotlarim", and the reason the AI plan below it changes. */
function PantryCard({ onOpen }) {
  const { profile, t } = useApp();
  const count = profile?.pantry?.length || 0;

  return (
    <button
      onClick={() => { haptic("light"); onOpen(); }}
      className="card mb-2 flex w-full items-center gap-3 px-4 py-3.5 text-left active:scale-[0.99]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan/12">
        <ShoppingBasket size={19} className="text-cyan" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-bold text-ink">{t("pantry.title")}</span>
        <span className="mt-0.5 block text-[11.5px] leading-relaxed text-muted">
          {count ? t("pantry.selected", { n: count }) : t("pantry.subtitle")}
        </span>
      </span>
      <ChevronRight size={17} className="shrink-0 text-faint" />
    </button>
  );
}

/**
 * The pre-made plans: free, instant, and built from the same catalogue the rest
 * of the screen uses — the meal-plan counterpart to Workouts' ready programs.
 */
function PresetPlans({ onPick }) {
  const { profile, t } = useApp();
  const ordered = useMemo(() => sortPlansForGoal(profile?.goal), [profile?.goal]);

  return (
    <div className="flex flex-col gap-2">
      {ordered.map((plan) => (
        <button
          key={plan.id}
          onClick={() => { haptic("light"); onPick(plan.id); }}
          className="card flex w-full items-center gap-3 px-4 py-3.5 text-left active:scale-[0.99]"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surfaceAlt text-xl">
            {plan.emoji}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-bold text-ink">
              {t(`dietPreset.names.${plan.id}`)}
            </span>
            <span className="mt-0.5 block text-[11.5px] leading-relaxed text-muted">
              {t(`dietPreset.descs.${plan.id}`)}
            </span>
          </span>
          <ChevronRight size={17} className="shrink-0 text-faint" />
        </button>
      ))}
    </div>
  );
}

function DietPlanCard({ onOpenPremium, onOpenPantry, onOpenRecipe, onOpenDay, onNavigate }) {
  const { dietPlan, saveDietPlan, profile, subscription, showToast, t, lang } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [locked, setLocked] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);

  const premium = Boolean(subscription?.isPremium);
  const pantry = profile?.pantry || [];
  const hasPantry = pantry.length > 0;

  const days = useMemo(() => planDays(dietPlan), [dietPlan]);
  const todayIndex = useMemo(() => todayDayIndex(dietPlan), [dietPlan]);
  // Only ever rendered for the single-day case (a preset or a legacy flat
  // plan) — a real week is shown as a day list instead, see below.
  const groups = useMemo(() => groupBySlot(days[0]?.meals || [], t), [days, t]);
  const totals = useMemo(() => dayTotals(days[0]?.meals || []), [days]);

  async function doGenerate() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.generateDietPlan(pantryPayload(pantry, lang));
      await saveDietPlan(res.plan);
      setDayIndex(null);
      haptic("success");
      showToast(t("dietPlanScreen.planChosen"), "success");
    } catch (e) {
      if (e.status === 402) {
        setLocked(true);
        onOpenPremium?.();
      } else {
        setError(e.message || t("recipes.planFailed"));
      }
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    // Don't spend a request to be told no — the client already knows.
    if (!premium) {
      setLocked(true);
      onOpenPremium?.();
      return;
    }
    // A plan built from nothing isn't useful — send the user to pick pantry
    // items first. onOpenPantry resumes generation itself once saved, the
    // same auto-resume shape as the dietPrefs gate right below.
    if (!hasPantry) {
      onOpenPantry(doGenerate);
      return;
    }
    // Asked once, reused on every regeneration after — see DietPrefsSheet.
    // The sheet itself resumes generation on save (onSaved below), so this
    // check only ever opens it, never calls doGenerate directly.
    if (!profile?.dietPrefs) {
      setPrefsOpen(true);
      return;
    }
    await doGenerate();
  }

  const prefsSheet = (
    <DietPrefsSheet
      open={prefsOpen}
      onClose={() => setPrefsOpen(false)}
      onSaved={() => {
        setPrefsOpen(false);
        doGenerate();
      }}
    />
  );

  if (!dietPlan) {
    return (
      <>
        {prefsSheet}
        {error && <div className="mb-2"><ErrorNote onRetry={generate}>{error}</ErrorNote></div>}
        <button
          onClick={generate}
          disabled={busy}
          className="card card-lit flex w-full items-center gap-3 px-4 py-4 text-left active:scale-[0.99] disabled:opacity-60"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-neon/12">
            {busy ? (
              <Loader2 size={19} className="animate-spin text-neon" />
            ) : premium ? (
              <Sparkles size={19} className="text-neon" />
            ) : (
              <Crown size={19} className="text-amber" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="block text-[13.5px] font-bold text-ink">
                {busy
                  ? t(hasPantry ? "pantry.generating" : "recipes.planThinking")
                  : t(hasPantry ? "pantry.generate" : "recipes.planTitle")}
              </span>
              {!premium && (
                <span className="shrink-0 rounded-md bg-amber/15 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-amber">
                  Premium
                </span>
              )}
            </span>
            <span className="mt-0.5 block text-[11.5px] text-muted">
              {!premium && locked
                ? t("recipes.planLocked")
                : hasPantry
                ? t("pantry.generateDesc")
                : t("recipes.planDesc")}
            </span>
          </span>
        </button>
      </>
    );
  }

  return (
    <div className="card px-4 py-4">
      {prefsSheet}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="shrink-0 text-neon" />
            <h3 className="truncate text-[13.5px] font-bold text-ink">{t("recipesScreen.yourPlan")}</h3>
            {dietPlan.source === "pantry" && (
              <span className="shrink-0 rounded-md bg-cyan/15 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-cyan">
                {t("pantry.fromPantry")}
              </span>
            )}
          </div>
          {dietPlan.summary && <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{dietPlan.summary}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <button onClick={() => onNavigate?.("history:diet")} aria-label={t("history.title")} className="text-faint">
            <History size={15} />
          </button>
          <button onClick={() => setPrefsOpen(true)} className="whitespace-nowrap text-[11.5px] font-bold text-faint">
            {t("dietPrefs.edit")}
          </button>
          <button onClick={generate} disabled={busy} className="whitespace-nowrap text-[11.5px] font-bold text-neon disabled:opacity-50">
            {busy ? "…" : t("recipesScreen.refresh")}
          </button>
        </div>
      </div>

      {days.length > 1 && days.length < 7 && (
        <p className="mb-3 text-[11px] leading-relaxed text-faint">
          {t("dietPlanScreen.partialWeek", { n: days.length })}
        </p>
      )}

      {/* A real week reads as a day list, mirroring the workout plan's —
          each day is entered separately rather than swapped in place. */}
      {days.length > 1 ? (
        <div className="flex flex-col gap-2">
          {days.map((d, i) => {
            const dt = dayTotals(d.meals);
            const isToday = i === todayIndex;
            return (
              <button
                key={i}
                onClick={() => { haptic("light"); onOpenDay(i); }}
                className="card flex w-full items-center gap-3 px-4 py-3 text-left active:scale-[0.99]"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surfaceAlt">
                  <UtensilsCrossed size={16} className="text-muted" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[13px] font-bold text-ink">{t("workout.dayN", { n: d.day || i + 1 })}</span>
                    {isToday && (
                      <span className="shrink-0 rounded-md bg-neon/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neon">
                        {t("dietPlanScreen.today")}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] text-muted">
                    {t("dietPreset.kcalMeta", { kcal: dt.kcal, n: d.meals.length })}
                  </span>
                </span>
                <ChevronRight size={16} className="shrink-0 text-faint" />
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-4 gap-2">
            {[
              { l: "kcal", v: totals.kcal, c: "text-neon" },
              { l: t("home.protein"), v: `${totals.protein}g`, c: "text-neon" },
              { l: t("home.carbs"), v: `${totals.carbs}g`, c: "text-cyan" },
              { l: t("home.fat"), v: `${totals.fat}g`, c: "text-amber" },
            ].map((m) => (
              <div key={m.l} className="rounded-xl bg-surfaceAlt px-2 py-2 text-center">
                <p className="truncate text-[9px] font-bold uppercase tracking-wider text-faint">{m.l}</p>
                <p className={`tabular mt-0.5 text-[12.5px] font-bold ${m.c}`}>{m.v}</p>
              </div>
            ))}
          </div>
          <MealSlotAccordion groups={groups} onOpenRecipe={onOpenRecipe} />
        </>
      )}

      {/* What the pantry could not cover. Saying so is the honest alternative to
          quietly inventing an ingredient the user does not have. */}
      {dietPlan.missing?.length > 0 && (
        <div className="mt-3 rounded-xl bg-amber/10 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[11.5px] font-bold text-amber">
            <AlertTriangle size={12} className="shrink-0" /> {t("pantry.missingTitle")}
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
            {t("pantry.missingDesc")} {dietPlan.missing.join(", ")}
          </p>
          <button onClick={() => onOpenPantry()} className="mt-1.5 text-[11.5px] font-bold text-cyan">
            {t("pantry.open")} →
          </button>
        </div>
      )}

      {dietPlan.tips?.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5 border-t border-borderSoft pt-3">
          {dietPlan.tips.map((tip, i) => (
            <li key={i} className="text-[11.5px] leading-relaxed text-muted">• {tip}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** On-demand AI commentary, separate from the plan card — mirrors Workouts' AI Tips section. */
function DietTipsSection() {
  const { dietPlan, subscription, t } = useApp();
  const [tips, setTips] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [premiumOpen, setPremiumOpen] = useState(false);

  if (!dietPlan) return null;

  async function load() {
    if (!subscription?.isPremium) {
      setPremiumOpen(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.enhanceDietPlan(dietPlan);
      setTips(res.enhancement);
    } catch (e) {
      if (e.status === 402) setPremiumOpen(true);
      else setError(e.message || t("workout.tipsFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section
      title={t("dietPlanScreen.aiTips")}
      action={
        !subscription?.isPremium && (
          <span className="flex items-center gap-1 rounded-full bg-amber/12 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber">
            <Crown size={11} /> {t("profile.premium")}
          </span>
        )
      }
    >
      {tips ? (
        <div className="card flex flex-col gap-2 px-4 py-4">
          <p className="text-[13px] leading-relaxed text-ink">{tips.advice}</p>
          {tips.swapTip && <p className="text-[12px] leading-relaxed text-muted">• {tips.swapTip}</p>}
          {tips.hydrationTip && <p className="text-[12px] leading-relaxed text-muted">• {tips.hydrationTip}</p>}
        </div>
      ) : (
        <>
          {error && <div className="mb-2"><ErrorNote onRetry={load}>{error}</ErrorNote></div>}
          <Button full variant="ghost" loading={busy} onClick={load}>
            {subscription?.isPremium ? <Lightbulb size={15} /> : <Crown size={15} />} {t("dietPlanScreen.getTips")}
          </Button>
        </>
      )}
      <PremiumSheet open={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </Section>
  );
}

/** A compact catalogue search, scoped to picking one item into a custom-plan slot. */
function FoodPickerSheet({ open, onClose, onPick }) {
  const { t, lang } = useApp();
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);
  const list = useMemo(() => (open ? filterFoods("all", search).slice(0, 30) : []), [open, search]);

  async function pick(food) {
    setBusyId(food.id);
    try {
      await onPick(food, food.kind === "dish" ? 1 : food.servingG / 100);
      setSearch("");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={t("dietPlanScreen.pickFood")}>
      <div className="mb-3 flex items-center gap-2 rounded-2xl border border-borderSoft bg-surface px-3.5 py-3 focus-within:border-neon/50">
        <Search size={16} className="shrink-0 text-faint" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("recipesScreen.searchPlaceholder")}
          className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-faint"
        />
      </div>
      <div className="mb-2 flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
        {list.map((food) => (
          <button
            key={food.id}
            onClick={() => pick(food)}
            disabled={busyId === food.id}
            className="flex items-center gap-3 rounded-xl border border-borderSoft bg-surface px-3 py-2.5 text-left active:scale-[0.99] disabled:opacity-50"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surfaceAlt text-xl">{food.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-semibold text-ink">{foodName(food, lang)}</span>
              <span className="block text-[11px] text-faint">{servingMacros(food).kcal} kcal</span>
            </span>
            {busyId === food.id ? <Loader2 size={15} className="animate-spin text-neon" /> : <Plus size={15} className="text-neon" />}
          </button>
        ))}
        {list.length === 0 && <p className="py-6 text-center text-[12px] text-faint">{t("recipesScreen.nothingFound")}</p>}
      </div>
    </Sheet>
  );
}

/**
 * "O'zim tuzaman" — a persisted plan the user builds themselves, independent
 * of the AI/preset suggestions above (which stay untouched, read-only
 * browsing surfaces). Fetched on demand rather than threaded through global
 * store state, since it is only ever needed while this section is open.
 */
function CustomPlanSection() {
  const { t, showToast } = useApp();
  const [items, setItems] = useState(null); // null = still loading
  const [slots, setSlots] = useState([]);
  const [pickerSlot, setPickerSlot] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getCustomDietPlan()
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setSlots(res.slots);
      })
      .catch((e) => !cancelled && setError(e.message || t("common.error")));
    return () => {
      cancelled = true;
    };
  }, [t]);

  async function removeItem(id) {
    const prev = items;
    setItems((cur) => cur.filter((i) => i.id !== id));
    try {
      await api.deleteCustomDietItem(id);
    } catch (e) {
      setItems(prev);
      showToast(e.message || t("common.error"), "error");
    }
  }

  async function addItem(food, factor) {
    const m = macros(food, factor);
    const payload = {
      slotIndex: pickerSlot,
      foodId: food.id,
      name: foodName(food, "uz"),
      emoji: food.emoji,
      portion: food.kind === "dish" ? `${factor}×` : `${Math.round(factor * 100)} g`,
      ...m,
    };
    const res = await api.addCustomDietItem(payload);
    setItems((cur) => [...cur, res.item]);
    haptic("success");
    setPickerSlot(null);
  }

  if (error) return <ErrorNote onRetry={() => setError(null)}>{error}</ErrorNote>;
  if (items === null) return null;

  const orphaned = items.filter((i) => i.slotIndex >= slots.length);

  return (
    <>
      <div className="flex flex-col gap-2">
        {slots.map((label, idx) => {
          const slotItems = items.filter((i) => i.slotIndex === idx);
          const kcalTotal = slotItems.reduce((s, i) => s + i.kcal, 0);
          return (
            <div key={idx} className="card px-4 py-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[13px] font-bold text-ink">{label}</span>
                {kcalTotal > 0 && <span className="tabular text-[11.5px] font-semibold text-faint">{kcalTotal} kkal</span>}
              </div>
              {slotItems.length > 0 && (
                <div className="mb-2 flex flex-col gap-2">
                  {slotItems.map((i) => (
                    <div key={i.id} className="flex items-center gap-3 rounded-xl bg-surfaceAlt px-3 py-2.5">
                      <span className="text-xl">{i.emoji || "🍽️"}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-semibold text-ink">{i.name}</p>
                        {i.portion && <p className="truncate text-[11px] text-muted">{i.portion}</p>}
                      </div>
                      <span className="tabular text-[12.5px] font-bold text-amber">{i.kcal}</span>
                      <button
                        onClick={() => removeItem(i.id)}
                        aria-label={t("common.delete")}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-rose/12 active:scale-95"
                      >
                        <Trash2 size={13} className="text-rose" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Button full variant="ghost" size="sm" onClick={() => setPickerSlot(idx)}>
                <Plus size={14} /> {t("dietPlanScreen.addToSlot")}
              </Button>
            </div>
          );
        })}
      </div>

      {orphaned.length > 0 && (
        <div className="card mt-2 px-4 py-3.5">
          <p className="mb-2 text-[13px] font-bold text-ink">{t("dietPlanScreen.otherSlot")}</p>
          <div className="flex flex-col gap-2">
            {orphaned.map((i) => (
              <div key={i.id} className="flex items-center gap-3 rounded-xl bg-surfaceAlt px-3 py-2.5">
                <span className="text-xl">{i.emoji || "🍽️"}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-ink">{i.name}</p>
                </div>
                <span className="tabular text-[12.5px] font-bold text-amber">{i.kcal}</span>
                <button
                  onClick={() => removeItem(i.id)}
                  aria-label={t("common.delete")}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-rose/12 active:scale-95"
                >
                  <Trash2 size={13} className="text-rose" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <FoodPickerSheet open={pickerSlot !== null} onClose={() => setPickerSlot(null)} onPick={addItem} />
    </>
  );
}

export default function DietPlanScreen({ onBack, onNavigate }) {
  const { dietPlan, subscription, t } = useApp();
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [pantryOpen, setPantryOpen] = useState(false);
  const [presetId, setPresetId] = useState(null);
  const [recipeFoodId, setRecipeFoodId] = useState(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [openDayIndex, setOpenDayIndex] = useState(null);
  // Set only when the pantry sheet is opened as a gate in front of AI
  // generation (DietPlanCard.generate()) — lets that flow resume itself once
  // the pantry is saved, instead of making the user tap "generate" again.
  const resumeAfterPantryRef = useRef(null);

  function openPantry(resume) {
    resumeAfterPantryRef.current = typeof resume === "function" ? resume : null;
    setPantryOpen(true);
  }

  if (recipeFoodId) {
    return <RecipeGuide foodId={recipeFoodId} onBack={() => setRecipeFoodId(null)} />;
  }

  if (openDayIndex !== null) {
    const days = planDays(dietPlan);
    const day = days[openDayIndex];
    if (day) {
      const isToday = openDayIndex === todayDayIndex(dietPlan);
      return (
        <DietDayScreen
          day={day}
          dayLabel={isToday ? t("dietPlanScreen.today") : t("workout.dayN", { n: day.day || openDayIndex + 1 })}
          onBack={() => setOpenDayIndex(null)}
        />
      );
    }
  }

  return (
    <Screen>
      <ScreenHeader title={t("dietPlanScreen.title")} subtitle={t("dietPlanScreen.subtitle")} onBack={onBack} />

      <Section title={t("recipesScreen.aiSection")}>
        <PantryCard onOpen={() => openPantry()} />
        <DietPlanCard
          onOpenPremium={() => setPremiumOpen(true)}
          onOpenPantry={openPantry}
          onOpenRecipe={setRecipeFoodId}
          onOpenDay={setOpenDayIndex}
          onNavigate={onNavigate}
        />
      </Section>

      <DietTipsSection />

      {/* Premium already gets an AI-tailored week above; the fixed presets are
          the free-tier alternative to that, not a second option once you have it. */}
      {!subscription?.isPremium && (
        <Section title={t("dietPreset.section")}>
          <p className="mb-2.5 text-[11.5px] leading-relaxed text-faint">{t("dietPreset.desc")}</p>
          <PresetPlans onPick={setPresetId} />
        </Section>
      )}

      <Section
        title={t("dietPlanScreen.customTitle")}
        action={
          <button onClick={() => setCustomOpen((o) => !o)} className="text-[12px] font-bold text-neon">
            {customOpen ? t("dietPlanScreen.customHide") : t("dietPlanScreen.customShow")}
          </button>
        }
      >
        <p className="mb-2.5 text-[11.5px] leading-relaxed text-faint">{t("dietPlanScreen.customDesc")}</p>
        {customOpen && <CustomPlanSection />}
      </Section>

      <PantrySheet
        open={pantryOpen}
        onClose={() => {
          setPantryOpen(false);
          resumeAfterPantryRef.current = null;
        }}
        onSaved={() => {
          setPantryOpen(false);
          const resume = resumeAfterPantryRef.current;
          resumeAfterPantryRef.current = null;
          resume?.();
        }}
      />
      <DietPresetSheet planId={presetId} onClose={() => setPresetId(null)} onOpenRecipe={setRecipeFoodId} />
      <PremiumSheet open={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </Screen>
  );
}
