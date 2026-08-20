import { useState } from "react";

/**
 * A square photo card for a ready-made programme.
 *
 * Shared by the workout programmes (WorkoutsLibraryScreen) and the diet
 * presets (RecipesScreen) so the two "pick a ready-made plan" surfaces read as
 * the same thing. Falls back to a gradient + emoji tile whenever no photo is
 * set or the file 404s, which is the normal state for the diet presets today.
 */
export default function ProgramCard({ image, emoji, title, meta, onClick }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = image && !imgFailed;

  return (
    <button
      onClick={onClick}
      className="flex w-[168px] shrink-0 flex-col overflow-hidden rounded-2xl border border-borderSoft bg-surface text-left active:scale-[0.98]"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-surfaceAlt">
        {showImage ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neon/20 via-surfaceAlt to-surfaceAlt">
            <span className="text-5xl">{emoji}</span>
          </div>
        )}
      </div>
      <div className="px-3 py-2.5">
        <p className="truncate text-[13px] font-bold text-ink">{title}</p>
        {meta && <p className="mt-0.5 truncate text-[11px] text-muted">{meta}</p>}
      </div>
    </button>
  );
}
