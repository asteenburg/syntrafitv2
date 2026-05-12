import { exercises } from "../../data/exercises";
import { supabase } from "../supabase";

/**
 * ─────────────────────────────
 * TYPES (IMPORT-FREE SAFE USAGE)
 * ─────────────────────────────
 * We DO NOT redeclare Exercise/Muscle to avoid TS conflicts.
 * We infer from data source instead.
 */

type Goal = "Strength" | "Hypertrophy" | "Fat Loss";

type Input = {
  userId: string;
  goal: Goal;
  duration: number;
  focus: string[];
  equipment: string;
};

/**
 * ─────────────────────────────
 * SIMPLE MEMORY (IN-MEMORY CACHE)
 * ─────────────────────────────
 */

const muscleFatigue: Record<string, number> = {};

/**
 * decay system (Fitbod-style recovery)
 */
function decayMemory() {
  Object.keys(muscleFatigue).forEach((m) => {
    muscleFatigue[m] = Math.max(0, muscleFatigue[m] - 0.05);
  });
}

function increaseFatigue(muscle: string) {
  muscleFatigue[muscle] = Math.min(
    1,
    (muscleFatigue[muscle] || 0) + 0.25
  );
}

function getFatigue(muscle: string) {
  return muscleFatigue[muscle] || 0;
}

/**
 * ─────────────────────────────
 * HISTORY (OPTIONAL SUPABASE MEMORY)
 * ─────────────────────────────
 */

async function getHistory(userId: string) {
  const { data } = await supabase
    .from("workout_logs")
    .select("exercise, muscle, weight, reps")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return data || [];
}

/**
 * ─────────────────────────────
 * SCORING ENGINE (CORE AI LOGIC)
 * ─────────────────────────────
 */

function scoreExercise(ex: any, goal: Goal) {
  let score = 10;

  const fatigue = getFatigue(ex.muscle);

  // fatigue penalty (MOST IMPORTANT SIGNAL)
  score -= fatigue * 6;

  // goal alignment
  if (goal === "Strength" && ex.type === "compound") score += 4;
  if (goal === "Hypertrophy" && ex.type === "isolation") score += 3;
  if (goal === "Fat Loss" && ex.type === "cardio") score += 5;

  // diversity boost
  score += Math.random() * 1.2;

  return score;
}

/**
 * ─────────────────────────────
 * MAIN V5 ENGINE
 * ─────────────────────────────
 */

export async function generateV5Workout(input: Input) {
  decayMemory();

  const pool = exercises.filter((ex: any) => {
    return (
      input.focus.includes(ex.muscle) &&
      (input.equipment === "Any" ||
        ex.equipment === input.equipment ||
        !ex.equipment)
    );
  });

  const ranked = pool
    .map((ex: any) => ({
      ...ex,
      score: scoreExercise(ex, input.goal),
    }))
    .sort((a, b) => b.score - a.score);

  /**
   * ─────────────────────────────
   * VOLUME SYSTEM (FIXED 6–12 RULE)
   * ─────────────────────────────
   */

  let target =
    input.duration <= 20 ? 6 :
    input.duration <= 40 ? 9 : 12;

  target = Math.max(6, Math.min(12, target));

  const selected: any[] = [];
  const muscleCount: Record<string, number> = {};

  for (const ex of ranked) {
    if (selected.length >= target) break;

    const fatigue = getFatigue(ex.muscle);

    // soft constraint (NOT blocking — important fix)
    const penalty = muscleCount[ex.muscle] ? 2 : 0;

    const finalScore = ex.score - penalty - fatigue * 3;

    if (finalScore < 4) continue;

    selected.push(ex);
    muscleCount[ex.muscle] = (muscleCount[ex.muscle] || 0) + 1;
  }

  /**
   * fallback fill (ensures 6–12 ALWAYS)
   */
  while (selected.length < target) {
    const ex = ranked.find(
      (e: any) => !selected.includes(e)
    );
    if (!ex) break;
    selected.push(ex);
  }

  /**
   * ─────────────────────────────
   * UPDATE MEMORY (ADAPTATION LOOP)
   * ─────────────────────────────
   */

  selected.forEach((ex: any) => {
    increaseFatigue(ex.muscle);
  });

  /**
   * ─────────────────────────────
   * WRITE TO DATABASE (REAL MEMORY)
   * ─────────────────────────────
   */

  await supabase.from("workout_logs").insert(
    selected.map((ex: any) => ({
      user_id: input.userId,
      exercise: ex.name,
      muscle: ex.muscle,
      weight: 0,
      reps: 0,
      created_at: new Date().toISOString(),
    }))
  );

  /**
   * ─────────────────────────────
   * RESPONSE
   * ─────────────────────────────
   */

  return {
    title: `${input.focus.join(", ")} Adaptive Session`,
    goal: input.goal,
    duration: input.duration,
    exercises: selected,
  };
}