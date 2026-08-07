import { useState } from "react";
import {
  Flame, Droplets, Dumbbell, Camera, Plus, Trash2, Minus, Activity,
  UtensilsCrossed, TrendingUp, Sparkles, BarChart3,
} from "lucide-react";
import { Screen, ScreenHeader, Section, StatTile, ProgressRing, MacroBar, EmptyState, Skeleton, Button, ListRow } from "../components/ui.jsx";
import ActivitySheet from "../components/ActivitySheet.jsx";
import { ACTIVITY_BY_ID } from "../data/activities.js";
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
  const { profile, summary, meals, activities, removeMeal, removeActivity, addWater, showToast, workoutPlan, t } = useApp();
  const [waterBusy, setWaterBusy] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);

  if (!summary) {
    return (
      <Screen>
        <ScreenHeader title={t("home.day")} subtitle={t("common.loading")} />
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
      showToast(e.message || t("common.error"), "error");
    } finally {
      setWaterBusy(false);
    }
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 6) return t("home.night");
    if (h < 12) return t("home.morning");
    if (h < 18) return t("home.day");
    return t("home.evening");
  })();

  const activityLabel = (a) =>
    a.activityId === "custom" ? a.name : t(`activity.names.${a.activityId}`);

  return (
    <Screen>
      <ScreenHeader
        title={greeting}
        subtitle={uzFullDate()}
        action={
          summary.streak > 0 && (
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-amber/30 bg-amber/12 px-2.5 py-1.5">
              <Flame size={13} className="text-amber" />
              <span className="tabular text-[12.5px] font-bold text-amber">{summary.streak}</span>
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
              {over ? t("home.over") : t("home.remaining")}
            </p>
          </div>
        </ProgressRing>

        <div className="mt-4 flex w-full items-center justify-center gap-5 text-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-faint">{t("home.eaten")}</p>
            <p className="tabular text-[15px] font-bold text-ink">{eaten}</p>
          </div>
          <span className="h-8 w-px bg-borderSoft" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-faint">{t("home.target")}</p>
            <p className="tabular text-[15px] font-bold text-ink">{target}</p>
          </div>
          <span className="h-8 w-px bg-borderSoft" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-faint">{t("home.burned")}</p>
            <p className="tabular text-[15px] font-bold text-cyan">{summary.burned}</p>
          </div>
        </div>

        <div className="mt-5 flex w-full gap-3">
          <MacroBar label={t("home.protein")} value={summary.protein} target={profile?.proteinTargetG} color="rgb(var(--c-neon))" />
          <MacroBar label={t("home.carbs")} value={summary.carbs} target={profile?.carbsTargetG} color="rgb(var(--c-cyan))" />
          <MacroBar label={t("home.fat")} value={summary.fat} target={profile?.fatTargetG} color="rgb(var(--c-amber))" />
        </div>
      </div>

      {/* Quick actions — the destinations that are not tabs. */}
      <div className="mb-5 flex gap-2.5">
        <QuickAction Icon={Camera} label={t("home.qaScan")} tone="neon" onClick={() => onNavigate("scan")} />
        <QuickAction Icon={Activity} label={t("home.qaActivity")} onClick={() => setActivityOpen(true)} />
        <QuickAction Icon={UtensilsCrossed} label={t("home.qaRecipes")} onClick={() => onNavigate("recipes")} />
        <QuickAction Icon={BarChart3} label={t("home.qaProgress")} onClick={() => onNavigate("progress")} />
      </div>

      {/* Water */}
      <Section title={t("home.water")}>
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
              aria-label="250 ml"
              className="grid h-9 w-9 place-items-center rounded-xl border border-borderSoft bg-surfaceAlt active:scale-95 disabled:opacity-30"
            >
              <Minus size={15} className="text-muted" />
            </button>
            <button
              onClick={() => water(250)}
              disabled={waterBusy}
              aria-label="250 ml"
              className="grid h-9 w-9 place-items-center rounded-xl bg-cyan/15 active:scale-95 disabled:opacity-40"
            >
              <Plus size={15} className="text-cyan" />
            </button>
          </div>
        </div>
      </Section>

      {/* Today's stats */}
      <Section title={t("home.todayStatus")}>
        <div className="flex gap-2.5">
          <StatTile Icon={UtensilsCrossed} label={t("home.meals")} value={summary.mealCount} unit={t("home.ta")} tone="amber" />
          <StatTile Icon={Dumbbell} label={t("home.workouts")} value={summary.workoutCount} unit={t("home.ta")} tone="cyan" />
          <StatTile Icon={Flame} label={t("home.streak")} value={summary.streak} unit={t("home.days")} tone="neon" />
        </div>
      </Section>

      {/* Free activity / cardio */}
      <Section
        title={t("activity.todayTitle")}
        action={
          <button onClick={() => setActivityOpen(true)} className="text-[12px] font-bold text-neon">
            {t("home.addMeal")}
          </button>
        }
      >
        {activities.length === 0 ? (
          <EmptyState
            Icon={Activity}
            title={t("activity.empty")}
            desc={t("activity.emptyDesc")}
            action={
              <Button full size="sm" onClick={() => setActivityOpen(true)}>
                <Activity size={15} /> {t("activity.logTitle")}
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            {activities.map((a) => (
              <ListRow
                key={a.id}
                emoji={a.emoji || ACTIVITY_BY_ID[a.activityId]?.emoji || "✨"}
                title={activityLabel(a)}
                subtitle={[
                  `${a.durationMin} ${t("common.min")}`,
                  a.distanceKm ? `${a.distanceKm} ${t("common.km")}` : null,
                  t(`activity.${a.intensity}`),
                ]
                  .filter(Boolean)
                  .join(" • ")}
                right={
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="tabular text-[13px] font-bold text-cyan">−{a.kcal}</span>
                    <button
                      onClick={async () => {
                        haptic("light");
                        try {
                          await removeActivity(a.id);
                        } catch (e) {
                          showToast(e.message || t("common.error"), "error");
                        }
                      }}
                      aria-label={t("common.delete")}
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

      {/* Meals */}
      <Section
        title={`${t("home.todayMeals")} (${meals.length})`}
        action={
          <button onClick={() => onNavigate("recipes")} className="text-[12px] font-bold text-neon">
            {t("home.addMeal")}
          </button>
        }
      >
        {meals.length === 0 ? (
          <EmptyState
            Icon={UtensilsCrossed}
            title={t("home.noMeals")}
            desc={t("home.noMealsDesc")}
            action={
              <Button full size="sm" onClick={() => onNavigate("scan")}>
                <Camera size={15} /> {t("home.scanWithAi")}
              </Button>
            }
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
                          showToast(e.message || t("common.error"), "error");
                        }
                      }}
                      aria-label={t("common.delete")}
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
              <span className="block text-[13.5px] font-bold text-ink">{t("home.planNudge")}</span>
              <span className="mt-0.5 block text-[11.5px] text-muted">{t("home.planNudgeDesc")}</span>
            </span>
            <TrendingUp size={16} className="shrink-0 text-neon" />
          </button>
        </Section>
      )}

      <ActivitySheet open={activityOpen} onClose={() => setActivityOpen(false)} />
    </Screen>
  );
}
