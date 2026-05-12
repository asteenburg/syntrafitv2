import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function MuscleSelector({
  selectedFocus,
  setSelectedFocus,
  MUSCLE_GROUPS,
  NEON_GREEN,
  generateWorkout,
}: any) {
  return (
    <View>
      <Text style={{ color: "#FFF", fontSize: 22, fontWeight: "800" }}>
        Select muscles
      </Text>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginTop: 12,
        }}
      >
        {MUSCLE_GROUPS.map((m: string) => {
          const selected = selectedFocus.includes(m);

          return (
            <TouchableOpacity
              key={m}
              onPress={() =>
                setSelectedFocus(
                  selected
                    ? selectedFocus.filter((x: string) => x !== m)
                    : [...selectedFocus, m]
                )
              }
              style={{
                padding: 10,
                borderRadius: 999,
                backgroundColor: selected ? NEON_GREEN : "#1A1A1A",
              }}
            >
              <Text style={{ color: selected ? "#000" : "#FFF" }}>{m}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={generateWorkout}
        style={{
          marginTop: 20,
          backgroundColor: NEON_GREEN,
          padding: 16,
          borderRadius: 16,
        }}
      >
        <Text style={{ fontWeight: "900" }}>Generate Workout</Text>
      </TouchableOpacity>
    </View>
  );
}
