import { useEffect, useState } from "react";
import { Trophy, Weight, Layers, Repeat } from "lucide-react";
import { Screen, ScreenHeader, Section, StatTile, Skeleton, ErrorNote, EmptyState } from "../components/ui.jsx";
import { localizeExercise } from "../data/exerciseText.js";
import { api } from "../api.js";
import { useBackButton } from "../lib/useBackButton.js";
import { useApp } from "../store.jsx";
import { shortDate } from "../lib/format.js";

/**
 * Every exercise the user has ever logged, ranked by how much total weight has
 * moved through it. Sorting by volume means the lifts someone actually trains
 * float to the top on their own, so the list needs no filter UI to be useful.
 */
export default function RecordsScreen({ onBack }) {
  const { t, lang } = useApp();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useBackButton(onBack);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    api
      .getWorkoutRecords()
      .then((res) => !cancelled && setData(res))
      .catch((e) => !cancelled && setError(e.message || t("common.error")));
    return () => {
      cancelled = true;
    };
  }, [reloadKey, t]);

  return (
    <Screen>
      <ScreenHeader title={t("records.title")} subtitle={t("records.subtitle")} onBack={onBack} />

      {error ? (
        <ErrorNote onRetry={() => setReloadKey((k) => k + 1)}>{error}</ErrorNote>
      ) : !data ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : data.records.length === 0 ? (
        <EmptyState Icon={Trophy} title={t("records.empty")} desc={t("records.emptyDesc")} />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-3 gap-2.5">
            <StatTile Icon={Weight} label={t("records.totalVolume")} value={data.totals.volumeKg} unit={t("common.kg")} tone="neon" />
            <StatTile Icon={Layers} label={t("records.totalSets")} value={data.totals.sets} unit={t("home.ta")} tone="cyan" />
            <StatTile Icon={Repeat} label={t("workout.reps")} value={data.totals.reps} unit={t("home.ta")} tone="amber" />
          </div>

          <Section title={t("records.byExercise")}>
            <div className="flex flex-col gap-2">
              {data.records.map((r) => {
                const name = localizeExercise({ id: r.exerciseId, name: r.exerciseName }, lang).name;
                return (
                  <div key={r.exerciseId || r.exerciseName} className="card px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-ink">{name}</span>
                      {r.maxWeightKg > 0 && (
                        <span className="flex shrink-0 items-center gap-1 rounded-lg bg-amber/12 px-2 py-1 text-[11px] font-bold text-amber">
                          <Trophy size={11} /> {r.maxWeightKg} {t("common.kg")}
                        </span>
                      )}
                    </div>

                    <div className="mt-2.5 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-surfaceAlt px-2 py-2 text-center">
                        <p className="text-[9.5px] font-bold uppercase tracking-wider text-faint">{t("records.totalVolume")}</p>
                        <p className="tabular mt-0.5 text-[13px] font-bold text-ink">{r.totalVolumeKg}</p>
                      </div>
                      <div className="rounded-xl bg-surfaceAlt px-2 py-2 text-center">
                        <p className="text-[9.5px] font-bold uppercase tracking-wider text-faint">{t("records.bestSession")}</p>
                        <p className="tabular mt-0.5 text-[13px] font-bold text-ink">{r.bestSessionVolumeKg}</p>
                      </div>
                      <div className="rounded-xl bg-surfaceAlt px-2 py-2 text-center">
                        <p className="text-[9.5px] font-bold uppercase tracking-wider text-faint">{t("records.sessions")}</p>
                        <p className="tabular mt-0.5 text-[13px] font-bold text-ink">{r.sessions}</p>
                      </div>
                    </div>

                    <p className="mt-2 text-[11px] text-faint">
                      {t("records.totalSets")}: {r.totalSets} · {t("workout.reps")}: {r.totalReps}
                      {r.lastAt && ` · ${t("records.lastDone")}: ${shortDate(new Date(r.lastAt), lang)}`}
                    </p>
                  </div>
                );
              })}
            </div>
          </Section>
        </>
      )}
    </Screen>
  );
}
