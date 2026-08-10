import { useEffect, useState } from "react";
import { Flame, TrendingUp, Award, Scale, Dumbbell, Target } from "lucide-react";
import { Screen, ScreenHeader, Section, StatTile, Skeleton, Chip } from "../components/ui.jsx";
import { api } from "../api.js";
import { useApp } from "../store.jsx";
import { localDateKey, weekdayShort } from "../lib/format.js";

/**
 * Monday, January 1st 2024 — a plain, DST-free reference date used only for
 * its day-of-week. Walking a week from it and running each day through the
 * existing `weekdayShort` gives Monday-first single-letter headers in
 * whichever language is active, without a fourth weekday table to keep in
 * sync with the three already in lib/format.js.
 */
const REF_MONDAY = new Date(2024, 0, 1);
function monFirstInitials(lang) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(REF_MONDAY);
    d.setDate(d.getDate() + i);
    return weekdayShort(d, lang).charAt(0);
  });
}

/**
 * Calendar heatmap for the current month: which days had a meal, workout or
 * activity logged. Restyled from a reference screenshot into the app's own
 * language — neon/flame (the primary accent, `text-neonOn` on the filled
 * cells for contrast) rather than the reference's flat orange, and a card
 * rather than a standalone panel so it sits like every other Progress widget.
 */
function MonthlyHeatmap({ month, t, lang }) {
  if (!month) return null;
  const { daysInMonth, firstWeekday, activeDays, today } = month;
  const activeSet = new Set(activeDays);
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="card px-4 py-4">
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <p className="min-w-0 text-[11.5px] leading-relaxed text-muted">{t("progress.monthlyHeatmapDesc")}</p>
        <span className="flex shrink-0 items-center gap-1 rounded-full border border-neon/30 bg-neon/[0.12] px-2.5 py-1">
          <Flame size={13} className="text-neon" />
          <span className="tabular text-[12.5px] font-bold text-neon">{activeDays.length}</span>
        </span>
      </div>

      <div className="mb-1.5 grid grid-cols-7 gap-1.5">
        {monFirstInitials(lang).map((letter, i) => (
          <span key={i} className="text-center text-[10px] font-bold uppercase text-faint">
            {letter}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, i) => {
          if (day == null) return <span key={`blank${i}`} aria-hidden="true" />;
          const active = activeSet.has(day);
          const isToday = day === today;
          return (
            <span
              key={day}
              className={`tabular grid aspect-square place-items-center rounded-xl text-[11px] font-bold ${
                active
                  ? "bg-neon text-neonOn"
                  : isToday
                    ? "border border-neon/50 text-ink"
                    : "bg-surfaceAlt text-faint"
              }`}
            >
              {active ? <Flame size={12} strokeWidth={2.5} className="text-neonOn" /> : day}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** Grouped bars: intake vs burn, with the target drawn as a reference line. */
function WeeklyChart({ days, target, t, lang }) {
  if (!days?.length) return null;

  const max = Math.max(target, ...days.map((d) => Math.max(d.consumed, d.burned)), 1);
  const H = 132;

  return (
    <div className="card px-4 py-4">
      <div className="mb-3 flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-[11px] text-muted">
          <span className="h-2 w-2 rounded-sm bg-neon" /> {t("progress.consumed")}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted">
          <span className="h-2 w-2 rounded-sm bg-cyan" /> {t("progress.burned")}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted">
          <span className="h-0.5 w-3 bg-faint" /> {t("progress.target")}
        </span>
      </div>

      <div className="relative" style={{ height: H }}>
        <div
          className="absolute inset-x-0 border-t border-dashed border-faint/50"
          style={{ bottom: `${(target / max) * H}px` }}
        />
        <div className="flex h-full items-end gap-1.5">
          {days.map((d) => {
            const date = new Date(`${d.date}T00:00:00`);
            // The device's own date, not UTC: `toISOString()` would highlight
            // yesterday's bar until 05:00 every Tashkent morning.
            const isToday = d.date === localDateKey();
            return (
              <div key={d.date} className="flex flex-1 flex-col items-center justify-end gap-1" style={{ height: H }}>
                <div className="flex h-full w-full items-end justify-center gap-0.5">
                  <div
                    className="w-1/2 rounded-t bg-neon transition-[height] duration-700"
                    style={{ height: `${(d.consumed / max) * 100}%`, opacity: isToday ? 1 : 0.55 }}
                    title={t("progress.tipConsumed", { kcal: d.consumed })}
                  />
                  <div
                    className="w-1/2 rounded-t bg-cyan transition-[height] duration-700"
                    style={{ height: `${(d.burned / max) * 100}%`, opacity: isToday ? 1 : 0.55 }}
                    title={t("progress.tipBurned", { kcal: d.burned })}
                  />
                </div>
                <span className={`text-[9.5px] font-semibold ${isToday ? "text-neon" : "text-faint"}`}>
                  {weekdayShort(date, lang)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WeightChart({ history, t }) {
  const distinct = new Set(history.map((h) => h.weightKg)).size;
  // A single logged value (or several identical ones) has no trend to draw —
  // show the current number rather than an empty box or a flat filled block.
  if (history.length < 2 || distinct < 2) {
    const current = history.at(-1)?.weightKg;
    return (
      <div className="card flex items-center gap-4 px-4 py-5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-surfaceAlt">
          <Scale size={20} className="text-muted" />
        </span>
        <div className="min-w-0">
          {current == null ? (
            <p className="text-[15px] font-bold leading-none text-ink">{t("progress.noWeightData")}</p>
          ) : (
            <p className="tabular text-[24px] font-bold leading-none text-ink">
              {current}<span className="text-[12px] text-faint"> {t("common.kg")}</span>
            </p>
          )}
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">{t("progress.noWeightDesc")}</p>
        </div>
      </div>
    );
  }

  const values = history.map((h) => h.weightKg);
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const W = 320;
  const H = 110;

  const pts = history.map((h, i) => {
    const x = (i / (history.length - 1)) * W;
    const y = H - ((h.weightKg - min) / (max - min || 1)) * H;
    return [x, y];
  });

  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const delta = values.at(-1) - values[0];

  return (
    <div className="card px-4 py-4">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <p className="tabular text-[24px] font-bold text-ink">
            {values.at(-1)}<span className="text-[12px] text-faint"> {t("common.kg")}</span>
          </p>
          <p className="text-[11px] text-muted">{t("progress.currentWeight")}</p>
        </div>
        <span
          className={`tabular rounded-lg px-2 py-1 text-[12px] font-bold ${
            delta < 0 ? "bg-neon/12 text-neon" : delta > 0 ? "bg-amber/12 text-amber" : "bg-surfaceAlt text-muted"
          }`}
        >
          {delta > 0 ? "+" : ""}{delta.toFixed(1)} {t("common.kg")}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[110px] w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#CCFF00" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#CCFF00" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#wg)" />
        <path d={line} fill="none" stroke="#CCFF00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function ProgressScreen({ onBack }) {
  const { summary, profile, workoutHistory, t, lang } = useApp();
  const [range, setRange] = useState(7);
  const [weekly, setWeekly] = useState(null);
  const [weights, setWeights] = useState([]);
  const [month, setMonth] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [w, wt] = await Promise.allSettled([api.getWeekly(range), api.getWeightHistory()]);
      if (!alive) return;
      if (w.status === "fulfilled") setWeekly(w.value.days);
      if (wt.status === "fulfilled") setWeights(wt.value.history || []);
    })();
    return () => {
      alive = false;
    };
  }, [range]);

  // Independent of `range` — the heatmap always covers the current calendar
  // month, not the 7/14/30-day window the chip row controls.
  useEffect(() => {
    let alive = true;
    api.getMonthActivity().then((m) => alive && setMonth(m)).catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const totalWorkouts = workoutHistory.length;
  const totalBurned = workoutHistory.reduce((s, w) => s + (w.kcal || 0), 0);

  const badges = [
    { id: "streak3", Icon: Flame, title: t("progress.badges.streak3"), earned: (summary?.streak || 0) >= 3 },
    { id: "streak7", Icon: Award, title: t("progress.badges.streak7"), earned: (summary?.streak || 0) >= 7 },
    { id: "w10", Icon: Dumbbell, title: t("progress.badges.workouts10"), earned: totalWorkouts >= 10 },
    { id: "burn1000", Icon: TrendingUp, title: t("progress.badges.burn1000"), earned: totalBurned >= 1000 },
  ];

  return (
    <Screen>
      <ScreenHeader title={t("progress.title")} subtitle={t("progress.subtitle")} onBack={onBack} />

      <Section title={t("progress.overall")}>
        <div className="mb-2.5 flex gap-2.5">
          <StatTile Icon={Flame} label={t("progress.streak")} value={summary?.streak || 0} unit={t("home.days")} tone="amber" />
          <StatTile Icon={Dumbbell} label={t("progress.workouts")} value={totalWorkouts} unit={t("home.ta")} tone="cyan" />
        </div>
        <div className="flex gap-2.5">
          <StatTile Icon={TrendingUp} label={t("progress.burned")} value={totalBurned} unit={t("common.kcal")} tone="neon" />
          <StatTile Icon={Target} label={t("progress.target")} value={profile?.dailyCalorieTarget || 0} unit={t("common.kcal")} tone="neon" />
        </div>
      </Section>

      <Section title={t("progress.monthlyHeatmap")}>
        {month ? <MonthlyHeatmap month={month} t={t} lang={lang} /> : <Skeleton className="h-48" />}
      </Section>

      <Section
        title={t("progress.calorieBalance")}
        action={
          <div className="flex gap-1.5">
            {[7, 14, 30].map((d) => (
              <Chip key={d} active={range === d} onClick={() => setRange(d)}>{t("progress.rangeDays", { n: d })}</Chip>
            ))}
          </div>
        }
      >
        {weekly ? (
          <WeeklyChart days={weekly} target={profile?.dailyCalorieTarget || 2000} t={t} lang={lang} />
        ) : (
          <Skeleton className="h-48" />
        )}
      </Section>

      <Section title={t("progress.weightDynamics")}>
        <WeightChart history={weights} t={t} />
      </Section>

      <Section title={t("progress.achievements")}>
        <div className="grid grid-cols-2 gap-2.5">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`flex flex-col items-center rounded-xl2 border px-3 py-4 text-center ${
                b.earned ? "border-neon/30 bg-neon/[0.07]" : "border-borderSoft bg-surface opacity-50"
              }`}
            >
              <span className={`mb-2 grid h-11 w-11 place-items-center rounded-xl ${b.earned ? "bg-neon/15" : "bg-surfaceAlt"}`}>
                <b.Icon size={19} className={b.earned ? "text-neon" : "text-faint"} />
              </span>
              <p className={`text-[11.5px] font-bold leading-tight ${b.earned ? "text-ink" : "text-muted"}`}>{b.title}</p>
              {b.earned && <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-neon">{t("progress.earned")}</p>}
            </div>
          ))}
        </div>
      </Section>
    </Screen>
  );
}
