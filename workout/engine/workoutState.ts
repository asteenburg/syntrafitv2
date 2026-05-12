import { WorkoutState } from "../types/workoutState";

export const initialWorkoutState: WorkoutState = {
  status: "idle",

  workout: [],
  selectedFocus: [],

  activeLogs: {},
  activeReps: {},

  sessionTime: 0,
  targetDuration: 30,

  activeExercise: null,
};
