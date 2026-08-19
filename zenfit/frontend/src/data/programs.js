/**
 * Pre-made trainer programs, offered as an alternative to the AI plan.
 *
 * `image` points at a file under `public/programs/` (plain static path, not an
 * ES import, so a not-yet-delivered photo 404s at runtime instead of failing
 * the build) — ProgramCard in WorkoutsScreen.jsx falls back to a gradient
 * tile on load error, so this is safe to reference before the file exists.
 */
export const PROGRAMS = [
  {
    id: "strength-basics", title: "Kuch asoslari", emoji: "🔥", trainer: "Botir Yusupov",
    trainerTitle: "Sertifikatlangan kuch treneri (IFBB)", image: "/programs/strength-basics.jpg",
    level: "beginner", days: 3, equipment: "gym", goal: "maintain", weeks: 4,
    desc: "Bazaviy harakatlar bilan kuch poydevorini qurish. Yangi boshlovchilar uchun eng xavfsiz start.",
  },
  {
    id: "mass-gain", title: "Massa yig'ish", emoji: "💪", trainer: "Sardor Aliyev",
    trainerTitle: "Bodybuilding murabbiyi", image: "/programs/mass-gain.jpg",
    level: "intermediate", days: 4, equipment: "gym", goal: "gain", weeks: 8,
    desc: "Upper/Lower split bilan mushak massasini oshirish. Kamida 1 yil tajriba talab qiladi.",
  },
  {
    id: "home-workout", title: "Uy mashqlari", emoji: "🏠", trainer: "Malika Nazarova",
    trainerTitle: "Fitnes va funksional trening murabbiyi", image: "/programs/home-workout.jpg",
    level: "beginner", days: 3, equipment: "home-none", goal: "lose", weeks: 6,
    desc: "Hech qanday jihozsiz, uyda bajariladigan to'liq tana dasturi.",
  },
  {
    id: "core-intensive", title: "Qorin pressi intensiv", emoji: "🧘", trainer: "Jasur Tojiboyev",
    trainerTitle: "Funksional trening mutaxassisi", image: "/programs/core-intensive.jpg",
    level: "intermediate", days: 5, equipment: "home-none", goal: "maintain", weeks: 4,
    desc: "Qorin va tana markazini mustahkamlashga yo'naltirilgan intensiv dastur.",
  },
  {
    id: "cardio-prep", title: "Yugurish tayyorgarligi", emoji: "🏃", trainer: "Dilnoza Karimova",
    trainerTitle: "Yengil atletika murabbiyi", image: "/programs/cardio-prep.jpg",
    level: "intermediate", days: 4, equipment: "outdoor", goal: "lose", weeks: 6,
    desc: "Chidamlilikni oshirish va birinchi 5 km masofaga tayyorlanish.",
  },
];

export const PROGRAM_BY_ID = Object.fromEntries(PROGRAMS.map((p) => [p.id, p]));

/** Scores how well a pre-made program fits the questionnaire answers. */
export function scoreProgram(p, a) {
  let score = 0;
  if (p.equipment === a.equipment) score += 3;
  else if (
    (p.equipment === "home-none" && a.equipment === "home-dumbbell") ||
    (p.equipment === "home-dumbbell" && a.equipment === "home-none")
  ) score += 1.5;
  if (p.level === a.level) score += 2;
  const dayDiff = Math.abs(p.days - (a.daysPerWeek || 3));
  score += dayDiff === 0 ? 2 : dayDiff === 1 ? 1 : 0;
  if (p.goal === a.goal) score += 1.5;
  return score;
}

export function bestProgram(answers) {
  // Only ever suggest a program that shares the user's goal — recommending a
  // mass-gain plan to someone trying to lose weight reads as a bug, however
  // well it scores on equipment and schedule.
  const candidates = PROGRAMS.filter((p) => p.goal === answers.goal);
  if (!candidates.length) return null;

  const scored = candidates
    .map((p) => ({ p, score: scoreProgram(p, answers) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  return best.score >= 5 ? { ...best, matchPercent: Math.round((best.score / 8.5) * 100) } : null;
}
