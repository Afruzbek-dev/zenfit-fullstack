import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Check, Loader2, X } from "lucide-react";
import { Button } from "./ui.jsx";
import { haptic } from "../telegram.js";
import { useApp } from "../store.jsx";
import { loadPoseLandmarker, POSE_CONNECTIONS } from "../lib/poseTracker.js";
import { createSquatCounter } from "../lib/squatCounter.js";

const FEEDBACK_TEXT_TONE = { neon: "text-neon", amber: "text-amber", rose: "text-rose" };
const FEEDBACK_TONE = { depthGood: "neon", depthShallow: "amber", kneeCave: "rose" };

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/** Draws the tracked joints directly onto the video's own pixel space — see the `canvas.width` sync in the loop below for why that keeps it aligned under `object-cover`. */
function drawSkeleton(ctx, canvas, landmarks, colorRgb) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!landmarks) return;
  const w = canvas.width;
  const h = canvas.height;

  ctx.strokeStyle = `rgb(${colorRgb})`;
  ctx.lineWidth = Math.max(2, w * 0.006);
  ctx.lineCap = "round";
  for (const [a, b] of POSE_CONNECTIONS) {
    const pa = landmarks[a];
    const pb = landmarks[b];
    if (!pa || !pb || (pa.visibility ?? 1) < 0.4 || (pb.visibility ?? 1) < 0.4) continue;
    ctx.beginPath();
    ctx.moveTo(pa.x * w, pa.y * h);
    ctx.lineTo(pb.x * w, pb.y * h);
    ctx.stroke();
  }

  ctx.fillStyle = `rgb(${colorRgb})`;
  const drawnJoints = new Set();
  for (const pair of POSE_CONNECTIONS) {
    for (const idx of pair) {
      if (drawnJoints.has(idx)) continue;
      drawnJoints.add(idx);
      const p = landmarks[idx];
      if (!p || (p.visibility ?? 1) < 0.4) continue;
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, Math.max(3, w * 0.008), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/**
 * Full-screen live squat tracker. Same getUserMedia approach as ScanScreen's
 * CameraView, but front-facing and continuous instead of a single shot: pose
 * estimation runs entirely on-device (see lib/poseTracker.js), so no video
 * frame ever leaves the phone.
 *
 * The rep count and depth/knee feedback are a geometric approximation, not a
 * verdict — `workout.cam.experimental` says so on screen the whole time
 * tracking is live, and the caller only ever gets a starting number the
 * lifter can still edit.
 */
export default function SquatCameraTracker({ onFinish, onClose }) {
  const { t } = useApp();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const counterRef = useRef(null);
  if (!counterRef.current) counterRef.current = createSquatCounter();
  const rafRef = useRef(null);
  const feedbackTimerRef = useRef(null);
  const cancelledRef = useRef(false);
  const neonColorRef = useRef("204 255 0");

  const repsRef = useRef(0);
  const totalsRef = useRef({ good: 0, shallow: 0 });
  const trackingRef = useRef(false);

  const [stage, setStage] = useState("starting"); // starting | tracking | camera-error | model-error
  const [reps, setReps] = useState(0);
  const [tracking, setTracking] = useState(false);
  const [feedback, setFeedback] = useState(null); // { text, tone }

  const showFeedback = useCallback(
    (key) => {
      clearTimeout(feedbackTimerRef.current);
      setFeedback({ text: t(`workout.cam.${key}`), tone: FEEDBACK_TONE[key] || "neon" });
      feedbackTimerRef.current = setTimeout(() => setFeedback(null), 2500);
    },
    [t]
  );

  useEffect(() => {
    cancelledRef.current = false;
    neonColorRef.current = cssVar("--c-neon", "204 255 0");

    (async () => {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          // Front camera: the lifter needs to see the counter (and themselves)
          // while squatting, which only works propped up facing them.
          video: { facingMode: { ideal: "user" }, width: { ideal: 1280 } },
          audio: false,
        });
      } catch {
        if (!cancelledRef.current) setStage("camera-error");
        return;
      }
      if (cancelledRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      try {
        landmarkerRef.current = await loadPoseLandmarker();
      } catch {
        if (!cancelledRef.current) setStage("model-error");
        return;
      }
      if (cancelledRef.current) return;

      setStage("tracking");

      const loop = () => {
        if (cancelledRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const landmarker = landmarkerRef.current;

        if (video && canvas && landmarker && video.readyState >= 2 && video.videoWidth) {
          // Canvas drawn at the video's own resolution, then scaled by CSS with
          // the same object-cover as the video — that keeps the overlay
          // pixel-aligned without re-deriving the crop math by hand.
          if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          const result = landmarker.detectForVideo(video, performance.now());
          const landmarks = result.landmarks?.[0] ?? null;
          const state = counterRef.current.update(landmarks);

          const ctx = canvas.getContext("2d");
          if (ctx) drawSkeleton(ctx, canvas, landmarks, neonColorRef.current);

          if (state.reps !== repsRef.current) {
            repsRef.current = state.reps;
            setReps(state.reps);
          }
          totalsRef.current = { good: state.good, shallow: state.shallow };
          if (state.tracking !== trackingRef.current) {
            trackingRef.current = state.tracking;
            setTracking(state.tracking);
          }
          if (state.repJustCompleted) {
            haptic("success");
            showFeedback(state.feedback);
          }
        }
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    })();

    return () => {
      cancelledRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(feedbackTimerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      landmarkerRef.current?.close?.();
      landmarkerRef.current = null;
    };
  }, [showFeedback]);

  function finish() {
    onFinish?.({ reps: repsRef.current, ...totalsRef.current });
  }

  if (stage === "camera-error" || stage === "model-error") {
    return createPortal(
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-black px-8 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-rose/15">
          <Camera size={26} className="text-rose" />
        </span>
        <p className="text-[14px] leading-relaxed text-white/80">
          {t(stage === "camera-error" ? "workout.cam.cameraFailed" : "workout.cam.modelFailed")}
        </p>
        <Button onClick={onClose}>{t("common.close")}</Button>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col bg-black">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-0" style={{ transform: "scaleX(-1)" }}>
          <video ref={videoRef} playsInline muted autoPlay className="absolute inset-0 h-full w-full object-cover" />
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />
        </div>

        {stage === "starting" && (
          <div className="absolute inset-0 grid place-items-center bg-black/60">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={26} className="animate-spin text-neon" />
              <p className="text-[13px] font-semibold text-white/80">{t("workout.cam.loadingModel")}</p>
            </div>
          </div>
        )}

        {stage === "tracking" && (
          <div
            className="absolute inset-x-0 flex flex-col items-center gap-0.5"
            style={{ top: "calc(var(--safe-top, 0px) + 20px)" }}
          >
            <p className="tabular text-[56px] font-bold leading-none text-white drop-shadow-lg">{reps}</p>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">{t("workout.reps")}</p>
          </div>
        )}
      </div>

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
        <p
          className={`min-h-[16px] text-center text-[12px] font-semibold leading-relaxed ${
            feedback ? FEEDBACK_TEXT_TONE[feedback.tone] : "text-white/60"
          }`}
        >
          {feedback ? feedback.text : !tracking ? t("workout.cam.positionHint") : t("workout.cam.experimental")}
        </p>
        <Button full size="lg" disabled={stage !== "tracking"} onClick={finish}>
          <Check size={17} /> {t("workout.cam.finish")}
        </Button>
      </div>
    </div>,
    document.body
  );
}
