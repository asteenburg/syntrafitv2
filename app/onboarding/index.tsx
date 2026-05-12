import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

const THEME = "#CCFF00";
const BG = "#080808";
const CARD_BG = "#121212";
const { width } = Dimensions.get("window");

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // User Selections
  const [goal, setGoal] = useState("build muscle");
  const [experience, setExperience] = useState("beginner");
  const [equipment, setEquipment] = useState("full gym");
  const [days, setDays] = useState(4);

  const handleNext = () => {
    if (step < 3) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setStep(step + 1);
    } else {
      finish();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStep(step - 1);
    }
  };

  async function finish() {
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        goal,
        experience,
        equipment,
        days_per_week: days,
      });
      router.replace("/workout");
    }
    setLoading(false);
  }

  const SelectCard = ({ title, subtitle, selected, onPress }: any) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View>
        <Text style={[styles.cardTitle, selected && styles.cardTitleSelected]}>
          {title}
        </Text>
        <Text
          style={[styles.cardSubtitle, selected && styles.cardSubtitleSelected]}
        >
          {subtitle}
        </Text>
      </View>
      {selected && <View style={styles.radioDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* PROGRESS BAR */}
      <View style={styles.progressContainer}>
        <View
          style={[styles.progressBar, { width: `${((step + 1) / 4) * 100}%` }]}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.headerArea}>
          {step > 0 && (
            <TouchableOpacity onPress={handleBack}>
              <Text style={styles.backBtn}>BACK</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.stepIndicator}>PHASE 0{step + 1}</Text>
        </View>

        <Text style={styles.mainTitle}>
          {step === 0 && "Define your objective"}
          {step === 1 && "Current capability"}
          {step === 2 && "Available hardware"}
          {step === 3 && "Weekly commitment"}
        </Text>

        {/* STEP 1: GOAL */}
        {step === 0 && (
          <View>
            <SelectCard
              title="Hypertrophy"
              subtitle="Increase size and muscle density"
              selected={goal === "build muscle"}
              onPress={() => setGoal("build muscle")}
            />
            <SelectCard
              title="Fat Loss"
              subtitle="Prioritize calorie deficit and lean tissue"
              selected={goal === "lose fat"}
              onPress={() => setGoal("lose fat")}
            />
            <SelectCard
              title="Raw Strength"
              subtitle="Focus on central nervous system & PRs"
              selected={goal === "strength"}
              onPress={() => setGoal("strength")}
            />
          </View>
        )}

        {/* STEP 2: EXPERIENCE */}
        {step === 1 && (
          <View>
            <SelectCard
              title="Novice"
              subtitle="0-1 years of consistent training"
              selected={experience === "beginner"}
              onPress={() => setExperience("beginner")}
            />
            <SelectCard
              title="Intermediate"
              subtitle="1-3 years of technical proficiency"
              selected={experience === "intermediate"}
              onPress={() => setExperience("intermediate")}
            />
            <SelectCard
              title="Advanced"
              subtitle="3+ years of progressive overload"
              selected={experience === "advanced"}
              onPress={() => setExperience("advanced")}
            />
          </View>
        )}

        {/* STEP 3: EQUIPMENT */}
        {step === 2 && (
          <View>
            <SelectCard
              title="Commercial Gym"
              subtitle="Full access to racks, machines, cables"
              selected={equipment === "full gym"}
              onPress={() => setEquipment("full gym")}
            />
            <SelectCard
              title="Home Setup"
              subtitle="Barbell, plates, and adjustable bench"
              selected={equipment === "home gym"}
              onPress={() => setEquipment("home gym")}
            />
            <SelectCard
              title="Minimalist"
              subtitle="Dumbbells or bodyweight only"
              selected={equipment === "minimal"}
              onPress={() => setEquipment("minimal")}
            />
          </View>
        )}

        {/* STEP 4: DAYS */}
        {step === 3 && (
          <View>
            {[3, 4, 5, 6].map((d) => (
              <SelectCard
                key={d}
                title={`${d} Sessions`}
                subtitle="Optimal frequency for recovery"
                selected={days === d}
                onPress={() => setDays(d)}
              />
            ))}
          </View>
        )}
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cta} onPress={handleNext}>
          <Text style={styles.ctaText}>
            {step < 3 ? "CONTINUE" : "INITIALIZE ENGINE"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  progressContainer: {
    height: 4,
    backgroundColor: "#1A1A1A",
    width: "100%",
    marginTop: 10,
  },
  progressBar: { height: "100%", backgroundColor: THEME },
  content: { flex: 1, padding: 24, paddingTop: 40 },
  headerArea: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  backBtn: {
    color: "#52525B",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 1,
  },
  stepIndicator: {
    color: THEME,
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 2,
  },
  mainTitle: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: 40,
    width: "80%",
  },
  card: {
    backgroundColor: CARD_BG,
    padding: 20,
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#1C1C1E",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardSelected: { borderColor: THEME, backgroundColor: "#1A2000" },
  cardTitle: { color: "#FFF", fontSize: 18, fontWeight: "800" },
  cardTitleSelected: { color: THEME },
  cardSubtitle: {
    color: "#71717A",
    fontSize: 13,
    marginTop: 4,
    fontWeight: "500",
  },
  cardSubtitleSelected: { color: "#A8D600" },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: THEME },
  footer: { padding: 24, paddingBottom: 40 },
  cta: {
    backgroundColor: "#FFF",
    height: 64,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaText: { color: "#000", fontSize: 16, fontWeight: "900", letterSpacing: 1 },
});
