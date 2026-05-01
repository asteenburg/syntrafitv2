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
        if (goals.includes(saved.primary_goal))
          setPrimaryGoal(saved.primary_goal);
        if (noEquipment.includes(saved.equipment_type)) {
          setTrainingEnvironment("no-equipment");
          setNoEquipmentType(saved.equipment_type);
        } else if (equipment.includes(saved.equipment_type)) {
          setTrainingEnvironment("equipment");
          setEquipmentType(saved.equipment_type);
        }
        if (saved.experience_level) setExperienceLevel(saved.experience_level);
        if (saved.preferred_split) setPreferredSplit(saved.preferred_split);
        if (saved.injury_notes) setInjuryNotes(saved.injury_notes || "");
        if (saved.disliked_exercises?.length)
          setDislikedExercises(saved.disliked_exercises.join(", "));
      }
      setLoading(false);
    };

    void checkSession();
  }, [router]);

  const onCreatePlan = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setFeedback("Supabase is not configured.");
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
        .map((v) => v.trim())
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

    setFeedback("Setup saved. Redirecting to your plan...");
    setSaving(false);
    router.push("/plan");
  };

  // --- STYLING HELPERS ---
  const getButtonStyles = (isActive: boolean) => {
    const base =
      "rounded-xl border px-4 py-3 text-left transition-all duration-200 text-sm font-medium focus:outline-none";
    const active =
      "border-violet-300 bg-violet-300/10 text-violet-700 ring-1 ring-violet-300";
    const inactive =
      "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50";
    return `${base} ${isActive ? active : inactive}`;
  };

  const labelStyles =
    "mb-3 block text-xs font-bold tracking-[0.15em] text-gray-400 uppercase";
  const inputStyles =
    "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 transition focus:border-violet-300 focus:ring-4 focus:ring-violet-500/5 outline-none";

  if (loading) {
    return (
      <main className='flex min-h-screen items-center justify-center bg-white text-gray-900'>
        <div className='flex flex-col items-center gap-2'>
          <div className='h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent' />
          <p className='text-sm font-medium text-gray-500'>
            Loading your setup...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-white px-6 py-10 text-gray-900'>
      {/* THE CARD WITH TOP SHADOW */}
      <div className='mx-auto w-full max-w-3xl rounded-2xl border border-gray-100 bg-white p-6 sm:p-10 shadow-[0_-24px_30px_-24px_rgba(168,85,247,0.4)]'>
        <div className='flex items-start justify-between gap-4 border-b border-gray-50 pb-8'>
          <div>
            <p className='text-xs font-bold tracking-[0.2em] text-violet-400 uppercase'>
              SYNTRAFIT SETUP
            </p>
            <h1 className='mt-2 text-3xl font-extrabold tracking-tight'>
              Let&apos;s build your training
            </h1>
            <p className='mt-2 text-sm text-gray-500 max-w-md'>
              Pick your main outcome and training environment. You can fine-tune
              details in your profile later.
            </p>
          </div>

          <Link
            href='/preferences'
            className='shrink-0 rounded-lg border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 transition'
          >
            Preferences
          </Link>
        </div>

        <div className='space-y-10 pt-10'>
          {/* GOALS */}
          <section>
            <label className={labelStyles}>Primary Goal</label>
            <div className='grid gap-3 sm:grid-cols-2'>
              {goals.map((goal) => (
                <button
                  key={goal}
                  type='button'
                  onClick={() => setPrimaryGoal(goal)}
                  className={getButtonStyles(primaryGoal === goal)}
                >
                  {goal}
                </button>
              ))}
            </div>
          </section>

          {/* ENVIRONMENT */}
          <section>
            <label className={labelStyles}>Training environment</label>
            <div className='grid gap-3 sm:grid-cols-2'>
              <button
                type='button'
                onClick={() => setTrainingEnvironment("equipment")}
                className={getButtonStyles(trainingEnvironment === "equipment")}
              >
                I have equipment
              </button>

              <button
                type='button'
                onClick={() => setTrainingEnvironment("no-equipment")}
                className={getButtonStyles(
                  trainingEnvironment === "no-equipment",
                )}
              >
                No equipment
              </button>
            </div>
          </section>

          {/* EXPERIENCE */}
          <section>
            <label className={labelStyles}>Experience level</label>
            <div className='grid gap-3 sm:grid-cols-3'>
              {(["beginner", "intermediate", "advanced"] as const).map(
                (level) => (
                  <button
                    key={level}
                    type='button'
                    onClick={() => setExperienceLevel(level)}
                    className={getButtonStyles(experienceLevel === level)}
                  >
                    <span className='capitalize'>{level}</span>
                  </button>
                ),
              )}
            </div>
          </section>

          {/* PREFERRED SPLIT */}
          <section>
            <label className={labelStyles}>Preferred split</label>
            <select
              value={preferredSplit}
              onChange={(e) => setPreferredSplit(e.target.value)}
              className={inputStyles}
            >
              <option value='full-body'>Full body</option>
              <option value='upper-lower'>Upper / Lower</option>
              <option value='push-pull-legs'>Push / Pull / Legs</option>
            </select>
          </section>

          {/* INJURY */}
          <section>
            <label className={labelStyles}>Injury Notes</label>
            <textarea
              value={injuryNotes}
              onChange={(e) => setInjuryNotes(e.target.value)}
              placeholder='Any physical limitations or old injuries?'
              rows={3}
              className={inputStyles}
            />
          </section>

          {/* DISLIKED */}
          <section>
            <label className={labelStyles}>Disliked Exercises</label>
            <input
              value={dislikedExercises}
              onChange={(e) => setDislikedExercises(e.target.value)}
              placeholder='Squats, Lunges, etc. (comma separated)'
              className={inputStyles}
            />
          </section>
        </div>

        {/* ACTIONS */}
        <div className='mt-12'>
          <button
            type='button'
            onClick={onCreatePlan}
            disabled={saving}
            className='w-full rounded-xl bg-violet-500 px-6 py-4 font-bold text-white shadow-lg shadow-violet-100 hover:bg-violet-600 active:scale-[0.99] transition-all disabled:opacity-50'
          >
            {saving ? "Creating your program..." : "Save Setup & Continue"}
          </button>

          {feedback && (
            <div
              className={`mt-6 rounded-xl p-4 text-center text-sm font-medium ${
                feedback.includes("Could not")
                  ? "bg-red-50 text-red-600"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              {feedback}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
