/**
 * Shared pose-estimation plumbing for camera-based exercise tracking.
 *
 * Loads Google's MediaPipe PoseLandmarker fully on-device (WASM + a small
 * model file, both fetched at runtime rather than bundled — the model alone
 * is several MB and most sessions never open a camera tracker). Nothing here
 * is squat-specific; per-exercise rep logic (e.g. lib/squatCounter.js) reads
 * the landmarks this returns.
 *
 * The wasm build is pinned to the exact installed npm version so the JS API
 * surface and the WASM binary never drift apart.
 */

const PACKAGE_VERSION = "1.0.1";
const WASM_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${PACKAGE_VERSION}/wasm`;
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";

/** BlazePose's 33-point topology — only the names this app actually uses. */
export const LM = {
  leftShoulder: 11, rightShoulder: 12,
  leftElbow: 13, rightElbow: 14,
  leftWrist: 15, rightWrist: 16,
  leftHip: 23, rightHip: 24,
  leftKnee: 25, rightKnee: 26,
  leftAnkle: 27, rightAnkle: 28,
};

/** A light stick-figure, not the full 33-point mesh — plenty to confirm tracking is live. */
export const POSE_CONNECTIONS = [
  [LM.leftShoulder, LM.rightShoulder],
  [LM.leftShoulder, LM.leftHip], [LM.rightShoulder, LM.rightHip],
  [LM.leftHip, LM.rightHip],
  [LM.leftShoulder, LM.leftElbow], [LM.leftElbow, LM.leftWrist],
  [LM.rightShoulder, LM.rightElbow], [LM.rightElbow, LM.rightWrist],
  [LM.leftHip, LM.leftKnee], [LM.leftKnee, LM.leftAnkle],
  [LM.rightHip, LM.rightKnee], [LM.rightKnee, LM.rightAnkle],
];

/** Degrees at `b`, formed by rays b→a and b→c. Null if either ray has ~zero length. */
export function angleDeg(a, b, c) {
  const abx = a.x - b.x, aby = a.y - b.y;
  const cbx = c.x - b.x, cby = c.y - b.y;
  const magA = Math.hypot(abx, aby);
  const magC = Math.hypot(cbx, cby);
  if (magA < 1e-6 || magC < 1e-6) return null;
  const cos = Math.min(1, Math.max(-1, (abx * cbx + aby * cby) / (magA * magC)));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function isVisible(landmarks, index, minVisibility = 0.5) {
  const p = landmarks?.[index];
  return Boolean(p) && (p.visibility ?? 1) >= minVisibility;
}

/**
 * Creates a VIDEO-mode PoseLandmarker. Tries the GPU delegate first — the
 * only realistic way to hold a usable frame rate in a phone webview — and
 * falls back to CPU for the devices/browsers that reject it.
 *
 * The `@mediapipe/tasks-vision` import is dynamic so its cost (bundle size,
 * WASM fetch) is paid only when a camera tracker actually opens.
 */
export async function loadPoseLandmarker({ signal } = {}) {
  const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
  const fileset = await FilesetResolver.forVisionTasks(WASM_BASE);
  if (signal?.aborted) throw new DOMException("aborted", "AbortError");

  const baseOptions = { modelAssetPath: MODEL_URL };
  const common = {
    baseOptions,
    runningMode: "VIDEO",
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  };

  try {
    return await PoseLandmarker.createFromOptions(fileset, { ...common, baseOptions: { ...baseOptions, delegate: "GPU" } });
  } catch {
    if (signal?.aborted) throw new DOMException("aborted", "AbortError");
    return await PoseLandmarker.createFromOptions(fileset, { ...common, baseOptions: { ...baseOptions, delegate: "CPU" } });
  }
}
