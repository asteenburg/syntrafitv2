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

        // Handle database returning array or single string for experience_level
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
      setFeedback("Supabase is not configured.");
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

    // Attempt to get existing goal/equipment
    const { data: current } = await supabase
      .from("user_setup_preferences")
      .select("primary_goal, equipment_type")
      .eq("user_id", user.id)
      .maybeSingle();

    // The Save Logic
    const { error } = await (
      supabase.from("user_setup_preferences") as any
    ).upsert(
      {
        user_id: user.id,
        primary_goal: (current as any)?.primary_goal ?? "Build muscle",
        equipment_type: (current as any)?.equipment_type ?? "Full gym",
        days_per_week: daysPerWeek,
        session_minutes: sessionMinutes,
        // ✅ No more brackets! Sending as plain strings now.
        experience_level: experienceLevel,
        preferred_split: preferredSplit,
        injury_notes: injuryNotes.trim() || null,
        // ✅ Keep this one as an array because it's a list of multiple items.
        disliked_exercises: dislikedExercises,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      setFeedback(`Error: ${error.message}`);
    } else {
      setFeedback("Preferences updated successfully!");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <main className='flex min-h-screen items-center justify-center bg-white text-gray-900'>
        <p>Loading your preferences...</p>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-white px-6 py-10 text-gray-900'>
      <div className='mx-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <h1 className='text-3xl font-bold'>Preferences</h1>
            <p className='mt-2 text-sm text-gray-600'>
              Fine-tune your workout pacing.
            </p>
          </div>
          <Link
            href='/setup'
            className='rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400'
          >
            Back to setup
          </Link>
        </div>

        <div className='mt-6 space-y-6'>
          <label className='block'>
            <span className='mb-2 block text-sm font-medium'>
              Days per week: {daysPerWeek}
            </span>
            <input
              type='range'
              min={2}
              max={7}
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(Number(e.target.value))}
              className='w-full accent-violet-400'
            />
          </label>

          <label className='block'>
            <span className='mb-2 block text-sm font-medium'>
              Session length: {sessionMinutes} min
            </span>
            <input
              type='range'
              min={20}
              max={120}
              step={5}
              value={sessionMinutes}
              onChange={(e) => setSessionMinutes(Number(e.target.value))}
              className='w-full accent-violet-400'
            />
          </label>

          <label className='block'>
            <span className='mb-2 block text-sm font-medium'>
              Experience level
            </span>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as any)}
              className='w-full rounded-lg border border-gray-300 bg-white px-3 py-2'
            >
              <option value='beginner'>Beginner</option>
              <option value='intermediate'>Intermediate</option>
              <option value='advanced'>Advanced</option>
            </select>
          </label>

          <label className='block'>
            <span className='mb-2 block text-sm font-medium'>
              Preferred split
            </span>
            <select
              value={preferredSplit}
              onChange={(e) => setPreferredSplit(e.target.value)}
              className='w-full rounded-lg border border-gray-300 bg-white px-3 py-2'
            >
              <option value='full-body'>Full body</option>
              <option value='upper-lower'>Upper / Lower</option>
              <option value='push-pull-legs'>Push / Pull / Legs</option>
            </select>
          </label>

          <label className='block'>
            <span className='mb-2 block text-sm font-medium'>
              Injuries or limitations
            </span>
            <textarea
              rows={3}
              value={injuryNotes}
              onChange={(e) => setInjuryNotes(e.target.value)}
              className='w-full rounded-lg border border-gray-300 bg-white px-3 py-2'
            />
          </label>

          <label className='block'>
            <span className='mb-2 block text-sm font-medium'>
              Disliked exercises
            </span>
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
              className='w-full rounded-lg border border-gray-300 bg-white px-3 py-2'
            />
          </label>
        </div>

        <button
          type='button'
          onClick={onSave}
          disabled={saving}
          className='mt-8 w-full rounded-lg bg-violet-400 px-4 py-3 font-semibold text-white'
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>

        {feedback && (
          <p className='mt-4 rounded-lg border border-[#CCFF00] bg-[#CCFF00]/50 px-3 py-2 text-sm text-zinc-500'>
            {feedback}
          </p>
        )}
      </div>
    </main>
  );
}
