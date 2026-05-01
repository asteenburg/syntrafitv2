"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

const goals = [
  "Build muscle",
  "Lose fat",
  "Improve endurance",
  "Increase strength",
];

const equipment = [
  "Full gym",
  "Dumbbells only",
  "Barbell only",
  "Kettlebells only",
  "Resistance bands only",
  "Other",
  "Home gym",
  "Swiss ball only",
  "Medicine ball only",
];

const noEquipment = [
  "Bodyweight only",
  "Cardio only",
  "Yoga only",
  "Pilates only",
  "Other",
];

type SetupPreferenceRow = {
  primary_goal: string;
  equipment_type: string;
  experience_level: "beginner" | "intermediate" | "advanced";
  injury_notes: string | null;
  preferred_split: string;
  disliked_exercises: string[] | null;
};

export default function SetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [primaryGoal, setPrimaryGoal] = useState(goals[0]);
  const [equipmentType, setEquipmentType] = useState(equipment[0]);

  const [trainingEnvironment, setTrainingEnvironment] = useState<
    "equipment" | "no-equipment"
  >("equipment");

  const [noEquipmentType, setNoEquipmentType] = useState(noEquipment[0]);

  const [experienceLevel, setExperienceLevel] = useState<
    "beginner" | "intermediate" | "advanced"
  >("intermediate");

  const [preferredSplit, setPreferredSplit] = useState("full-body");
  const [injuryNotes, setInjuryNotes] = useState("");
  const [dislikedExercises, setDislikedExercises] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const checkSession = async () => {
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

      const { data } = await supabase
        .from("user_setup_preferences")
        .select(
          "primary_goal, equipment_type, experience_level, preferred_split, injury_notes, disliked_exercises",
        )
        .eq("user_id", user.id)
        .maybeSingle();

      const saved = data as SetupPreferenceRow | null;

      if (saved) {
        if (goals.includes(saved.primary_goal)) {
          setPrimaryGoal(saved.primary_goal);
        }

        if (noEquipment.includes(saved.equipment_type)) {
          setTrainingEnvironment("no-equipment");
          setNoEquipmentType(saved.equipment_type);
        } else if (equipment.includes(saved.equipment_type)) {
          setTrainingEnvironment("equipment");
          setEquipmentType(saved.equipment_type);
        }

        if (saved.experience_level) {
          setExperienceLevel(saved.experience_level);
        }

        if (saved.preferred_split) {
          setPreferredSplit(saved.preferred_split);
        }

        if (saved.injury_notes) {
          setInjuryNotes(saved.injury_notes);
        }

        if (saved.disliked_exercises?.length) {
          setDislikedExercises(saved.disliked_exercises.join(", "));
        }
      }

      setLoading(false);
    };

    void checkSession();
  }, [router]);

  const onCreatePlan = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setFeedback("Supabase is not configured. Add values in .env.local.");
      return;
    }

    setSaving(true);
    setFeedback("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setFeedback("Your session expired. Please log in again.");
      setSaving(false);
      router.replace("/auth");
      return;
    }

    const payload = {
      user_id: user.id,
      primary_goal: primaryGoal,
      days_per_week: 4,
      session_minutes: 45,
      equipment_type:
        trainingEnvironment === "no-equipment"
          ? noEquipmentType
          : equipmentType,
      experience_level: experienceLevel,
      preferred_split: preferredSplit,
      injury_notes: injuryNotes.trim() || null,
      disliked_exercises: dislikedExercises
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    };

    const { error } = await supabase
      .from("user_setup_preferences")
      .upsert(payload as any, { onConflict: "user_id" });

    if (error) {
      setFeedback(`Could not save setup: ${error.message}`);
      setSaving(false);
      return;
    }

    setFeedback(
      "Setup saved. Next step is generating your starter weekly program automatically.",
    );
    setSaving(false);
    router.push("/plan");
  }; // <--- Fixed the missing bracket for onCreatePlan here

  if (loading) {
    return (
      <main className='flex min-h-screen items-center justify-center bg-white text-gray-900'>
        <p>Loading your setup...</p>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-white px-6 py-10 text-gray-900'>
      <div className='mx-auto w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_-24px_30px_-24px_rgba(168,85,247,0.8)]'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <p className='text-xs font-semibold tracking-[0.18em] text-violet-300'>
              SYNTRAFIT SETUP
            </p>
            <h1 className='mt-2 text-3xl font-bold'>
              Let&apos;s build your training
            </h1>
            <p className='mt-2 text-sm text-gray-600'>
              Pick your main outcome and training environment. You can fine-tune
              days and session length later in Preferences.
            </p>
          </div>

          <Link
            href='/preferences'
            className='rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400'
          >
            Preferences
          </Link>
        </div>

        {/* GOALS */}
        <div className='mt-8'>
          <p className='mb-3 text-sm font-semibold text-zinc-300'>
            Primary goal
          </p>
          <div className='grid gap-3 sm:grid-cols-2'>
            {goals.map((goal) => (
              <button
                key={goal}
                type='button'
                onClick={() => setPrimaryGoal(goal)}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  primaryGoal === goal
                    ? "border-violet-300 bg-violet-300/10 text-violet-100"
                    : "border-zinc-700 bg-zinc-950 text-zinc-200 hover:border-zinc-500"
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>

        {/* ENVIRONMENT */}
        <div className='mt-6'>
          <p className='mb-3 text-sm font-semibold text-zinc-300'>
            Training environment
          </p>
          <div className='grid gap-3 sm:grid-cols-2'>
            <button
              type='button'
              onClick={() => setTrainingEnvironment("equipment")}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                trainingEnvironment === "equipment"
                  ? "border-violet-300 bg-violet-300/10 text-violet-100"
                  : "border-zinc-700 bg-zinc-950 text-zinc-200"
              }`}
            >
              I have equipment
            </button>

            <button
              type='button'
              onClick={() => setTrainingEnvironment("no-equipment")}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                trainingEnvironment === "no-equipment"
                  ? "border-violet-300 bg-violet-300/10 text-violet-100"
                  : "border-zinc-700 bg-zinc-950 text-zinc-200"
              }`}
            >
              No equipment
            </button>
          </div>
        </div>

        {/* EXPERIENCE */}
        <div className='mt-6'>
          <p className='mb-3 text-sm font-semibold text-zinc-300'>
            Experience level
          </p>
          <div className='grid gap-3 sm:grid-cols-3'>
            {(["beginner", "intermediate", "advanced"] as const).map(
              (level) => (
                <button
                  key={level}
                  type='button'
                  onClick={() => setExperienceLevel(level)}
                  className={`rounded-xl border px-4 py-3 capitalize ${
                    experienceLevel === level
                      ? "border-violet-300 bg-violet-300/10 text-violet-100"
                      : "border-zinc-700 bg-zinc-950 text-zinc-200"
                  }`}
                >
                  {level}
                </button>
              ),
            )}
          </div>
        </div>

        {/* SPLIT */}
        <div className='mt-6'>
          <p className='mb-3 text-sm font-semibold text-zinc-300'>
            Preferred split
          </p>
          <select
            value={preferredSplit}
            onChange={(e) => setPreferredSplit(e.target.value)}
            className='w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100'
          >
            <option value='full-body'>Full body</option>
            <option value='upper-lower'>Upper / Lower</option>
            <option value='push-pull-legs'>Push / Pull / Legs</option>
          </select>
        </div>

        {/* INJURY */}
        <div className='mt-6'>
          <textarea
            value={injuryNotes}
            onChange={(e) => setInjuryNotes(e.target.value)}
            rows={3}
            className='w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100'
          />
        </div>

        {/* DISLIKED */}
        <div className='mt-6'>
          <input
            value={dislikedExercises}
            onChange={(e) => setDislikedExercises(e.target.value)}
            className='w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100'
          />
        </div>

        {/* SAVE */}
        <button
          type='button'
          onClick={onCreatePlan}
          disabled={saving}
          className='mt-8 w-full rounded-lg bg-violet-400 px-4 py-3 font-semibold text-zinc-950'
        >
          {saving ? "Saving setup..." : "Save Setup & Continue"}
        </button>

        {feedback ? (
          <p className='mt-4 text-sm text-red-400'>{feedback}</p>
        ) : null}
      </div>
    </main>
  );
}
