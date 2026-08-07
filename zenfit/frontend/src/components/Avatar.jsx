import { useRef, useState } from "react";
import { Camera, User2, Loader2 } from "lucide-react";
import { toSquareDataUrl } from "../lib/image.js";
import { haptic } from "../telegram.js";
import { useApp } from "../store.jsx";

/**
 * Profile picture with an optional edit affordance.
 *
 * Telegram supplies a photo_url for most accounts, which seeds this; picking a
 * file replaces it with a locally-downscaled data URI.
 */
export default function Avatar({ size = 104, editable = false, onChanged }) {
  const { user, updateProfile, showToast, t } = useApp();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const src = user?.avatarUrl || null;

  async function pick(e) {
    const file = e.target.files?.[0];
    // Reset immediately so choosing the same file twice still fires onChange.
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    try {
      const dataUrl = await toSquareDataUrl(file);
      await updateProfile({ avatarUrl: dataUrl });
      haptic("success");
      showToast(t("common.saved"), "success");
      onChanged?.();
    } catch (err) {
      showToast(err.message || t("common.error"), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-surfaceAlt ring-2 ring-neon/25"
        style={{ width: size, height: size }}
      >
        {src ? (
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <User2 size={size * 0.4} className="text-faint" />
        )}
      </div>

      {editable && (
        <>
          <button
            onClick={() => {
              haptic("light");
              inputRef.current?.click();
            }}
            disabled={busy}
            aria-label={t("profile.changePhoto")}
            className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full border-2 border-bg bg-neon active:scale-95 disabled:opacity-60"
          >
            {busy ? (
              <Loader2 size={15} className="animate-spin text-neonOn" />
            ) : (
              <Camera size={15} className="text-neonOn" />
            )}
          </button>
          <input ref={inputRef} type="file" accept="image/*" onChange={pick} className="hidden" />
        </>
      )}
    </div>
  );
}
