import { supabase } from "./supabase";

type MuscleLog = {
  muscle: string;
  timestamp: number;
};

export async function getMuscleMemory(userId: string) {
  const { data } = await supabase
    .from("workout_logs")
    .select("muscle, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!data) return [];

  return data.map((d) => ({
    muscle: d.muscle,
    timestamp: new Date(d.created_at).getTime(),
  }));
}

export function getMusclePenalty(
  muscle: string,
  memory: MuscleLog[]
) {
  const logs = memory.filter((m) => m.muscle === muscle);

  if (logs.length === 0) return 0;

  const last = logs[0].timestamp;
  const hoursSince = (Date.now() - last) / (1000 * 60 * 60);

  // REAL fatigue curve
  if (hoursSince < 24) return 5;
  if (hoursSince < 48) return 3;
  if (hoursSince < 72) return 1;

  return 0;
}

export async function updateMuscleMemory(
  userId: string,
  muscles: string[]
) {
  const rows = muscles.map((m) => ({
    user_id: userId,
    muscle: m,
    created_at: new Date().toISOString(),
  }));

  await supabase.from("workout_logs").insert(rows);
}