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
  const [dislikedExercises, setDislikedExercises] = useState("");
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

      const saved = data as Pick<
        SetupPreferenceRow,
        | "days_per_week"
        | "session_minutes"
        | "experience_level"
        | "preferred_split"
        | "injury_notes"
        | "disliked_exercises"
      > | null;

      if (saved) {
        setDaysPerWeek(saved.days_per_week);
        setSessionMinutes(saved.session_minutes);
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

    void loadPreferences();
  }, [router]);

  const onSave = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setFeedback("Supabase is not configured. Add values in .env.local.");
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

    const currentRow = await supabase
      .from("user_setup_preferences")
      .select("primary_goal, equipment_type")
      .eq("user_id", user.id)
      .maybeSingle();

    const current = currentRow.data as Pick<
      SetupPreferenceRow,
      "primary_goal" | "equipment_type"
    > | null;

    const { error } = await supabase.from("user_setup_preferences").upsert(
      {
        user_id: user.id,
        primary_goal: current?.primary_goal ?? "Build muscle",
        equipment_type: current?.equipment_type ?? "Full gym",
        days_per_week: daysPerWeek,
        session_minutes: sessionMinutes,
        experience_level: experienceLevel,
        preferred_split: preferredSplit,
        injury_notes: injuryNotes.trim() || null,
        disliked_exercises: dislikedExercises
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      } as never,
      { onConflict: "user_id" },
    );

    if (error) {
      setFeedback(`Could not save preferences: ${error.message}`);
      setSaving(false);
      return;
    }

    setFeedback("Preferences updated.");
    setSaving(false);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-gray-900">
        <p>Loading your preferences...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-10 text-gray-900">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_-16px_22px_-22px_rgba(168,85,247,0.35)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Preferences</h1>
            <p className="mt-2 text-sm text-gray-600">
              Fine-tune your workout pacing and weekly frequency.
            </p>
          </div>
          <Link
            href="/setup"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400"
          >
            Back to setup
          </Link>
        </div>

        <div className="mt-6 space-y-6">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              Days per week: {daysPerWeek}
            </span>
            <input
              type="range"
              min={2}
              max={7}
              step={1}
              value={daysPerWeek}
              onChange={(e) => setDaysPerWeek(Number(e.target.value))}
              className="w-full accent-violet-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">
              Session length: {sessionMinutes} min
            </span>
            <input
              type="range"
              min={20}
              max={120}
              step={5}
              value={sessionMinutes}
              onChange={(e) => setSessionMinutes(Number(e.target.value))}
              className="w-full accent-violet-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Experience level</span>
            <select
              value={experienceLevel}
              onChange={(event) =>
                setExperienceLevel(
                  event.target.value as "beginner" | "intermediate" | "advanced",
                )
              }
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Preferred split</span>
            <select
              value={preferredSplit}
              onChange={(event) => setPreferredSplit(event.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
            >
              <option value="full-body">Full body</option>
              <option value="upper-lower">Upper / Lower</option>
              <option value="push-pull-legs">Push / Pull / Legs</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Injuries or limitations</span>
            <textarea
              rows={3}
              value={injuryNotes}
              onChange={(event) => setInjuryNotes(event.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Disliked exercises</span>
            <input
              value={dislikedExercises}
              onChange={(event) => setDislikedExercises(event.target.value)}
              placeholder="Burpees, treadmill sprints"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="mt-8 w-full rounded-lg bg-violet-400 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>

        {feedback ? (
          <p className="mt-4 rounded-lg border border-[#E60000]/60 bg-[#E60000]/10 px-3 py-2 text-sm text-[#ffb3b3]">
            {feedback}
          </p>
        ) : null}
      </div>
    </main>
  );
}
