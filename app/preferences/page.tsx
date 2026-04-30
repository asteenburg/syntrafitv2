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
};

export default function PreferencesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [sessionMinutes, setSessionMinutes] = useState(45);
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
        .select("days_per_week, session_minutes")
        .eq("user_id", user.id)
        .maybeSingle();

      const saved = data as Pick<
        SetupPreferenceRow,
        "days_per_week" | "session_minutes"
      > | null;

      if (saved) {
        setDaysPerWeek(saved.days_per_week);
        setSessionMinutes(saved.session_minutes);
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
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <p>Loading your preferences...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Preferences</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Fine-tune your workout pacing and weekly frequency.
            </p>
          </div>
          <Link
            href="/setup"
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 hover:border-zinc-500"
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
