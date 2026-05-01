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
      setFeedback("Supabase configuration missing.");
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

    setFeedback("Initialization complete. Redirecting...");
    setSaving(false);
    router.push("/plan");
  };

  // --- STYLING HELPERS ---
  const getButtonStyles = (isActive: boolean) => {
    const base =
      "rounded-xl border px-4 py-3 text-left transition-all duration-200 text-sm font-medium focus:outline-none";
    const active =
      "border-violet-500/50 bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/50 shadow-[0_0_15px_rgba(139,92,246,0.1)]";
    const inactive =
      "border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300";
    return `${base} ${isActive ? active : inactive}`;
  };

  const labelStyles =
    "mb-3 block text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase";
  const inputStyles =
    "w-full rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-100 transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/5 outline-none placeholder:text-zinc-700";

  if (loading) {
    return (
      <main className='flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100'>
        <div className='flex flex-col items-center gap-4'>
          <div className='h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent' />
          <p className='font-mono text-[10px] tracking-widest uppercase text-violet-400'>
            Syncing Protocol...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-zinc-950 px-6 py-12 text-zinc-100 selection:bg-violet-500/30'>
      {/* Background Ambient Glow */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-[5%] -right-[5%] w-[35%] h-[35%] bg-violet-900/10 blur-[100px] rounded-full' />
      </div>

      <div className='relative mx-auto w-full max-w-3xl rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 sm:p-12 backdrop-blur-xl shadow-[0_-24px_50px_-24px_rgba(168,85,247,0.2)]'>
        <div className='flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-zinc-800/50 pb-10'>
          <div>
            <div className='flex items-center gap-2 mb-2'>
              <div className='h-1 w-6 bg-violet-500' />
              <p className='text-[10px] font-black tracking-[0.3em] text-violet-400 uppercase'>
                SyntraFit OS
              </p>
            </div>
            <h1 className='text-4xl font-extrabold tracking-tighter text-white'>
              Initialize Training
            </h1>
            <p className='mt-2 text-sm text-zinc-500 max-w-md font-medium leading-relaxed'>
              Define your primary objectives and training parameters. The
              algorithm will adapt to your environment.
            </p>
          </div>

          <Link
            href='/preferences'
            className='shrink-0 rounded-xl border border-zinc-800 px-5 py-2.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-95'
          >
            Preferences
          </Link>
        </div>

        <div className='space-y-12 pt-12'>
          {/* GOALS */}
          <section>
            <label className={labelStyles}>Mission Objective</label>
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
            <label className={labelStyles}>Operational Environment</label>
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
                Zero equipment
              </button>
            </div>
          </section>

          {/* EXPERIENCE */}
          <section>
            <label className={labelStyles}>Skill Level</label>
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
            <label className={labelStyles}>Preferred Split Architecture</label>
            <select
              value={preferredSplit}
              onChange={(e) => setPreferredSplit(e.target.value)}
              className={inputStyles}
            >
              <option
                className='bg-zinc-950'
                value='full-body'
              >
                Full body
              </option>
              <option
                className='bg-zinc-950'
                value='upper-lower'
              >
                Upper / Lower
              </option>
              <option
                className='bg-zinc-950'
                value='push-pull-legs'
              >
                Push / Pull / Legs
              </option>
            </select>
          </section>

          <div className='grid gap-8 sm:grid-cols-2'>
            {/* INJURY */}
            <section>
              <label className={labelStyles}>Structural Limitations</label>
              <textarea
                value={injuryNotes}
                onChange={(e) => setInjuryNotes(e.target.value)}
                placeholder='List injuries...'
                rows={3}
                className={`${inputStyles} resize-none`}
              />
            </section>

            {/* DISLIKED */}
            <section>
              <label className={labelStyles}>Exercise Blacklist</label>
              <textarea
                value={dislikedExercises}
                onChange={(e) => setDislikedExercises(e.target.value)}
                placeholder='Squats, burpees...'
                rows={3}
                className={`${inputStyles} resize-none`}
              />
            </section>
          </div>
        </div>

        {/* ACTIONS */}
        <div className='mt-16'>
          <button
            type='button'
            onClick={onCreatePlan}
            disabled={saving}
            className='relative w-full overflow-hidden rounded-2xl bg-violet-600 px-6 py-5 font-black text-white shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:bg-violet-500 hover:shadow-violet-500/50 active:scale-[0.98] transition-all disabled:opacity-50'
          >
            <span className='relative z-10 uppercase tracking-[0.2em] text-sm'>
              {saving ? "Calibrating..." : "Finalize & Generate Program"}
            </span>
          </button>

          {feedback && (
            <div
              className={`mt-6 rounded-xl border px-4 py-3 text-center text-xs font-bold uppercase tracking-wider ${
                feedback.includes("Could not")
                  ? "border-red-900/50 bg-red-950/30 text-red-400"
                  : "border-emerald-900/50 bg-emerald-950/30 text-emerald-400"
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
