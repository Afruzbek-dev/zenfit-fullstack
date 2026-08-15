import { LM, angleDeg, isVisible } from "./poseTracker.js";

/**
 * Squat rep counter driven by the hip-knee-ankle angle.
 *
 * The three angle thresholds are a rough stand-in for "standing" vs "at
 * least parallel", not a biomechanical measurement — tuned by eye against a
 * handful of test clips, not a lab. Good enough to count reps and flag an
 * obviously shallow or knee-caving one; not a substitute for a coach's eye.
 */
const STAND_ANGLE = 160; // rep completes once the knee opens back up past this
const DESCEND_ANGLE = 140; // below this the rep has visibly started
const GOOD_DEPTH_ANGLE = 100; // must dip at/below this once to count as full depth

function kneeAngle(landmarks) {
  const leftOk = [LM.leftHip, LM.leftKnee, LM.leftAnkle].every((i) => isVisible(landmarks, i));
  const rightOk = [LM.rightHip, LM.rightKnee, LM.rightAnkle].every((i) => isVisible(landmarks, i));
  const left = leftOk ? angleDeg(landmarks[LM.leftHip], landmarks[LM.leftKnee], landmarks[LM.leftAnkle]) : null;
  const right = rightOk ? angleDeg(landmarks[LM.rightHip], landmarks[LM.rightKnee], landmarks[LM.rightAnkle]) : null;
  if (left != null && right != null) return (left + right) / 2;
  return left ?? right;
}

/** Knees noticeably narrower than ankles reads as valgus (knees caving inward). */
function kneesCaving(landmarks) {
  const idx = [LM.leftKnee, LM.rightKnee, LM.leftAnkle, LM.rightAnkle];
  if (!idx.every((i) => isVisible(landmarks, i))) return false;
  const kneeGap = Math.abs(landmarks[LM.leftKnee].x - landmarks[LM.rightKnee].x);
  const ankleGap = Math.abs(landmarks[LM.leftAnkle].x - landmarks[LM.rightAnkle].x);
  return ankleGap > 0.02 && kneeGap < ankleGap * 0.75;
}

const IDLE = { tracking: false, phase: "up", angle: null, repJustCompleted: false, feedback: null };

/**
 * `update(landmarks)` is called once per detected frame (`landmarks` is null
 * on a frame with no confident detection). Returns the running state, plus
 * `repJustCompleted` / `feedback` set on the single frame a rep finishes —
 * "depthGood" | "depthShallow" | "kneeCave" — so the caller can react (haptic,
 * on-screen note) without debouncing the same event itself.
 */
export function createSquatCounter() {
  let phase = "up";
  let reps = 0;
  let good = 0;
  let shallow = 0;
  let minAngleThisRep = Infinity;
  let caveThisRep = false;

  function update(landmarks) {
    if (!landmarks) return { ...IDLE, phase, reps, good, shallow };

    const angle = kneeAngle(landmarks);
    if (angle == null) return { ...IDLE, phase, reps, good, shallow };

    let repJustCompleted = false;
    let feedback = null;

    if (phase === "up" && angle < DESCEND_ANGLE) {
      phase = "down";
      minAngleThisRep = angle;
      caveThisRep = kneesCaving(landmarks);
    } else if (phase === "down") {
      minAngleThisRep = Math.min(minAngleThisRep, angle);
      if (kneesCaving(landmarks)) caveThisRep = true;

      if (angle > STAND_ANGLE) {
        phase = "up";
        reps += 1;
        repJustCompleted = true;
        const deep = minAngleThisRep <= GOOD_DEPTH_ANGLE;
        if (deep) good += 1;
        else shallow += 1;
        feedback = caveThisRep ? "kneeCave" : deep ? "depthGood" : "depthShallow";
        minAngleThisRep = Infinity;
        caveThisRep = false;
      }
    }

    return { tracking: true, phase, reps, good, shallow, angle, repJustCompleted, feedback };
  }

  function reset() {
    phase = "up";
    reps = 0;
    good = 0;
    shallow = 0;
    minAngleThisRep = Infinity;
    caveThisRep = false;
  }

  return { update, reset };
}
