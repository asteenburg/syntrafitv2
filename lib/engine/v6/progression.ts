import { supabase } from "../../supabase";
import { PerformanceLog } from "./types";

export async function getLastPerformance(
  userId: string,
  exercise: string
): Promise<PerformanceLog | null> {
  const { data } = await supabase
    .from("workout_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("exercise", exercise)
    .order("created_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  return data as PerformanceLog | null;
}

export function adjustWeight(
  baseWeight: number,
  lastWeight?: number
): number {
  if (!lastWeight) return baseWeight;

  return Math.round(lastWeight + 5);
}