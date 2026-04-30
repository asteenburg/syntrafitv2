"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";

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
            exercises (
              name
            ),
            set_logs (
              reps,
              weight_lbs,
              is_warmup
            )
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

      setSessions((sessionsResult.data as WorkoutSession[]) ?? []);
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
            if (setLog.is_warmup) {
              return setTotal;
            }
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
        if (name.includes("squat") || name.includes("lunge")) {
          muscle = "legs";
        } else if (name.includes("bench") || name.includes("push")) {
          muscle = "chest";
        } else if (name.includes("row") || name.includes("pull")) {
          muscle = "back";
        } else if (name.includes("press")) {
          muscle = "shoulders";
        }
        const volume = entry.set_logs.reduce((sum, log) => {
          if (log.is_warmup) {
            return sum;
          }
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
      <main className='flex min-h-screen items-center justify-center bg-white text-gray-900'>
        <p>Loading workout history...</p>
      </main>
    );
  }

  return (
    <main className='min-h-screen bg-white px-6 py-10 text-zinc-200'>
      <div className='mx-auto w-full max-w-5xl rounded-2xl border border-gray-200 bg-zinc-900 p-6 shadow-[0_-16px_22px_-22px_rgba(168,85,247,0.35)]'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <h1 className='text-3xl font-bold'>Workout History</h1>
            <p className='mt-2 text-sm text-gray-600'>
              Track how your training volume changes over time.
            </p>
          </div>
          <Link
            href='/plan'
            className='rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400'
          >
            Back to plan
          </Link>
        </div>

        <div className='mt-8 grid gap-3 md:grid-cols-3'>
          <div className='rounded-xl border border-zinc-700 bg-zinc-950 p-4'>
            <p className='text-xs uppercase tracking-wider text-zinc-400'>
              Volume achieved (7d)
            </p>
            <p className='mt-2 text-2xl font-semibold'>
              {Math.round(trendSummary.achieved)} lbs
            </p>
          </div>
          <div className='rounded-xl border border-[#CCFF00]/70 bg-[#CCFF00]/10 p-4'>
            <p className='text-xs uppercase tracking-wider text-[#CCFF00]'>
              Volume increase
            </p>
            <p className='mt-2 text-2xl font-semibold text-[#CCFF00]'>
              +{Math.round(trendSummary.increase)} lbs
            </p>
          </div>
          <div className='rounded-xl border border-[#E60000]/60 bg-[#E60000]/10 p-4'>
            <p className='text-xs uppercase tracking-wider text-[#ffb3b3]'>
              Volume decrease
            </p>
            <p className='mt-2 text-2xl font-semibold text-[#ffb3b3]'>
              -{Math.round(trendSummary.decrease)} lbs
            </p>
          </div>
        </div>

        <div className='mt-4 grid gap-3 md:grid-cols-2'>
          <div className='rounded-xl border border-zinc-700 bg-zinc-950 p-4'>
            <p className='text-xs uppercase tracking-wider text-zinc-400'>
              Sessions (30d)
            </p>
            <p className='mt-2 text-2xl font-semibold'>
              {consistencySummary.sessionsLast30Days}
            </p>
          </div>
          <div className='rounded-xl border border-zinc-700 bg-zinc-950 p-4'>
            <p className='text-xs uppercase tracking-wider text-zinc-400'>
              Active days
            </p>
            <p className='mt-2 text-2xl font-semibold'>
              {consistencySummary.activeDays}
            </p>
          </div>
        </div>

        <section className='mt-4 rounded-xl border border-zinc-700 bg-zinc-950 p-4'>
          <h2 className='font-semibold'>Muscle Recovery Readiness</h2>
          <div className='mt-3 grid gap-2 md:grid-cols-2'>
            {(recoveryRows.length
              ? recoveryRows
              : [{ muscle: "full body", readiness: 100 }]
            ).map((row) => (
              <div
                key={row.muscle}
                className='rounded-md border border-zinc-800 p-3'
              >
                <div className='flex items-center justify-between'>
                  <p className='capitalize text-sm'>{row.muscle}</p>
                  <p className='text-sm text-zinc-300'>{row.readiness}%</p>
                </div>
                <div className='mt-2 h-2 overflow-hidden rounded bg-zinc-800'>
                  <div
                    className='h-full bg-[#CCFF00]'
                    style={{ width: `${row.readiness}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className='mt-8 space-y-5'>
          <section className='rounded-xl border border-zinc-700 bg-zinc-950 p-4'>
            <div className='mb-4 flex items-center justify-between gap-3'>
              <h2 className='font-semibold'>Workout Volume Chart</h2>
              <p className='text-xs text-zinc-400'>
                Last {chartSessions.length} sessions
              </p>
            </div>
            <div className='flex h-52 items-end gap-2'>
              {chartSessions.map((session) => {
                const isUp = session.deltaFromPrevious > 0;
                const isDown = session.deltaFromPrevious < 0;
                return (
                  <div
                    key={session.id}
                    className='flex h-full min-w-0 flex-1 flex-col'
                  >
                    <div className='flex flex-1 items-end'>
                      <div
                        className={`mx-auto w-3 rounded-t-sm md:w-4 ${
                          isUp
                            ? "bg-[#CCFF00]/80"
                            : isDown
                              ? "bg-[#E60000]/75"
                              : session.isPlaceholder
                                ? "border border-dashed border-zinc-500/70 bg-zinc-700/30"
                                : "bg-zinc-500/70"
                        }`}
                        style={{ height: `${session.heightPercent}%` }}
                        title={`${Math.round(session.volumeLbs)} lbs on ${formatDate(session.startedAt)}`}
                      />
                    </div>
                    <p className='mt-2 text-center text-[10px] text-zinc-500'>
                      {session.label}
                    </p>
                  </div>
                );
              })}
            </div>
            {sessionVolumes.length === 0 ? (
              <p className='mt-3 text-xs text-zinc-500'>
                Today&apos;s bar is a placeholder until your first completed
                workout is logged.
              </p>
            ) : null}
          </section>

          {sessionVolumes.length === 0 ? (
            <div className='rounded-xl border border-dashed border-zinc-700 bg-zinc-950 p-6 text-center'>
              <p className='text-zinc-300'>No workout sessions logged yet.</p>
              <p className='mt-2 text-sm text-zinc-500'>
                Complete a workout day to replace the placeholder with real
                session volume.
              </p>
            </div>
          ) : (
            sessionVolumes.map((session) => {
              const isUp = session.deltaFromPrevious > 0;
              const isDown = session.deltaFromPrevious < 0;
              return (
                <article
                  key={session.id}
                  className='rounded-xl border border-zinc-700 bg-zinc-950 p-4'
                >
                  <div className='flex flex-wrap items-center justify-between gap-3'>
                    <div>
                      <h2 className='font-semibold'>{session.title}</h2>
                      <p className='mt-1 text-sm text-zinc-400'>
                        {formatDate(session.startedAt)}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='text-lg font-semibold'>
                        {Math.round(session.volumeLbs)} lbs
                      </p>
                      <p
                        className={`text-sm ${
                          isUp
                            ? "text-[#CCFF00]"
                            : isDown
                              ? "text-[#ffb3b3]"
                              : "text-zinc-400"
                        }`}
                      >
                        {isUp
                          ? `+${Math.round(session.deltaFromPrevious)} vs previous`
                          : isDown
                            ? `-${Math.round(Math.abs(session.deltaFromPrevious))} vs previous`
                            : "No change vs previous"}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {feedback ? (
          <p className='mt-4 rounded-lg border border-[#E60000]/60 bg-[#E60000]/10 px-3 py-2 text-sm text-[#ffb3b3]'>
            {feedback}
          </p>
        ) : null}
      </div>
    </main>
  );
}
