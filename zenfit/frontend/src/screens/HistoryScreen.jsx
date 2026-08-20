import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardList, Dumbbell, Flame, UtensilsCrossed, ChevronRight } from "lucide-react";
import { Screen, ScreenHeader, Chip, Skeleton, ErrorNote, EmptyState, Sheet } from "../components/ui.jsx";
import SessionSummary from "./SessionSummary.jsx";
import { MealSlotAccordion } from "../components/PlanMealRow.jsx";
import { groupBySlot, planDays } from "../lib/planMeals.js";
import { localizeDay, planTitle } from "../lib/aiPlanEngine.js";
import { weekIndexOf } from "../lib/planWeek.js";
import { api } from "../api.js";
import { useBackButton } from "../lib/useBackButton.js";
import { useApp } from "../store.jsx";
import { localDateKey, shortDate } from "../lib/format.js";

const TABS = [
  { id: "sessions", key: "history.tabSessions" },
  { id: "workout", key: "history.tabWorkoutPlans" },
  { id: "diet", key: "history.tabDietPlans" },
];

/** Finished workouts, one row per calendar day. */
function SessionsTab({ onOpenDay }) {
  const { workoutHistory, t, lang } = useApp();

  // The store already holds the last 300 logs for the plan screen's
  // done-markers, so grouping them here costs nothing extra.
  const days = useMemo(() => {
    const byDay = new Map();
    for (const w of workoutHistory) {
      const key = localDateKey(new Date(w.loggedAt));
      const entry = byDay.get(key) || { date: key, at: new Date(w.loggedAt), exercises: 0, kcal: 0 };
      entry.exercises += 1;
      entry.kcal += Number(w.kcal) || 0;
      byDay.set(key, entry);
    }
    return [...byDay.values()].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [workoutHistory]);

  if (days.length === 0) {
    return <EmptyState Icon={Dumbbell} title={t("history.empty")} desc={t("history.emptySessions")} />;
  }

  return (
    <div className="flex flex-col gap-2">
      {days.map((d) => (
        <button
          key={d.date}
          onClick={() => onOpenDay(d.date)}
          className="card flex w-full items-center gap-3 px-4 py-3.5 text-left active:scale-[0.99]"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surfaceAlt">
            <CalendarDays size={17} className="text-muted" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-bold text-ink">{shortDate(d.at, lang)}</span>
            <span className="mt-0.5 block text-[11.5px] text-muted">{t("history.exercisesN", { n: d.exercises })}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[12.5px] font-bold text-amber">
            <Flame size={13} /> {d.kcal}
          </span>
          <ChevronRight size={16} className="shrink-0 text-faint" />
        </button>
      ))}
    </div>
  );
}

/** Past versions of a stored plan — the rows POST /api/plans deactivated. */
function PlansTab({ planType }) {
  const { t, lang } = useApp();
  const [plans, setPlans] = useState(null);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setPlans(null);
    api
      .getPlanHistory(planType)
      .then((res) => !cancelled && setPlans(res.plans))
      .catch((e) => !cancelled && setError(e.message || t("common.error")));
    return () => {
      cancelled = true;
    };
  }, [planType, reloadKey, t]);

  if (error) return <ErrorNote onRetry={() => setReloadKey((k) => k + 1)}>{error}</ErrorNote>;
  if (!plans) return <Skeleton className="h-24 rounded-2xl" />;
  if (plans.length === 0) {
    return (
      <EmptyState
        Icon={planType === "diet" ? UtensilsCrossed : ClipboardList}
        title={t("history.empty")}
        desc={t("history.emptyPlans")}
      />
    );
  }

  const meta = (p) =>
    planType === "diet"
      ? t("history.mealsN", { n: planDays(p).reduce((n, d) => n + (d.meals?.length || 0), 0) })
      : t("history.daysN", { n: p.daysPerWeek || (p.days || []).filter((d) => !d.rest).length });

  return (
    <>
      <div className="flex flex-col gap-2">
        {plans.map((row) => {
          const p = row.plan || {};
          return (
            <button
              key={row.id}
              onClick={() => setOpen(row)}
              className="card flex w-full items-center gap-3 px-4 py-3.5 text-left active:scale-[0.99]"
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-[13.5px] font-bold text-ink">
                    {planType === "diet" ? t("dietPlanScreen.weekPlan") : planTitle(p, t)}
                  </span>
                  {row.isActive && (
                    <span className="shrink-0 rounded-md bg-neon/15 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-neon">
                      {t("history.activeBadge")}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-[11.5px] text-muted">
                  {t("history.createdOn")}: {shortDate(new Date(row.createdAt), lang)}
                  {planType !== "diet" && ` · ${t("workout.weekN", { n: weekIndexOf(p) })}`}
                  {` · ${meta(p)}`}
                </span>
              </span>
              <ChevronRight size={16} className="shrink-0 text-faint" />
            </button>
          );
        })}
      </div>

      <Sheet
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title={open ? shortDate(new Date(open.createdAt), lang) : ""}
      >
        {open && planType === "diet" ? (
          <div className="flex flex-col gap-4">
            {planDays(open.plan).map((d, i) => (
              <div key={i}>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">
                  {t("workout.dayN", { n: d.day || i + 1 })}
                </p>
                <MealSlotAccordion groups={groupBySlot(d.meals || [], t)} defaultOpen={false} />
              </div>
            ))}
          </div>
        ) : (
          open && (
            <div className="flex flex-col gap-2">
              {(open.plan.days || []).map((d) => (
                <div key={d.day} className="rounded-2xl border border-borderSoft bg-surfaceAlt px-3.5 py-3">
                  <p className="text-[12.5px] font-bold text-ink">
                    {localizeDay(d.day, t)} — {d.rest ? t("workout.restDay") : d.label}
                  </p>
                  {!d.rest && (
                    <p className="mt-1 text-[11.5px] leading-relaxed text-muted">
                      {d.exercises.map((e) => `${e.name} ${e.sets}×${e.reps}`).join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </Sheet>
    </>
  );
}

export default function HistoryScreen({ initialTab, onBack }) {
  const { t } = useApp();
  const [tab, setTab] = useState(TABS.some((x) => x.id === initialTab) ? initialTab : "sessions");
  const [dayOpen, setDayOpen] = useState(null);

  useBackButton(dayOpen ? null : onBack);

  if (dayOpen) {
    return <SessionSummary date={dayOpen} dayTitle={dayOpen} onBack={() => setDayOpen(null)} />;
  }

  return (
    <Screen>
      <ScreenHeader title={t("history.title")} subtitle={t("history.subtitle")} onBack={onBack} />

      <div className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 no-scrollbar">
        {TABS.map((x) => (
          <Chip key={x.id} active={tab === x.id} onClick={() => setTab(x.id)}>
            {t(x.key)}
          </Chip>
        ))}
      </div>

      {tab === "sessions" ? <SessionsTab onOpenDay={setDayOpen} /> : <PlansTab key={tab} planType={tab} />}
    </Screen>
  );
}
