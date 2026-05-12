import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../lib/supabase";

const CYCLE_COLORS = ["#CCFF00", "#00F0FF", "#FF00FF", "#FF3E3E", "#FF8A00"];

export default function History() {
  const [history, setHistory] = useState<any[]>([]);

  // ----------------------------
  // LOAD DATA
  // ----------------------------
  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function load() {
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

    console.log("USER:", user);

    if (!user) return;

    const { data, error } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", user.id);

    console.log("RAW LOGS:", data);
    console.log("LOAD ERROR:", error);

    setHistory(data || []);
  }

  // ----------------------------
  // DATE HELPERS
  // ----------------------------
  const formatDateKey = (dateString?: string | null) => {
    if (!dateString) return "unknown-date";

    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "unknown-date";

    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getUTCDate()).padStart(2, "0")}`;
  };

  const formatDateDisplay = (dateKey: string) => {
    if (dateKey === "unknown-date") return "Unknown Date";

    const [y, m, d] = dateKey.split("-");

    const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // ----------------------------
  // GROUPING ENGINE (FIXED)
  // ----------------------------
  const groupedHistoryMap = new Map<string, any>();

  history.forEach((current) => {
    const sessionId = current.session_id;
    if (!sessionId) return;

    let session = groupedHistoryMap.get(sessionId);

    if (!session) {
      session = {
        sessionId,
        date: current.created_at, // first log timestamp
        exercises: [],
      };

      groupedHistoryMap.set(sessionId, session);
    }

    const existingExercise = session.exercises.find(
      (e: any) => e.name === current.exercise_name
    );

    if (existingExercise) {
      existingExercise.sets.push({
        weight: current.weight,
        reps: current.reps,
      });
    } else {
      session.exercises.push({
        name: current.exercise_name,
        muscle: current.muscle_group,
        sets: [
          {
            weight: current.weight,
            reps: current.reps,
          },
        ],
      });
    }
  });
  const groupedHistory = Array.from(groupedHistoryMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // ----------------------------
  // COLORS
  // ----------------------------
  const getThemeColorForIndex = (index: number) => {
    const len = groupedHistory?.length ?? 1;

    return CYCLE_COLORS[(len - 1 - index) % CYCLE_COLORS.length];
  };

  // ----------------------------
  // RENDER
  // ----------------------------
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={[styles.subtitle, { color: CYCLE_COLORS[0] }]}>
          {groupedHistory.length} SESSIONS COMPLETED
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {groupedHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No logs found.</Text>
          </View>
        ) : (
          groupedHistory.map((day, dayIdx) => {
            const themeColor = getThemeColorForIndex(dayIdx);

            return (
              <View key={day.dateKey} style={styles.sessionContainer}>
                {/* DATE HEADER */}
                <View style={styles.dateHeader}>
                  <Text style={[styles.dateText, { color: themeColor }]}>
                    {new Date(day.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                  <View
                    style={[
                      styles.dateLine,
                      { backgroundColor: themeColor, opacity: 0.2 },
                    ]}
                  />
                </View>

                {/* EXERCISES */}
                {day.exercises.map((ex: any, exIdx: number) => (
                  <View
                    key={`${ex.name}-${exIdx}`}
                    style={[styles.logCard, { borderColor: `${themeColor}20` }]}
                  >
                    <View
                      style={[
                        styles.cardAccent,
                        { backgroundColor: themeColor },
                      ]}
                    />

                    <View style={styles.cardBody}>
                      <View style={styles.topRow}>
                        <View>
                          <Text style={styles.exerciseTitle}>{ex.name}</Text>
                          <Text style={styles.muscleSub}>
                            {ex.muscle?.toUpperCase()}
                          </Text>
                        </View>

                        <Text style={styles.setCountText}>
                          {ex.sets.length} SETS
                        </Text>
                      </View>

                      <View style={styles.setsList}>
                        {ex.sets.map((set: any, sIdx: number) => (
                          <View key={sIdx} style={styles.setRow}>
                            <Text style={styles.setIndex}>S{sIdx + 1}</Text>
                            <Text style={styles.setDetails}>
                              {set.weight}{" "}
                              <Text style={styles.unitSmall}>LBS</Text> ×{" "}
                              {set.reps}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ----------------------------
// STYLES
// ----------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
  title: {
    color: "white",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 4,
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  sessionContainer: { marginBottom: 10 },

  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 25,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "800",
    marginRight: 10,
    textTransform: "uppercase",
  },
  dateLine: { flex: 1, height: 1 },

  logCard: {
    backgroundColor: "#0D0D0D",
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: "row",
    overflow: "hidden",
    borderWidth: 1,
  },
  cardAccent: { width: 4 },

  cardBody: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  exerciseTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },

  muscleSub: {
    color: "#555",
    fontSize: 9,
    fontWeight: "800",
    marginTop: 2,
  },

  setCountText: {
    color: "#444",
    fontSize: 10,
    fontWeight: "900",
  },

  setsList: { gap: 4 },

  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
  },

  setIndex: {
    color: "#333",
    fontSize: 10,
    fontWeight: "900",
    width: 25,
  },

  setDetails: {
    color: "#AAA",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },

  unitSmall: { fontSize: 9, color: "#444" },

  emptyState: { marginTop: 100, alignItems: "center" },
  emptyText: { color: "#333", fontSize: 14, fontWeight: "600" },
});
