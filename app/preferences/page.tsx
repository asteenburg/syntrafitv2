"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

type SetupPreferenceRow = {
  primary_goal: string;
  equipment_type: string;
  days_per_week: number;
  session_minutes: number;
  experience_level: "beginner" | "intermediate" | "advanced";
  preferred_split: string;
  injury_notes: string | null;
  disliked_exercises: string[] | null;
};

export default function PreferencesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [sessionMinutes, setSessionMinutes] = useState(45);

  const [experienceLevel, setExperienceLevel] = useState<
    "beginner" | "intermediate" | "advanced"
  >("intermediate");

  const [preferredSplit, setPreferredSplit] = useState("full-body");
  const [injuryNotes, setInjuryNotes] = useState("");
  const [dislikedExercises, setDislikedExercises] = useState<string[]>([]);

  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const loadPreferences = async () => {
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
          "days_per_week, session_minutes, experience_level, preferred_split, injury_notes, disliked_exercises",
        )
        .eq("user_id", user.id)
        .maybeSingle();

      const saved = data as any;

      if (saved) {
        setDaysPerWeek(saved.days_per_week);
        setSessionMinutes(saved.session_minutes);

        if (saved.experience_level) {
          const level = Array.isArray(saved.experience_level)
            ? saved.experience_level[0]
            : saved.experience_level;
          setExperienceLevel(level);
        }

        if (saved.preferred_split) {
          const split = Array.isArray(saved.preferred_split)
            ? saved.preferred_split[0]
            : saved.preferred_split;
          setPreferredSplit(split);
        }

        if (saved.injury_notes) setInjuryNotes(saved.injury_notes);
        setDislikedExercises(saved.disliked_exercises ?? []);
      }

      setLoading(false);
    };

    void loadPreferences();
  }, [router]);

  const onSave = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setFeedback("Supabase configuration missing.");
      return;
    }

    setSaving(true);
    setFeedback("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      router.replace("/auth");
      return;
    }

    const { data: current } = await supabase
      .from("user_setup_preferences")
      .select("primary_goal, equipment_type")
      .eq("user_id", user.id)
      .maybeSingle();

    const { error } = await (
      supabase.from("user_setup_preferences") as any
    ).upsert(
      {
        user_id: user.id,
        primary_goal: (current as any)?.primary_goal ?? "Build muscle",
        equipment_type: (current as any)?.equipment_type ?? "Full gym",
        days_per_week: daysPerWeek,
        session_minutes: sessionMinutes,
        experience_level: experienceLevel,
        preferred_split: preferredSplit,
        injury_notes: injuryNotes.trim() || null,
        disliked_exercises: dislikedExercises,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      setFeedback(`Error: ${error.message}`);
    } else {
      setFeedback("Preferences calibrated successfully.");
    }
    setSaving(false);
  };

  // --- STYLING CONSTANTS ---
  const inputBg =
    "bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/50 focus:ring-violet-500/20";
  const labelText =
    "text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 block";

  if (loading) {
    return (
      <main className='flex min-h-screen items-center justify-center bg-zinc-950 text-violet-400'>
        <div className='flex flex-col items-center gap-4'>
          <div className='h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent' />
          <p className='font-mono text-xs tracking-widest uppercase'>
            Initializing Interface...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-zinc-950 px-6 py-12 text-zinc-100 selection:bg-violet-500/30'>
      {/* Background Glow Effect */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-violet-900/20 blur-[120px] rounded-full' />
      </div>

      <div className='relative mx-auto w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 sm:p-12 backdrop-blur-xl shadow-2xl shadow-black'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-10 border-b border-zinc-800/50'>
          <div>
            <div className='flex items-center gap-2 mb-2'>
              <div className='h-1 w-8 bg-violet-500' />
              <p className='text-[10px] font-black tracking-[0.3em] text-violet-400 uppercase'>
                System Config
              </p>
            </div>
            <h1 className='text-4xl font-extrabold tracking-tighter text-white'>
              Preferences
            </h1>
            <p className='mt-2 text-sm text-zinc-500 font-medium'>
              Fine-tune the algorithm for your workout pacing.
            </p>
          </div>
          <Link
            href='/setup'
            className='inline-flex items-center justify-center rounded-xl border border-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all active:scale-95'
          >
            ← Back to setup
          </Link>
        </div>

        <div className='mt-10 space-y-8'>
          {/* SLIDERS */}
          <div className='grid gap-8 sm:grid-cols-2'>
            <label className='block'>
              <span className={labelText}>
                Days per week:{" "}
                <span className='text-violet-400 font-mono text-sm ml-1'>
                  {daysPerWeek}
                </span>
              </span>
              <input
                type='range'
                min={2}
                max={7}
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                className='w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500'
              />
            </label>

            <label className='block'>
              <span className={labelText}>
                Session:{" "}
                <span className='text-violet-400 font-mono text-sm ml-1'>
                  {sessionMinutes}m
                </span>
              </span>
              <input
                type='range'
                min={20}
                max={120}
                step={5}
                value={sessionMinutes}
                onChange={(e) => setSessionMinutes(Number(e.target.value))}
                className='w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500'
              />
            </label>
          </div>

          {/* SELECTS */}
          <div className='grid gap-6 sm:grid-cols-2'>
            <label className='block'>
              <span className={labelText}>Experience level</span>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as any)}
                className={`w-full rounded-xl border px-4 py-3 text-sm transition-all outline-none ${inputBg}`}
              >
                <option value='beginner'>Beginner</option>
                <option value='intermediate'>Intermediate</option>
                <option value='advanced'>Advanced</option>
              </select>
            </label>

            <label className='block'>
              <span className={labelText}>Preferred split</span>
              <select
                value={preferredSplit}
                onChange={(e) => setPreferredSplit(e.target.value)}
                className={`w-full rounded-xl border px-4 py-3 text-sm transition-all outline-none ${inputBg}`}
              >
                <option value='full-body'>Full body</option>
                <option value='upper-lower'>Upper / Lower</option>
                <option value='push-pull-legs'>Push / Pull / Legs</option>
              </select>
            </label>
          </div>

          {/* TEXT AREAS */}
          <label className='block'>
            <span className={labelText}>Injuries or limitations</span>
            <textarea
              rows={3}
              value={injuryNotes}
              onChange={(e) => setInjuryNotes(e.target.value)}
              placeholder='e.g. Lower back sensitivity'
              className={`w-full rounded-xl border px-4 py-3 text-sm transition-all outline-none resize-none ${inputBg}`}
            />
          </label>

          <label className='block'>
            <span className={labelText}>Disliked exercises</span>
            <input
              value={dislikedExercises.join(", ")}
              onChange={(e) =>
                setDislikedExercises(
                  e.target.value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                )
              }
              placeholder='Burpees, treadmill sprints'
              className={`w-full rounded-xl border px-4 py-3 text-sm transition-all outline-none ${inputBg}`}
            />
          </label>
        </div>

        {/* Footer & Actions */}
        <div className='mt-12'>
          <button
            type='button'
            onClick={onSave}
            disabled={saving}
            className='relative w-full overflow-hidden rounded-2xl bg-violet-600 px-6 py-4 font-black text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:bg-violet-500 hover:shadow-violet-500/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale'
          >
            <span className='relative z-10 uppercase tracking-widest text-sm'>
              {saving ? "Processing..." : "Save Preferences"}
            </span>
          </button>

          {feedback && (
            <div
              className={`mt-6 rounded-xl border px-4 py-3 text-center text-xs font-bold uppercase tracking-wider transition-all ${
                feedback.includes("Error")
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
