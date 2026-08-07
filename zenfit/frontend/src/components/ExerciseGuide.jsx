import { useState } from "react";
import { Play, AlertTriangle, ListChecks, Dumbbell, Target, ExternalLink } from "lucide-react";
import { Screen, ScreenHeader } from "./ui.jsx";
import { EX_BY_ID, EQUIPMENT_LABELS, youtubeSearchUrl } from "../data/exercises.js";
import { openLink } from "../telegram.js";
import { useBackButton } from "../lib/useBackButton.js";
import { useApp } from "../store.jsx";

/**
 * In-app video. The player is only mounted after a tap: 40 exercises each
 * loading a YouTube iframe on render would cost several MB on a phone
 * connection, and the poster image alone answers "which movement is this".
 */
export function VideoPlayer({ videoId, title, searchUrl }) {
  const { t } = useApp();
  const [playing, setPlaying] = useState(false);

  if (!videoId) {
    return (
      <button
        onClick={() => searchUrl && openLink(searchUrl)}
        className="flex w-full items-center gap-3 rounded-xl2 border border-borderSoft bg-surfaceAlt px-4 py-4 text-left active:scale-[0.99]"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-rose/12">
          <Play size={20} fill="currentColor" className="text-rose" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-bold text-ink">{t("workout.videoMissing")}</span>
          <span className="mt-0.5 block text-[11.5px] text-muted">{t("workout.openYoutube")}</span>
        </span>
        <ExternalLink size={15} className="shrink-0 text-faint" />
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl2 border border-borderSoft bg-black">
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        {playing ? (
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            aria-label={title}
            className="absolute inset-0 h-full w-full"
            style={{
              backgroundImage: `url(https://i.ytimg.com/vi/${videoId}/hqdefault.jpg)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <span className="absolute inset-0 grid place-items-center bg-black/35">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-rose/95 shadow-2xl transition-transform active:scale-95">
                <Play size={26} fill="white" className="ml-1 text-white" />
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

function Tag({ Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-borderSoft bg-surfaceAlt px-3 py-1.5 text-[11.5px] font-semibold text-muted">
      <Icon size={12} className="shrink-0 text-faint" />
      {children}
    </span>
  );
}

/** Full-screen how-to: video, ordered steps and the mistakes that cause injuries. */
export default function ExerciseGuide({ exerciseId, onBack }) {
  const { t } = useApp();
  useBackButton(onBack);

  const exercise = exerciseId ? EX_BY_ID[exerciseId] : null;
  if (!exercise) return null;

  return (
    <Screen>
      <ScreenHeader title={t("workout.guide")} subtitle={exercise.name} onBack={onBack} />

      <div className="mb-4">
        <VideoPlayer
          videoId={exercise.youtubeId}
          title={`${exercise.name} — ${t("workout.video")}`}
          searchUrl={youtubeSearchUrl(exercise)}
        />
      </div>

      <div className="mb-1">
        <h2 className="font-display text-[19px] font-bold leading-tight text-ink">{exercise.name}</h2>
        <p className="mt-0.5 text-[12px] text-faint">{exercise.nameEn}</p>
      </div>

      <div className="mb-5 mt-3 flex flex-wrap gap-2">
        <Tag Icon={Target}>{exercise.muscle}</Tag>
        <Tag Icon={Dumbbell}>{EQUIPMENT_LABELS[exercise.equipment] || exercise.equipment}</Tag>
      </div>

      <section className="mb-5">
        <div className="mb-2.5 flex items-center gap-2">
          <ListChecks size={14} className="text-neon" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">{t("workout.howTo")}</h3>
        </div>
        <ol className="flex flex-col gap-2">
          {exercise.steps.map((s, i) => (
            <li key={i} className="flex gap-3 rounded-2xl border border-borderSoft bg-surface px-3.5 py-3">
              <span className="tabular grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-neon/15 text-[11px] font-bold text-neon">
                {i + 1}
              </span>
              <span className="text-[13px] leading-relaxed text-ink">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <div className="mb-2.5 flex items-center gap-2">
          <AlertTriangle size={14} className="text-amber" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">{t("workout.mistakes")}</h3>
        </div>
        <div className="rounded-2xl border border-amber/20 bg-amber/[0.07] px-4 py-3">
          <ul className="flex flex-col gap-2">
            {exercise.mistakes.map((m, i) => (
              <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-amber">
                <span className="shrink-0">✕</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </Screen>
  );
}
