/* -------------------------------------------------------------------------- */
/* HYPERV2 / CONFIG                              */
/* -------------------------------------------------------------------------- */

/**
 * FOCUS: Defines all valid muscle groups and session types.
 * Add to this list if you expand your physical training categories.
 */
export type Focus =
  | "Chest"
  | "Back"
  | "Legs"
  | "Shoulders"
  | "Biceps"
  | "Triceps"
  | "Glutes"
  | "Core"
  | "Cardio"
  | "HIIT"
  | "Full Body"
  | "Calves"
  | "Forearms"
  | "Quads"
  | "Thighs";

/**
 * EXERCISE TYPE: Used by the Engine to filter based on user preferences 
 * (e.g., Weights Only vs Cardio Only).
 */
export type ExerciseType = "compound" | "isolation" | "cardio";

/**
 * EXERCISE SCHEMA: Matches your Supabase 'exercises' table structure.
 */
export type Exercise = {
  id: string;
  name: string;
  muscle: Focus;
  type: ExerciseType;
  sets: number;
  reps: string;
  weight?: number;
};

/**
 * UI PILL OPTIONS: These define the horizontal scroll categories 
 * in your Workout Builder.
 */
export const FOCUS_OPTIONS: Focus[] = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Forearms",
  "Triceps",
  "Core",
  "Legs",
  "Glutes",
  "Quads",
  "Thighs",
  "Calves",
  "Cardio",
  "HIIT",
  "Full Body",
];

// NOTE: EXERCISE_POOL has been migrated to Supabase.
// Use supabase.from("exercises").select("*") to fetch fuel for the engine.