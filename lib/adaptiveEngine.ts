import { exercises } from "../data/exercises";
import type { Muscle } from "../types/workout";
import { supabase } from "./supabase";

type Goal = "Strength" | "Fat Loss" | "Hypertrophy";

export type Exercise = {
  name: string;
  muscle: Muscle;
  type: "compound" | "isolation" | "cardio";
  score?: number;
};

type WorkoutInput = {
  userId: string;
  goal: Goal;
  duration: number;
  focus: Muscle[];
  equipment: string;
};

/**
 * 1. MUSCLE RECOVERY MODEL
 */
function getRecoveryPenalty(lastUsedHours: number) {
  if (lastUsedHours < 24) return 5;
  if (lastUsedHours < 48) return 3;
  if (lastUsedHours < 72) return 1;
  return 0;
}

/**
 * 2. FETCH USER HISTORY
 */
async function getHistory(userId: string) {
  const { data } = await supabase
    .from("workout_logs")
    .select("exercise, muscle, weight, reps, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);

  return data || [];
}

/**
 * 3. BUILD MUSCLE MAP
 */
function buildMuscleMap(history: any[]) {
  // Initialize with an empty object cast to your Record type
  const map: Partial<Record<Muscle, number>> = {};

  history.forEach((h) => {
    // Cast the string from the DB to your Muscle type
    const muscle = h.muscle as Muscle;
    const last = new Date(h.created_at).getTime();

    if (!map[muscle] || last > (map[muscle] ?? 0)) {
      map[muscle] = last;
    }
  });

  return map;
}

/**
 * 4. PROGRESSIVE OVERLOAD SCORE
 */
function overloadBonus(history: any[], exercise: string) {
  const logs = history.filter((h) => h.exercise === exercise);
  if (!logs.length) return 0;

  const last = logs[0];
  return last.weight ? Math.min(last.weight * 0.01, 3) : 0;
}

/**
 * 5. NORMALIZE MUSCLE NAMES TO MATCH TYPE
 */
// Define a list of valid muscles (usually matching your Muscle type)
const VALID_MUSCLES: Muscle[] = ["Chest", "Back", "Legs", "Shoulders"];

function normalizeMuscle(m: string): Muscle {
  const normalized = m.toLowerCase().replace(/\s+/g, "_") as Muscle;

  // If the string isn't in our type, default to a fallback or throw an error
  if (!VALID_MUSCLES.includes(normalized)) {
    console.error(`Invalid muscle type found: ${normalized}`);
    return "Chest"; // Or a sensible default
  }

  return normalized;
}

/**
 * 6. MAIN AI ENGINE
 */
export async function generateAdaptiveWorkout({
  userId,
  goal,
  duration,
  focus,
  equipment,
}: WorkoutInput) {
  // 1. Fetch fresh data
  const history = await getHistory(userId);
  const muscleMap = buildMuscleMap(history);

  // 2. Filter the pool correctly
  // We compare lowercase strings to avoid casting mismatches
  const pool = exercises.filter((ex) =>
    focus.some((f) => f.toLowerCase() === ex.muscle.toLowerCase())
  );

  // 3. Score and attach previous performance
  const scored = pool
    .map((ex) => {
      // Use our normalization helper to safely index the muscleMap
      const muscleKey = normalizeMuscle(ex.muscle);
      const lastUsed = muscleMap[muscleKey] || 0;
      const hoursSince = (Date.now() - lastUsed) / (1000 * 60 * 60);

      let score = 10;
      score -= getRecoveryPenalty(hoursSince);

      // Strategic Goal Scoring
      if (ex.type === "compound") score += 3;
      if (ex.type === "isolation" && goal === "Hypertrophy") score += 2;
      if (ex.type === "cardio" && goal === "Fat Loss") score += 4;

      // Progressive Overload Reference
      const userLogs = history.filter((h) => h.exercise === ex.name);
      const prevWeight = userLogs.length > 0 ? userLogs[0].weight : 0;

      score += prevWeight ? Math.min(prevWeight * 0.01, 3) : 0;
      score += Math.random() * 1.5;

      return {
        ...ex,
        score,
        muscle: muscleKey, // Ensure returned object uses valid Muscle type
        previousWeight: prevWeight,
      };
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  // 4. Select based on duration
  const targetCount = duration <= 20 ? 6 : duration <= 40 ? 9 : 12;
  const selected = scored.slice(0, targetCount);

  return {
    title: `${focus.join(" & ")} Adaptive Session`,
    goal,
    duration,
    exercises: selected,
  };
}
