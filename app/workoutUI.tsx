import React from "react";
import {
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Exercise, Muscle } from "../types/workout";

type Mode = "idle" | "ready" | "active" | "saving";

type Props = {
  workout: Exercise[];
  selectedFocus: Muscle[];
  setSelectedFocus: (v: Muscle[]) => void;
  activeLogs: Record<string, number[]>;
  activeReps: Record<string, number[]>;
  setActiveLogs: React.Dispatch<React.SetStateAction<Record<string, number[]>>>;
  setActiveReps: React.Dispatch<React.SetStateAction<Record<string, number[]>>>;
  activeExercise: string | null;
  setActiveExercise: (v: string | null) => void;
  status: Mode;
  sessionTime: number;
  generateWorkout: () => void;
  saveWorkout: () => void;
  handleAbort: () => void;
  startSession: () => void;
  formatTime: (s: number) => string;
  MUSCLE_GROUPS: Muscle[];
  NEON_GREEN: string;
  isSelectable: boolean;
  styles: any;
};

export default function WorkoutUI(props: Props) {
  const insets = useSafeAreaInsets();

  const {
    workout,
    selectedFocus,
    setSelectedFocus,
    activeLogs,
    activeReps,
    setActiveLogs,
    setActiveReps,
    activeExercise,
    setActiveExercise,
    status,
    sessionTime,
    generateWorkout,
    saveWorkout,
    handleAbort,
    startSession,
    formatTime,
    MUSCLE_GROUPS,
    NEON_GREEN,
    isSelectable,
    styles,
  } = props;

  /**
   * Primary Button Logic (Generate -> Start -> Finish)
   */
  const handlePrimaryAction = () => {
    if (status === "idle") return generateWorkout();
    if (status === "ready") return startSession();
    if (status === "active") return saveWorkout();
  };

  /**
   * Updates manual weight/reps for a specific set
   */
  const updateSetData = (
    id: string,
    index: number,
    type: "weight" | "reps",
    delta: number
  ) => {
    const isWeight = type === "weight";
    const setter = isWeight ? setActiveLogs : setActiveReps;

    setter((prev) => {
      const currentArr = [...(prev[id] ?? [])];
      // Ensure we don't go below 0
      currentArr[index] = Math.max(0, (currentArr[index] ?? 0) + delta);
      return { ...prev, [id]: currentArr };
    });
  };

  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    const isFocused = activeExercise === item.id;
    const weights = activeLogs[item.id] ?? [];
    const reps = activeReps[item.id] ?? [];

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (!isSelectable) return;
          setActiveExercise(isFocused ? null : item.id);
        }}
      >
        <BlurView intensity={40} tint="dark" style={styles.exerciseCard}>
          <View style={{ padding: 20 }}>
            <Text style={styles.exerciseTitle}>{item.name}</Text>
            <Text style={styles.exerciseSub}>
              {item.muscle} • {item.sets} sets
            </Text>

            {isFocused && (
              <View style={{ marginTop: 15 }}>
                {Array.from({ length: item.sets }).map((_, i) => (
                  <View
                    key={`${item.id}-set-${i}`}
                    style={{ marginBottom: 12 }}
                  >
                    <Text
                      style={{ color: "#888", fontSize: 12, marginBottom: 4 }}
                    >
                      SET {i + 1}
                    </Text>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      {/* Weight Controls */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 15,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() =>
                            updateSetData(item.id, i, "weight", -5)
                          }
                        >
                          <View style={styles.adjustCircle}>
                            <Text style={{ color: "#fff" }}>-</Text>
                          </View>
                        </TouchableOpacity>

                        <Text
                          style={{
                            color: "#fff",
                            minWidth: 50,
                            textAlign: "center",
                          }}
                        >
                          {weights[i] ?? 0} lb
                        </Text>

                        <TouchableOpacity
                          onPress={() => updateSetData(item.id, i, "weight", 5)}
                        >
                          <View style={styles.adjustCircle}>
                            <Text style={{ color: "#fff" }}>+</Text>
                          </View>
                        </TouchableOpacity>
                      </View>

                      {/* Rep Controls */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 15,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => updateSetData(item.id, i, "reps", -1)}
                        >
                          <View style={styles.adjustCircle}>
                            <Text style={{ color: "#fff" }}>-</Text>
                          </View>
                        </TouchableOpacity>

                        <Text
                          style={{
                            color: NEON_GREEN,
                            minWidth: 50,
                            textAlign: "center",
                            fontWeight: "bold",
                          }}
                        >
                          {reps[i] ?? 0} reps
                        </Text>

                        <TouchableOpacity
                          onPress={() => updateSetData(item.id, i, "reps", 1)}
                        >
                          <View style={styles.adjustCircle}>
                            <Text style={{ color: "#fff" }}>+</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.brand}>SYNTRAFIT</Text>
        <Text style={styles.timer}>{formatTime(sessionTime)}</Text>
      </View>

      {workout.length === 0 ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={{ color: "#888", marginBottom: 15 }}>
            What are we training today?
          </Text>
          <View style={styles.grid}>
            {MUSCLE_GROUPS.map((m) => {
              const isSelected = selectedFocus.includes(m);

              return (
                <TouchableOpacity
                  key={m}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (m === "Full Body") {
                      // Selecting Full Body clears specific muscle groups
                      setSelectedFocus(["Full Body"]);
                    } else {
                      // Selecting a muscle group removes Full Body fallback
                      const withoutFullBody = selectedFocus.filter(
                        (f) => f !== "Full Body"
                      );
                      const alreadySelected = withoutFullBody.includes(m);

                      setSelectedFocus(
                        alreadySelected
                          ? withoutFullBody.filter((f) => f !== m)
                          : [...withoutFullBody, m]
                      );
                    }
                  }}
                  style={[
                    styles.pill,
                    isSelected && { backgroundColor: NEON_GREEN },
                  ]}
                >
                  <Text
                    style={{
                      color: isSelected ? "#000" : "#fff",
                      fontWeight: isSelected ? "bold" : "normal",
                    }}
                  >
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={workout}
          keyExtractor={(item) => item.id}
          renderItem={renderExerciseItem}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity onPress={handlePrimaryAction}>
          <LinearGradient colors={[NEON_GREEN, "#A3CC00"]} style={styles.btn}>
            <Text style={styles.btnText}>
              {status === "idle"
                ? "GENERATE"
                : status === "ready"
                ? "START"
                : "FINISH"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {status === "active" && (
          <TouchableOpacity onPress={handleAbort} style={{ marginTop: 15 }}>
            <Text style={styles.abort}>END SESSION</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
