import { Exercise, Muscle } from "../../types/workout";

export type WorkoutStatus =
  | "idle"
  | "generating"
  | "ready"
  | "active"
  | "saving";

export type WorkoutState = {
  status: WorkoutStatus;

  workout: Exercise[];
  selectedFocus: Muscle[];

  activeLogs: Record<string, number[]>;
  activeReps: Record<string, number[]>;

  sessionTime: number;
  targetDuration: number;

  activeExercise: string | null;
};
