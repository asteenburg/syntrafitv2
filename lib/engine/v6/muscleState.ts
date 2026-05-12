import { supabase } from "../../supabase";
import { Muscle, MuscleState } from "./types";

export async function loadMuscleState(
  userId: string
): Promise<MuscleState[]> {
  const { data } = await supabase
    .from("profiles")
    .select("muscle_state")
    .eq("id", userId)
    .single();

  return (data?.muscle_state || []) as MuscleState[];
}

export function calculateFatigue(
  state?: MuscleState
): number {
  if (!state) return 0;

  const hours =
    (Date.now() -
      new Date(state.last_trained).getTime()) /
    3600000;

  if (hours < 24) return 100;
  if (hours < 48) return 60;
  if (hours < 72) return 30;

  return 0;
}

export async function updateMuscleState(
  userId: string,
  muscles: Muscle[]
): Promise<void> {
  const now = new Date().toISOString();

  const newState: MuscleState[] = muscles.map(
    (muscle) => ({
      muscle,
      last_trained: now,
    })
  );

  await supabase
    .from("profiles")
    .update({
      muscle_state: newState,
    })
    .eq("id", userId);
}