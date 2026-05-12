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
      if (intervalRef.current) clearInterval(intervalRef.current);
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
   * CANONICAL KEY (FIX DUPLICATES)
   * =========================
   */

  const getMovementKey = (ex: any) => {
    const name = (ex.name ?? "").toLowerCase();

    return name
      .replace(/barbell|dumbbell|machine|cable|smith/g, "")
      .replace(/standing|seated|incline|decline|flat/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  /**
   * =========================
   * GENERATE WORKOUT
   * =========================
   */

  const generateWorkout = async () => {
    if (!userId || selectedFocus.length === 0) return;

    setMode("saving");

    try {
      const history = await getExerciseHistory(userId, selectedFocus);

      const ai = await generateWorkoutV7({
        userId,
        focus: selectedFocus,
        goal: profile?.training_goal ?? "Hypertrophy",
        level: profile?.experience_level ?? "Intermediate",
        duration: 30,
        equipment: profile?.training_location ?? "Gym",
        history,
      });

      if (!ai?.exercises?.length) {
        throw new Error("No exercises returned");
      }

      /**
       * =========================
       * DEDUPE BY MOVEMENT
       * =========================
       */

      const unique = new Map<string, any>();

      ai.exercises.forEach((ex: any, i: number) => {
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
       * FORMAT EXERCISES
       * =========================
       */

      const formatted: Exercise[] = Array.from(unique.values()).map(
        (ex: any, i: number) => ({
          id: `${getMovementKey(ex)}-${i}`,
          name: ex.name,
          muscle: ex.muscle,
          sets: ex.sets ?? 3,
          reps:
            typeof ex.reps === "string"
              ? parseInt(ex.reps.split("-")[0])
              : ex.reps ?? 10,
          weight: ex.weight ?? 0,
          movement_id: getMovementKey(ex),

          // ✅ REQUIRED FIELD (THIS FIXES YOUR ERROR)
          type: ex.type ?? "Accessory",
        })
      );

      /**
       * =========================
       * INIT STATE
       * =========================
       */

      const logs: Record<string, number[]> = {};
      const reps: Record<string, number[]> = {};

      formatted.forEach((ex) => {
        logs[ex.id] = Array.from({ length: ex.sets }, () => ex.weight);

        reps[ex.id] = Array.from({ length: ex.sets }, () =>
          typeof ex.reps === "string"
            ? parseInt(ex.reps.split("-")[0])
            : ex.reps ?? 10
        );
      });

      setWorkout(formatted);
      setActiveLogs(logs);
      setActiveReps(reps);

      setActiveExercise(formatted[0]?.id ?? null);
      setSessionTime(0);

      setMode("ready");

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Workout generation failed");
      setMode("idle");
    }
  };

  /**
   * =========================
   * SESSION CONTROL
   * =========================
   */

  const startSession = () => setMode("active");

  const saveWorkout = async () => {
    setMode("saving");

    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) throw new Error("No user");

      const volume = workout.reduce((total, ex) => {
        const w = activeLogs[ex.id] ?? [];
        const r = activeReps[ex.id] ?? [];

        return total + w.reduce((s, v, i) => s + v * (r[i] ?? 0), 0);
      }, 0);

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

      resetAll();
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Save failed");
      setMode("active");
    }
  };

  const handleAbort = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    resetAll();
  };

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
