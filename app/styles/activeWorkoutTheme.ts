import { Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  // Header & Navigation
  header: {
    width: "100%",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2C2C2E",
  },
  headerContent: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  closeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1C1C1E",
    alignItems: "center",
    justifyContent: "center",
  },
  timerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
    fontVariant: ["tabular-nums"], // Prevents jittering numbers
  },
  saveButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  // Scroll Area
  scrollContent: {
    paddingBottom: 100,
  },

  // Exercise Sections
  exerciseSection: {
    backgroundColor: "#000",
    paddingTop: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 8,
    borderBottomColor: "#1C1C1E",
  },
  exerciseHeading: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 20,
    textTransform: "uppercase",
  },

  // Set Rows
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  setNumber: {
    color: "#8E8E93",
    fontSize: 12,
    fontWeight: "800",
    width: 45,
  },

  // Controls (Weight & Reps)
  controlGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2C2C2E",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: width * 0.35,
    justifyContent: "space-between",
  },
  weightInput: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    width: 50,
    padding: 0, // Removes default Android padding
  },
  repText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    width: 40,
  },
  unitText: {
    color: "#8E8E93",
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 4,
  },
});
