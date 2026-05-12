import { WorkoutState } from "../types/workoutState";

type Action =
  | { type: "GENERATE_START" }
  | { type: "GENERATE_SUCCESS" }
  | { type: "GENERATE_FAIL" }
  | { type: "SET_WORKOUT"; payload: any }
  | { type: "SET_SELECTED_FOCUS"; payload: any }
  | { type: "SET_LOGS"; payload: any }
  | { type: "SET_REPS"; payload: any }
  | { type: "SET_TARGET_DURATION"; payload: number }
  | { type: "SET_ACTIVE_EXERCISE"; payload: string | null }
  | { type: "START_SAVING" }
  | { type: "STOP_SAVING" };

export function workoutReducer(
  state: WorkoutState,
  action: Action
): WorkoutState {
  switch (action.type) {
    case "GENERATE_START":
      return { ...state, status: "generating" };

    case "GENERATE_SUCCESS":
      return { ...state, status: "ready" };

    case "GENERATE_FAIL":
      return { ...state, status: "idle" };

    case "SET_WORKOUT":
      return { ...state, workout: action.payload };

    case "SET_SELECTED_FOCUS":
      return { ...state, selectedFocus: action.payload };

    case "SET_LOGS":
      return { ...state, activeLogs: action.payload };

    case "SET_REPS":
      return { ...state, activeReps: action.payload };

    case "SET_TARGET_DURATION":
      return { ...state, targetDuration: action.payload };

    case "SET_ACTIVE_EXERCISE":
      return { ...state, activeExercise: action.payload };

    case "START_SAVING":
      return { ...state, status: "saving" };

    case "STOP_SAVING":
      return { ...state, status: "ready" };

    default:
      return state;
  }
}
