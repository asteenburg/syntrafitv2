import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";

import { getExerciseHistory } from "../../data/historyFetch";
import { generateWorkoutV7 } from "../../lib/generateWorkoutV7";
import { supabase } from "../../lib/supabase";

import { Exercise, Muscle } from "../../types/workout";
import { styles } from "../styles/workoutTheme";
import WorkoutUI from "../workoutUI";

/**
 * =========================
 * CONSTANTS
 * =========================
 */

const NEON_GREEN = "#CCFF00";

const MUSCLE_GROUPS: Muscle[] = [
  "Full Body",
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Core",
  "Calves",
  "Quads",
  "Hamstrings",
  "HIIT",
  "Cardio",
];

const MUSCLE_EXPANSIONS: Partial<Record<Muscle, Muscle[]>> = {
  Legs: ["Quads", "Hamstrings", "Calves"],

  "Full Body": [
    "Chest",
    "Back",
    "Quads",
    "Hamstrings",
    "Calves",
    "Shoulders",
    "Biceps",
    "Triceps",
    "Core",
  ],
};

/**
 * =========================
 * TYPES
 * =========================
 */

type Mode = "idle" | "ready" | "active" | "saving";

/**
 * =========================
 * COMPONENT
 * =========================
 */

export default function Workout() {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  const [workout, setWorkout] = useState<Exercise[]>([]);
  const [selectedFocus, setSelectedFocus] = useState<Muscle[]>([]);
  const [activeExercise, setActiveExercise] = useState<string | null>(null);

  const [activeLogs, setActiveLogs] = useState<Record<string, number[]>>({});
  const [activeReps, setActiveReps] = useState<Record<string, number[]>>({});

  const [sessionTime, setSessionTime] = useState(0);
  const [mode, setMode] = useState<Mode>("idle");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isSelectable = mode === "ready" || mode === "active";

  /**
   * =========================
   * TIMER
   * =========================
   */

  useEffect(() => {
    if (mode !== "active") return;

    intervalRef.current = setInterval(() => {
      setSessionTime((t) => t + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = null;
    };
  }, [mode]);

  /**
   * =========================
   * USER LOAD
   * =========================
   */

  const loadUser = async () => {
    const { data } = await supabase.auth.getUser();

    if (!data.user) return;

    setUserId(data.user.id);

    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();

    setProfile(prof);
  };

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
  );

  /**
   * =========================
   * RESET
   * =========================
   */

  const resetAll = () => {
    setWorkout([]);
    setSelectedFocus([]);
    setActiveExercise(null);

    setActiveLogs({});
    setActiveReps({});

    setSessionTime(0);

    setMode("idle");
  };

  /**
   * =========================
   * RESOLVE FOCUS
   * =========================
   */

  const resolveFocusGroups = (focus: Muscle[]): Muscle[] => {
    const expanded = new Set<Muscle>();

    focus.forEach((m) => {
      const mapped = MUSCLE_EXPANSIONS[m];

      if (mapped?.length) {
        mapped.forEach((sub) => expanded.add(sub));
      } else {
        expanded.add(m);
      }
    });

    return Array.from(expanded);
  };

  /**
   * =========================
   * CANONICAL KEY
   * =========================
   */

  const getMovementKey = (ex: any) => {
    return (ex.name ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  };

  /**
   * =========================
   * SAFE REP PARSER
   * =========================
   */

  const parseRepValue = (reps: any): number => {
    if (typeof reps === "number") {
      return reps;
    }

    if (typeof reps === "string") {
      const parsed = parseInt(reps.split("-")[0]);

      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }

    return 10;
  };

  /**
   * =========================
   * SAFE SET PARSER
   * =========================
   */

  const parseSetValue = (sets: any): number => {
    const parsed = Number(sets);

    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed);
    }

    return 3;
  };

  /**
   * =========================
   * GENERATE WORKOUT
   * =========================
   */

  const generateWorkout = async () => {
    if (!userId || selectedFocus.length === 0) {
      return;
    }

    setMode("saving");

    try {
      /**
       * =========================
       * EXPAND ABSTRACT GROUPS
       * =========================
       */

      const expandedFocus = resolveFocusGroups(selectedFocus);

      console.log("SELECTED FOCUS:", selectedFocus);

      console.log("EXPANDED FOCUS:", expandedFocus);

      /**
       * =========================
       * HISTORY
       * =========================
       */

      const history = await getExerciseHistory(userId, expandedFocus);

      /**
       * =========================
       * GENERATE
       * =========================
       */

      const ai = await generateWorkoutV7({
        userId,

        focus: expandedFocus,

        goal: profile?.training_goal ?? "Hypertrophy",

        level: profile?.experience_level ?? "Intermediate",

        duration: 30,

        equipment: profile?.training_location ?? "Gym",

        history,
      });

      console.log(
        "AI EXERCISES:",
        ai?.exercises?.map((e: any) => ({
          name: e.name,
          muscle: e.muscle,
        }))
      );

      if (!ai?.exercises?.length) {
        throw new Error("No exercises returned");
      }

      /**
       * =========================
       * VALIDATE EXERCISES
       * =========================
       */

      const validExercises = ai.exercises.filter(
        (ex: any) =>
          ex && typeof ex.name === "string" && ex.name.trim().length > 0
      );

      if (!validExercises.length) {
        throw new Error("No valid exercises returned");
      }

      /**
       * =========================
       * DEDUPE
       * =========================
       */

      const unique = new Map<string, any>();

      validExercises.forEach((ex: any) => {
        const key = getMovementKey(ex);

        if (!unique.has(key)) {
          unique.set(key, {
            ...ex,
            movement_id: key,
          });
        }
      });

      /**
       * =========================
       * FORMAT
       * =========================
       */

      const formatted: Exercise[] = Array.from(unique.values()).map(
        (ex: any, i: number) => {
          const parsedSets = parseSetValue(ex.sets);

          const parsedReps = parseRepValue(ex.reps);

          return {
            id: `${getMovementKey(ex)}-${i}`,

            name: ex.name ?? "Exercise",

            muscle: (ex.muscle as Muscle) ?? selectedFocus[0],

            sets: parsedSets,

            reps: parsedReps,

            weight: typeof ex.weight === "number" ? ex.weight : 0,

            movement_id: getMovementKey(ex),

            type: ex.type ?? "Accessory",
          };
        }
      );

      if (!formatted.length) {
        throw new Error("No formatted exercises available");
      }

      /**
       * =========================
       * INIT TRACKING
       * =========================
       */

      const logs: Record<string, number[]> = {};

      const reps: Record<string, number[]> = {};

      formatted.forEach((ex) => {
        logs[ex.id] = Array.from({ length: ex.sets }, () => ex.weight);

        reps[ex.id] = Array.from({ length: ex.sets }, () =>
          parseRepValue(ex.reps)
        );
      });

      /**
       * =========================
       * STATE
       * =========================
       */

      setWorkout(formatted);

      setActiveLogs(logs);

      setActiveReps(reps);

      setActiveExercise(formatted[0]?.id ?? null);

      setSessionTime(0);

      setMode("ready");

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      console.log("WORKOUT GENERATION ERROR:", e);

      Alert.alert("Error", e?.message ?? "Workout generation failed");

      setMode("idle");
    }
  };

  /**
   * =========================
   * SESSION CONTROL
   * =========================
   */

  const startSession = () => {
    setMode("active");
  };

  const saveWorkout = async () => {
    setMode("saving");

    try {
      const { data } = await supabase.auth.getUser();

      const user = data.user;

      if (!user) {
        throw new Error("No user");
      }

      /**
       * =========================
       * TOTAL VOLUME
       * =========================
       */

      const volume = workout.reduce((total, ex) => {
        const weights = activeLogs[ex.id] ?? [];

        const reps = activeReps[ex.id] ?? [];

        return (
          total +
          weights.reduce((sum, weight, i) => sum + weight * (reps[i] ?? 0), 0)
        );
      }, 0);

      /**
       * =========================
       * PAYLOAD
       * =========================
       */

      const payload = {
        user_id: user.id,

        created_at: new Date().toISOString(),

        duration: sessionTime,

        volume,

        exercises: workout.map((ex) => ({
          id: ex.id,

          name: ex.name,

          muscle: ex.muscle,

          movement_id: ex.movement_id,

          sets: ex.sets,

          logs: activeLogs[ex.id],

          reps: activeReps[ex.id],
        })),
      };

      const { error } = await supabase
        .from("workout_sessions")
        .insert([payload]);

      if (error) {
        Alert.alert("Save failed", error.message);

        setMode("active");

        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      resetAll();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Save failed");

      setMode("active");
    }
  };

  /**
   * =========================
   * ABORT
   * =========================
   */

  const handleAbort = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    resetAll();
  };

  /**
   * =========================
   * TIME FORMAT
   * =========================
   */

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);

    const sec = s % 60;

    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  /**
   * =========================
   * RENDER
   * =========================
   */

  return (
    <WorkoutUI
      workout={workout}
      selectedFocus={selectedFocus}
      setSelectedFocus={setSelectedFocus}
      activeLogs={activeLogs}
      activeReps={activeReps}
      setActiveLogs={setActiveLogs}
      setActiveReps={setActiveReps}
      activeExercise={activeExercise}
      setActiveExercise={setActiveExercise}
      status={mode}
      sessionTime={sessionTime}
      NEON_GREEN={NEON_GREEN}
      MUSCLE_GROUPS={MUSCLE_GROUPS}
      generateWorkout={generateWorkout}
      startSession={startSession}
      saveWorkout={saveWorkout}
      handleAbort={handleAbort}
      formatTime={formatTime}
      isSelectable={isSelectable}
      styles={styles}
    />
  );
}
