"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

// --- IMPORT EXTERNAL CONSTANTS ---
import {
  muscleGroupPools,
  equipmentPlans,
  noEquipmentPlans,
} from "@/lib/workoutConstants";

// --- TYPES ---
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
    id: string;
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

// --- HELPER FUNCTIONS ---

function buildExercisePool(goal: string, equipmentType: string) {
  const lowerGoal = goal.toLowerCase().trim();
  if (muscleGroupPools[lowerGoal]) return muscleGroupPools[lowerGoal];
  const source = equipmentType.includes("Bodyweight")
    ? noEquipmentPlans
    : equipmentPlans;
  return source[goal] ?? source["Build muscle"];
}

function buildRepScheme(goal: string) {
  const lower = goal.toLowerCase();
  if (lower.includes("strength"))
    return { sets: 5, minReps: 3, maxReps: 6, rest: 150 };
  if (lower.includes("endurance") || lower.includes("cardio"))
    return { sets: 3, minReps: 12, maxReps: 20, rest: 60 };
  return { sets: 4, minReps: 8, maxReps: 12, rest: 90 };
}

function estimateDayMinutes(day: PlanDay) {
  const warmupMinutes = 5;
  const seconds = day.program_day_exercises.reduce((total, exercise) => {
    const sets = exercise.target_sets ?? 3;
    const avgReps =
      ((exercise.target_reps_min ?? 8) + (exercise.target_reps_max ?? 12)) / 2;
    const workSeconds = sets * (avgReps * 4);
    const restSeconds = Math.max(0, sets - 1) * (exercise.rest_seconds ?? 60);
    return total + workSeconds + restSeconds + 45;
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
    return { label: "On target", className: "border-sky-500/50 text-sky-400" };
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
  const [swapOptions, setSwapOptions] = useState<ExerciseOption[]>([]);

  const loadPlan = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/auth");
      return;
    }

    const { data: prefs } = await (supabase
      .from("user_setup_preferences")
      .select("session_minutes")
      .eq("user_id", user.id)
      .maybeSingle() as any);
    if (prefs) setPreferredSessionMinutes(prefs.session_minutes);

    const { data: planData } = await supabase
      .from("programs")
      .select(
        `
  id, name, description,
  program_days (
    id, day_index, name,
    program_day_exercises (
      id, exercise_id, order_index, target_sets, target_reps_min, target_reps_max, rest_seconds, notes,
      exercises ( id, name )
    )
  )
`,
      )
      .eq("owner_id", user.id)
      .eq("name", "Starter Plan")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentProgram = planData as unknown as Program | null;
    setProgram(currentProgram);

    if (currentProgram) {
      const weights: Record<string, string> = {};
      const bw: Record<string, boolean> = {};
      currentProgram.program_days.forEach((day) => {
        day.program_day_exercises.forEach((ex) => {
          weights[ex.id] = "";
          bw[ex.id] =
            ex.exercises?.name?.toLowerCase().includes("bodyweight") ?? false;
        });
      });
      setExerciseWeights(weights);
      setBodyweightOnly(bw);

      const { data: comp } = await supabase
        .from("program_day_completions")
        .select("program_day_id")
        .eq("user_id", user.id);
      if (comp) setCompletedDayIds(comp.map((r) => r.program_day_id));
    }

    const { data: exData } = await supabase
      .from("exercises")
      .select("id, name")
      .order("name", { ascending: true })
      .limit(50);
    if (exData) setSwapOptions(exData as unknown as ExerciseOption[]);

    setLoading(false);
  }, [router]);

  const generatePlan = async () => {
    setGenerating(true);
    setFeedback("Calibrating Neural Pathways...");
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: prefs } = await (supabase
      .from("user_setup_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single() as any);
    if (!prefs) {
      setFeedback("Setup preferences required.");
      setGenerating(false);
      return;
    }

    const pool = buildExercisePool(prefs.primary_goal, prefs.equipment_type);
    const scheme = buildRepScheme(prefs.primary_goal);

    await supabase
      .from("programs")
      .delete()
      .eq("owner_id", user.id)
      .eq("name", "Starter Plan");

    const { data: newProg } = await (supabase
      .from("programs")
      .insert({
        owner_id: user.id,
        name: "Starter Plan",
        description: `Generated for ${prefs.primary_goal}`,
      })
      .select()
      .single() as any);

    if (newProg) {
      for (let i = 0; i < prefs.days_per_week; i++) {
        const { data: day } = await (supabase
          .from("program_days")
          .insert({
            program_id: newProg.id,
            day_index: i,
            name: `Unit ${i + 1}`,
          })
          .select()
          .single() as any);

        if (day) {
          const selected = [...pool]
            .sort(() => 0.5 - Math.random())
            .slice(0, 5);
          for (let j = 0; j < selected.length; j++) {
            const { data: ex } = await (supabase
              .from("exercises")
              .select("id")
              .eq("name", selected[j])
              .maybeSingle() as any);
            if (ex) {
              await supabase.from("program_day_exercises").insert({
                program_day_id: day.id,
                exercise_id: ex.id,
                order_index: j,
                target_sets: scheme.sets,
                target_reps_min: scheme.minReps,
                target_reps_max: scheme.maxReps,
                rest_seconds: scheme.rest,
              });
            }
          }
        }
      }
    }
    await loadPlan();
    setGenerating(false);
    setFeedback("Neural Link Established.");
  };

  const toggleCompleteDay = async (dayId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    if (completedDayIds.includes(dayId)) {
      await supabase
        .from("program_day_completions")
        .delete()
        .eq("user_id", user.id)
        .eq("program_day_id", dayId);
      setCompletedDayIds((prev) => prev.filter((id) => id !== dayId));
    } else {
      await supabase.from("program_day_completions").insert({
        user_id: user.id,
        program_day_id: dayId,
        program_id: program?.id,
      });
      setCompletedDayIds((prev) => [...prev, dayId]);
    }
  };

  const swapExercise = async (dayExerciseId: string, newExerciseId: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase
      .from("program_day_exercises")
      .update({ exercise_id: newExerciseId })
      .eq("id", dayExerciseId);
    void loadPlan();
  };

  useEffect(() => {
    void loadPlan();
  }, [loadPlan]);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get("recalibrate") === "true") {
      window.history.replaceState(null, "", window.location.pathname);
      void generatePlan();
    }
  }, []);

  const completedCount =
    program?.program_days.filter((d) => completedDayIds.includes(d.id))
      .length ?? 0;
  const totalDays = program?.program_days.length ?? 0;

  return (
    <main className='min-h-screen bg-zinc-950 px-6 py-12 text-zinc-100'>
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-[5%] -right-[5%] w-[35%] h-[35%] bg-violet-600/10 blur-[120px] rounded-full' />
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
              className='rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-2 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all'
            >
              Setup
            </Link>
            <button
              onClick={generatePlan}
              disabled={generating}
              className='rounded-xl bg-violet-600 px-6 py-2 text-xs font-black uppercase tracking-widest text-white hover:bg-violet-500 transition-all shadow-lg shadow-violet-900/20'
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
          <div className='py-20 text-center border border-dashed border-zinc-800 rounded-3xl'>
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
                    className={`group rounded-2xl border transition-all p-6 ${completed ? "bg-zinc-950/50 border-zinc-900 opacity-60" : "bg-zinc-900 border-zinc-800 shadow-xl"}`}
                  >
                    <div className='flex items-center justify-between mb-6'>
                      <div>
                        <h2
                          className={`text-xl font-black ${completed ? "text-zinc-600 line-through" : "text-zinc-100"}`}
                        >
                          {day.name}
                        </h2>
                        <div className='flex items-center gap-3 mt-1'>
                          <span
                            className={`text-[10px] font-mono border rounded-full px-2 py-0.5 uppercase ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                          <span className='text-[10px] font-mono text-zinc-600'>
                            {estimated} min est.
                          </span>
                        </div>
                      </div>
                      <div className='flex gap-2'>
                        <button
                          onClick={() => toggleCompleteDay(day.id)}
                          className={`rounded-lg px-4 py-2 text-[10px] font-black uppercase tracking-widest border transition-all ${completed ? "border-green-500/50 text-green-400 bg-green-500/10" : "border-zinc-700 text-zinc-400 hover:border-white"}`}
                        >
                          {completed ? "Done" : "Mark Done"}
                        </button>
                        <Link
                          href={`/workout?dayId=${day.id}`}
                          className='rounded-lg bg-zinc-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-950 hover:bg-white transition-all'
                        >
                          Start
                        </Link>
                      </div>
                    </div>

                    <div className='space-y-3'>
                      {day.program_day_exercises.map((ex) => (
                        <div
                          key={ex.id}
                          className='flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800/50 bg-zinc-950/30 p-4 transition-all hover:border-zinc-700'
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
                              className='w-20 rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-center text-xs font-bold text-white outline-none focus:border-violet-500/50'
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
                              className='bg-transparent text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white cursor-pointer outline-none'
                              onChange={(e) =>
                                swapExercise(ex.id, e.target.value)
                              }
                              value=''
                            >
                              <option value=''>Swap</option>
                              {swapOptions.map((opt) => (
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
            <p className='text-center font-mono text-[10px] text-violet-400 uppercase tracking-widest italic'>
              {feedback}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
