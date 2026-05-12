import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { workouts } from "../data/workouts";
import { supabase } from "../lib/supabase";

type WorkoutLog = {
  id: string;
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
  created_at: string;
};

export default function Dashboard() {
  const router = useRouter();

  const [history, setHistory] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.log("History load error:", error.message);
      setHistory([]);
      setLoading(false);
      return;
    }

    setHistory((data as WorkoutLog[]) || []);
    setLoading(false);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0b0b0b" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* HEADER */}
        <View style={{ paddingTop: 70, paddingHorizontal: 24 }}>
          <Text style={{ color: "white", fontSize: 34, fontWeight: "800" }}>
            Progress
          </Text>

          <Text style={{ color: "#9ca3af", marginTop: 6 }}>
            Your training history & progression
          </Text>
        </View>

        {/* QUICK WORKOUTS */}
        <View style={{ marginTop: 30 }}>
          <Text
            style={{
              color: "white",
              fontSize: 24,
              fontWeight: "800",
              paddingHorizontal: 24,
              marginBottom: 16,
            }}
          >
            Quick Workouts
          </Text>

          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingLeft: 24,
              paddingRight: 12,
            }}
          >
            {workouts.map((workout) => (
              <TouchableOpacity
                key={workout.id}
                activeOpacity={0.8}
                onPress={() => router.push("/workout")}
                style={{
                  width: 260,
                  backgroundColor: "#151515",
                  padding: 18,
                  borderRadius: 18,
                  marginRight: 12,
                  borderWidth: 1,
                  borderColor: "#2a2a2a",
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontSize: 18,
                    fontWeight: "700",
                  }}
                >
                  {workout.title}
                </Text>

                <Text style={{ color: "#9ca3af", marginTop: 8 }}>
                  {workout.category}
                </Text>

                <Text style={{ color: "#9ca3af", marginTop: 4 }}>
                  {workout.duration} • {workout.level}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* HISTORY */}
        <View style={{ marginTop: 34, paddingHorizontal: 24 }}>
          <Text
            style={{
              color: "white",
              fontSize: 24,
              fontWeight: "800",
              marginBottom: 16,
            }}
          >
            Recent Workouts
          </Text>

          {loading && (
            <View
              style={{
                backgroundColor: "#151515",
                padding: 20,
                borderRadius: 16,
              }}
            >
              <Text style={{ color: "#9ca3af" }}>
                Loading history...
              </Text>
            </View>
          )}

          {!loading && history.length === 0 && (
            <View
              style={{
                backgroundColor: "#151515",
                padding: 20,
                borderRadius: 16,
              }}
            >
              <Text style={{ color: "white", fontWeight: "700" }}>
                No workouts yet
              </Text>

              <Text style={{ color: "#9ca3af", marginTop: 6 }}>
                Complete your first workout to start tracking progress.
              </Text>
            </View>
          )}

          {!loading &&
            history.map((item) => (
              <View
                key={item.id}
                style={{
                  backgroundColor: "#151515",
                  padding: 16,
                  borderRadius: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "#2a2a2a",
                }}
              >
                <Text
                  style={{
                    color: "white",
                    fontWeight: "700",
                    marginBottom: 10,
                  }}
                >
                  {new Date(item.created_at).toDateString()}
                </Text>

                <Text style={{ color: "#9ca3af", marginTop: 4 }}>
                  {item.exercise} — {item.sets}x{item.reps} ({item.weight} lb)
                </Text>
              </View>
            ))}
        </View>
      </ScrollView>
    </View>
  );
}