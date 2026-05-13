// ===============================
// APPLE FITNESS+ STYLE POLISH
// LOGIC UNCHANGED
// ONLY STYLING / VISUAL ENHANCEMENTS
// ===============================

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

  const handlePrimaryAction = () => {
    if (status === "idle") return generateWorkout();
    if (status === "ready") return startSession();
    if (status === "active") return saveWorkout();
  };

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
        activeOpacity={0.92}
        onPress={() => {
          if (!isSelectable) return;
          setActiveExercise(isFocused ? null : item.id);
        }}
        style={{
          marginHorizontal: 16,
          marginBottom: 18,
        }}
      >
        <BlurView
          intensity={65}
          tint="dark"
          style={[
            styles.exerciseCard,
            {
              overflow: "hidden",
              borderRadius: 30,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.06)",
              backgroundColor: "rgba(24,24,24,0.72)",
            },
          ]}
        >
          {/* subtle glow edge */}
          <LinearGradient
            colors={["rgba(255,255,255,0.08)", "transparent", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 120,
            }}
          />

          <View style={{ padding: 22 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.exerciseTitle,
                    {
                      fontSize: 24,
                      fontWeight: "700",
                      letterSpacing: -0.7,
                    },
                  ]}
                >
                  {item.name}
                </Text>

                <Text
                  style={[
                    styles.exerciseSub,
                    {
                      marginTop: 6,
                      color: "rgba(255,255,255,0.5)",
                      fontSize: 14,
                      letterSpacing: 0.3,
                    },
                  ]}
                >
                  {item.muscle} • {item.sets} sets
                </Text>
              </View>

              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  backgroundColor: NEON_GREEN,
                  opacity: isFocused ? 1 : 0.35,
                }}
              />
            </View>

            {isFocused && (
              <View style={{ marginTop: 24 }}>
                {Array.from({ length: item.sets }).map((_, i) => (
                  <BlurView
                    key={`${item.id}-set-${i}`}
                    intensity={30}
                    tint="dark"
                    style={{
                      marginBottom: 14,
                      padding: 16,
                      borderRadius: 22,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: "rgba(255,255,255,0.05)",
                      backgroundColor: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <Text
                      style={{
                        color: "rgba(255,255,255,0.4)",
                        fontSize: 11,
                        marginBottom: 14,
                        letterSpacing: 1.8,
                        fontWeight: "700",
                      }}
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
                      {/* Weight */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 14,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() =>
                            updateSetData(item.id, i, "weight", -5)
                          }
                          activeOpacity={0.8}
                        >
                          <View
                            style={[
                              styles.adjustCircle,
                              {
                                width: 38,
                                height: 38,
                                borderRadius: 999,
                                backgroundColor: "rgba(255,255,255,0.06)",
                                justifyContent: "center",
                                alignItems: "center",
                              },
                            ]}
                          >
                            <Text
                              style={{
                                color: "#fff",
                                fontSize: 20,
                                fontWeight: "300",
                              }}
                            >
                              −
                            </Text>
                          </View>
                        </TouchableOpacity>

                        <Text
                          style={{
                            color: "#fff",
                            minWidth: 65,
                            textAlign: "center",
                            fontSize: 18,
                            fontWeight: "600",
                            letterSpacing: -0.3,
                          }}
                        >
                          {weights[i] ?? 0}
                          <Text
                            style={{
                              color: "rgba(255,255,255,0.45)",
                              fontSize: 13,
                            }}
                          >
                            {" "}
                            lb
                          </Text>
                        </Text>

                        <TouchableOpacity
                          onPress={() => updateSetData(item.id, i, "weight", 5)}
                          activeOpacity={0.8}
                        >
                          <View
                            style={[
                              styles.adjustCircle,
                              {
                                width: 38,
                                height: 38,
                                borderRadius: 999,
                                backgroundColor: "rgba(255,255,255,0.06)",
                                justifyContent: "center",
                                alignItems: "center",
                              },
                            ]}
                          >
                            <Text
                              style={{
                                color: "#fff",
                                fontSize: 20,
                                fontWeight: "300",
                              }}
                            >
                              +
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>

                      {/* Reps */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 14,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => updateSetData(item.id, i, "reps", -1)}
                          activeOpacity={0.8}
                        >
                          <View
                            style={[
                              styles.adjustCircle,
                              {
                                width: 38,
                                height: 38,
                                borderRadius: 999,
                                backgroundColor: "rgba(255,255,255,0.06)",
                                justifyContent: "center",
                                alignItems: "center",
                              },
                            ]}
                          >
                            <Text
                              style={{
                                color: "#fff",
                                fontSize: 20,
                                fontWeight: "300",
                              }}
                            >
                              −
                            </Text>
                          </View>
                        </TouchableOpacity>

                        <Text
                          style={{
                            color: NEON_GREEN,
                            minWidth: 75,
                            textAlign: "center",
                            fontSize: 20,
                            fontWeight: "800",
                            letterSpacing: -0.6,
                          }}
                        >
                          {reps[i] ?? 0}
                          <Text
                            style={{
                              color: "rgba(255,255,255,0.45)",
                              fontSize: 13,
                              fontWeight: "600",
                            }}
                          >
                            {" "}
                            reps
                          </Text>
                        </Text>

                        <TouchableOpacity
                          onPress={() => updateSetData(item.id, i, "reps", 1)}
                          activeOpacity={0.8}
                        >
                          <View
                            style={[
                              styles.adjustCircle,
                              {
                                width: 38,
                                height: 38,
                                borderRadius: 999,
                                backgroundColor: "rgba(255,255,255,0.06)",
                                justifyContent: "center",
                                alignItems: "center",
                              },
                            ]}
                          >
                            <Text
                              style={{
                                color: "#fff",
                                fontSize: 20,
                                fontWeight: "300",
                              }}
                            >
                              +
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </BlurView>
                ))}
              </View>
            )}
          </View>
        </BlurView>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: "#050505",
        },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingHorizontal: 24,
            paddingTop: 10,
            paddingBottom: 20,
          },
        ]}
      >
        <Text
          style={[
            styles.brand,
            {
              fontSize: 28,
              fontWeight: "800",
              letterSpacing: -1.2,
              color: "#fff",
            },
          ]}
        >
          SYNTRAFIT
        </Text>

        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.06)",
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <Text
            style={[
              styles.timer,
              {
                color: "#fff",
                fontSize: 16,
                fontWeight: "700",
                letterSpacing: 1,
              },
            ]}
          >
            {formatTime(sessionTime)}
          </Text>
        </View>
      </View>

      {workout.length === 0 ? (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingHorizontal: 20,
              paddingTop: 10,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.55)",
              marginBottom: 22,
              fontSize: 16,
              letterSpacing: -0.2,
            }}
          >
            What are we training today?
          </Text>

          <View
            style={[
              styles.grid,
              {
                gap: 14,
              },
            ]}
          >
            {MUSCLE_GROUPS.map((m) => {
              const isSelected = selectedFocus.includes(m);

              return (
                <TouchableOpacity
                  key={m}
                  activeOpacity={0.88}
                  onPress={() => {
                    if (m === "Full Body") {
                      setSelectedFocus(["Full Body"]);
                    } else {
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
                  style={{
                    transform: [{ scale: isSelected ? 1.03 : 1 }],
                  }}
                >
                  <LinearGradient
                    colors={
                      isSelected
                        ? [NEON_GREEN, "#D8FF72"]
                        : ["rgba(255,255,255,0.10)", "rgba(255,255,255,0.04)"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      paddingVertical: 16,
                      paddingHorizontal: 22,
                      borderRadius: 24,

                      borderWidth: 1,
                      borderColor: isSelected
                        ? "rgba(255,255,255,0.12)"
                        : "rgba(255,255,255,0.06)",

                      shadowColor: isSelected ? NEON_GREEN : "#000",
                      shadowOpacity: isSelected ? 0.35 : 0.15,
                      shadowRadius: isSelected ? 18 : 8,
                      shadowOffset: {
                        width: 0,
                        height: isSelected ? 8 : 4,
                      },

                      elevation: isSelected ? 10 : 2,

                      minWidth: 120,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? "#000" : "#fff",
                        fontWeight: isSelected ? "800" : "600",
                        fontSize: 15,
                        letterSpacing: -0.2,
                      }}
                    >
                      {m}
                    </Text>
                  </LinearGradient>
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
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: 180,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Footer */}
      <View
        style={[
          styles.footer,
          {
            position: "absolute",
            bottom: 28,
            left: 20,
            right: 20,
          },
        ]}
      >
        <TouchableOpacity onPress={handlePrimaryAction} activeOpacity={0.9}>
          <LinearGradient
            colors={[NEON_GREEN, "#C9FF45"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.btn,
              {
                height: 64,
                borderRadius: 999,
                justifyContent: "center",
                alignItems: "center",
                shadowColor: NEON_GREEN,
                shadowOpacity: 0.45,
                shadowRadius: 24,
                shadowOffset: {
                  width: 0,
                  height: 10,
                },
                elevation: 12,
              },
            ]}
          >
            <Text
              style={[
                styles.btnText,
                {
                  color: "#000",
                  fontSize: 17,
                  fontWeight: "800",
                  letterSpacing: 1.1,
                },
              ]}
            >
              {status === "idle"
                ? "GENERATE"
                : status === "ready"
                ? "START"
                : "FINISH"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {status === "active" && (
          <TouchableOpacity
            onPress={handleAbort}
            style={{
              marginTop: 18,
              alignItems: "center",
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.abort,
                {
                  color: "rgba(255,255,255,0.45)",
                  fontSize: 13,
                  letterSpacing: 1.4,
                  fontWeight: "700",
                },
              ]}
            >
              END SESSION
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
