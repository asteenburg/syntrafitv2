"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
        .select("primary_goal, equipment_type")
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
    };

    const { error } = await supabase
      .from("user_setup_preferences")
      .upsert(payload as never, { onConflict: "user_id" });

    if (error) {
      setFeedback(
        `Could not save setup yet: ${error.message}. Run Migration 003 SQL first.`,
      );
      setSaving(false);
      return;
    }

    setFeedback(
      "Setup saved. Next step is generating your starter weekly program automatically.",
    );
    setSaving(false);
    router.push("/plan");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <p>Loading your setup...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950/90 px-6 py-10 text-zinc-100">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-[0_-24px_30px_-24px_rgba(168,85,247,0.8)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-violet-300">
              SYNTRAFIT SETUP
            </p>
            <h1 className="mt-2 text-3xl font-bold">Let&apos;s build your training</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Pick your main outcome and training environment. You can fine-tune
              days and session length later in Preferences.
            </p>
          </div>
          <Link
            href="/preferences"
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 hover:border-zinc-500"
          >
            Preferences
          </Link>
        </div>

        <div className="mt-8">
          <p className="mb-3 text-sm font-semibold text-zinc-300">Primary goal</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {goals.map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => setPrimaryGoal(goal)}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  primaryGoal === goal
                    ? "border-violet-300 bg-violet-300/10 text-violet-100"
                    : "border-zinc-700 bg-zinc-950 text-zinc-200 hover:border-zinc-500"
                }`}
              >
                <p className="font-semibold">{goal}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold text-zinc-300">
            Training environment
          </p>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setTrainingEnvironment("equipment")}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                trainingEnvironment === "equipment"
                  ? "border-violet-300 bg-violet-300/10 text-violet-100"
                  : "border-zinc-700 bg-zinc-950 text-zinc-200 hover:border-zinc-500"
              }`}
            >
              <p className="font-semibold">I have equipment</p>
            </button>
            <button
              type="button"
              onClick={() => setTrainingEnvironment("no-equipment")}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                trainingEnvironment === "no-equipment"
                  ? "border-violet-300 bg-violet-300/10 text-violet-100"
                  : "border-zinc-700 bg-zinc-950 text-zinc-200 hover:border-zinc-500"
              }`}
            >
              <p className="font-semibold">No equipment</p>
            </button>
          </div>
        </div>

        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold text-zinc-300">
            {trainingEnvironment === "no-equipment"
              ? "No equipment"
              : "Equipment"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(trainingEnvironment === "no-equipment"
              ? noEquipment
              : equipment
            ).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() =>
                  trainingEnvironment === "no-equipment"
                    ? setNoEquipmentType(item)
                    : setEquipmentType(item)
                }
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  (trainingEnvironment === "no-equipment"
                    ? noEquipmentType
                    : equipmentType) === item
                    ? "border-violet-300 bg-violet-300/10 text-violet-100"
                    : "border-zinc-700 bg-zinc-950 text-zinc-200 hover:border-zinc-500"
                }`}
              >
                <p className="font-semibold">{item}</p>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onCreatePlan}
          disabled={saving}
          className="mt-8 w-full rounded-lg bg-violet-400 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? "Saving setup..." : "Save Setup & Continue"}
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
