import { useReducer } from "react";
import { Exercise, Muscle } from "../../types/workout";

export type WorkoutStatus =
  | "idle"
  | "ready"
  | "active"
  | "generating"
  | "saving";

type State = {
  workout: Exercise[];
  selectedFocus: Muscle[];
  activeLogs: Record<string, number[]>;
  activeReps: Record<string, number[]>;
  activeExercise: string | null;
  targetDuration: number;
  sessionTime: number;
  status: WorkoutStatus;
};

const initialState: State = {
  workout: [],
  selectedFocus: [],
  activeLogs: {},
  activeReps: {},
  activeExercise: null,
  targetDuration: 30,
  sessionTime: 0,
  status: "idle",
};

type Action =
  | { type: "SET_WORKOUT"; payload: Exercise[] }
  | { type: "SET_SELECTED_FOCUS"; payload: Muscle[] }
  | { type: "SET_LOGS"; payload: Record<string, number[]> }
  | { type: "SET_REPS"; payload: Record<string, number[]> }
  | { type: "SET_ACTIVE_EXERCISE"; payload: string | null }
  | { type: "SET_TARGET_DURATION"; payload: number }
  | { type: "START_GENERATING" }
  | { type: "START_SAVING" }
  | { type: "STOP_SAVING" }
  | { type: "GENERATE_SUCCESS" }
  | { type: "GENERATE_FAIL" }
  | { type: "START_SESSION" }
  | { type: "TICK_SESSION" }
  | { type: "RESET" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_WORKOUT":
      return { ...state, workout: action.payload };

    case "SET_SELECTED_FOCUS":
      return { ...state, selectedFocus: action.payload };

    case "SET_LOGS":
      return { ...state, activeLogs: action.payload };

    case "SET_REPS":
      return { ...state, activeReps: action.payload };

    case "SET_ACTIVE_EXERCISE":
      return { ...state, activeExercise: action.payload };

    case "SET_TARGET_DURATION":
      return { ...state, targetDuration: action.payload };

    case "START_GENERATING":
      return { ...state, status: "generating" };

    case "START_SAVING":
      return { ...state, status: "saving" };

    case "STOP_SAVING":
      return { ...state, status: "active" };

    case "GENERATE_SUCCESS":
      return { ...state, status: "ready" };

    case "GENERATE_FAIL":
      return { ...state, status: "idle" };

    case "START_SESSION":
      return { ...state, status: "active", sessionTime: 0 };

    case "TICK_SESSION":
      return { ...state, sessionTime: state.sessionTime + 1 };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

export function useWorkoutMachine() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const startSession = () => dispatch({ type: "START_SESSION" });
  const finishSession = () => dispatch({ type: "RESET" });
  const abortSession = () => dispatch({ type: "RESET" });

  return {
    state,
    dispatch,
    startSession,
    finishSession,
    abortSession,
  };
}
