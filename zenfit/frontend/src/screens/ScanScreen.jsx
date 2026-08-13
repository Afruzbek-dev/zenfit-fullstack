import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, ImageIcon, Sparkles, Type, Check, RotateCcw, Info, Loader2, Crown, X, ThumbsUp, ThumbsDown } from "lucide-react";
import { Screen, ScreenActions, Section, Button, ErrorNote, EmptyState, FitBadge } from "../components/ui.jsx";
import { foodFit } from "../lib/foodFit.js";
import { api } from "../api.js";
import { haptic } from "../telegram.js";
import { useApp } from "../store.jsx";

/**
 * Live camera viewfinder.
 *
 * `<input capture="environment">` is a *hint*, not a guarantee, and Telegram's
 * in-app webview ignores it — tapping "take a photo" opened the gallery
 * instead, which is the bug this replaces. getUserMedia asks for the camera
 * explicitly, so the permission prompt is the real one and the stream is
 * genuinely the rear camera.
 *
 * The file input stays as the fallback for the cases where this cannot work:
 * permission refused, no camera, or an embedded browser without the API.
 */
function CameraView({ onCapture, onClose, onFail }) {
  const { t } = useApp();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          // `ideal` rather than `exact`: a laptop or a phone with only a front
          // camera should still get a picture rather than an OverconstrainedError.
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setReady(true);
      } catch (err) {
        if (!cancelled) onFail(err);
      }
    })();

    return () => {
      cancelled = true;
      // Leaving the track running keeps the camera indicator lit and holds the
      // device against the next open.
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [onFail]);

  function shoot() {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    haptic("medium");

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(new File([blob], "scan.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="min-h-0 w-full flex-1 object-cover"
      />

      <button
        onClick={onClose}
        aria-label={t("common.close")}
        className="absolute right-4 grid h-10 w-10 place-items-center rounded-full bg-black/50 backdrop-blur"
        style={{ top: "calc(var(--safe-top, 0px) + 16px)" }}
      >
        <X size={20} className="text-white" />
      </button>

      <div
        className="flex shrink-0 flex-col items-center gap-3 bg-black px-6 pt-5"
        style={{ paddingBottom: "calc(var(--safe-bottom, 0px) + 24px)" }}
      >
        <p className="text-center text-[12px] leading-relaxed text-white/70">{t("scan.shootHint")}</p>
        <button
          onClick={shoot}
          disabled={!ready}
          aria-label={t("scan.shoot")}
          className="grid h-[72px] w-[72px] place-items-center rounded-full border-[3px] border-white/80 disabled:opacity-40"
        >
          <span className="h-[58px] w-[58px] rounded-full bg-white" />
        </button>
      </div>
    </div>,
    document.body
  );
}

/** Downscales before upload — phone photos are far larger than the model needs. */
async function compressImage(file, maxDim = 1280, quality = 0.82) {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 900_000) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", quality));
    bitmap.close?.();
    return blob ? new File([blob], "scan.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

/**
 * The composition read: what is actually worth knowing about this specific
 * food, not a nutrition-label recitation. Premium-only and absent entirely
 * from a LogMeal-recognised result, so an empty `composition` (or none of it
 * present) simply renders nothing — same optionality as `fitNote`.
 */
function CompositionCard({ composition, t }) {
  const benefits = composition?.benefits?.filter(Boolean) || [];
  const harms = composition?.harms?.filter(Boolean) || [];
  if (!benefits.length && !harms.length) return null;

  return (
    <div className="card px-4 py-3.5">
      <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-faint">{t("scan.compositionTitle")}</p>
      <div className="flex flex-col gap-2">
        {benefits.map((b, i) => (
          <div key={`b${i}`} className="flex items-start gap-2">
            <ThumbsUp size={13} className="mt-0.5 shrink-0 text-neon" />
            <p className="text-[12px] leading-relaxed text-ink">{b}</p>
          </div>
        ))}
        {harms.map((h, i) => (
          <div key={`h${i}`} className="flex items-start gap-2">
            <ThumbsDown size={13} className="mt-0.5 shrink-0 text-amber" />
            <p className="text-[12px] leading-relaxed text-ink">{h}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ScanScreen({ onNavigate }) {
  const { addMeal, showToast, subscription, profile, summary, t } = useApp();
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  const [mode, setMode] = useState("photo"); // photo | text
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [quotaHit, setQuotaHit] = useState(false);
  const [text, setText] = useState("");
  const [freeLeft, setFreeLeft] = useState(null);
  const [portion, setPortion] = useState(1);
  const [cameraOpen, setCameraOpen] = useState(false);

  function reset() {
    setPreview(null);
    setResult(null);
    setError(null);
    setQuotaHit(false);
    setPortion(1);
  }

  /** Everything that produces an image ends up here — camera, gallery, retry. */
  const analyze = useCallback(
    async (file) => {
      reset();
      setPreview(URL.createObjectURL(file));
      setBusy(true);
      try {
        const compressed = await compressImage(file);
        const res = await api.scanImage(compressed);
        setResult(res.result);
        setFreeLeft(res.freeScansLeft);
        haptic("success");
      } catch (err) {
        if (err.status === 402) setQuotaHit(true);
        else setError(err.message || t("scan.scanFailed"));
        haptic("error");
      } finally {
        setBusy(false);
      }
    },
    [t]
  );

  function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allows re-picking the same file
    if (file) analyze(file);
  }

  /**
   * The camera could not be opened — permission refused, no device, or the
   * camera is busy in another app.
   *
   * Falls straight through to the file picker rather than dead-ending on an
   * error: the user asked to photograph their food, and the picker (with
   * `capture` still set) is the next best thing on the platforms where that
   * works.
   *
   * Deliberately does *not* remember the failure. Latching it meant one
   * mis-tapped "deny" sent every later scan to the gallery until the app was
   * restarted — and a refusal is often transient (permission granted in
   * settings afterwards, or another app let go of the camera). A denial
   * rejects almost instantly, so retrying costs a few milliseconds and buys
   * back the camera the moment it becomes available.
   */
  const onCameraFail = useCallback(() => {
    setCameraOpen(false);
    cameraRef.current?.click();
  }, []);

  function openCamera() {
    haptic("light");
    // No getUserMedia at all (old webview, or a non-secure origin) — the file
    // input is the only route.
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraRef.current?.click();
      return;
    }
    setCameraOpen(true);
  }

  async function askText() {
    if (text.trim().length < 2) return;
    reset();
    setBusy(true);
    try {
      const res = await api.askAi(text.trim());
      setResult(res.result);
      haptic("success");
    } catch (err) {
      if (err.status === 402) setQuotaHit(true);
      else setError(err.message || t("scan.aiFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    try {
      await addMeal({
        name: result.name,
        emoji: "🍽️",
        kcal: Math.round((result.kcalPerServing || 0) * portion),
        carbs: Math.round((result.carbs || 0) * portion),
        protein: Math.round((result.protein || 0) * portion),
        fat: Math.round((result.fat || 0) * portion),
        source: mode === "photo" ? "ai_scan" : "ai_ask",
      });
      haptic("success");
      showToast(t("scan.added"), "success");
      reset();
      setText("");
      onNavigate("home");
    } catch (e) {
      showToast(e.message || t("scan.saveFailed"), "error");
    }
  }

  const scaled = result
    ? {
        kcal: Math.round((result.kcalPerServing || 0) * portion),
        carbs: Math.round((result.carbs || 0) * portion),
        protein: Math.round((result.protein || 0) * portion),
        fat: Math.round((result.fat || 0) * portion),
      }
    : null;

  // Scored locally, so it is on screen the moment the result is — and it
  // re-scores as the portion changes. `result.fitNote` is the Premium sentence
  // the scan endpoint adds; free users get the number and the reasons.
  const fit = useMemo(
    () => (scaled ? foodFit(scaled, { profile, summary }) : null),
    [scaled, profile, summary]
  );

  return (
    <Screen topPad>
      <ScreenActions>
        {freeLeft !== null && !subscription?.isPremium && (
          <span className="tabular shrink-0 rounded-full border border-borderSoft bg-surfaceAlt px-2.5 py-1.5 text-[11px] font-semibold text-muted">
            {freeLeft}
          </span>
        )}
      </ScreenActions>

      <div className="mb-5 flex gap-2 rounded-2xl border border-borderSoft bg-surfaceAlt p-1">
        {[
          { id: "photo", label: t("scan.photoMode"), Icon: Camera },
          { id: "text", label: t("scan.textMode"), Icon: Type },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id);
              reset();
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12.5px] font-bold transition-colors ${
              mode === m.id ? "bg-neon text-neonOn" : "text-muted"
            }`}
          >
            <m.Icon size={14} /> {m.label}
          </button>
        ))}
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
      <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

      {mode === "photo" && !preview && !result && (
        <>
          <button
            onClick={openCamera}
            className="card card-lit mb-3 flex w-full flex-col items-center gap-3 px-6 py-10 active:scale-[0.99]"
          >
            <span className="relative grid h-20 w-20 place-items-center">
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-neon/20" />
              <span className="relative grid h-16 w-16 place-items-center rounded-full bg-neon">
                <Camera size={28} className="text-neonOn" />
              </span>
            </span>
            <span className="font-display text-[16px] font-bold text-ink">{t("scan.shoot")}</span>
            <span className="max-w-[240px] text-center text-[12px] leading-relaxed text-muted">
              {t("scan.shootHint")}
            </span>
          </button>

          <Button full variant="ghost" onClick={() => galleryRef.current?.click()}>
            <ImageIcon size={16} /> {t("scan.fromGallery")}
          </Button>

          <Section title={t("scan.tipsTitle")} className="mt-6">
            <div className="card flex flex-col gap-2 px-4 py-3.5">
              {(t("scan.tips") || []).map((tip) => (
                <p key={tip} className="flex gap-2 text-[12px] leading-relaxed text-muted">
                  <Check size={13} className="mt-0.5 shrink-0 text-neon" /> {tip}
                </p>
              ))}
            </div>
          </Section>
        </>
      )}

      {mode === "text" && !result && (
        <>
          <div className="card mb-3 px-4 py-3.5 focus-within:border-neon/50">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              placeholder={t("scan.textPlaceholder")}
              className="w-full resize-none bg-transparent text-[14px] leading-relaxed text-ink outline-none placeholder:text-faint"
            />
          </div>
          <Button full size="lg" loading={busy} disabled={text.trim().length < 2} onClick={askText}>
            <Sparkles size={16} /> {t("scan.askAi")}
          </Button>
        </>
      )}

      {preview && (
        <div className="mb-4 overflow-hidden rounded-xl2 border border-borderSoft">
          <img src={preview} alt={t("scan.scannedMeal")} className="h-52 w-full object-cover" />
        </div>
      )}

      {busy && (
        <div className="card flex flex-col items-center gap-3 px-6 py-8">
          <Loader2 size={26} className="animate-spin text-neon" />
          <p className="font-display text-[14px] font-bold text-ink">{t("scan.analyzing")}</p>
          <p className="text-[12px] text-muted">{t("scan.analyzingHint")}</p>
        </div>
      )}

      {quotaHit && (
        <div className="card card-lit flex flex-col items-center px-6 py-8 text-center">
          <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-amber/15">
            <Crown size={24} className="text-amber" />
          </span>
          <p className="font-display text-[16px] font-bold text-ink">{t("scan.quotaTitle")}</p>
          <p className="mt-1.5 max-w-[260px] text-[12.5px] leading-relaxed text-muted">
            {t("scan.quotaDesc")}
          </p>
          <Button className="mt-4" full onClick={() => onNavigate("profile")}>
            <Crown size={15} /> {t("scan.aboutPremium")}
          </Button>
        </div>
      )}

      {error && !busy && (
        <div className="mb-3">
          <ErrorNote onRetry={mode === "photo" ? openCamera : askText}>{error}</ErrorNote>
        </div>
      )}

      {cameraOpen && (
        <CameraView
          onCapture={(file) => {
            setCameraOpen(false);
            analyze(file);
          }}
          onClose={() => setCameraOpen(false)}
          onFail={onCameraFail}
        />
      )}

      {result && !busy && (
        <div className="animate-fade-up">
          {/* The server decides this — comparing against a translated label
              never matched for ru/en, so those users saw a 0 kcal result card
              instead of the retry prompt. */}
          {result.recognized === false ? (
            <EmptyState
              Icon={Camera}
              title={t("scan.notDetected")}
              desc={t("scan.notDetectedDesc")}
              action={<Button full onClick={reset}><RotateCcw size={15} /> {t("scan.retry")}</Button>}
            />
          ) : (
            <>
              <div className="card card-lit mb-3 px-5 py-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display text-[19px] font-bold leading-tight text-ink">{result.name}</h2>
                    {result.servingDescription && (
                      <p className="mt-0.5 text-[12px] text-muted">{result.servingDescription}</p>
                    )}
                  </div>
                  {Number.isFinite(result.confidence) && (
                    <span className="shrink-0 rounded-lg bg-surfaceAlt px-2 py-1 text-[10.5px] font-bold text-muted">
                      {result.confidence}% {t("scan.confidence")}
                    </span>
                  )}
                </div>

                <p className="tabular text-[38px] font-bold leading-none text-neon">
                  {scaled.kcal}<span className="ml-1 text-[13px] font-semibold text-faint">kcal</span>
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    { l: t("home.carbs"), v: scaled.carbs, c: "text-cyan" },
                    { l: t("home.protein"), v: scaled.protein, c: "text-neon" },
                    { l: t("home.fat"), v: scaled.fat, c: "text-amber" },
                  ].map((m) => (
                    <div key={m.l} className="rounded-xl bg-surfaceAlt px-2.5 py-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-faint">{m.l}</p>
                      <p className={`tabular mt-0.5 text-[16px] font-bold ${m.c}`}>{m.v}<span className="text-[10px] text-faint">g</span></p>
                    </div>
                  ))}
                </div>

                {result.note && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber/10 px-3 py-2.5">
                    <Info size={13} className="mt-0.5 shrink-0 text-amber" />
                    <p className="text-[11.5px] leading-relaxed text-amber">{result.note}</p>
                  </div>
                )}

                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">{t("scan.portion")}</p>
                  <div className="flex gap-2">
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
                </div>
              </div>

              {/* Before the "add to diary" button on purpose — a warning that
                  arrives after logging is only a reprimand. */}
              {fit && (
                <div className="mb-3">
                  <FitBadge fit={fit} aiNote={result.fitNote} />
                </div>
              )}

              {result.composition && (
                <div className="mb-3">
                  <CompositionCard composition={result.composition} t={t} />
                </div>
              )}

              <div className="flex gap-2.5">
                <Button variant="ghost" onClick={reset}><RotateCcw size={15} /></Button>
                <Button full size="lg" onClick={save}><Check size={17} /> {t("scan.addToDiary")}</Button>
              </div>
            </>
          )}
        </div>
      )}
    </Screen>
  );
}
