import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function ActiveSessionOverlay({
  sessionTime,
  workout,
  activeExercise,
  NEON_GREEN,
  handleAbort,
  saveWorkout,
}: any) {
  const current =
    workout.find((x: any) => x.name === activeExercise)?.name ||
    workout[0]?.name ||
    "Workout";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#050505",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 72, color: "#FFF", fontWeight: "900" }}>
        {Math.floor(sessionTime / 60)}:
        {(sessionTime % 60).toString().padStart(2, "0")}
      </Text>

      <Text style={{ color: NEON_GREEN, fontSize: 20, marginTop: 20 }}>
        {current}
      </Text>

      <View style={{ flexDirection: "row", gap: 16, marginTop: 40 }}>
        <TouchableOpacity onPress={handleAbort}>
          <Text style={{ color: "#FF4444", fontWeight: "800" }}>End</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={saveWorkout}>
          <Text style={{ color: NEON_GREEN, fontWeight: "800" }}>Finish</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
