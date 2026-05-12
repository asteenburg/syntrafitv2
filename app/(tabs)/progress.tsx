import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";
import { supabase } from "../../lib/supabase";

const { width } = Dimensions.get("window");
const NEON_CYAN = "#00F0FF";
const NEON_GREEN = "#CCFF00";
const ZINC_900 = "#18181B";

const MUSCLE_GROUPS = [
  "All",
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Core",
  "Cardio",
  "HIIT",
];

const COLORS = [NEON_CYAN, NEON_GREEN, "#FF00FF", "#FF8A00", "#FF3E3E"];

const num = (v: any) => Number(v) || 0;

/* --- EXERCISE → MUSCLE FALLBACK MAP --- */
const inferMuscle = (exercise: string = "") => {
  const e = exercise.toLowerCase();
  if (e.includes("bench") || e.includes("chest")) return "chest";
  if (e.includes("row") || e.includes("pull")) return "back";
  if (e.includes("squat")) return "quads";
  if (e.includes("hamstring")) return "hamstrings";
  if (e.includes("calf")) return "calves";
  if (e.includes("glute")) return "glutes";
  if (e.includes("lateral") || e.includes("shoulder")) return "shoulders";
  if (e.includes("curl") && !e.includes("leg")) return "biceps";
  if (e.includes("tricep") || e.includes("pushdown")) return "triceps";
  if (e.includes("run") || e.includes("bike")) return "cardio";
  if (e.includes("hiit")) return "hiit";
  return "other";
};

export default function Progress() {
  const [logs, setLogs] = useState<any[]>([]);
  const [active, setActive] = useState("All");
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", auth.user.id);

    if (!error) setLogs(data || []);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchLogs();
    }, [])
  );

  const getVolume = (l: any) => {
    const weight = num(l.weight);
    const reps = num(l.reps);
    return weight <= 0 ? reps : weight * reps;
  };

  const analytics = useMemo(() => {
    const muscleMap: Record<string, number> = {};
    const dateMap: Record<string, number> = {};
    const prs: Record<string, number> = {};
    const activityDays = new Set<string>();
    const filter = active.toLowerCase();

    logs.forEach((l) => {
      const exercise = l.exercise_name || "";
      const rawMuscle = (l.muscle_group || "").toLowerCase();
      const muscle =
        rawMuscle !== "" && rawMuscle !== "unknown"
          ? rawMuscle
          : inferMuscle(exercise);

      if (l.created_at) {
        const isoDate = new Date(l.created_at).toISOString().split("T")[0];
        activityDays.add(isoDate);
      }

      if (filter !== "all" && !muscle.includes(filter)) return;

      const volume = getVolume(l);
      muscleMap[muscle] = (muscleMap[muscle] || 0) + volume;

      const d = new Date(l.created_at);
      const dateKey = `${d.getMonth() + 1}/${d.getDate()}`;
      dateMap[dateKey] = (dateMap[dateKey] || 0) + volume;
      prs[exercise] = Math.max(prs[exercise] || 0, num(l.weight));
    });

    const heatmap = Array.from({ length: 28 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split("T")[0];
      return { date: dateString, isActive: activityDays.has(dateString) };
    }).reverse();

    const totalVolume = Object.values(muscleMap).reduce((a, b) => a + b, 0);

    const donutData = Object.entries(muscleMap)
      .filter(([_, v]) => v > 0)
      .map(([k, v], i) => ({
        value: v,
        label: k.charAt(0).toUpperCase() + k.slice(1),
        color: COLORS[i % COLORS.length],
      }));

    const barData = Object.entries(dateMap)
      .map(([date, value]) => ({ value, label: date, frontColor: NEON_CYAN }))
      .slice(-7);

    const prList = Object.entries(prs)
      .map(([exercise, weight]) => ({ exercise, weight }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 8);

    return { donutData, barData, prList, totalVolume, heatmap };
  }, [logs, active]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#000" }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View style={{ padding: 20 }}>
        <Text style={styles.pageTitle}>PROGRESS</Text>

        {loading ? (
          <ActivityIndicator color={NEON_CYAN} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* DASHBOARD CARD */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>DASHBOARD OVERVIEW</Text>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 20,
                  marginBottom: 20,
                }}
              >
                <PieChart
                  donut
                  radius={55}
                  innerRadius={40}
                  data={
                    analytics.donutData.length > 0
                      ? analytics.donutData
                      : [{ value: 1, color: "#27272A" }]
                  }
                  centerLabelComponent={() => (
                    <View style={{ alignItems: "center" }}>
                      <Text
                        style={{
                          color: "white",
                          fontWeight: "800",
                          fontSize: 12,
                        }}
                      >
                        {analytics.totalVolume > 1000
                          ? `${(analytics.totalVolume / 1000).toFixed(1)}k`
                          : analytics.totalVolume}
                      </Text>
                    </View>
                  )}
                />
                <View style={{ gap: 4, flexShrink: 1 }}>
                  {analytics.donutData.slice(0, 4).map((item, i) => (
                    <View key={i} style={styles.legendItem}>
                      <View
                        style={[styles.dot, { backgroundColor: item.color }]}
                      />
                      <Text
                        style={[styles.legendText, { fontSize: 11 }]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* MONTHLY GOAL BAR */}
              <View style={{ marginBottom: 20 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Text
                    style={{
                      color: "#71717A",
                      fontSize: 10,
                      fontWeight: "800",
                    }}
                  >
                    MONTHLY GOAL
                  </Text>
                  <Text
                    style={{ color: "white", fontSize: 10, fontWeight: "800" }}
                  >
                    75%
                  </Text>
                </View>
                <View
                  style={{
                    height: 4,
                    backgroundColor: "#27272A",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      width: "75%",
                      height: "100%",
                      backgroundColor: NEON_CYAN,
                    }}
                  />
                </View>
              </View>

              {/* HEATMAP SECTION */}
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: "#27272A",
                  paddingTop: 20,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <Text
                    style={{
                      color: "#52525B",
                      fontSize: 10,
                      fontWeight: "800",
                    }}
                  >
                    LAST 28 DAYS ACTIVITY
                  </Text>
                  <Text
                    style={{
                      color: NEON_GREEN,
                      fontSize: 10,
                      fontWeight: "800",
                    }}
                  >
                    {analytics.heatmap.filter((d) => d.isActive).length}{" "}
                    SESSIONS
                  </Text>
                </View>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}
                >
                  {analytics.heatmap.map((day, i) => (
                    <View
                      key={i}
                      style={{
                        width: (width - 100) / 7 - 6,
                        height: 14,
                        borderRadius: 3,
                        backgroundColor: day.isActive ? NEON_GREEN : "#27272A",
                        borderWidth: day.isActive ? 0 : 1,
                        borderColor: day.isActive ? "transparent" : "#3F3F46",
                      }}
                    />
                  ))}
                </View>
              </View>
            </View>

            {/* FILTERS */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginVertical: 10 }}
            >
              {MUSCLE_GROUPS.map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => setActive(m)}
                  style={[styles.pill, active === m && styles.activePill]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      active === m && styles.activePillText,
                    ]}
                  >
                    {m.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* BAR CHART */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>VOLUME HISTORY</Text>
              {analytics.barData.length === 0 ? (
                <Text style={styles.emptyText}>No data for this period</Text>
              ) : (
                <View style={{ marginLeft: -20, marginTop: 10 }}>
                  <BarChart
                    data={analytics.barData}
                    barWidth={22}
                    spacing={18}
                    hideRules
                    xAxisThickness={0}
                    yAxisThickness={0}
                    yAxisTextStyle={{ color: "#52525B", fontSize: 10 }}
                    xAxisLabelTextStyle={{ color: "#52525B", fontSize: 10 }}
                    isAnimated
                  />
                </View>
              )}
            </View>

            {/* PRs */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>TOP RECORDS</Text>
              {analytics.prList.length === 0 ? (
                <Text style={styles.emptyText}>No records found</Text>
              ) : (
                analytics.prList.map((p, i) => (
                  <View key={i} style={styles.prRow}>
                    <Text style={styles.prName}>{p.exercise}</Text>
                    <Text style={styles.prWeight}>
                      {p.weight} <Text style={{ fontSize: 10 }}>LBS</Text>
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    color: "white",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: 10,
  },
  card: {
    backgroundColor: ZINC_900,
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  cardTitle: {
    color: "#71717A",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 20,
    letterSpacing: 1,
  },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendText: { color: "white", fontSize: 12, fontWeight: "600" },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: ZINC_900,
    borderWidth: 1,
    borderColor: "#27272A",
  },
  activePill: { backgroundColor: NEON_CYAN, borderColor: NEON_CYAN },
  pillText: { color: "#71717A", fontSize: 10, fontWeight: "800" },
  activePillText: { color: "#000" },
  prRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#27272A",
  },
  prName: { color: "white", fontWeight: "600", fontSize: 13 },
  prWeight: { color: NEON_CYAN, fontWeight: "900" },
  emptyText: { color: "#3F3F46", textAlign: "center", paddingVertical: 20 },
});
