export type Muscle =
  | "Chest"
  | "Back"
  | "Shoulders"
  | "Biceps"
  | "Triceps"
  | "Forearms" // New
  | "Core"
  | "Legs"
  | "Glutes"
  | "Quads" // New
  | "Hamstrings" // New
  | "Thighs" // New
  | "Calves" // New
  | "Cardio"
  | "HIIT"
  | "Full Body";

export type Goal = "Strength" | "Hypertrophy" | "Fat Loss";

export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  sets: number;
  reps: number | string;
  weight: number;
  type: string;
  difficulty?: number;
  notes?: string;

  // 🔥 ADD THESE (IMPORTANT FOR DEDUPE + HISTORY)
  movement_id?: string;
  variation_id?: string;
}
