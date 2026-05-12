import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function ExerciseCard({
  ex,
  active,
  setActiveExercise,
  activeLogs,
  NEON_GREEN,
}: any) {
  const isActive = active;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => setActiveExercise(ex.name)}
      style={[
        {
          backgroundColor: "#121212",
          borderRadius: 18,
          padding: 16,
          marginBottom: 12,

          borderLeftWidth: 4,
          borderLeftColor: isActive ? NEON_GREEN : "transparent",

          opacity: isActive ? 1 : 0.75,

          // 🔥 Apple-style depth
          shadowColor: NEON_GREEN,
          shadowOpacity: isActive ? 0.35 : 0,
          shadowRadius: isActive ? 18 : 0,
          shadowOffset: { width: 0, height: 8 },

          elevation: isActive ? 10 : 0,

          transform: [{ scale: isActive ? 1.02 : 1 }],
        },
      ]}
    >
      {/* HEADER */}
      <Text
        style={{
          color: "#FFF",
          fontSize: 18,
          fontWeight: "900",
          letterSpacing: -0.3,
        }}
      >
        {ex.name}
      </Text>

      <Text
        style={{
          color: isActive ? NEON_GREEN : "#888",
          fontSize: 12,
          marginTop: 4,
          fontWeight: "700",
        }}
      >
        {ex.muscle} • {ex.sets} sets • {ex.type}
      </Text>

      {/* SETS */}
      <View style={{ marginTop: 10 }}>
        {(activeLogs[ex.name] ?? []).map((w: number, i: number) => (
          <View
            key={i}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 6,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(255,255,255,0.05)",
            }}
          >
            <Text style={{ color: "#666" }}>Set {i + 1}</Text>
            <Text style={{ color: "#FFF", fontWeight: "800" }}>{w} lbs</Text>
          </View>
        ))}
      </View>

      {/* ACTIVE INDICATOR */}
      {isActive && (
        <View
          style={{
            marginTop: 10,
            height: 2,
            backgroundColor: NEON_GREEN,
            shadowColor: NEON_GREEN,
            shadowOpacity: 0.8,
            shadowRadius: 8,
          }}
        />
      )}
    </TouchableOpacity>
  );
}
