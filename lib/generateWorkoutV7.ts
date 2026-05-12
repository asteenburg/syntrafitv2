import { Goal, Muscle } from "@/types/workout";
import { supabase } from "./supabase";

export interface Input {
  userId: string;
  focus: Muscle[];
  goal: Goal;
  level: string;
  duration: number;
  equipment: string;
  history?: any[];
}

/**
 * REFINED DEDUPLICATION
 * Allows variety (Incline, Hammer, Cable) while blocking exact duplicates.
 */
function getCanonicalKey(ex: any): string {
  const name = (ex.name || "").toLowerCase();
  const equip = (ex.equipment || "").toLowerCase();

  // 1. Identify Variation/Angle
  let variation = "standard";
  if (name.includes("incline")) variation = "incline";
  if (name.includes("decline")) variation = "decline";
  if (name.includes("hammer")) variation = "hammer";
  if (name.includes("preacher")) variation = "preacher";
  if (name.includes("reverse")) variation = "reverse";
  if (name.includes("supnated")) variation = "supnated";
  if (name.includes("concentration")) variation = "concentration";

  // 2. Identify Core Movement
  let movement = "other";
  if (name.includes("curl")) movement = "curl";
  else if (name.includes("bench")) movement = "bench_press";
  else if (name.includes("press")) movement = "press";
  else if (name.includes("squat")) movement = "squat";
  else if (name.includes("row")) movement = "row";
  else if (name.includes("extension")) movement = "extension";
  else if (name.includes("fly")) movement = "fly";
  else movement = name.replace(/\s+/g, "_");

  // Key format: "dumbbell_incline_curl" or "barbell_standard_curl"
  return `${equip}_${variation}_${movement}`;
}

export async function generateWorkoutV7(input: Input) {
  const {
    goal,
    duration,
    focus,
    equipment,
    level = "Intermediate",
    history = [],
  } = input;

  const EDGE_FUNCTION_URL =
    "https://sjyrpkctldydggcimsds.supabase.co/functions/v1/hyper-ai";

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;

  /**
   * 1. SMART FETCH (Home Gym Mapping)
   */
  let query = supabase.from("exercises").select("*");

  // 1a. Muscle Focus
  if (focus && focus.length > 0 && !focus.includes("Full Body")) {
    query = query.in("muscle", focus);
  }

  // 1b. Equipment Mapping
  const baseEquipment = ["Bodyweight", "Any"];

  if (equipment === "Home Gym") {
    // Home Gym: Pull everything that isn't a fixed machine
    query = query
      .in("equipment", [...baseEquipment, "Gym", "Dumbbell"])
      .eq("is_machine", false);
  } else if (equipment === "Gym") {
    // Commercial Gym: Pull everything including machines
    query = query.in("equipment", [...baseEquipment, "Gym", "Dumbbell"]);
  } else if (equipment === "Dumbbell") {
    // Pure Dumbbell: No Barbell/Gym equipment
    query = query
      .in("equipment", [...baseEquipment, "Dumbbell"])
      .eq("is_machine", false);
  } else {
    query = query.eq("equipment", equipment);
  }

  const { data: dbExercises, error } = await query.limit(100);

  if (error || !dbExercises?.length) {
    throw new Error(
      `No exercises found for ${focus} using ${equipment} equipment.`
    );
  }

  /**
   * =========================
   * 2. CALL AI ENGINE
   * =========================
   */
  let aiWorkout;

  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        exercises: dbExercises,
        history,
        goal,
        level,
        focus,
      }),
    });

    if (!response.ok) throw new Error("AI failed");
    aiWorkout = await response.json();
  } catch (e) {
    console.warn("AI Engine failed or timed out → Fallback to Local Shuffle");
    aiWorkout = { exercises: dbExercises };
  }

  /**
   * =========================
   * 3. SMART DEDUPE
   * =========================
   */
  const map = new Map<string, any>();

  for (const ex of aiWorkout.exercises) {
    const key = getCanonicalKey(ex);

    if (!map.has(key)) {
      map.set(key, {
        ...ex,
        canonical: key,
      });
    }
  }

  const deduped = Array.from(map.values());

  /**
   * =========================
   * 4. DYNAMIC SELECTION
   * =========================
   */
  // If we have fewer unique exercises than the target, use what we have.
  const idealCount = duration <= 30 ? 6 : 8;
  const targetCount = Math.min(deduped.length, idealCount);

  const selected = deduped
    .sort(() => Math.random() - 0.5)
    .slice(0, targetCount);

  const formatted = selected.map((ex, i) => {
    return {
      id: `${ex.id ?? i}-${ex.name.replace(/\s+/g, "_")}`,
      name: ex.name,
      muscle: ex.muscle,
      sets: ex.sets ?? 3,
      reps:
        typeof ex.reps === "string"
          ? parseInt(ex.reps.split("-")[0], 10)
          : ex.reps ?? 10,
      weight: ex.weight ?? 0,
      type: ex.type ?? "Accessory",
      difficulty: ex.difficulty ?? 5,
      notes: ex.notes ?? "",
      canonical: ex.canonical,
    };
  });

  return {
    title: `SyntraFit ${level} Session`,
    goal,
    duration,
    level,
    version: "v7-stable-dedupe",
    exercises: formatted,
  };
}
