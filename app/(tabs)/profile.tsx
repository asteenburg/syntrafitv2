import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { ERROR, THEME, styles } from "../styles/profileTheme";

export default function Profile() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [goal, setGoal] = useState("Build Muscle");
  const [level, setLevel] = useState("Intermediate");
  const [frequency, setFrequency] = useState(3);
  const [location, setLocation] = useState("Gym");

  const displayName = userEmail ? userEmail.split("@")[0] : "OPERATOR";
  const restDays = 7 - frequency;

  useEffect(() => {
    fetchProfileData();
  }, []);

  async function fetchProfileData() {
    setRefreshing(true);
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    if (!user) {
      setRefreshing(false);
      return;
    }

    setUserEmail(user.email ?? "OPERATOR");

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && data) {
      setGoal(data.training_goal ?? "Build Muscle");
      setLevel(data.experience_level ?? "Intermediate");
      setFrequency(data.weekly_frequency ?? 3);
      setLocation(data.training_location ?? "Gym");
    }
    setRefreshing(false);
  }

  const updateEngineParams = async () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    if (!user) {
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        training_goal: goal,
        experience_level: level,
        weekly_frequency: frequency,
        training_location: location,
      })
      .eq("id", user.id);

    if (!error) {
      // Re-fetch ensures the local state is hard-synced with DB
      await fetchProfileData();
      Alert.alert(
        "SYNC SUCCESSFUL",
        "Engine parameters calibrated to your profile."
      );
    } else {
      Alert.alert("SYNC ERROR", error.message);
    }
    setLoading(false);
  };

  async function handleLogout() {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await supabase.auth.signOut();
  }

  const triggerTerminate = () => {
    const msg =
      "TERMINATE ACCOUNT: This will permanently purge your profile and all workout history.";
    if (Platform.OS === "web") {
      if (window.confirm(msg)) handleDeleteAccount();
    } else {
      Alert.alert("Confirm Termination", msg, [
        { text: "Abort", style: "cancel" },
        {
          text: "Delete Everything",
          style: "destructive",
          onPress: handleDeleteAccount,
        },
      ]);
    }
  };

  async function handleDeleteAccount() {
    setIsDeleting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;
      await supabase.from("profiles").delete().eq("id", auth.user.id);
      await supabase.from("workout_logs").delete().eq("user_id", auth.user.id);
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
              {displayName.toUpperCase()}'S PROFILE
            </Text>
            <View style={styles.userBadge}>
              <Text style={styles.userEmail}>{userEmail?.toUpperCase()}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={fetchProfileData} style={{ padding: 5 }}>
            <Ionicons name="sync" size={22} color={THEME} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.settingsScroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchProfileData}
              tintColor={THEME}
            />
          }
        >
          <View style={styles.commandDeck}>
            {/* PRIMARY OBJECTIVE */}
            <View style={styles.group}>
              <Text style={styles.groupLabel}>PRIMARY OBJECTIVE</Text>
              <View style={styles.pillGrid}>
                {["Build Muscle", "Lose Weight", "Build Strength"].map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGoal(g)}
                    style={[styles.pill, goal === g && styles.pillActive]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        goal === g && styles.pillTextActive,
                      ]}
                    >
                      {g.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* EXPERIENCE LEVEL */}
            <View style={styles.group}>
              <Text style={styles.groupLabel}>EXPERIENCE LEVEL</Text>
              <View style={styles.pillGrid}>
                {["Beginner", "Intermediate", "Advanced"].map((l) => (
                  <TouchableOpacity
                    key={l}
                    onPress={() => setLevel(l)}
                    style={[styles.pill, level === l && styles.pillActive]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        level === l && styles.pillTextActive,
                      ]}
                    >
                      {l.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* WEEKLY FREQUENCY */}
            <View style={styles.group}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupLabel}>WEEKLY FREQUENCY</Text>
              </View>
              <View style={styles.pillGrid}>
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <TouchableOpacity
                    key={num}
                    onPress={() => setFrequency(num)}
                    style={[
                      styles.freqPill,
                      frequency === num && styles.pillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        frequency === num && styles.pillTextActive,
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.restContainer}>
                <Text style={styles.restLabel}>
                  <Text style={{ color: THEME }}>{restDays} REST DAYS</Text> PER
                  WEEK
                </Text>
              </View>
            </View>

            {/* HARDWARE / ENVIRONMENT */}
            <View style={styles.group}>
              <Text style={styles.groupLabel}>HARDWARE / ENVIRONMENT</Text>
              <View style={styles.pillGrid}>
                {["Gym", "Home Gym"].map((env) => (
                  <TouchableOpacity
                    key={env}
                    onPress={() => setLocation(env)}
                    style={[styles.pill, location === env && styles.pillActive]}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        location === env && styles.pillTextActive,
                      ]}
                    >
                      {env.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.calibrateBtn}
              onPress={updateEngineParams}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.calibrateBtnText}>SAVE & SYNC</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.sessionArea}>
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={handleLogout}
                style={styles.secondaryBtn}
                disabled={loading || isDeleting}
              >
                <Text style={styles.secondaryBtnText}>LOGOUT</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={triggerTerminate}
                style={[styles.secondaryBtn, styles.dangerBorder]}
                disabled={loading || isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={ERROR} />
                ) : (
                  <Text style={[styles.secondaryBtnText, { color: ERROR }]}>
                    DELETE ACCOUNT
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.versionText}>
              HYPERV2 TERMINAL // BUILD 7.0.4
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
