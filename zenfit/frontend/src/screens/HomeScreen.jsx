import { useState } from "react";
import {
  Flame, Droplets, Dumbbell, Camera, Plus, MessageSquare, Trash2, Minus,
  UtensilsCrossed, TrendingUp, Sparkles, BarChart3,
} from "lucide-react";
import { Screen, ScreenHeader, Section, StatTile, ProgressRing, MacroBar, EmptyState, Skeleton, Button, ListRow } from "../components/ui.jsx";
import { useApp } from "../store.jsx";
import { haptic } from "../telegram.js";
import { uzFullDate } from "../lib/format.js";

function QuickAction({ Icon, label, onClick, tone = "surface" }) {
  const tones = {
    neon: "bg-neon text-neonOn",
    surface: "bg-surfaceAlt text-ink border border-borderSoft",
  };
  return (
    <button
      onClick={() => {
        haptic("light");
        onClick();
      }}
      className={`flex flex-1 flex-col items-center gap-1.5 rounded-2xl px-2 py-3.5 active:scale-[0.96] ${tones[tone]}`}
    >
      <Icon size={19} />
      <span className="text-[11px] font-bold leading-none">{label}</span>
    </button>
  );
}

export default function HomeScreen({ onNavigate }) {
  const { profile, summary, meals, removeMeal, addWater, showToast, workoutPlan } = useApp();
  const [waterBusy, setWaterBusy] = useState(false);

  if (!summary) {
    return (
      <Screen>
        <ScreenHeader title="Bugun" subtitle="Yuklanmoqda…" />
        <Skeleton className="mb-4 h-64" />
        <Skeleton className="mb-3 h-24" />
        <Skeleton className="h-40" />
      </Screen>
    );
  }

  const eaten = summary.kcal;
  const target = summary.target;
  const remaining = Math.max(0, summary.remaining);
  const over = summary.remaining < 0;

  async function water(delta) {
    setWaterBusy(true);
    try {
      await addWater(delta);
      haptic("success");
    } catch (e) {
      showToast(e.message || "Xatolik", "error");
    } finally {
      setWaterBusy(false);
    }
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return "Xayrli tun";
    if (h < 12) return "Xayrli tong";
    if (h < 18) return "Xayrli kun";
    return "Xayrli kech";
  })();

  return (
    <Screen>
      <ScreenHeader
        title={greeting}
        subtitle={uzFullDate()}
        right={
          summary.streak > 0 && (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-amber/30 bg-amber/12 px-3 py-1.5">
              <Flame size={14} className="text-amber" />
              <span className="tabular text-[13px] font-bold text-amber">{summary.streak}</span>
            </span>
          )
        }
      />

      {/* Calorie hero */}
      <div className="card card-lit mb-3 flex flex-col items-center px-5 py-6">
        <ProgressRing value={eaten} max={target}>
          <div className="text-center">
            <p className={`tabular text-[40px] font-bold leading-none ${over ? "text-rose" : "text-ink"}`}>{remaining}</p>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-faint">
              {over ? "ortiqcha" : "kcal qoldi"}
            </p>
          </div>
        </ProgressRing>

        <div className="mt-4 flex w-full items-center justify-center gap-5 text-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-faint">Yeyildi</p>
            <p className="tabular text-[15px] font-bold text-ink">{eaten}</p>
          </div>
          <span className="h-8 w-px bg-borderSoft" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-faint">Me'yor</p>
            <p className="tabular text-[15px] font-bold text-ink">{target}</p>
          </div>
          <span className="h-8 w-px bg-borderSoft" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-faint">Sarflandi</p>
            <p className="tabular text-[15px] font-bold text-cyan">{summary.burned}</p>
          </div>
        </div>

        <div className="mt-5 flex w-full gap-3">
          <MacroBar label="Oqsil" value={summary.protein} target={profile?.proteinTargetG} color="#CCFF00" />
          <MacroBar label="Uglevod" value={summary.carbs} target={profile?.carbsTargetG} color="#4DFFDF" />
          <MacroBar label="Yog'" value={summary.fat} target={profile?.fatTargetG} color="#FFB020" />
        </div>
      </div>

      {/* Quick actions — these lead to the destinations that are not tabs. */}
      <div className="mb-5 flex gap-2.5">
        <QuickAction Icon={Camera} label="AI Skan" tone="neon" onClick={() => onNavigate("scan")} />
        <QuickAction Icon={UtensilsCrossed} label="Retseptlar" onClick={() => onNavigate("recipes")} />
        <QuickAction Icon={BarChart3} label="Progress" onClick={() => onNavigate("progress")} />
        <QuickAction Icon={MessageSquare} label="AI Trener" onClick={() => onNavigate("chat")} />
      </div>

      {/* Water */}
      <Section title="Suv">
        <div className="card flex items-center gap-3 px-4 py-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan/12">
            <Droplets size={19} className="text-cyan" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="tabular text-[15px] font-bold text-ink">
              {summary.waterMl}
              <span className="text-[12px] font-semibold text-faint"> / {summary.waterTargetMl} ml</span>
            </p>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-borderSoft">
              <div
                className="h-full rounded-full bg-cyan transition-[width] duration-500"
                style={{ width: `${Math.min((summary.waterMl / summary.waterTargetMl) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <button
              onClick={() => water(-250)}
              disabled={waterBusy || summary.waterMl <= 0}
              aria-label="250 ml ayirish"
              className="grid h-9 w-9 place-items-center rounded-xl border border-borderSoft bg-surfaceAlt active:scale-95 disabled:opacity-30"
            >
              <Minus size={15} className="text-muted" />
            </button>
            <button
              onClick={() => water(250)}
              disabled={waterBusy}
              aria-label="250 ml qo'shish"
              className="grid h-9 w-9 place-items-center rounded-xl bg-cyan/15 active:scale-95 disabled:opacity-40"
            >
              <Plus size={15} className="text-cyan" />
            </button>
          </div>
        </div>
      </Section>

      {/* Today's stats */}
      <Section title="Bugungi holat">
        <div className="flex gap-2.5">
          <StatTile Icon={UtensilsCrossed} label="Ovqat" value={summary.mealCount} unit="ta" tone="amber" />
          <StatTile Icon={Dumbbell} label="Mashq" value={summary.workoutCount} unit="ta" tone="cyan" />
          <StatTile Icon={Flame} label="Streak" value={summary.streak} unit="kun" tone="neon" />
        </div>
      </Section>

      {/* Meals */}
      <Section
        title={`Bugungi ovqatlar (${meals.length})`}
        action={
          <button onClick={() => onNavigate("recipes")} className="text-[12px] font-bold text-neon">
            + Qo'shish
          </button>
        }
      >
        {meals.length === 0 ? (
          <EmptyState
            Icon={UtensilsCrossed}
            title="Hali ovqat qo'shilmagan"
            desc="Taom rasmini skanerlang yoki retseptlardan tanlang."
            action={<Button full size="sm" onClick={() => onNavigate("scan")}><Camera size={15} /> AI bilan skanerlash</Button>}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {meals.map((m) => (
              <ListRow
                key={m.id}
                emoji={m.emoji || "🍽️"}
                title={m.name}
                subtitle={`${m.carbs || 0}g U • ${m.protein || 0}g O • ${m.fat || 0}g Y${m.portionG ? ` • ${m.portionG}g` : ""}`}
                right={
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="tabular text-[13px] font-bold text-amber">{m.kcal}</span>
                    <button
                      onClick={async () => {
                        haptic("light");
                        try {
                          await removeMeal(m.id);
                        } catch (e) {
                          showToast(e.message || "O'chirib bo'lmadi", "error");
                        }
                      }}
                      aria-label={`${m.name} ni o'chirish`}
                      className="grid h-8 w-8 place-items-center rounded-lg bg-surfaceAlt active:scale-95"
                    >
                      <Trash2 size={13} className="text-faint" />
                    </button>
                  </span>
                }
              />
            ))}
          </div>
        )}
      </Section>

      {/* Plan nudge */}
      {!workoutPlan && (
        <Section>
          <button
            onClick={() => onNavigate("workouts")}
            className="card card-lit flex w-full items-center gap-3 px-4 py-4 text-left active:scale-[0.99]"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-neon/12">
              <Sparkles size={19} className="text-neon" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-bold text-ink">AI mashq rejasini tuzing</span>
              <span className="mt-0.5 block text-[11.5px] text-muted">Vazningizga mos kg'lar bilan haftalik reja</span>
            </span>
            <TrendingUp size={16} className="shrink-0 text-neon" />
          </button>
        </Section>
      )}
    </Screen>
  );
}
