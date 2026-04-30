"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

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

function buildExercisePool(goal: string, equipmentType: string) {
  const isNoEquipment =
    equipmentType.includes("Bodyweight") ||
    equipmentType.includes("Cardio") ||
    equipmentType.includes("Yoga") ||
    equipmentType.includes("Pilates");
  const source = isNoEquipment ? noEquipmentPlans : equipmentPlans;
  return source[goal] ?? source["Build muscle"];
}

function buildRepScheme(goal: string) {
  if (goal === "Increase strength") {
    return { sets: 5, minReps: 3, maxReps: 6, rest: 150 };
  }
  if (goal === "Improve endurance") {
    return { sets: 3, minReps: 12, maxReps: 20, rest: 60 };
  }
  if (goal === "Lose fat") {
    return { sets: 4, minReps: 10, maxReps: 15, rest: 75 };
  }
  return { sets: 4, minReps: 8, maxReps: 12, rest: 90 };
}

function getExerciseCountForDuration(sessionMinutes: number) {
  if (sessionMinutes <= 30) {
    return 3;
  }
  if (sessionMinutes <= 45) {
    return 4;
  }
  if (sessionMinutes <= 60) {
    return 5;
  }
  if (sessionMinutes <= 75) {
    return 6;
  }
  return 7;
}

function tuneSchemeForDuration(
  base: { sets: number; minReps: number; maxReps: number; rest: number },
  sessionMinutes: number,
) {
  if (sessionMinutes <= 30) {
    return {
      ...base,
      sets: Math.max(2, base.sets - 1),
      rest: Math.max(45, base.rest - 30),
    };
  }

  if (sessionMinutes >= 75) {
    return {
      ...base,
      sets: Math.min(6, base.sets + 1),
      rest: base.rest,
    };
  }

  return base;
}

function estimateDayMinutes(day: PlanDay) {
  const warmupMinutes = 5;
  const perExerciseTransitionSeconds = 45;
  const seconds = day.program_day_exercises.reduce((total, exercise) => {
    const sets = exercise.target_sets ?? 3;
    const avgReps = ((exercise.target_reps_min ?? 8) + (exercise.target_reps_max ?? 12)) / 2;
    const repSeconds = avgReps * 4;
    const workSeconds = sets * repSeconds;
    const restSeconds = Math.max(0, sets - 1) * (exercise.rest_seconds ?? 60);
    return total + workSeconds + restSeconds + perExerciseTransitionSeconds;
  }, 0);
  return Math.max(15, Math.round((seconds + warmupMinutes * 60) / 60));
}

function getDurationBadge(estimated: number, preferred: number | null) {
  if (!preferred) {
    return {
      label: `${estimated} min est.`,
      className: "border-zinc-600/60 text-zinc-300",
    };
  }

  const delta = estimated - preferred;
  if (Math.abs(delta) <= 5) {
    return {
      label: "On target",
      className: "border-[#CCFF00]/70 text-[#CCFF00]",
    };
  }

  if (delta > 0) {
    return {
      label: `+${delta} min`,
      className: "border-[#E60000]/70 text-[#ffb3b3]",
    };
  }

  return {
    label: `${delta} min`,
    className: "border-zinc-500/70 text-zinc-300",
  };
}

type ExerciseOption = {
  id: string;
  name: string;
};

export default function PlanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [program, setProgram] = useState<Program | null>(null);
  const [completedDayIds, setCompletedDayIds] = useState<string[]>([]);
  const [exerciseWeights, setExerciseWeights] = useState<Record<string, string>>({});
  const [bodyweightOnly, setBodyweightOnly] = useState<Record<string, boolean>>({});
  const [preferredSessionMinutes, setPreferredSessionMinutes] = useState<number | null>(null);
  const [dayDifficulty, setDayDifficulty] = useState<
    Record<string, "too_easy" | "just_right" | "too_hard">
  >({});
  const [nextWeightSuggestion, setNextWeightSuggestion] = useState<Record<string, string>>({});
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

    const preferenceData = (prefsResult.data as
      | { session_minutes?: number; disliked_exercises?: string[] | null }
      | null) ?? null;

    if (!prefsResult.error && preferenceData?.session_minutes) {
      setPreferredSessionMinutes(preferenceData.session_minutes);
    }
    if (!prefsResult.error && preferenceData?.disliked_exercises) {
      const disliked = preferenceData.disliked_exercises;
      const conflictFound = program?.program_days.some((day) =>
        day.program_day_exercises.some((exercise) =>
          disliked.some(
            (item) =>
              exercise.exercises?.name?.toLowerCase().trim() === item.toLowerCase().trim(),
          ),
        ),
      );
      setNeedsRegeneration(Boolean(conflictFound));
    }

    const { data: planData } = await supabase
      .from("programs")
      .select(
        `
        id,
        name,
        description,
        program_days (
          id,
          day_index,
          name,
          program_day_exercises (
            id,
              exercise_id,
            order_index,
            target_sets,
            target_reps_min,
            target_reps_max,
            rest_seconds,
            notes,
            exercises (
              name
            )
          )
        )
      `,
      )
      .eq("owner_id", user.id)
      .eq("name", "Starter Plan")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentProgram = (planData as Program | null) ?? null;
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

      const allExerciseIds = currentProgram.program_days.flatMap((day) =>
        day.program_day_exercises.map((exercise) => exercise.exercise_id),
      );
      const suggestionMap: Record<string, string> = {};
      for (const exerciseId of allExerciseIds) {
        const recentLogs = await supabase
          .from("set_logs")
          .select("weight_lbs, reps, workout_exercise_entries!inner(exercise_id, session_id)")
          .eq("workout_exercise_entries.exercise_id", exerciseId)
          .not("weight_lbs", "is", null)
          .order("completed_at", { ascending: false })
          .limit(5);

        const recentLogRows = (recentLogs.data as Array<{ weight_lbs: number | null }> | null) ?? [];
        const lastWeight = Number(recentLogRows[0]?.weight_lbs ?? 0);
        if (lastWeight > 0) {
          suggestionMap[exerciseId] = `${lastWeight + 5} lbs next`;
        }
      }
      setNextWeightSuggestion(suggestionMap);
    }

    const swapsResult = await supabase
      .from("exercises")
      .select("id, name")
      .order("name", { ascending: true })
      .limit(120);
    if (!swapsResult.error) {
      setSwapOptions((swapsResult.data as ExerciseOption[]) ?? []);
    }

    if (currentProgram) {
      const completionResult = await supabase
        .from("program_day_completions")
        .select("program_day_id")
        .eq("user_id", user.id)
        .eq("program_id", currentProgram.id);

      if (!completionResult.error) {
        const completedRows =
          (completionResult.data as Array<{ program_day_id: string }> | null) ?? [];
        const completed = completedRows.map((row) => row.program_day_id);
        setCompletedDayIds(completed);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadPlan();
  }, []);

  const generatePlan = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setFeedback("Supabase is not configured. Add values in .env.local.");
      return;
    }

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
      .select("primary_goal, equipment_type, days_per_week, session_minutes, disliked_exercises")
      .eq("user_id", user.id)
      .maybeSingle();

    if (prefsResult.error || !prefsResult.data) {
      setFeedback("Please complete setup first so we can build your plan.");
      setGenerating(false);
      router.push("/setup");
      return;
    }

    const preferences = prefsResult.data as SetupPreferenceRow;
    const pool = buildExercisePool(preferences.primary_goal, preferences.equipment_type);
    const filteredPool = pool.filter(
      (name) =>
        !(
          preferences.disliked_exercises ?? []
        ).some((item) => item.toLowerCase().trim() === name.toLowerCase().trim()),
    );
    const poolToUse = filteredPool.length >= 3 ? filteredPool : pool;
    const baseScheme = buildRepScheme(preferences.primary_goal);
    const scheme = tuneSchemeForDuration(baseScheme, preferences.session_minutes);
    const exercisesPerDay = getExerciseCountForDuration(preferences.session_minutes);

    const { data: createdProgram, error: programError } = await supabase
      .from("programs")
      .insert({
        owner_id: user.id,
        name: "Starter Plan",
        description: `${preferences.primary_goal} - ${preferences.days_per_week} days/week - ${preferences.session_minutes} min sessions`,
      } as never)
      .select("id")
      .single();

    if (programError || !createdProgram) {
      setFeedback(`Could not create starter plan: ${programError?.message ?? "Unknown error"}`);
      setGenerating(false);
      return;
    }
    const createdProgramId = (createdProgram as { id: string }).id;

    for (let dayIndex = 0; dayIndex < preferences.days_per_week; dayIndex += 1) {
      const { data: dayRow, error: dayError } = await supabase
        .from("program_days")
        .insert({
          program_id: createdProgramId,
          day_index: dayIndex,
          name: `Day ${dayIndex + 1}`,
        } as never)
        .select("id")
        .single();

      if (dayError || !dayRow) {
        setFeedback(`Could not create plan day ${dayIndex + 1}: ${dayError?.message ?? "Unknown error"}`);
        setGenerating(false);
        return;
      }
      const dayRowId = (dayRow as { id: string }).id;

      const start = (dayIndex * 2) % pool.length;
      const dayExerciseNames = Array.from({ length: exercisesPerDay }, (_, offset) => {
        return poolToUse[(start + offset) % poolToUse.length];
      });

      for (let i = 0; i < dayExerciseNames.length; i += 1) {
        const exerciseName = dayExerciseNames[i];
        const existingExercise = await supabase
          .from("exercises")
          .select("id")
          .eq("name", exerciseName)
          .maybeSingle();

        let exerciseId = (existingExercise.data as { id: string } | null)?.id;
        if (!exerciseId) {
          const insertedExercise = await supabase
            .from("exercises")
            .insert({
              name: exerciseName,
              category:
                preferences.primary_goal === "Improve endurance" ? "cardio" : "strength",
              equipment: preferences.equipment_type,
              is_custom: true,
              created_by: user.id,
            } as never)
            .select("id")
            .single();

          exerciseId = (insertedExercise.data as { id: string } | null)?.id;
        }

        if (!exerciseId) {
          setFeedback(`Could not prepare exercise "${exerciseName}".`);
          setGenerating(false);
          return;
        }

        const exerciseInsert = await supabase.from("program_day_exercises").insert({
          program_day_id: dayRowId,
          exercise_id: exerciseId,
          order_index: i,
          target_sets: scheme.sets,
          target_reps_min: scheme.minReps,
          target_reps_max: scheme.maxReps,
          rest_seconds: scheme.rest,
          notes: `${preferences.session_minutes}-minute session`,
        } as never);

        if (exerciseInsert.error) {
          setFeedback(`Could not add exercise to Day ${dayIndex + 1}: ${exerciseInsert.error.message}`);
          setGenerating(false);
          return;
        }
      }
    }

    setGenerating(false);
    setFeedback("Starter plan generated.");
    await loadPlan();
  };

  const toggleCompleteDay = async (dayId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase || !program) {
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/auth");
      return;
    }

    const isCompleted = completedDayIds.includes(dayId);
    if (isCompleted) {
      const deleteResult = await supabase
        .from("program_day_completions")
        .delete()
        .eq("user_id", user.id)
        .eq("program_id", program.id)
        .eq("program_day_id", dayId);

      if (deleteResult.error) {
        setFeedback(
          `Could not update completion state: ${deleteResult.error.message}. Run migration 004 first.`,
        );
        return;
      }

      setCompletedDayIds((prev) => prev.filter((id) => id !== dayId));
      return;
    }

    const insertResult = await supabase.from("program_day_completions").insert({
      user_id: user.id,
      program_id: program.id,
      program_day_id: dayId,
    } as never);

    if (insertResult.error) {
      setFeedback(
        `Could not save completion: ${insertResult.error.message}. Run migration 004 first.`,
      );
      return;
    }

    const selectedDay = program.program_days.find((day) => day.id === dayId);
    if (!selectedDay) {
      setFeedback("Could not find workout day details to log this completion.");
      return;
    }

    const createdSessionResult = await supabase
      .from("workout_sessions")
      .insert({
        user_id: user.id,
        title: selectedDay.name ?? `Day ${selectedDay.day_index + 1} Workout`,
      } as never)
      .select("id")
      .single();
    const createdSession = createdSessionResult as {
      data: { id: string } | null;
      error: { message: string } | null;
    };

    if (createdSession.error || !createdSession.data) {
      setFeedback(`Completion saved, but could not create workout log: ${createdSession.error?.message}`);
      setCompletedDayIds((prev) => [...prev, dayId]);
      return;
    }
    const createdSessionId = (createdSession.data as { id: string }).id;

    for (const exercise of selectedDay.program_day_exercises) {
      const createdEntryResult = await supabase
        .from("workout_exercise_entries")
        .insert({
          session_id: createdSessionId,
          exercise_id: exercise.exercise_id,
          order_index: exercise.order_index,
        } as never)
        .select("id")
        .single();
      const createdEntry = createdEntryResult as {
        data: { id: string } | null;
        error: { message: string } | null;
      };

      if (createdEntry.error || !createdEntry.data) {
        setFeedback(`Workout log partially saved: ${createdEntry.error?.message ?? "Entry error"}`);
        continue;
      }
      const createdEntryId = (createdEntry.data as { id: string }).id;

      const setsCount = exercise.target_sets ?? 1;
      const repsValue = exercise.target_reps_max ?? exercise.target_reps_min ?? 8;
      const enteredWeight = Number(exerciseWeights[exercise.id] ?? 0);
      const useBodyweightOnly = bodyweightOnly[exercise.id] ?? false;

      for (let setNumber = 1; setNumber <= setsCount; setNumber += 1) {
        const setInsert = await supabase.from("set_logs").insert({
          entry_id: createdEntryId,
          set_number: setNumber,
          reps: repsValue,
          weight_lbs: useBodyweightOnly || enteredWeight <= 0 ? null : enteredWeight,
          is_warmup: false,
        } as never);

        if (setInsert.error) {
          setFeedback(`Workout log partially saved: ${setInsert.error.message}`);
          break;
        }
      }
    }

    const selectedDifficulty = dayDifficulty[dayId] ?? "just_right";
    await supabase.from("workout_day_feedback").insert({
      user_id: user.id,
      program_id: program.id,
      program_day_id: dayId,
      session_id: createdSessionId,
      difficulty: selectedDifficulty,
    } as never);

    setCompletedDayIds((prev) => [...prev, dayId]);
  };

  const swapExercise = async (
    programDayExerciseId: string,
    nextExerciseId: string,
    dayId: string,
  ) => {
    const supabase = getSupabaseClient();
    if (!supabase || !program) {
      return;
    }
    const updateResult = await supabase
      .from("program_day_exercises")
      .update({ exercise_id: nextExerciseId } as never)
      .eq("id", programDayExerciseId);

    if (updateResult.error) {
      setFeedback(`Could not swap exercise: ${updateResult.error.message}`);
      return;
    }

    await loadPlan();
    setFeedback(`Exercise swapped for ${program.program_days.find((d) => d.id === dayId)?.name ?? "day"}.`);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-gray-900">
        <p>Loading your plan...</p>
      </main>
    );
  }

  const completedCount = completedDayIds.length;
  const totalDays = program?.program_days.length ?? 0;

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-gray-900">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_-20px_26px_-22px_rgba(168,85,247,0.55)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">My Plan</h1>
            <p className="mt-2 text-sm text-gray-600">
              {program
                ? `${completedCount} of ${totalDays} workout days completed this cycle.`
                : "No plan yet. Generate your starter plan based on setup."}
            </p>
            {preferredSessionMinutes ? (
              <p className="mt-1 text-xs text-gray-500">
                Preferred session duration: {preferredSessionMinutes} minutes
              </p>
            ) : null}
            {needsRegeneration ? (
              <p className="mt-1 text-xs text-[#ffb3b3]">
                Your preferences changed. Regenerate plan to apply updates.
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/setup"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400"
            >
              Setup
            </Link>
            <Link
              href="/preferences"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400"
            >
              Preferences
            </Link>
            <button
              type="button"
              onClick={generatePlan}
              disabled={generating}
              className="rounded-lg bg-violet-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {generating ? "Generating..." : program ? "Regenerate Plan" : "Generate Plan"}
            </button>
          </div>
        </div>

        {!program ? (
          <div className="mt-8 rounded-xl border border-dashed border-zinc-700 bg-zinc-950 p-6 text-center">
            <p className="text-zinc-300">No starter plan found for your account yet.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {program.program_days
              .slice()
              .sort((a, b) => a.day_index - b.day_index)
              .map((day) => {
                const completed = completedDayIds.includes(day.id);
                const estimatedMinutes = estimateDayMinutes(day);
                const durationBadge = getDurationBadge(
                  estimatedMinutes,
                  preferredSessionMinutes,
                );
                return (
                  <section
                    key={day.id}
                    className={`rounded-xl border p-4 ${
                      completed
                        ? "border-[#CCFF00]/60 bg-[#CCFF00]/10 text-zinc-500"
                        : "border-zinc-700 bg-zinc-950 text-zinc-500"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold">
                          {day.name ?? `Day ${day.day_index + 1}`}
                        </h2>
                        <p className="mt-1 text-xs text-zinc-400">
                          Estimated duration: {estimatedMinutes} min
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full border px-2 py-1 text-xs font-medium ${durationBadge.className}`}
                        >
                          {durationBadge.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => void toggleCompleteDay(day.id)}
                          className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                            completed
                              ? "border border-[#CCFF00]/70 text-[#CCFF00] hover:bg-[#CCFF00]/10"
                              : "border border-zinc-600 text-zinc-100 hover:border-zinc-400"
                          }`}
                        >
                          {completed ? "Completed" : "Mark Complete"}
                        </button>
                        <Link
                          href={`/workout?dayId=${day.id}`}
                          className="rounded-md border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-200 hover:border-zinc-400"
                        >
                          Start Workout
                        </Link>
                      </div>
                    </div>
                    <div className="mb-3 flex items-center gap-2 text-xs">
                      <span className="text-zinc-400">How did this session feel?</span>
                      {(
                        [
                          ["too_easy", "Too easy"],
                          ["just_right", "Just right"],
                          ["too_hard", "Too hard"],
                        ] as const
                      ).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setDayDifficulty((prev) => ({
                              ...prev,
                              [day.id]: value,
                            }))
                          }
                          className={`rounded-full border px-2 py-1 ${
                            (dayDifficulty[day.id] ?? "just_right") === value
                              ? "border-violet-300 text-violet-200"
                              : "border-zinc-700 text-zinc-400"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <ul className="space-y-2">
                      {day.program_day_exercises
                        .slice()
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((exercise) => (
                          <li
                            key={exercise.id}
                            className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2"
                          >
                            <p className="font-medium">
                              {exercise.exercises?.name ?? "Exercise"}
                            </p>
                            <p className="mt-1 text-sm text-zinc-400">
                              {exercise.target_sets ?? 0} sets x {exercise.target_reps_min ?? 0}-
                              {exercise.target_reps_max ?? 0} reps, rest{" "}
                              {exercise.rest_seconds ?? 0}s
                            </p>
                            {nextWeightSuggestion[exercise.exercise_id] ? (
                              <p className="mt-1 text-xs text-[#CCFF00]">
                                Suggested progression: {nextWeightSuggestion[exercise.exercise_id]}
                              </p>
                            ) : null}
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              <label className="flex items-center gap-2 text-sm text-zinc-300">
                                <span>Weight (lbs)</span>
                                <input
                                  type="number"
                                  min={0}
                                  step={2.5}
                                  value={exerciseWeights[exercise.id] ?? ""}
                                  onChange={(event) =>
                                    setExerciseWeights((prev) => ({
                                      ...prev,
                                      [exercise.id]: event.target.value,
                                    }))
                                  }
                                  disabled={bodyweightOnly[exercise.id]}
                                  className="w-24 rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100 disabled:opacity-50"
                                />
                              </label>
                              <label className="flex items-center gap-2 text-sm text-zinc-300">
                                <input
                                  type="checkbox"
                                  checked={bodyweightOnly[exercise.id] ?? false}
                                  onChange={(event) =>
                                    setBodyweightOnly((prev) => ({
                                      ...prev,
                                      [exercise.id]: event.target.checked,
                                    }))
                                  }
                                  className="h-4 w-4 accent-violet-400"
                                />
                                Bodyweight only
                              </label>
                              <label className="flex items-center gap-2 text-sm text-zinc-300">
                                <span>Swap</span>
                                <select
                                  defaultValue=""
                                  onChange={(event) => {
                                    if (!event.target.value) {
                                      return;
                                    }
                                    void swapExercise(exercise.id, event.target.value, day.id);
                                  }}
                                  className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-100"
                                >
                                  <option value="">Pick exercise</option>
                                  {swapOptions
                                    .filter((option) => option.id !== exercise.exercise_id)
                                    .slice(0, 30)
                                    .map((option) => (
                                      <option key={option.id} value={option.id}>
                                        {option.name}
                                      </option>
                                    ))}
                                </select>
                              </label>
                            </div>
                          </li>
                        ))}
                    </ul>
                  </section>
                );
              })}
          </div>
        )}

        {feedback ? (
          <p className="mt-4 rounded-lg border border-[#E60000]/60 bg-[#E60000]/10 px-3 py-2 text-sm text-[#ffb3b3]">
            {feedback}
          </p>
        ) : null}
      </div>
    </main>
  );
}
