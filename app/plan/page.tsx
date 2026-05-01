"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

// --- TYPES ---
type SetupPreferenceRow = {
  primary_goal: string;
  equipment_type: string;
  days_per_week: number;
  session_minutes: number;
  preferred_split: string;
  disliked_exercises: string[] | null;
};

type PlanDayExercise = {
  id: string;
  exercise_id: string;
  order_index: number;
  target_sets: number | null;
  target_reps_min: number | null;
  target_reps_max: number | null;
  rest_seconds: number | null;
  notes: string | null;
  exercises: {
    name: string;
  } | null;
};

type PlanDay = {
  id: string;
  day_index: number;
  name: string | null;
  program_day_exercises: PlanDayExercise[];
};

type Program = {
  id: string;
  name: string;
  description: string | null;
  program_days: PlanDay[];
};

type ExerciseOption = {
  id: string;
  name: string;
};

// --- LOGIC CONSTANTS ---
const equipmentPlans: Record<string, string[]> = {
  "Build muscle": [
    "Barbell Back Squat",
    "Bench Press",
    "Romanian Deadlift",
    "Pull-Up",
    "Overhead Press",
    "Dumbbell Row",
    "Leg Press",
    "Incline Dumbbell Press",
  ],
  "Lose fat": [
    "Goblet Squat",
    "Dumbbell Bench Press",
    "Lat Pulldown",
    "Walking Lunge",
    "Seated Row",
    "Kettlebell Swing",
    "Bike Intervals",
    "Treadmill Incline Walk",
  ],
  "Improve endurance": [
    "Bike Intervals",
    "Treadmill Incline Walk",
    "Rowing Machine",
    "Step-Ups",
    "Goblet Squat",
    "Dumbbell Push Press",
    "Plank",
    "Farmer Carry",
  ],
  "Increase strength": [
    "Barbell Back Squat",
    "Deadlift",
    "Bench Press",
    "Overhead Press",
    "Barbell Row",
    "Split Squat",
    "Chin-Up",
    "Hip Thrust",
  ],
};

const noEquipmentPlans: Record<string, string[]> = {
  "Build muscle": [
    "Push-Up",
    "Bulgarian Split Squat",
    "Bodyweight Row",
    "Pike Push-Up",
    "Glute Bridge",
    "Tempo Squat",
    "Plank",
    "Mountain Climbers",
  ],
  "Lose fat": [
    "Burpee",
    "Bodyweight Squat",
    "Alternating Lunge",
    "Push-Up",
    "Mountain Climbers",
    "Jumping Jacks",
    "High Knees",
    "Plank",
  ],
  "Improve endurance": [
    "Jumping Jacks",
    "High Knees",
    "Mountain Climbers",
    "Bodyweight Squat",
    "Alternating Reverse Lunge",
    "Plank Shoulder Tap",
    "Walk/Jog Intervals",
    "Step-Ups",
  ],
  "Increase strength": [
    "Decline Push-Up",
    "Bulgarian Split Squat",
    "Single-Leg Glute Bridge",
    "Pike Push-Up",
    "Tempo Squat",
    "Bodyweight Row",
    "Hollow Hold",
    "Side Plank",
  ],
};

// --- HELPER FUNCTIONS ---
function buildExercisePool(goal: string, equipmentType: string) {
  const isNoEquipment =
    equipmentType.includes("Bodyweight") ||
    equipmentType.includes("Cardio") ||
    equipmentType.includes("Yoga");
  const source = isNoEquipment ? noEquipmentPlans : equipmentPlans;
  return source[goal] ?? source["Build muscle"];
}

function buildRepScheme(goal: string) {
  if (goal === "Increase strength")
    return { sets: 5, minReps: 3, maxReps: 6, rest: 150 };
  if (goal === "Improve endurance")
    return { sets: 3, minReps: 12, maxReps: 20, rest: 60 };
  if (goal === "Lose fat")
    return { sets: 4, minReps: 10, maxReps: 15, rest: 75 };
  return { sets: 4, minReps: 8, maxReps: 12, rest: 90 };
}

function getExerciseCountForDuration(sessionMinutes: number) {
  if (sessionMinutes <= 30) return 3;
  if (sessionMinutes <= 45) return 4;
  if (sessionMinutes <= 60) return 5;
  if (sessionMinutes <= 75) return 6;
  return 7;
}

function tuneSchemeForDuration(
  base: { sets: number; minReps: number; maxReps: number; rest: number },
  sessionMinutes: number,
) {
  if (sessionMinutes <= 30)
    return {
      ...base,
      sets: Math.max(2, base.sets - 1),
      rest: Math.max(45, base.rest - 30),
    };
  if (sessionMinutes >= 75)
    return { ...base, sets: Math.min(6, base.sets + 1), rest: base.rest };
  return base;
}

function estimateDayMinutes(day: PlanDay) {
  const warmupMinutes = 5;
  const perExerciseTransitionSeconds = 45;
  const seconds = day.program_day_exercises.reduce((total, exercise) => {
    const sets = exercise.target_sets ?? 3;
    const avgReps =
      ((exercise.target_reps_min ?? 8) + (exercise.target_reps_max ?? 12)) / 2;
    const repSeconds = avgReps * 4;
    const workSeconds = sets * repSeconds;
    const restSeconds = Math.max(0, sets - 1) * (exercise.rest_seconds ?? 60);
    return total + workSeconds + restSeconds + perExerciseTransitionSeconds;
  }, 0);
  return Math.max(15, Math.round((seconds + warmupMinutes * 60) / 60));
}

function getDurationBadge(estimated: number, preferred: number | null) {
  if (!preferred)
    return {
      label: `${estimated} min est.`,
      className: "border-zinc-700 text-zinc-500",
    };
  const delta = estimated - preferred;
  if (Math.abs(delta) <= 5)
    return {
      label: "On target",
      className: "border-violet-500/50 text-violet-400",
    };
  if (delta > 0)
    return {
      label: `+${delta} min`,
      className: "border-red-900/50 text-red-400",
    };
  return { label: `${delta} min`, className: "border-zinc-700 text-zinc-400" };
}

export default function PlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [program, setProgram] = useState<Program | null>(null);
  const [completedDayIds, setCompletedDayIds] = useState<string[]>([]);
  const [exerciseWeights, setExerciseWeights] = useState<
    Record<string, string>
  >({});
  const [bodyweightOnly, setBodyweightOnly] = useState<Record<string, boolean>>(
    {},
  );
  const [preferredSessionMinutes, setPreferredSessionMinutes] = useState<
    number | null
  >(null);
  const [dayDifficulty, setDayDifficulty] = useState<Record<string, string>>(
    {},
  );
  const [nextWeightSuggestion, setNextWeightSuggestion] = useState<
    Record<string, string>
  >({});
  const [swapOptions, setSwapOptions] = useState<ExerciseOption[]>([]);
  const [needsRegeneration, setNeedsRegeneration] = useState(false);

  const loadPlan = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      router.replace("/auth");
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/auth");
      return;
    }

    const prefsResult = await supabase
      .from("user_setup_preferences")
      .select("session_minutes, disliked_exercises")
      .eq("user_id", user.id)
      .maybeSingle();
    const preferenceData = (prefsResult.data as any) ?? null;

    if (!prefsResult.error && preferenceData?.session_minutes) {
      setPreferredSessionMinutes(preferenceData.session_minutes);
    }

    const { data: planData } = await supabase
      .from("programs")
      .select(
        `
        id, name, description,
        program_days (
          id, day_index, name,
          program_day_exercises (
            id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, rest_seconds, notes,
            exercises ( name )
          )
        )
      `,
      )
      .eq("owner_id", user.id)
      .eq("name", "Starter Plan")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentProgram = planData as any as Program | null;
    setProgram(currentProgram);

    if (currentProgram) {
      const initialWeights: Record<string, string> = {};
      const initialBodyweightFlags: Record<string, boolean> = {};
      currentProgram.program_days.forEach((day) => {
        day.program_day_exercises.forEach((exercise) => {
          initialWeights[exercise.id] = "";
          initialBodyweightFlags[exercise.id] = Boolean(
            exercise.exercises?.name?.toLowerCase().includes("bodyweight"),
          );
        });
      });
      setExerciseWeights(initialWeights);
      setBodyweightOnly(initialBodyweightFlags);

      // Suggestions logic
      const allExerciseIds = currentProgram.program_days.flatMap((day) =>
        day.program_day_exercises.map((ex) => ex.exercise_id),
      );
      const suggestionMap: Record<string, string> = {};
      for (const exId of allExerciseIds) {
        const recentLogs = await supabase
          .from("set_logs")
          .select("weight_lbs, workout_exercise_entries!inner(exercise_id)")
          .eq("workout_exercise_entries.exercise_id", exId)
          .not("weight_lbs", "is", null)
          .order("created_at", { ascending: false })
          .limit(1);

        const logs = recentLogs.data as { weight_lbs: number }[] | null;
        const lastWeight = Number(logs?.[0]?.weight_lbs ?? 0);
        if (lastWeight > 0) suggestionMap[exId] = `${lastWeight + 5} lbs next`;
      }
      setNextWeightSuggestion(suggestionMap);

      const completionResult = await supabase
        .from("program_day_completions")
        .select("program_day_id")
        .eq("user_id", user.id)
        .eq("program_id", currentProgram.id);
      if (!completionResult.error)
        setCompletedDayIds(
          (completionResult.data as any[]).map((row) => row.program_day_id),
        );
    }

    const swapsResult = await supabase
      .from("exercises")
      .select("id, name")
      .order("name", { ascending: true })
      .limit(100);
    if (!swapsResult.error)
      setSwapOptions(swapsResult.data as any as ExerciseOption[]);

    setLoading(false);
  };

  useEffect(() => {
    void loadPlan();
  }, []);

  const generatePlan = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setGenerating(true);
    setFeedback("");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setGenerating(false);
      router.replace("/auth");
      return;
    }

    const prefsResult = await supabase
      .from("user_setup_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (prefsResult.error || !prefsResult.data) {
      setGenerating(false);
      router.push("/setup");
      return;
    }

    const preferences = prefsResult.data as SetupPreferenceRow;
    const pool = buildExercisePool(
      preferences.primary_goal,
      preferences.equipment_type,
    );
    const filteredPool = pool.filter(
      (name) =>
        !(preferences.disliked_exercises ?? []).some(
          (item) => item.toLowerCase().trim() === name.toLowerCase().trim(),
        ),
    );
    const poolToUse = filteredPool.length >= 3 ? filteredPool : pool;
    const scheme = tuneSchemeForDuration(
      buildRepScheme(preferences.primary_goal),
      preferences.session_minutes,
    );
    const exercisesPerDay = getExerciseCountForDuration(
      preferences.session_minutes,
    );

    const { data: createdProgram } = await supabase
      .from("programs")
      .insert({
        owner_id: user.id,
        name: "Starter Plan",
        description: `${preferences.primary_goal} cycle`,
      } as never)
      .select("id")
      .single();

    const createdProgramId = (createdProgram as { id: string } | null)?.id;
    if (!createdProgramId) {
      setGenerating(false);
      return;
    }

    for (
      let dayIndex = 0;
      dayIndex < preferences.days_per_week;
      dayIndex += 1
    ) {
      const { data: dayRow } = await supabase
        .from("program_days")
        .insert({
          program_id: createdProgramId,
          day_index: dayIndex,
          name: `Day ${dayIndex + 1}`,
        } as never)
        .select("id")
        .single();

      const dayRowId = (dayRow as { id: string } | null)?.id;
      if (!dayRowId) continue;

      const start = (dayIndex * 2) % poolToUse.length;
      const dayExerciseNames = Array.from(
        { length: exercisesPerDay },
        (_, offset) => poolToUse[(start + offset) % poolToUse.length],
      );

      for (let i = 0; i < dayExerciseNames.length; i += 1) {
        const exerciseName = dayExerciseNames[i];
        const { data: existingExercise } = await supabase
          .from("exercises")
          .select("id")
          .eq("name", exerciseName)
          .maybeSingle();
        let exerciseId = (existingExercise as { id: string } | null)?.id;

        if (!exerciseId) {
          const { data: newEx } = await supabase
            .from("exercises")
            .insert({
              name: exerciseName,
              category:
                preferences.primary_goal === "Improve endurance"
                  ? "cardio"
                  : "strength",
              equipment: preferences.equipment_type,
              is_custom: true,
              created_by: user.id,
            } as never)
            .select("id")
            .single();
          exerciseId = (newEx as { id: string } | null)?.id;
        }

        if (exerciseId) {
          await supabase.from("program_day_exercises").insert({
            program_day_id: dayRowId,
            exercise_id: exerciseId,
            order_index: i,
            target_sets: scheme.sets,
            target_reps_min: scheme.minReps,
            target_reps_max: scheme.maxReps,
            rest_seconds: scheme.rest,
            notes: `${preferences.session_minutes}-minute session`,
          } as never);
        }
      }
    }

    setGenerating(false);
    setFeedback("Starter plan generated.");
    await loadPlan();
  };

  const toggleCompleteDay = async (dayId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase || !program) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const isCompleted = completedDayIds.includes(dayId);
    if (isCompleted) {
      await supabase
        .from("program_day_completions")
        .delete()
        .eq("user_id", user.id)
        .eq("program_id", program.id)
        .eq("program_day_id", dayId);
      setCompletedDayIds((prev) => prev.filter((id) => id !== dayId));
      return;
    }

    const { error: insErr } = await supabase
      .from("program_day_completions")
      .insert({
        user_id: user.id,
        program_id: program.id,
        program_day_id: dayId,
      } as never);

    if (insErr) {
      setFeedback(`Error: ${insErr.message}`);
      return;
    }

    const selectedDay = program.program_days.find((day) => day.id === dayId);
    if (!selectedDay) return;

    const { data: sessionData } = await supabase
      .from("workout_sessions")
      .insert({
        user_id: user.id,
        title: selectedDay.name ?? `Day ${selectedDay.day_index + 1} Workout`,
      } as never)
      .select("id")
      .single();

    const sessionId = (sessionData as { id: string } | null)?.id;

    if (sessionId) {
      for (const ex of selectedDay.program_day_exercises) {
        const { data: entryData } = await supabase
          .from("workout_exercise_entries")
          .insert({
            session_id: sessionId,
            exercise_id: ex.exercise_id,
            order_index: ex.order_index,
          } as never)
          .select("id")
          .single();

        const entryId = (entryData as { id: string } | null)?.id;

        if (entryId) {
          const weight = Number(exerciseWeights[ex.id] ?? 0);
          for (let s = 1; s <= (ex.target_sets ?? 1); s++) {
            await supabase.from("set_logs").insert({
              entry_id: entryId,
              set_number: s,
              reps: ex.target_reps_max ?? 8,
              weight_lbs: bodyweightOnly[ex.id] || weight <= 0 ? null : weight,
              is_warmup: false,
            } as never);
          }
        }
      }
    }

    await supabase.from("workout_day_feedback").insert({
      user_id: user.id,
      program_id: program.id,
      program_day_id: dayId,
      difficulty: dayDifficulty[dayId] ?? "just_right",
    } as never);

    setCompletedDayIds((prev) => [...prev, dayId]);
  };

  const swapExercise = async (
    programDayExerciseId: string,
    nextExerciseId: string,
  ) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase
      .from("program_day_exercises")
      .update({ exercise_id: nextExerciseId } as never)
      .eq("id", programDayExerciseId);
    await loadPlan();
  };

  if (loading) {
    return (
      <main className='flex min-h-screen items-center justify-center bg-zinc-950 font-mono text-[10px] uppercase tracking-[0.3em] text-violet-500'>
        Syncing Neural Plan...
      </main>
    );
  }

  const completedCount = completedDayIds.length;
  const totalDays = program?.program_days.length ?? 0;

  return (
    <main className='min-h-screen bg-zinc-950 px-6 py-12 text-zinc-100'>
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-[5%] -right-[5%] w-[35%] h-[35%] bg-violet-900/10 blur-[100px] rounded-full' />
      </div>

      <div className='relative mx-auto w-full max-w-4xl rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 backdrop-blur-xl shadow-2xl'>
        <header className='flex flex-wrap items-end justify-between gap-6 border-b border-zinc-800/50 pb-8 mb-10'>
          <div>
            <p className='text-[10px] font-black tracking-[0.3em] text-violet-400 uppercase mb-2'>
              Protocol: {program ? "Active" : "Standby"}
            </p>
            <h1 className='text-4xl font-extrabold tracking-tighter'>
              My Plan
            </h1>
            {program && (
              <p className='mt-2 text-xs font-medium text-zinc-500 uppercase tracking-widest'>
                {completedCount} / {totalDays} Units Completed
              </p>
            )}
          </div>
          <div className='flex gap-3'>
            <Link
              href='/setup'
              className='rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors'
            >
              Setup
            </Link>
            <button
              onClick={generatePlan}
              disabled={generating}
              className='rounded-xl bg-violet-600 px-6 py-2 text-xs font-black text-white uppercase tracking-widest hover:bg-violet-500 transition-all active:scale-95 disabled:opacity-50'
            >
              {generating
                ? "Calibrating..."
                : program
                  ? "Regenerate"
                  : "Generate"}
            </button>
          </div>
        </header>

        {!program ? (
          <div className='py-20 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/30'>
            <p className='text-xs font-mono uppercase tracking-[0.2em] text-zinc-600'>
              No Program Data Detected
            </p>
          </div>
        ) : (
          <div className='space-y-6'>
            {program.program_days
              .slice()
              .sort((a, b) => a.day_index - b.day_index)
              .map((day) => {
                const completed = completedDayIds.includes(day.id);
                const estimated = estimateDayMinutes(day);
                const badge = getDurationBadge(
                  estimated,
                  preferredSessionMinutes,
                );

                return (
                  <section
                    key={day.id}
                    className={`group rounded-2xl border transition-all duration-300 ${completed ? "border-violet-500/20 bg-violet-500/5 opacity-60" : "border-zinc-800 bg-zinc-900/30 p-6"}`}
                  >
                    <div className='flex items-center justify-between mb-6'>
                      <div>
                        <h2
                          className={`text-xl font-black ${completed ? "text-white" : "text-white"}`}
                        >
                          {day.name}
                        </h2>
                        <div className='flex items-center gap-3 mt-1'>
                          <span
                            className={`text-[10px] font-mono border rounded px-2 py-0.5 uppercase ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                          <span className='text-[10px] font-mono text-zinc-600 uppercase'>
                            {estimated} min est.
                          </span>
                        </div>
                      </div>
                      <div className='flex gap-2'>
                        <button
                          onClick={() => toggleCompleteDay(day.id)}
                          className={`rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${completed ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700"}`}
                        >
                          {completed ? "Done" : "Mark Done"}
                        </button>
                        <Link
                          href={`/workout?dayId=${day.id}`}
                          className='rounded-lg bg-zinc-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-900 hover:bg-white transition-all'
                        >
                          Start
                        </Link>
                      </div>
                    </div>

                    <div className='space-y-3'>
                      {day.program_day_exercises.map((ex) => (
                        <div
                          key={ex.id}
                          className='flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800/50 bg-zinc-950/40 p-4 transition-colors hover:border-zinc-700'
                        >
                          <div className='min-w-[200px]'>
                            <p className='text-sm font-bold text-zinc-100'>
                              {ex.exercises?.name}
                            </p>
                            <p className='text-[10px] font-mono text-zinc-500 uppercase'>
                              {ex.target_sets}S × {ex.target_reps_min}-
                              {ex.target_reps_max}R
                            </p>
                          </div>

                          <div className='flex items-center gap-4'>
                            <input
                              type='number'
                              placeholder='lbs'
                              className='w-20 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white focus:border-violet-500/50 outline-none'
                              value={exerciseWeights[ex.id] || ""}
                              onChange={(e) =>
                                setExerciseWeights((p) => ({
                                  ...p,
                                  [ex.id]: e.target.value,
                                }))
                              }
                              disabled={bodyweightOnly[ex.id]}
                            />
                            <select
                              className='bg-transparent text-[10px] font-bold text-zinc-600 uppercase outline-none'
                              onChange={(e) =>
                                swapExercise(ex.id, e.target.value)
                              }
                              value=''
                            >
                              <option value=''>Swap</option>
                              {swapOptions.slice(0, 20).map((opt) => (
                                <option
                                  key={opt.id}
                                  value={opt.id}
                                  className='bg-zinc-900 text-white'
                                >
                                  {opt.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}
          </div>
        )}

        {feedback && (
          <div className='mt-8 border-t border-zinc-800 pt-6'>
            <p className='text-center font-mono text-[10px] text-violet-400 uppercase tracking-widest'>
              {feedback}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
