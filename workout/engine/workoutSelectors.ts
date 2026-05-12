import { WorkoutState } from "../types/workoutState";

export const selectIsIdle = (state: WorkoutState) => state.status === "idle";

export const selectIsReady = (state: WorkoutState) => state.status === "ready";

export const selectIsActive = (state: WorkoutState) =>
  state.status === "active";

export const selectWorkout = (state: WorkoutState) => state.workout;

export const selectSessionTime = (state: WorkoutState) => state.sessionTime;
