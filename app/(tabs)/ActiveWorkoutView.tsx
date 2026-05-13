import { BlurView } from "expo-blur";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react-native";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { styles } from "../styles/activeWorkoutTheme";

// FIX: This interface now matches your types/workout.ts global definition
interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number | string; // Matches global 'string | number'
  weight: number;
  muscle?: string;
  type?: string; // Included to prevent missing property errors
  movement_id?: string; // Included to prevent missing property errors
}

interface Props {
  workout: Exercise[];
  activeLogs: Record<string, number[]>;
  activeReps: Record<string, number[]>;
  setActiveLogs: (logs: Record<string, number[]>) => void;
  setActiveReps: (reps: Record<string, number[]>) => void;
  onCancel: () => void;
  onSave: () => void;
  formatTime: (s: number) => string;
  sessionTime: number;
}

export default function ActiveWorkoutView({
  workout,
  activeLogs,
  activeReps,
  setActiveLogs,
  setActiveReps,
  onCancel,
  onSave,
  formatTime,
  sessionTime,
}: Props) {
  // Logic remains identical to ensure your toggles work
  const updateWeight = (
    exerciseId: string,
    setIndex: number,
    delta: number
  ) => {
    const newLogs = { ...activeLogs };
    if (!newLogs[exerciseId]) return;
    newLogs[exerciseId][setIndex] = Math.max(
      0,
      (Number(newLogs[exerciseId][setIndex]) || 0) + delta
    );
    setActiveLogs(newLogs);
  };

  const updateReps = (exerciseId: string, setIndex: number, delta: number) => {
    const newReps = { ...activeReps };
    if (!newReps[exerciseId]) return;
    newReps[exerciseId][setIndex] = Math.max(
      0,
      (Number(newReps[exerciseId][setIndex]) || 0) + delta
    );
    setActiveReps(newReps);
  };

  const handleManualWeight = (
    exerciseId: string,
    setIndex: number,
    val: string
  ) => {
    const num = parseInt(val) || 0;
    const newLogs = { ...activeLogs };
    if (!newLogs[exerciseId]) return;
    newLogs[exerciseId][setIndex] = num;
    setActiveLogs(newLogs);
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={100} tint="dark" style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={onCancel} style={styles.closeCircle}>
              <X color="#FFF" size={20} />
            </TouchableOpacity>
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>{formatTime(sessionTime)}</Text>
            </View>
            <TouchableOpacity onPress={onSave} style={styles.saveButton}>
              <Check color="#30D158" size={24} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </BlurView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {workout.map((ex) => (
          <View key={ex.id} style={styles.exerciseSection}>
            <Text style={styles.exerciseHeading}>{ex.name}</Text>

            {Array.from({ length: ex.sets }).map((_, setIndex) => (
              <View key={`${ex.id}-set-${setIndex}`} style={styles.setRow}>
                <Text style={styles.setNumber}>SET {setIndex + 1}</Text>

                <View style={styles.controlGroup}>
                  <TouchableOpacity
                    onPress={() => updateWeight(ex.id, setIndex, -5)}
                  >
                    <ChevronDown color="#8E8E93" size={24} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.weightInput}
                    keyboardType="numeric"
                    value={String(activeLogs[ex.id]?.[setIndex] ?? 0)}
                    onChangeText={(val) =>
                      handleManualWeight(ex.id, setIndex, val)
                    }
                    placeholderTextColor="#444"
                  />
                  <TouchableOpacity
                    onPress={() => updateWeight(ex.id, setIndex, 5)}
                  >
                    <ChevronUp color="#30D158" size={24} />
                  </TouchableOpacity>
                  <Text style={styles.unitText}>LBS</Text>
                </View>

                <View style={styles.controlGroup}>
                  <TouchableOpacity
                    onPress={() => updateReps(ex.id, setIndex, -1)}
                  >
                    <ChevronDown color="#8E8E93" size={24} />
                  </TouchableOpacity>
                  <Text style={styles.repText}>
                    {activeReps[ex.id]?.[setIndex] ?? 0}
                  </Text>
                  <TouchableOpacity
                    onPress={() => updateReps(ex.id, setIndex, 1)}
                  >
                    <ChevronUp color="#30D158" size={24} />
                  </TouchableOpacity>
                  <Text style={styles.unitText}>REPS</Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
