export type Goal = "Strength" | "Fat Loss" | "Hypertrophy";

export type Muscle =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Biceps"
  | "Forearms"
  | "Triceps"
  | "Core"
  | "Legs"
  | "Glutes"
  | "Quads"
  | "Thighs"
  | "Calves"
  | "Core"
  | "Cardio"
  | "HIIT"
  | "Full Body";

export type ExerciseType =
  | "compound"
  | "isolation"
  | "cardio";

export type Exercise = {
  name: string;
  muscle: Muscle;
  type: ExerciseType;
  equipment?: string;
};

export type MuscleState = {
  muscle: Muscle;
  last_trained: string;
};

export type PerformanceLog = {
  id?: string;
  user_id: string;
  exercise: string;
  muscle: Muscle;
  weight: number;
  reps: number;
  created_at?: string;
};