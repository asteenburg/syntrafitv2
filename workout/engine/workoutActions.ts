import { Exercise } from "../../types/workout";

export type WorkoutAction =
  | { type: "GENERATE_START" }
  | {
      type: "GENERATE_SUCCESS";
      payload: Exercise[];
    }
  | { type: "START_SESSION" }
  | { type: "FINISH_SESSION" }
  | { type: "ABORT_SESSION" }
  | {
      type: "SET_ACTIVE_EXERCISE";
      payload: string | null;
    }
  | {
      type: "TICK";
    }
  | { type: "START_SAVING" };
