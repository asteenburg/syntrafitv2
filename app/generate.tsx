import { supabase } from "@/lib/supabase";
import { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { generateWorkoutV7 } from "../lib/generateWorkoutV7";
import { Goal, Muscle } from "../types/workout";

// ... Types and Constants remain the same ...

type Equipment = "Gym" | "Dumbbell" | "Bodyweight" | "Any";

const MUSCLES: Muscle[] = [
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Glutes",
  "Calves",
  "Core",
  "Cardio",
  "HIIT",
  "Full Body",
];
const EQUIPMENT: Equipment[] = ["Gym", "Dumbbell", "Bodyweight", "Any"];
const GOALS: Goal[] = ["Strength", "Hypertrophy", "Fat Loss"];

const THEME = "#CCFF00";

export default function Generate() {
  const [muscle, setMuscle] = useState<Muscle | null>(null);
  const [equipment, setEquipment] = useState<Equipment>("Gym");
  const [goal, setGoal] = useState<Goal>("Hypertrophy");
  const [workout, setWorkout] = useState<any>(null);

  async function handleGenerate() {
    if (!muscle) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const result = await generateWorkoutV7({
      userId: user.id,
      focus: muscle ? [muscle] : [],
      equipment,
      goal,
      duration: 30,
    });

    setWorkout(result);
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={{ padding: 24, paddingTop: 70 }}>
          <Text style={styles.title}>Build Your Workout</Text>
          <Text style={styles.subtitle}>Step 1: Choose a body part</Text>

          {/* MUSCLE SELECTION */}
          <View style={{ marginTop: 20 }}>
            {MUSCLES.map((m) => (
              <TouchableOpacity
                key={m}
                onPress={() => setMuscle(m)}
                style={[styles.pill, muscle === m && styles.pillActive]}
              >
                <Text
                  style={[
                    styles.pillText,
                    muscle === m && styles.pillTextActive,
                  ]}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* EQUIPMENT & GOAL SECTIONS (Simplified for brevity) */}
          <Text style={styles.sectionTitle}>Equipment</Text>
          <View style={styles.row}>
            {EQUIPMENT.map((e) => (
              <TouchableOpacity
                key={e}
                onPress={() => setEquipment(e)}
                style={[styles.smallPill, equipment === e && styles.pillActive]}
              >
                <Text
                  style={[
                    styles.pillText,
                    equipment === e && styles.pillTextActive,
                  ]}
                >
                  {e}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* GENERATE BUTTON */}
          {!workout && (
            <TouchableOpacity
              onPress={handleGenerate}
              disabled={!muscle}
              style={[
                styles.generateBtn,
                { backgroundColor: muscle ? THEME : "#1A1A1A" },
              ]}
            >
              <Text style={styles.generateBtnText}>
                {muscle ? "GENERATE WORKOUT" : "SELECT BODY PART"}
              </Text>
            </TouchableOpacity>
          )}

          {/* WORKOUT RESULT VIEW */}
          {workout && (
            <View style={styles.workoutCard}>
              <Text style={styles.workoutTitle}>{workout.title}</Text>
              <Text style={styles.workoutMeta}>
                {workout.goal} • {workout.duration} MIN
              </Text>

              {workout.exercises.map((ex: any, i: number) => (
                <View key={i} style={styles.exerciseRow}>
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  <Text style={styles.exerciseDetails}>
                    {ex.sets} × {ex.reps}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* THREE BUTTON CONTROL ROW */}
      {workout && (
        <View style={styles.footer}>
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.startBtn]}>
              <Text style={styles.startText}>START</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionBtn, styles.finishBtn]}>
              <Text style={styles.finishText}>FINISH</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.abortBtn]}
              onPress={() => setWorkout(null)} // Resets the view
            >
              <Text style={styles.abortText}>ABORT</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b" },
  scrollContent: { paddingBottom: 120 },
  title: { color: "white", fontSize: 28, fontWeight: "900", letterSpacing: -1 },
  subtitle: {
    color: "#666",
    marginTop: 6,
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: 10,
  },
  sectionTitle: {
    color: "white",
    marginTop: 30,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  pill: {
    padding: 14,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: "#151515",
    borderWidth: 1,
    borderColor: "#222",
  },
  pillActive: { backgroundColor: THEME, borderColor: THEME },
  pillText: { color: "#9ca3af", fontWeight: "700" },
  pillTextActive: { color: "black" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  smallPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#151515",
    borderWidth: 1,
    borderColor: "#222",
  },
  generateBtn: {
    marginTop: 40,
    padding: 18,
    borderRadius: 14,
    alignItems: "center",
  },
  generateBtnText: { color: "black", fontWeight: "900", letterSpacing: 1 },

  // WORKOUT CARD
  workoutCard: {
    marginTop: 30,
    padding: 20,
    backgroundColor: "#111",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#222",
  },
  workoutTitle: { color: "white", fontSize: 22, fontWeight: "900" },
  workoutMeta: {
    color: THEME,
    fontSize: 10,
    fontWeight: "800",
    marginTop: 4,
    letterSpacing: 1,
  },
  exerciseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  exerciseName: { color: "white", fontWeight: "600" },
  exerciseDetails: { color: "#666", fontWeight: "800" },

  // FOOTER CONTROLS
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    backgroundColor: "#0b0b0b", // Use solid black to test layout first
    borderTopWidth: 1,
    borderTopColor: "#222",
    // Ensure the footer itself is centering the row
    alignItems: "center",
  },
  actionRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    // We use width '100%' and justifyContent to force the spread
    width: "100%",
    justifyContent: "space-between",
  },
  actionBtn: {
    // Use a height and flex combo
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    // This ensures the margin doesn't break the flex calculation
    marginHorizontal: 4,
  },
  startBtn: {
    flex: 0.7,
    backgroundColor: THEME,
    borderColor: THEME,
  },
  startText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 12, // Slightly larger for readability
    letterSpacing: 0.5,
  },
  finishBtn: {
    flex: 0.7,
    backgroundColor: "transparent",
    borderColor: THEME,
  },
  finishText: {
    color: THEME,
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  abortBtn: {
    flex: 1,
    backgroundColor: "transparent",
    borderColor: "#FF453A",
  },
  abortText: {
    color: "#FF453A",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
