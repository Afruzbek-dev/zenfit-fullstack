import { useEffect, useState } from "react";
import { Flame, Timer, Dumbbell, Weight, Trophy, ChevronRight } from "lucide-react";
import { Screen, ScreenHeader, Section, StatTile, Skeleton, ErrorNote, EmptyState, Button } from "../components/ui.jsx";
import RecordsScreen from "./RecordsScreen.jsx";
import { localizeExercise } from "../data/exerciseText.js";
import { api } from "../api.js";
import { useBackButton } from "../lib/useBackButton.js";
import { useApp } from "../store.jsx";

/**
 * What a finished day of training came to.
 *
 * Records are fetched alongside the summary because a personal best is only
 * meaningful next to the number it beat — and the moment it is set is the only
 * moment anyone cares. The full list lives one tap away in RecordsScreen.
 */
export default function SessionSummary({ date, planDay, dayTitle, onBack }) {
  const { t, lang } = useApp();
  const [data, setData] = useState(null);
  const [records, setRecords] = useState({});
  const [error, setError] = useState(null);
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useBackButton(recordsOpen ? null : onBack);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    Promise.all([api.getDaySummary({ date, planDay }), api.getWorkoutRecords().catch(() => ({ records: [] }))])
      .then(([s, r]) => {
        if (cancelled) return;
        setData(s.summary);
        setRecords(Object.fromEntries((r.records || []).map((x) => [x.exerciseId, x])));
      })
      .catch((e) => !cancelled && setError(e.message || t("common.error")));
    return () => {
      cancelled = true;
    };
  }, [date, planDay, reloadKey, t]);

  if (recordsOpen) return <RecordsScreen onBack={() => setRecordsOpen(false)} />;

  return (
    <Screen>
      <ScreenHeader title={t("workout.summaryTitle")} subtitle={dayTitle} onBack={onBack} />

      {error ? (
        <ErrorNote onRetry={() => setReloadKey((k) => k + 1)}>{error}</ErrorNote>
      ) : !data ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : data.exerciseCount === 0 ? (
        <EmptyState Icon={Dumbbell} title={t("workout.noSessionToday")} desc={t("workout.noPlanDesc")} />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-2.5">
            <StatTile Icon={Flame} label={t("home.burned")} value={data.kcal} unit={t("common.kcal")} tone="amber" />
            <StatTile Icon={Timer} label={t("activity.duration")} value={data.minutes} unit={t("workout.minutes")} tone="cyan" />
            <StatTile Icon={Dumbbell} label={t("workout.exercisesDone")} value={data.exerciseCount} unit={t("home.ta")} tone="neon" />
            <StatTile Icon={Weight} label={t("workout.volume")} value={data.volumeKg} unit={t("common.kg")} tone="neon" />
          </div>

          <Section title={t("workout.setsTitle")}>
            <div className="flex flex-col gap-2">
              {data.exercises.map((e) => {
                const record = records[e.exerciseId];
                // Records include today, so matching the max means this session
                // either set it or matched it — both worth a badge.
                const isPr = e.topWeightKg > 0 && record && e.topWeightKg >= record.maxWeightKg;
                const name = localizeExercise({ id: e.exerciseId, name: e.exerciseName }, lang).name;

                return (
                  <div key={e.exerciseId || e.exerciseName} className="card flex items-center gap-3 px-4 py-3">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold text-ink">{name}</span>
                      <span className="tabular mt-0.5 block text-[11.5px] text-muted">
                        {e.sets} {t("workout.sets")} · {e.reps} {t("workout.reps")}
                        {e.volumeKg > 0 && ` · ${e.volumeKg} ${t("common.kg")}`}
                      </span>
                    </span>
                    {isPr && (
                      <span className="flex shrink-0 items-center gap-1 rounded-lg bg-amber/12 px-2 py-1 text-[10.5px] font-bold text-amber">
                        <Trophy size={11} /> {t("records.pr")}
                      </span>
                    )}
                    {e.topWeightKg > 0 && (
                      <span className="tabular shrink-0 text-[12.5px] font-bold text-neon">
                        {e.topWeightKg} {t("common.kg")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>

          <Button full variant="ghost" onClick={() => setRecordsOpen(true)}>
            <Trophy size={15} /> {t("records.title")} <ChevronRight size={15} />
          </Button>
        </>
      )}
    </Screen>
  );
}
