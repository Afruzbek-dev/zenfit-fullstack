# ZenFit AI Personal Trainer (Smart Workout Generator) Specification

## Overview
ZenFit AI Personal Trainer is a smart, hybrid workout generation engine integrated into the ZenFit Telegram Mini App. It creates safe, realistic, and personalized weekly workout plans tailored to the user's demographic profile (gender, age, height, weight), experience level, goal, workout frequency, available equipment, session duration, and physical injuries.

The engine uses a **Smart Hybrid Approach**:
1. **Client-side Math & Rule Engine**: Instantly (0ms delay) calculates 100% accurate split selection, rep/rest rules, injury replacements, and bodyweight-percentage (%BW) initial starting weights (kg) rounded to standard 2.5kg plates.
2. **Workout History Auto-Progression**: Automatically analyzes `workout_logs` and increments compound exercises (+2.5-5kg) or isolation exercises (+1-2kg) when top rep bounds are achieved.
3. **Backend AI Enhancer API**: Optional endpoint (`POST /api/ai/workout-plan`) providing LLM-driven exercise variation tips and personal advice.

---

## 1. Algorithmic Rules & Weight Engine

### 1.1 Split Selection Rule
- **2-3 Days/Week**: Full Body split (Full Body A, B, C). Exercises across different days must rotate so identical movement variations are never repeated twice.
- **4 Days/Week**: Upper / Lower split (Upper A, Lower A, Upper B, Lower B).
- **5-6 Days/Week**: Push / Pull / Legs split.

### 1.2 Set & Rep Guidelines
- **Sets**:
  - Beginner: 3 sets
  - Intermediate / Advanced: 4 sets for primary compound movements, 3 sets for accessories.
- **Goal Mapping**:
  - `lose` (Weight Loss): 12-15 reps, 45-60s rest between sets.
  - `maintain` (Maintenance): 8-12 reps, 60-90s rest between sets.
  - `gain` (Muscle Mass): 6-10 reps (compound), 8-12 reps (isolation), 90-120s rest between sets.

### 1.3 Weight Recommendation Logic (%BW & RPE)
For first-session compound barbell lifts, starting weight is calculated at **~80% of estimated baseline %BW** (for safety) and rounded to the nearest 2.5 kg:

| Movement | Beginner (%BW) | Intermediate (%BW) | Advanced (%BW) |
| :--- | :--- | :--- | :--- |
| **Barbell Back Squat** | 0.40 × BW | 0.60 × BW | 0.80 × BW |
| **Barbell Deadlift** | 0.60 × BW | 0.80 × BW | 1.10 × BW |
| **Barbell Bench Press** | 0.32 × BW | 0.48 × BW | 0.72 × BW |
| **Overhead Press** | 0.20 × BW | 0.32 × BW | 0.44 × BW |
| **Barbell Row** | 0.32 × BW | 0.44 × BW | 0.60 × BW |

- **Dumbbell Compound Lifts**: ~40% of the barbell baseline divided per hand (rounded to nearest 2kg).
- **Isolation / Machine Lifts**: Set `weightType: "rpe_guided"`, `suggestedWeightKg: null`, and note `"Yengil vazndan boshlang, oxirgi 2-3 takror qiyin lekin bajarilishi mumkin bo'lsin"`.
- **Bodyweight Lifts**: Set `weightType: "bodyweight"`, `suggestedWeightKg: null`.

### 1.4 Workout History Auto-Progression (Rule #4e)
If previous session logs exist in `workout_logs`:
- If top reps were completed across all sets in the last session:
  - Compound exercise: **+2.5 kg to +5.0 kg**
  - Isolation exercise: **+1.0 kg to +2.0 kg**
- Otherwise: Maintain previous weight.

### 1.5 Injury & Safety Filtering
- **Knee Injury (`tizza`)**: Replaces Squats/Lunges with `Glute bridge (yengil, tizzasiz)` + warning note.
- **Lower Back Injury (`bel`)**: Replaces Barbell Deadlift/Bent Rows with `Machine-assisted hip hinge / Seated row`.
- **Shoulder Injury (`yelka`)**: Replaces Overhead Press with `Light DB lateral raise`.
- Includes mandatory safety note: *"Og'riq sezsangiz, mashqni to'xtating va shifokorga murojaat qiling."*

---

## 2. Component Architecture & Integration Points

### 2.1 New Components
- `frontend/src/components/AIWorkoutGeneratorModal.jsx`: 6-step interactive questionnaire modal (Goal, Level, Days, Equipment, Duration, Injuries) with instant plan generation.
- `frontend/src/components/AIPlanView.jsx`: Active AI Plan card view displaying weekly schedule, calculated starting weights (kg), sets, reps, and RPE notes.
- `frontend/src/utils/aiTrainerEngine.js`: Core math and rule engine implementing %BW, split logic, rep rules, and injury substitution.

### 2.2 Integration Sites
1. **Onboarding (`Onboarding.jsx`)**: Adds Step 6 for AI Workout Setup upon completing initial profile creation.
2. **Workouts Screen (`WorkoutsScreen.jsx`)**: Embeds "🤖 AI Shaxsiy Trener Dasturingiz" section with active plan view and "🔄 Rejani Qayta Tuzish" trigger.
3. **Workout Session (`WorkoutSession.jsx`)**: Pre-fills the exercise session form with AI calculated starting weights (kg).

---

## 3. Data Persistence
- Client state saved to `localStorage` under key `zenfit_ai_workout_plan`.
- Synced to backend profile table column `active_ai_plan_json`.
