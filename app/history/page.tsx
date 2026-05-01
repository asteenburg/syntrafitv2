"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";

// --- TYPES ---
type SessionSetLog = {
  reps: number | null;
  weight_lbs: number | null;
  is_warmup: boolean;
};

type SessionExerciseEntry = {
  id: string;
  exercises: { name: string } | null;
  set_logs: SessionSetLog[];
};

type WorkoutSession = {
  id: string;
  title: string | null;
  started_at: string;
  workout_exercise_entries: SessionExerciseEntry[];
};

type SessionVolume = {
  id: string;
  title: string;
  startedAt: string;
  volumeLbs: number;
  deltaFromPrevious: number;
};

type RecoveryRow = {
  muscle: string;
  readiness: number;
};

// --- HELPERS ---
function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
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

      const sessionsResult = await supabase
        .from("workout_sessions")
        .select(
          `
          id,
          title,
          started_at,
          workout_exercise_entries (
            id,
            exercises ( name ),
            set_logs ( reps, weight_lbs, is_warmup )
          )
        `,
        )
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });

      if (sessionsResult.error) {
        setFeedback(`Could not load history: ${sessionsResult.error.message}`);
        setLoading(false);
        return;
      }

      // FIX: Cast the result from never to our known WorkoutSession type
      setSessions((sessionsResult.data as unknown as WorkoutSession[]) ?? []);
      setLoading(false);
    };

    void loadHistory();
  }, [router]);

  const sessionVolumes = useMemo(() => {
    const chronological = [...sessions].reverse();
    const volumes: SessionVolume[] = [];
    let previousVolume = 0;

    for (const session of chronological) {
      const volumeLbs = session.workout_exercise_entries.reduce(
        (sessionTotal, entry) => {
          const entryTotal = entry.set_logs.reduce((setTotal, setLog) => {
            if (setLog.is_warmup) return setTotal;
            const reps = setLog.reps ?? 0;
            const weight = setLog.weight_lbs ?? 0;
            return setTotal + reps * weight;
          }, 0);
          return sessionTotal + entryTotal;
        },
        0,
      );

      volumes.push({
        id: session.id,
        title: session.title ?? "Workout Session",
        startedAt: session.started_at,
        volumeLbs,
        deltaFromPrevious: volumeLbs - previousVolume,
      });

      previousVolume = volumeLbs;
    }

    return volumes.reverse();
  }, [sessions]);

  const trendSummary = useMemo(() => {
    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    let currentVolume = 0;
    let previousVolume = 0;

    for (const session of sessionVolumes) {
      const ts = new Date(session.startedAt).getTime();
      if (ts >= now - oneWeekMs) {
        currentVolume += session.volumeLbs;
      } else if (ts >= now - oneWeekMs * 2 && ts < now - oneWeekMs) {
        previousVolume += session.volumeLbs;
      }
    }

    const difference = currentVolume - previousVolume;
    return {
      achieved: currentVolume,
      increase: difference > 0 ? difference : 0,
      decrease: difference < 0 ? Math.abs(difference) : 0,
    };
  }, [sessionVolumes]);

  const consistencySummary = useMemo(() => {
    const uniqueDays = new Set(
      sessions.map((session) =>
        new Date(session.started_at).toISOString().slice(0, 10),
      ),
    );
    return {
      sessionsLast30Days: sessions.filter(
        (session) =>
          new Date(session.started_at).getTime() >=
          Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).length,
      activeDays: uniqueDays.size,
    };
  }, [sessions]);

  const recoveryRows = useMemo<RecoveryRow[]>(() => {
    const map = new Map<string, number>();
    sessions.slice(0, 8).forEach((session) => {
      session.workout_exercise_entries.forEach((entry) => {
        const name = entry.exercises?.name?.toLowerCase() ?? "";
        let muscle = "full body";
        if (name.includes("squat") || name.includes("lunge")) muscle = "legs";
        else if (name.includes("bench") || name.includes("push"))
          muscle = "chest";
        else if (name.includes("row") || name.includes("pull")) muscle = "back";
        else if (name.includes("press")) muscle = "shoulders";

        const volume = entry.set_logs.reduce((sum, log) => {
          if (log.is_warmup) return sum;
          return sum + (log.reps ?? 0) * (log.weight_lbs ?? 0);
        }, 0);
        map.set(muscle, (map.get(muscle) ?? 0) + volume);
      });
    });
    return [...map.entries()].map(([muscle, load]) => ({
      muscle,
      readiness: Math.max(20, Math.min(100, Math.round(100 - load / 75))),
    }));
  }, [sessions]);

  const chartSessions = useMemo(() => {
    if (sessionVolumes.length === 0) {
      return [
        {
          id: "today-placeholder",
          title: "Today's Session",
          startedAt: new Date().toISOString(),
          volumeLbs: 0,
          deltaFromPrevious: 0,
          heightPercent: 20,
          label: "Today",
          isPlaceholder: true,
        },
      ];
    }

    const ordered = [...sessionVolumes].reverse().slice(-10);
    const maxVolume = Math.max(
      ...ordered.map((session) => session.volumeLbs),
      1,
    );
    return ordered.map((session) => ({
      ...session,
      heightPercent: Math.max(
        6,
        Math.round((session.volumeLbs / maxVolume) * 100),
      ),
      label: new Date(session.startedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      isPlaceholder: false,
    }));
  }, [sessionVolumes]);

  if (loading) {
    return (
      <main className='flex min-h-screen items-center justify-center bg-zinc-950 font-mono text-[10px] uppercase tracking-[0.3em] text-violet-500'>
        Syncing Neural Data...
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-zinc-950 px-6 py-12 text-zinc-100'>
      <div className='relative mx-auto w-full max-w-5xl rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 backdrop-blur-xl shadow-2xl'>
        <header className='flex flex-wrap items-end justify-between gap-6 border-b border-zinc-800/50 pb-8 mb-10'>
          <div>
            <p className='text-[10px] font-black tracking-[0.3em] text-violet-400 uppercase mb-2'>
              Archive: Ready
            </p>
            <h1 className='text-4xl font-extrabold tracking-tighter'>
              Workout History
            </h1>
            <p className='mt-2 text-xs font-medium text-zinc-500 uppercase tracking-widest'>
              Performance Analytics & Volume Trends
            </p>
          </div>
          <Link
            href='/plan'
            className='rounded-xl border border-zinc-800 bg-zinc-900 px-6 py-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-widest'
          >
            Back to Plan
          </Link>
        </header>

        <div className='grid gap-4 md:grid-cols-3'>
          <div className='rounded-2xl border border-zinc-800 bg-zinc-950/50 p-5'>
            <p className='text-[10px] font-black tracking-widest text-zinc-500 uppercase'>
              Volume Achieved (7d)
            </p>
            <p className='mt-3 text-3xl font-extrabold tracking-tight'>
              {Math.round(trendSummary.achieved)}{" "}
              <span className='text-sm font-normal text-zinc-500'>lbs</span>
            </p>
          </div>
          <div className='rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5'>
            <p className='text-[10px] font-black tracking-widest text-sky-400 uppercase'>
              Volume Increase
            </p>
            <p className='mt-3 text-3xl font-extrabold tracking-tight text-sky-400'>
              +{Math.round(trendSummary.increase)}{" "}
              <span className='text-sm font-normal opacity-70'>lbs</span>
            </p>
          </div>
          <div className='rounded-2xl border border-red-500/20 bg-red-500/5 p-5'>
            <p className='text-[10px] font-black tracking-widest text-red-400 uppercase'>
              Volume Decrease
            </p>
            <p className='mt-3 text-3xl font-extrabold tracking-tight text-red-400'>
              -{Math.round(trendSummary.decrease)}{" "}
              <span className='text-sm font-normal opacity-70'>lbs</span>
            </p>
          </div>
        </div>

        <div className='mt-4 grid gap-4 md:grid-cols-2'>
          <div className='rounded-2xl border border-zinc-800 bg-zinc-950/50 p-5'>
            <p className='text-[10px] font-black tracking-widest text-zinc-500 uppercase'>
              Sessions (30d)
            </p>
            <p className='mt-2 text-2xl font-bold tracking-tight'>
              {consistencySummary.sessionsLast30Days}
            </p>
          </div>
          <div className='rounded-2xl border border-zinc-800 bg-zinc-950/50 p-5'>
            <p className='text-[10px] font-black tracking-widest text-zinc-500 uppercase'>
              Active Days
            </p>
            <p className='mt-2 text-2xl font-bold tracking-tight'>
              {consistencySummary.activeDays}
            </p>
          </div>
        </div>

        <section className='mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6'>
          <h2 className='text-xs font-black tracking-widest text-zinc-400 uppercase mb-5'>
            Muscle Recovery Readiness
          </h2>
          <div className='grid gap-4 md:grid-cols-2'>
            {(recoveryRows.length
              ? recoveryRows
              : [{ muscle: "full body", readiness: 100 }]
            ).map((row) => (
              <div
                key={row.muscle}
                className='rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4'
              >
                <div className='flex items-center justify-between mb-3'>
                  <p className='text-sm font-bold capitalize text-zinc-200'>
                    {row.muscle}
                  </p>
                  <p className='text-[10px] font-mono font-bold text-sky-400'>
                    {row.readiness}%
                  </p>
                </div>
                <div className='h-1.5 w-full overflow-hidden rounded-full bg-zinc-800'>
                  <div
                    className='h-full bg-sky-500 transition-all duration-500'
                    style={{ width: `${row.readiness}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className='mt-10 space-y-8'>
          <section className='rounded-2xl border border-zinc-800 bg-zinc-950/50 p-6'>
            <div className='mb-8 flex items-center justify-between'>
              <h2 className='text-xs font-black tracking-widest text-zinc-400 uppercase'>
                Volume Progression Chart
              </h2>
              <p className='text-[10px] font-mono text-zinc-600 uppercase'>
                Last {chartSessions.length} sessions
              </p>
            </div>
            <div className='flex h-52 items-end gap-3 px-2'>
              {chartSessions.map((session) => {
                const isUp = session.deltaFromPrevious > 0;
                const isDown = session.deltaFromPrevious < 0;
                return (
                  <div
                    key={session.id}
                    className='group flex h-full min-w-0 flex-1 flex-col'
                  >
                    <div className='flex flex-1 items-end relative'>
                      <div
                        className={`mx-auto w-full max-w-[16px] rounded-t-sm transition-all duration-300 group-hover:opacity-100 ${
                          isUp
                            ? "bg-sky-500/80"
                            : isDown
                              ? "bg-red-500/70"
                              : session.isPlaceholder
                                ? "border border-dashed border-zinc-700 bg-zinc-800/30"
                                : "bg-zinc-700/70"
                        }`}
                        style={{ height: `${session.heightPercent}%` }}
                        title={`${Math.round(session.volumeLbs)} lbs on ${formatDate(session.startedAt)}`}
                      />
                    </div>
                    <p className='mt-3 text-center text-[9px] font-mono font-bold text-zinc-600 group-hover:text-zinc-400 transition-colors'>
                      {session.label}
                    </p>
                  </div>
                );
              })}
            </div>
            {sessionVolumes.length === 0 && (
              <p className='mt-4 text-[10px] text-zinc-600 font-mono text-center uppercase tracking-wider'>
                Placeholder active until initial log
              </p>
            )}
          </section>

          {sessionVolumes.length === 0 ? (
            <div className='rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/30 p-12 text-center'>
              <p className='text-xs font-black tracking-widest text-zinc-600 uppercase'>
                No Archive Data Detected
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              <h2 className='text-xs font-black tracking-widest text-zinc-400 uppercase px-1'>
                Session Logs
              </h2>
              {sessionVolumes.map((session) => {
                const isUp = session.deltaFromPrevious > 0;
                const isDown = session.deltaFromPrevious < 0;
                return (
                  <article
                    key={session.id}
                    className='group rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900/50'
                  >
                    <div className='flex flex-wrap items-center justify-between gap-6'>
                      <div>
                        <h2 className='text-lg font-bold text-zinc-100 group-hover:text-white transition-colors'>
                          {session.title}
                        </h2>
                        <p className='mt-1 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-tighter'>
                          {formatDate(session.startedAt)}
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='text-xl font-black tracking-tight'>
                          {Math.round(session.volumeLbs)}{" "}
                          <span className='text-xs font-normal text-zinc-500 uppercase tracking-widest'>
                            lbs
                          </span>
                        </p>
                        <p
                          className={`text-[10px] font-black uppercase tracking-widest mt-1 ${
                            isUp
                              ? "text-sky-400"
                              : isDown
                                ? "text-red-400/80"
                                : "text-zinc-600"
                          }`}
                        >
                          {isUp
                            ? `+${Math.round(session.deltaFromPrevious)} Δ`
                            : isDown
                              ? `-${Math.round(Math.abs(session.deltaFromPrevious))} Δ`
                              : "No Variance"}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {feedback && (
          <div className='mt-8 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3'>
            <p className='text-[10px] font-black uppercase tracking-widest text-red-400'>
              {feedback}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
