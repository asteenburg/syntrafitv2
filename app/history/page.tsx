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
      const volumeLbs = session.workout_exercise_entries.reduce((sessionTotal, entry) => {
        const entryTotal = entry.set_logs.reduce((setTotal, setLog) => {
          if (setLog.is_warmup) {
            return setTotal;
          }
          const reps = setLog.reps ?? 0;
          const weight = setLog.weight_lbs ?? 0;
          return setTotal + reps * weight;
        }, 0);
        return sessionTotal + entryTotal;
      }, 0);

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
    const maxVolume = Math.max(...ordered.map((session) => session.volumeLbs), 1);
    return ordered.map((session) => ({
      ...session,
      heightPercent: Math.max(6, Math.round((session.volumeLbs / maxVolume) * 100)),
      label: new Date(session.startedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      isPlaceholder: false,
    }));
  }, [sessionVolumes]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <p>Loading workout history...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto w-full max-w-5xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Workout History</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Track how your training volume changes over time.
            </p>
          </div>
          <Link
            href="/plan"
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-medium text-zinc-200 hover:border-zinc-500"
          >
            Back to plan
          </Link>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-400">Volume achieved (7d)</p>
            <p className="mt-2 text-2xl font-semibold">{Math.round(trendSummary.achieved)} lbs</p>
          </div>
          <div className="rounded-xl border border-[#CCFF00]/70 bg-[#CCFF00]/10 p-4">
            <p className="text-xs uppercase tracking-wider text-[#CCFF00]">Volume increase</p>
            <p className="mt-2 text-2xl font-semibold text-[#CCFF00]">
              +{Math.round(trendSummary.increase)} lbs
            </p>
          </div>
          <div className="rounded-xl border border-[#E60000]/60 bg-[#E60000]/10 p-4">
            <p className="text-xs uppercase tracking-wider text-[#ffb3b3]">Volume decrease</p>
            <p className="mt-2 text-2xl font-semibold text-[#ffb3b3]">
              -{Math.round(trendSummary.decrease)} lbs
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          <section className="rounded-xl border border-zinc-700 bg-zinc-950 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold">Workout Volume Chart</h2>
              <p className="text-xs text-zinc-400">Last {chartSessions.length} sessions</p>
            </div>
            <div className="flex h-52 items-end gap-2">
              {chartSessions.map((session) => {
                const isUp = session.deltaFromPrevious > 0;
                const isDown = session.deltaFromPrevious < 0;
                return (
                  <div key={session.id} className="flex h-full min-w-0 flex-1 flex-col">
                    <div className="flex flex-1 items-end">
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
                    <p className="mt-2 text-center text-[10px] text-zinc-500">{session.label}</p>
                  </div>
                );
              })}
            </div>
            {sessionVolumes.length === 0 ? (
              <p className="mt-3 text-xs text-zinc-500">
                Today&apos;s bar is a placeholder until your first completed workout is logged.
              </p>
            ) : null}
          </section>

          {sessionVolumes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950 p-6 text-center">
              <p className="text-zinc-300">No workout sessions logged yet.</p>
              <p className="mt-2 text-sm text-zinc-500">
                Complete a workout day to replace the placeholder with real session volume.
              </p>
            </div>
          ) : (
            sessionVolumes.map((session) => {
              const isUp = session.deltaFromPrevious > 0;
              const isDown = session.deltaFromPrevious < 0;
              return (
                <article
                  key={session.id}
                  className="rounded-xl border border-zinc-700 bg-zinc-950 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{session.title}</h2>
                      <p className="mt-1 text-sm text-zinc-400">{formatDate(session.startedAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{Math.round(session.volumeLbs)} lbs</p>
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
          <p className="mt-4 rounded-lg border border-[#E60000]/60 bg-[#E60000]/10 px-3 py-2 text-sm text-[#ffb3b3]">
            {feedback}
          </p>
        ) : null}
      </div>
    </main>
  );
}
