"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

type WorkoutExercise = {
  id: string;
  exercise_id: string;
  order_index: number;
  target_sets: number | null;
  target_reps_min: number | null;
  target_reps_max: number | null;
  exercises: { name: string } | null;
};

function WorkoutContent() {
  const params = useSearchParams();
  const router = useRouter();
  const dayId = params.get("dayId");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [exerciseRows, setExerciseRows] = useState<WorkoutExercise[]>([]);
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [completedSets, setCompletedSets] = useState<Record<string, number>>(
    {},
  );
  const [startedAt] = useState<number>(Date.now());

  useEffect(() => {
    const load = async () => {
      if (!dayId) {
        setFeedback("Missing workout day.");
        setLoading(false);
        return;
      }

      const supabase = getSupabaseClient();
      if (!supabase) {
        router.replace("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("program_day_exercises")
        .select(
          "id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, exercises(name)",
        )
        .eq("program_day_id", dayId)
        .order("order_index", { ascending: true });

      if (error) {
        setFeedback("Error loading exercises.");
      }

      const rows = (data as WorkoutExercise[]) ?? [];
      setExerciseRows(rows);

      const initialSets: Record<string, number> = {};
      rows.forEach((row) => {
        initialSets[row.id] = 0;
      });

      setCompletedSets(initialSets);
      setLoading(false);
    };

    void load();
  }, [dayId, router]);

  const totalSets = useMemo(
    () => exerciseRows.reduce((sum, row) => sum + (row.target_sets ?? 1), 0),
    [exerciseRows],
  );

  const doneSets = useMemo(
    () => Object.values(completedSets).reduce((sum, value) => sum + value, 0),
    [completedSets],
  );

  const completeSet = (exerciseId: string, maxSets: number) => {
    setCompletedSets((prev) => ({
      ...prev,
      [exerciseId]: Math.min((prev[exerciseId] ?? 0) + 1, maxSets),
    }));
  };

  const finishWorkout = async () => {
    if (!dayId || saving) return;

    setSaving(true);
    setFeedback("");

    const supabase = getSupabaseClient();
    if (!supabase) {
      setSaving(false);
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;

    if (!user) {
      router.replace("/auth");
      return;
    }

    // 1. Create workout session
    const { data: sessionData, error: sessionError } = await (
      supabase.from("workout_sessions") as any
    )
      .insert({
        user_id: user.id,
        title: "Guided Workout",
        started_at: new Date(startedAt).toISOString(),
        ended_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (sessionError || !sessionData) {
      setFeedback(`Could not save workout: ${sessionError?.message}`);
      setSaving(false);
      return;
    }

    // 2. Bulk insert exercise entries
    const entriesPayload = exerciseRows.map((exercise) => ({
      session_id: sessionData.id,
      exercise_id: exercise.exercise_id,
      order_index: exercise.order_index,
    }));

    const { data: entriesData, error: entriesError } = await (
      supabase.from("workout_exercise_entries") as any
    )
      .insert(entriesPayload)
      .select("id, exercise_id, order_index");

    if (entriesError || !entriesData) {
      setFeedback("Failed saving exercises.");
      setSaving(false);
      return;
    }

    // 3. Build set logs
    const setLogs: any[] = [];

    for (const exercise of exerciseRows) {
      const entry = entriesData.find(
        (e: any) => e.order_index === exercise.order_index,
      );

      const setsToSave = completedSets[exercise.id] ?? 0;

      for (let i = 1; i <= setsToSave; i++) {
        setLogs.push({
          entry_id: entry?.id,
          set_number: i,
          reps: exercise.target_reps_max ?? exercise.target_reps_min ?? 8,
          weight_lbs: Number(weights[exercise.id] ?? 0) || null,
          is_warmup: false,
        });
      }
    }

    if (setLogs.length > 0) {
      const { error: setError } = await (
        supabase.from("set_logs") as any
      ).insert(setLogs);

      if (setError) {
        setFeedback("Failed saving sets.");
        setSaving(false);
        return;
      }
    }

    router.push("/history");
  };

  if (loading) {
    return (
      <main className='flex min-h-screen items-center justify-center'>
        Loading...
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100'>
      <div className='mx-auto w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6'>
        <div className='mb-6 flex items-center justify-between'>
          <h1 className='text-2xl font-bold'>Start Workout</h1>
          <Link
            href='/plan'
            className='text-sm text-zinc-300 underline'
          >
            Back to plan
          </Link>
        </div>

        <p className='text-sm text-zinc-400'>
          Progress: {doneSets}/{totalSets} sets completed
        </p>

        <div className='mt-5 space-y-3'>
          {exerciseRows.map((exercise) => {
            const targetSets = exercise.target_sets ?? 1;

            return (
              <div
                key={exercise.id}
                className='rounded-lg border border-zinc-700 p-3'
              >
                <p className='font-semibold'>
                  {exercise.exercises?.name ?? "Exercise"}
                </p>

                <p className='text-sm text-zinc-400'>
                  {completedSets[exercise.id] ?? 0} / {targetSets} sets
                </p>

                <div className='mt-2 flex items-center gap-2'>
                  <input
                    type='number'
                    placeholder='Weight lbs'
                    value={weights[exercise.id] ?? ""}
                    onChange={(event) =>
                      setWeights((prev) => ({
                        ...prev,
                        [exercise.id]: event.target.value,
                      }))
                    }
                    className='w-28 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1'
                  />

                  <button
                    type='button'
                    onClick={() => completeSet(exercise.id, targetSets)}
                    className='rounded-md border border-[#CCFF00]/70 px-3 py-1 text-sm text-[#CCFF00]'
                  >
                    Complete Set
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type='button'
          onClick={finishWorkout}
          disabled={saving}
          className='mt-6 w-full rounded-lg bg-violet-400 px-4 py-3 font-semibold text-zinc-950'
        >
          {saving ? "Saving..." : "Finish Workout Summary"}
        </button>

        {feedback ? (
          <p className='mt-4 rounded-lg border border-[#E60000]/60 bg-[#E60000]/10 px-3 py-2 text-sm text-[#ffb3b3]'>
            {feedback}
          </p>
        ) : null}
      </div>
    </main>
  );
}

export default function WorkoutPage() {
  return (
    <Suspense fallback={<div>Loading Workout...</div>}>
      <WorkoutContent />
    </Suspense>
  );
}
