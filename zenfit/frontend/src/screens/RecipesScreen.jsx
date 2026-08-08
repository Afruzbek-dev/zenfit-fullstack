import { useMemo, useState } from "react";
import { Search, Clock, Flame, Plus, Info, Sparkles, Loader2, UtensilsCrossed, Crown, Minus, ChevronDown } from "lucide-react";
import { Screen, ScreenHeader, Section, Chip, Sheet, Button, EmptyState, ErrorNote } from "../components/ui.jsx";
import { CATEGORIES, filterFoods, foodName, macros, servingMacros } from "../data/foods.js";
import { api } from "../api.js";
import { haptic } from "../telegram.js";
import { useApp } from "../store.jsx";
import PremiumSheet from "./profile/PremiumSheet.jsx";

/** How much of the catalogue is on screen before, and after each, "show more". */
const FIRST_PAGE = 15;
const PAGE = 20;

const GRAM_STEPS = [50, 100, 150, 200, 250, 300];
const PORTION_STEPS = [0.5, 1, 1.5, 2];

function DietPlanCard({ onOpenPremium }) {
  const { dietPlan, setDietPlan, addMeal, showToast, subscription, t } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [locked, setLocked] = useState(false);

  const premium = Boolean(subscription?.isPremium);

  async function generate() {
    // Don't spend a request to be told no — the client already knows.
    if (!premium) {
      setLocked(true);
      onOpenPremium?.();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.generateDietPlan();
      setDietPlan(res.plan);
      haptic("success");
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

  if (!dietPlan) {
    return (
      <>
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
                {busy ? t("recipes.planThinking") : t("recipes.planTitle")}
              </span>
              {!premium && (
                <span className="shrink-0 rounded-md bg-amber/15 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-amber">
                  Premium
                </span>
              )}
            </span>
            <span className="mt-0.5 block text-[11.5px] text-muted">
              {premium || !locked ? t("recipes.planDesc") : t("recipes.planLocked")}
            </span>
          </span>
        </button>
      </>
    );
  }

  return (
    <div className="card px-4 py-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="shrink-0 text-neon" />
            <h3 className="text-[13.5px] font-bold text-ink">{t("recipesScreen.yourPlan")}</h3>
          </div>
          {dietPlan.summary && <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{dietPlan.summary}</p>}
        </div>
        <button onClick={generate} disabled={busy} className="shrink-0 text-[11.5px] font-bold text-neon disabled:opacity-50">
          {busy ? "…" : t("recipesScreen.refresh")}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {(dietPlan.meals || []).map((m, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl bg-surfaceAlt px-3 py-2.5">
            <span className="text-xl">{m.emoji || "🍽️"}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-faint">{m.slot}</p>
              <p className="truncate text-[12.5px] font-semibold text-ink">{m.name}</p>
              <p className="truncate text-[11px] text-muted">{m.portion}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="tabular text-[12.5px] font-bold text-amber">{m.kcal}</span>
              <button
                onClick={async () => {
                  try {
                    await addMeal({
                      name: m.name, emoji: m.emoji || "🍽️", kcal: m.kcal,
                      carbs: m.carbs, protein: m.protein, fat: m.fat, source: "ai_plan",
                    });
                    haptic("success");
                    showToast(t("recipesScreen.added"), "success");
                  } catch (e) {
                    showToast(e.message || t("common.error"), "error");
                  }
                }}
                aria-label={t("recipesScreen.addPortion")}
                className="grid h-7 w-7 place-items-center rounded-lg bg-neon/15 active:scale-95"
              >
                <Plus size={13} className="text-neon" />
              </button>
            </div>
          </div>
        ))}
      </div>

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

/** One catalogue row. Shows what a default serving costs, not per 100 g. */
function FoodRow({ food, lang, t, onOpen, onAdd }) {
  const per = servingMacros(food);
  return (
    <button
      onClick={onOpen}
      className="flex items-start gap-3 rounded-2xl border border-borderSoft bg-surface p-3 text-left active:scale-[0.99]"
    >
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-surfaceAlt text-2xl">{food.emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[13px] font-bold text-ink">{foodName(food, lang)}</span>
          {food.approx && <Info size={11} className="shrink-0 text-amber" />}
        </span>
        <span className="mt-0.5 block truncate text-[10.5px] text-faint">
          {food.kind === "dish" ? `${food.portionG} g` : `${food.servingG} g`}
        </span>
        <span className="mt-1 flex items-center gap-3 text-[11px] text-faint">
          {food.minutes && (
            <span className="flex items-center gap-1"><Clock size={10} /> {food.minutes} {t("common.min")}</span>
          )}
          <span className="flex items-center gap-1"><Flame size={10} className="text-amber" /> {per.kcal} kcal</span>
        </span>
      </span>
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.stopPropagation();
            onAdd();
          }
        }}
        aria-label={foodName(food, lang)}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-neon/12 active:scale-95"
      >
        <Plus size={16} className="text-neon" />
      </span>
    </button>
  );
}

export default function RecipesScreen({ onBack }) {
  const { addMeal, showToast, t, lang } = useApp();
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [shown, setShown] = useState(FIRST_PAGE);
  const [detail, setDetail] = useState(null);
  // Dishes are counted in portions, products in grams — the sheet swaps the
  // control, so both amounts live here and only one is ever in play.
  const [portion, setPortion] = useState(1);
  const [grams, setGrams] = useState(100);

  const list = useMemo(() => filterFoods(cat, search), [cat, search]);
  // Every filter change rewinds to the first page, so "show more" always means
  // more of what is currently being looked at.
  const visible = list.slice(0, shown);

  function reset(next) {
    next();
    setShown(FIRST_PAGE);
  }

  function open(food) {
    haptic("light");
    setDetail(food);
    setPortion(1);
    setGrams(food.kind === "product" ? food.servingG : 100);
  }

  /** `factor` scales the stored macros: portions for dishes, g/100 for products. */
  async function add(food, factor) {
    const m = macros(food, factor);
    try {
      await addMeal({
        name: foodName(food, lang),
        emoji: food.emoji,
        ...m,
        portionG: food.kind === "dish" ? Math.round(food.portionG * factor) : Math.round(factor * 100),
        source: food.kind === "dish" ? "recipe" : "catalogue",
      });
      haptic("success");
      showToast(t("recipesScreen.added"), "success");
      setDetail(null);
    } catch (e) {
      showToast(e.message || t("common.error"), "error");
    }
  }

  const detailFactor = detail ? (detail.kind === "dish" ? portion : grams / 100) : 1;
  const detailMacros = detail ? macros(detail, detailFactor) : null;

  return (
    <Screen>
      <ScreenHeader
        title={t("recipesScreen.title")}
        subtitle={t("recipesScreen.subtitle")}
        onBack={onBack}
      />

      <Section title={t("recipesScreen.aiSection")}>
        <DietPlanCard onOpenPremium={() => setPremiumOpen(true)} />
      </Section>

      <div className="mb-3 flex items-center gap-2 rounded-2xl border border-borderSoft bg-surface px-3.5 py-3 focus-within:border-neon/50">
        <Search size={16} className="shrink-0 text-faint" />
        <input
          value={search}
          onChange={(e) => reset(() => setSearch(e.target.value))}
          placeholder={t("recipesScreen.searchPlaceholder")}
          className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-faint"
        />
      </div>

      <div className="no-scrollbar -mx-5 mb-3 flex gap-2 overflow-x-auto px-5 pb-1">
        {CATEGORIES.map((id) => (
          <Chip key={id} active={cat === id} onClick={() => reset(() => setCat(id))}>
            {t(`recipesScreen.cats.${id}`)}
          </Chip>
        ))}
      </div>

      <p className="mb-2.5 text-[11px] text-faint">
        {list.length} {t("recipesScreen.results")}
      </p>

      {list.length === 0 ? (
        <EmptyState
          Icon={UtensilsCrossed}
          title={t("recipesScreen.nothingFound")}
          desc={t("recipesScreen.nothingFoundDesc")}
        />
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {visible.map((food) => (
              <FoodRow
                key={food.id}
                food={food}
                lang={lang}
                t={t}
                onOpen={() => open(food)}
                onAdd={() => add(food, food.kind === "dish" ? 1 : food.servingG / 100)}
              />
            ))}
          </div>

          {shown < list.length && (
            <button
              onClick={() => {
                haptic("light");
                setShown((n) => n + PAGE);
              }}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-borderSoft bg-surfaceAlt py-3 text-[12.5px] font-bold text-ink active:scale-[0.99]"
            >
              {t("recipesScreen.showMore")}
              <ChevronDown size={15} className="text-muted" />
            </button>
          )}

          <p className="mt-4 text-[11px] leading-relaxed text-faint">{t("recipesScreen.catalogueNote")}</p>
        </>
      )}

      <Sheet open={Boolean(detail)} onClose={() => setDetail(null)} title={detail ? foodName(detail, lang) : ""}>
        {detail && (
          <>
            <div className="mb-3 flex items-center gap-3">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-surfaceAlt text-3xl">{detail.emoji}</span>
              <div className="min-w-0">
                <p className="text-[12px] text-muted">
                  {detail.kind === "dish"
                    ? `${Math.round(detail.portionG * portion)} g`
                    : `${grams} g · ${detail.macros[0]} kcal ${t("recipesScreen.per100")}`}
                </p>
                <p className="tabular mt-0.5 text-[22px] font-bold text-neon">
                  {detailMacros.kcal}<span className="ml-1 text-[12px] text-faint">kcal</span>
                </p>
              </div>
            </div>

            {detail.note && (
              <div className={`mb-3 flex items-start gap-2 rounded-xl px-3 py-2.5 ${detail.approx ? "bg-amber/10" : "bg-neon/8"}`}>
                <Info size={13} className={`mt-0.5 shrink-0 ${detail.approx ? "text-amber" : "text-neon"}`} />
                <div>
                  <p className={`text-[11px] font-bold ${detail.approx ? "text-amber" : "text-neon"}`}>
                    {detail.approx ? t("recipesScreen.approxValue") : t("recipesScreen.stableValue")}
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{detail.note[lang] || detail.note.uz}</p>
                </div>
              </div>
            )}

            <div className="mb-4 grid grid-cols-3 gap-2">
              {[
                { l: t("home.carbs"), v: detailMacros.carbs, c: "text-cyan" },
                { l: t("home.protein"), v: detailMacros.protein, c: "text-neon" },
                { l: t("home.fat"), v: detailMacros.fat, c: "text-amber" },
              ].map((m) => (
                <div key={m.l} className="rounded-xl bg-surfaceAlt px-2.5 py-2.5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-faint">{m.l}</p>
                  <p className={`tabular mt-0.5 text-[16px] font-bold ${m.c}`}>{m.v}<span className="text-[10px] text-faint">g</span></p>
                </div>
              ))}
            </div>

            {detail.kind === "dish" ? (
              <>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">{t("recipesScreen.portion")}</p>
                <div className="mb-4 flex gap-2">
                  {PORTION_STEPS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPortion(p)}
                      className={`flex-1 rounded-xl border py-2 text-[12px] font-bold ${
                        portion === p ? "border-neon bg-neon/12 text-neon" : "border-borderSoft bg-surfaceAlt text-muted"
                      }`}
                    >
                      {p}×
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">{t("recipesScreen.grams")}</p>
                <div className="mb-2.5 flex items-center gap-3">
                  <button
                    onClick={() => setGrams((g) => Math.max(5, g - 10))}
                    aria-label="−10 g"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-borderSoft bg-surfaceAlt active:scale-95"
                  >
                    <Minus size={16} className="text-muted" />
                  </button>
                  <div className="flex flex-1 items-baseline justify-center gap-1">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={grams}
                      onChange={(e) => setGrams(Math.min(2000, Math.max(0, Number(e.target.value) || 0)))}
                      aria-label={t("recipesScreen.grams")}
                      className="tabular w-20 bg-transparent text-center text-[26px] font-bold text-ink outline-none"
                    />
                    <span className="text-[13px] font-semibold text-faint">g</span>
                  </div>
                  <button
                    onClick={() => setGrams((g) => Math.min(2000, g + 10))}
                    aria-label="+10 g"
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-borderSoft bg-surfaceAlt active:scale-95"
                  >
                    <Plus size={16} className="text-muted" />
                  </button>
                </div>
                <div className="mb-4 flex gap-2">
                  {GRAM_STEPS.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGrams(g)}
                      className={`flex-1 rounded-xl border py-1.5 text-[11.5px] font-bold ${
                        grams === g ? "border-neon bg-neon/12 text-neon" : "border-borderSoft bg-surfaceAlt text-muted"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </>
            )}

            {detail.ingredients && (
              <>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">{t("recipesScreen.ingredients")}</p>
                <ul className="mb-5 flex flex-col gap-1">
                  {(detail.ingredients[lang] || detail.ingredients.uz).map((i) => (
                    <li key={i} className="text-[12.5px] text-muted">• {i}</li>
                  ))}
                </ul>
              </>
            )}

            <Button full size="lg" disabled={detailMacros.kcal <= 0} onClick={() => add(detail, detailFactor)}>
              <Plus size={17} /> {t("recipesScreen.addPortion")}
            </Button>
          </>
        )}
      </Sheet>
      <PremiumSheet open={premiumOpen} onClose={() => setPremiumOpen(false)} />
    </Screen>
  );
}
