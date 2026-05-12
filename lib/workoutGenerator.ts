import { exercises as EXERCISE_DB } from "../data/exercises";
import { Exercise } from "../types/workout";

type Goal = "Strength" | "Fat Loss" | "Hypertrophy";

type GenerateInput = {
  goal: Goal;
  duration: number;
  focus: string[]; // allows multi-muscle selection
  equipment?: string;
};

/**
 * ─────────────────────────────
 * 1. RECOVERY SIMULATION (simple but effective)
 * ─────────────────────────────
 */
function recoveryPenalty(muscleFrequency: number) {
  if (muscleFrequency >= 3) return 4;
  if (muscleFrequency === 2) return 2;
  return 0;
}

/**
 * ─────────────────────────────
 * 2. SCORE ENGINE (core AI logic)
 * ─────────────────────────────
 */
function scoreExercise(ex: Exercise, goal: Goal, muscleLoad: Record<string, number>) {
  let score = 10;

  // fatigue penalty
  score -= recoveryPenalty(muscleLoad[ex.muscle] || 0);

  // type logic
  if (goal === "Strength" && ex.type === "compound") score += 4;
  if (goal === "Hypertrophy" && ex.type === "isolation") score += 3;
  if (goal === "Fat Loss" && ex.type === "cardio") score += 5;

  // general structure bonus
  if (ex.type === "compound") score += 2;

  // randomness (controlled variability)
  score += Math.random() * 1.5;

  return score;
}

/**
 * ─────────────────────────────
 * 3. MAIN V5 ENGINE
 * ─────────────────────────────
 */
export function generateWorkoutV5(input: GenerateInput) {
  const { goal, duration, focus, equipment } = input;

  /**
   * STEP 1 — FILTER POOL
   */
  let pool = EXERCISE_DB.filter((ex) => {
    const matchesMuscle = focus.length === 0 || focus.includes(ex.muscle);
    const matchesEquipment =
      !equipment || equipment === "Any" || ex.equipment === equipment;

    return matchesMuscle && matchesEquipment;
  });

  /**
   * STEP 2 — MUSCLE FREQUENCY TRACKING
   */
  const muscleLoad: Record<string, number> = {};

  /**
   * STEP 3 — SCORE EVERYTHING
   */
  const scored = pool
    .map((ex) => {
      const s = scoreExercise(ex, goal, muscleLoad);
      return { ...ex, score: s };
    })
    .sort((a, b) => b.score - a.score);

  /**
   * STEP 4 — TARGET SIZE (STRICT 8–12)
   */
  let target =
    duration <= 20 ? 8 :
    duration <= 40 ? 10 :
    12;

  target = Math.max(8, Math.min(12, target));

  /**
   * STEP 5 — BUILD WORKOUT (DIVERSITY CONTROL)
   */
  const selected: Exercise[] = [];
  const usedMuscles = new Set<string>();

  for (const ex of scored) {
    if (selected.length >= target) break;

    const muscle = ex.muscle;

    // soft diversity rule (prevents spam)
    const muscleCount = muscleLoad[muscle] || 0;
    if (muscleCount >= 2 && usedMuscles.has(muscle)) continue;

    selected.push(ex);

    muscleLoad[muscle] = (muscleLoad[muscle] || 0) + 1;
    usedMuscles.add(muscle);
  }

  /**
   * STEP 6 — BACKFILL IF UNDER TARGET
   */
  while (selected.length < target) {
    const fallback = scored.find(
      (ex) => !selected.find((s) => s.name === ex.name)
    );

    if (!fallback) break;
    selected.push(fallback);
  }

  /**
   * STEP 7 — OUTPUT FORMAT
   */
  return {
    title: `V5 Adaptive ${focus.join(", ") || "Full Body"}`,
    goal,
    duration,
    version: "v5",
    exercises: selected.slice(0, target).map((ex) => ({
      name: ex.name,
      muscle: ex.muscle,
      type: ex.type,
      sets:
        goal === "Strength" ? 4 :
        goal === "Hypertrophy" ? 3 : 2,
      reps:
        goal === "Strength"
          ? "4-6"
          : goal === "Hypertrophy"
          ? "8-12"
          : "12-15",
    })),
  };
}