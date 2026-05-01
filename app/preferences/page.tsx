"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function PreferencesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  // --- CORE PREFERENCES STATE ---
  const [primaryGoal, setPrimaryGoal] = useState("Build muscle");
  const [equipmentType, setEquipmentType] = useState("Commercial Gym");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [sessionMinutes, setSessionMinutes] = useState(45);
  const [preferredSplit, setPreferredSplit] = useState("Full Body");
  const [dislikedExercises, setDislikedExercises] = useState<string[]>([]);
  const [newDislike, setNewDislike] = useState("");

  // PILL OPTIONS
  const standardOptions = [
    "Build muscle",
    "Increase strength",
    "Lose fat",
    "Improve endurance",
  ];
  const targetedOptions = [
    "only biceps",
    "only triceps",
    "only quads",
    "only legs",
    "only chest",
    "only back",
    "only calves",
    "only hiit",
    "only full body",
  ];

  // --- LOADING LOGIC ---
  useEffect(() => {
    const loadData = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("user_setup_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data && !error) {
        const casted = data as any;
        setPrimaryGoal(casted.primary_goal || "Build muscle");
        setEquipmentType(casted.equipment_type || "Commercial Gym");
        setDaysPerWeek(casted.days_per_week || 3);
        setSessionMinutes(casted.session_minutes || 45);
        setPreferredSplit(casted.preferred_split || "Full Body");
        setDislikedExercises(casted.disliked_exercises || []);
      }
      setLoading(false);
    };
    void loadData();
  }, [router]);

  // --- HANDLERS ---
  const addDislike = () => {
    if (newDislike.trim() && !dislikedExercises.includes(newDislike.trim())) {
      setDislikedExercises([...dislikedExercises, newDislike.trim()]);
      setNewDislike("");
    }
  };

  const removeDislike = (index: number) => {
    setDislikedExercises(dislikedExercises.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback("");
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // "Nuclear" fix: Cast the table selector to any to avoid the 'never' type mismatch
    const { error } = await (
      supabase.from("user_setup_preferences") as any
    ).upsert(
      {
        user_id: user.id,
        primary_goal: primaryGoal,
        equipment_type: equipmentType,
        days_per_week: daysPerWeek,
        session_minutes: sessionMinutes,
        preferred_split: preferredSplit,
        disliked_exercises: dislikedExercises,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

    if (error) {
      setFeedback(`Sync Error: ${error.message}`);
      setSaving(false);
    } else {
      // Redirect with recalibrate param so plan page auto-regenerates
      router.push("/plan?recalibrate=true");
    }
  };

  if (loading) {
    return (
      <main className='flex min-h-screen items-center justify-center bg-zinc-950 font-mono text-[10px] uppercase tracking-[0.3em] text-violet-500'>
        Syncing Neural Profile...
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-zinc-950 px-6 py-12 text-zinc-100'>
      {/* Background Ambient Glow */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-[5%] -right-[5%] w-[35%] h-[35%] bg-violet-900/10 blur-[100px] rounded-full' />
      </div>
      <div className='relative mx-auto w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 backdrop-blur-xl shadow-2xl'>
        <header className='flex items-center justify-between border-b border-zinc-800/50 pb-8 mb-10'>
          <div>
            <p className='text-[10px] font-black tracking-[0.3em] text-violet-400 uppercase mb-2'>
              Protocol Architecture
            </p>
            <h1 className='text-4xl font-extrabold tracking-tighter'>
              Preferences
            </h1>
          </div>
          <Link
            href='/plan'
            className='text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-white'
          >
            ESC
          </Link>
        </header>

        <div className='space-y-10'>
          {/* PRIMARY GOAL PILLS */}
          <section className='space-y-4'>
            <label className='text-[10px] font-black uppercase tracking-widest text-zinc-500'>
              Standard Protocols
            </label>
            <div className='flex flex-wrap gap-2'>
              {standardOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setPrimaryGoal(opt)}
                  className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all border ${
                    primaryGoal === opt
                      ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/40"
                      : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </section>

          {/* TARGETED PILLS */}
          <section className='space-y-4'>
            <label className='text-[10px] font-black uppercase tracking-widest text-zinc-500'>
              Isolated Targeting
            </label>
            <div className='flex flex-wrap gap-2'>
              {targetedOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setPrimaryGoal(opt)}
                  className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all border ${
                    primaryGoal === opt
                      ? "bg-sky-600 border-sky-500 text-white shadow-lg shadow-sky-900/40"
                      : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-600"
                  }`}
                >
                  {opt.replace("only ", "")}
                </button>
              ))}
            </div>
          </section>

          {/* ARCHITECTURE (SPLIT) */}
          <section className='space-y-4'>
            <label className='text-[10px] font-black uppercase tracking-widest text-zinc-500'>
              Program Architecture
            </label>
            <div className='grid grid-cols-3 gap-2'>
              {["Full Body", "PPL", "Upper/Lower"].map((split) => (
                <button
                  key={split}
                  type='button'
                  onClick={() => setPreferredSplit(split)}
                  className={`rounded-xl border p-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                    preferredSplit === split
                      ? "border-violet-500/50 bg-violet-500/10 text-violet-400"
                      : "border-zinc-800 bg-zinc-950 text-zinc-600 hover:border-zinc-700"
                  }`}
                >
                  {split}
                </button>
              ))}
            </div>
          </section>

          {/* EQUIPMENT GRID */}
          <section className='space-y-4'>
            <label className='text-[10px] font-black uppercase tracking-widest text-zinc-500'>
              Hardware Environment
            </label>
            <div className='grid grid-cols-2 gap-3'>
              {[
                "Commercial Gym",
                "Home Gym",
                "Bodyweight",
                "Dumbbells Only",
              ].map((type) => (
                <button
                  key={type}
                  type='button'
                  onClick={() => setEquipmentType(type)}
                  className={`rounded-xl border p-4 text-xs font-bold transition-all ${
                    equipmentType === type
                      ? "border-sky-500/50 bg-sky-500/10 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.1)]"
                      : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </section>

          {/* FREQUENCY & DURATION */}
          <div className='grid grid-cols-2 gap-6'>
            <section className='space-y-4'>
              <label className='text-[10px] font-black uppercase tracking-widest text-zinc-500'>
                Units Per Week
              </label>
              <input
                type='number'
                min='1'
                max='7'
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                className='w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm font-bold text-white outline-none focus:border-violet-500/50'
              />
            </section>
            <section className='space-y-4'>
              <label className='text-[10px] font-black uppercase tracking-widest text-zinc-500'>
                Session Cap (Min)
              </label>
              <input
                type='number'
                step='15'
                value={sessionMinutes}
                onChange={(e) => setSessionMinutes(Number(e.target.value))}
                className='w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm font-bold text-white outline-none focus:border-violet-500/50'
              />
            </section>
          </div>

          {/* NEURAL EXCLUSIONS (DISLIKED) */}
          <section className='space-y-4 border-t border-zinc-800/50 pt-8'>
            <label className='text-[10px] font-black uppercase tracking-widest text-zinc-500'>
              Neural Exclusions
            </label>
            <div className='flex gap-2'>
              <input
                type='text'
                placeholder='Block movements...'
                value={newDislike}
                onChange={(e) => setNewDislike(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addDislike()}
                className='flex-1 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm font-bold text-white outline-none focus:border-red-500/30'
              />
              <button
                onClick={addDislike}
                className='rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-2 text-xs font-black text-zinc-400 hover:text-white'
              >
                ADD
              </button>
            </div>
            <div className='flex flex-wrap gap-2 pt-2'>
              {dislikedExercises.map((ex, index) => (
                <span
                  key={index}
                  className='flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/5 px-3 py-1 text-[10px] font-bold text-red-400 uppercase tracking-tighter'
                >
                  {ex}
                  <button
                    onClick={() => removeDislike(index)}
                    className='hover:text-white'
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </section>

          {/* ACTION */}
          <button
            onClick={handleSave}
            disabled={saving}
            className='w-full mt-6 rounded-2xl bg-violet-600 py-4 text-xs font-black text-white uppercase tracking-[0.2em] hover:bg-violet-500 transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-violet-900/20'
          >
            {saving ? "Syncing Protocol..." : "Apply & Recalibrate"}
          </button>

          {feedback && (
            <p className='mt-4 text-center text-[10px] font-mono text-red-400 uppercase tracking-widest italic'>
              {feedback}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
