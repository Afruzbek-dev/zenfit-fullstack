import { useState } from "react";
import { Search, Clock, Flame, Plus, Info, Sparkles, Loader2, UtensilsCrossed } from "lucide-react";
import { Screen, ScreenHeader, Section, Chip, Sheet, Button, EmptyState, ErrorNote, BackButton } from "../components/ui.jsx";
import { RECIPES, RECIPE_TAGS, filterRecipes } from "../data/recipes.js";
import { api } from "../api.js";
import { haptic } from "../telegram.js";
import { useApp } from "../store.jsx";

function DietPlanCard() {
  const { dietPlan, setDietPlan, addMeal, showToast } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.generateDietPlan();
      setDietPlan(res.plan);
      haptic("success");
    } catch (e) {
      setError(e.message || "Reja tuzib bo'lmadi");
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
            {busy ? <Loader2 size={19} className="animate-spin text-neon" /> : <Sparkles size={19} className="text-neon" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-bold text-ink">
              {busy ? "AI reja tuzmoqda…" : "AI kunlik ovqat rejasi"}
            </span>
            <span className="mt-0.5 block text-[11.5px] text-muted">
              Me'yoringizga mos 4 mahal ovqat — milliy taomlar bilan
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
            <h3 className="text-[13.5px] font-bold text-ink">AI kunlik rejangiz</h3>
          </div>
          {dietPlan.summary && <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{dietPlan.summary}</p>}
        </div>
        <button onClick={generate} disabled={busy} className="shrink-0 text-[11.5px] font-bold text-neon disabled:opacity-50">
          {busy ? "…" : "Yangilash"}
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
                    showToast("Qo'shildi ✓", "success");
                  } catch (e) {
                    showToast(e.message || "Xatolik", "error");
                  }
                }}
                aria-label={`${m.name} ni qo'shish`}
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
          {dietPlan.tips.map((t, i) => (
            <li key={i} className="text-[11.5px] leading-relaxed text-muted">• {t}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function RecipesScreen({ onBack }) {
  const { addMeal, showToast } = useApp();
  const [tag, setTag] = useState("Barchasi");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [portion, setPortion] = useState(1);

  const list = filterRecipes(tag, search);

  async function add(recipe, mult = 1) {
    try {
      await addMeal({
        name: recipe.name,
        emoji: recipe.emoji,
        kcal: Math.round(recipe.kcal * mult),
        carbs: Math.round(recipe.carbs * mult),
        protein: Math.round(recipe.protein * mult),
        fat: Math.round(recipe.fat * mult),
        source: "recipe",
      });
      haptic("success");
      showToast("Dietaga qo'shildi ✓", "success");
      setDetail(null);
      setPortion(1);
    } catch (e) {
      showToast(e.message || "Xatolik", "error");
    }
  }

  return (
    <Screen>
      <ScreenHeader
        title="Retseptlar"
        subtitle="Milliy taomlar va sodda fit taomlar"
        right={<BackButton onBack={onBack} />}
      />

      <Section title="AI ovqat rejasi">
        <DietPlanCard />
      </Section>

      <div className="mb-3 flex items-center gap-2 rounded-2xl border border-borderSoft bg-surface px-3.5 py-3 focus-within:border-neon/50">
        <Search size={16} className="shrink-0 text-faint" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Retsept yoki ingredient qidirish…"
          className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-faint"
        />
      </div>

      <div className="no-scrollbar -mx-5 mb-3 flex gap-2 overflow-x-auto px-5 pb-1">
        {RECIPE_TAGS.map((t) => (
          <Chip key={t} active={tag === t} onClick={() => setTag(t)}>{t}</Chip>
        ))}
      </div>

      <p className="mb-2.5 text-[11px] text-faint">{list.length} ta natija</p>

      {list.length === 0 ? (
        <EmptyState Icon={UtensilsCrossed} title="Topilmadi" desc="Boshqa filtr yoki qidiruv so'zini sinab ko'ring." />
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((r) => (
            <button
              key={r.id}
              onClick={() => {
                haptic("light");
                setDetail(r);
                setPortion(1);
              }}
              className="flex items-start gap-3 rounded-2xl border border-borderSoft bg-surface p-3 text-left active:scale-[0.99]"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-surfaceAlt text-2xl">{r.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[13px] font-bold text-ink">{r.name}</span>
                  {r.isApprox && <Info size={11} className="shrink-0 text-amber" />}
                </span>
                <span className="mt-0.5 block truncate text-[10.5px] text-faint">{r.portion}</span>
                <span className="mt-1 flex items-center gap-3 text-[11px] text-faint">
                  <span className="flex items-center gap-1"><Clock size={10} /> {r.minutes} daq</span>
                  <span className="flex items-center gap-1"><Flame size={10} className="text-amber" /> {r.kcal} kcal</span>
                </span>
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  add(r);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.stopPropagation();
                    add(r);
                  }
                }}
                aria-label={`${r.name} ni qo'shish`}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-neon/12 active:scale-95"
              >
                <Plus size={16} className="text-neon" />
              </span>
            </button>
          ))}
        </div>
      )}

      <Sheet open={Boolean(detail)} onClose={() => setDetail(null)} title={detail?.name}>
        {detail && (
          <>
            <div className="mb-3 flex items-center gap-3">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-surfaceAlt text-3xl">{detail.emoji}</span>
              <div className="min-w-0">
                <p className="text-[12px] text-muted">{detail.portion}</p>
                <p className="tabular mt-0.5 text-[22px] font-bold text-neon">
                  {Math.round(detail.kcal * portion)}<span className="ml-1 text-[12px] text-faint">kcal</span>
                </p>
              </div>
            </div>

            <div
              className={`mb-3 flex items-start gap-2 rounded-xl px-3 py-2.5 ${detail.isApprox ? "bg-amber/10" : "bg-neon/8"}`}
            >
              <Info size={13} className={`mt-0.5 shrink-0 ${detail.isApprox ? "text-amber" : "text-neon"}`} />
              <div>
                <p className={`text-[11px] font-bold ${detail.isApprox ? "text-amber" : "text-neon"}`}>
                  {detail.isApprox ? "Taxminiy qiymat" : "Barqaror qiymat"}
                </p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{detail.note}</p>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2">
              {[
                { l: "Uglevod", v: Math.round(detail.carbs * portion), c: "text-cyan" },
                { l: "Oqsil", v: Math.round(detail.protein * portion), c: "text-neon" },
                { l: "Yog'", v: Math.round(detail.fat * portion), c: "text-amber" },
              ].map((m) => (
                <div key={m.l} className="rounded-xl bg-surfaceAlt px-2.5 py-2.5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-faint">{m.l}</p>
                  <p className={`tabular mt-0.5 text-[16px] font-bold ${m.c}`}>{m.v}<span className="text-[10px] text-faint">g</span></p>
                </div>
              ))}
            </div>

            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">Porsiya</p>
            <div className="mb-4 flex gap-2">
              {[0.5, 1, 1.5, 2].map((p) => (
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

            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">Tarkibi (1 porsiya)</p>
            <ul className="mb-5 flex flex-col gap-1">
              {detail.ingredients.map((i) => (
                <li key={i} className="text-[12.5px] text-muted">• {i}</li>
              ))}
            </ul>

            <Button full size="lg" onClick={() => add(detail, portion)}>
              <Plus size={17} /> Dietaga qo'shish
            </Button>
          </>
        )}
      </Sheet>
    </Screen>
  );
}
