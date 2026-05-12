import { Dimensions, StyleSheet } from "react-native";

export const THEME_COLOR = "#CCFF00";
export const BG = "#080808";
export const CARD = "#121212";
export const TEXT_MAIN = "#FFFFFF";
export const TEXT_MUTED = "#71717A";
export const ERROR = "#FF453A";
export const BORDER = "#1C1C1E";
export const NEON_GREEN = "#CCFF00";

const { width } = Dimensions.get("window");

export const styles = StyleSheet.create({
  /* =========================
     BASE LAYOUT
  ========================= */

  container: {
    flex: 1,
    backgroundColor: "#050505",
  },

  content: {
    padding: 20,
    paddingBottom: 140,
  },

  scrollPadding: {
    padding: 20,
    paddingBottom: 140,
  },

  /* =========================
     HEADER
  ========================= */

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 18,
  },

  brand: {
    color: "#666",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },

  title: {
    color: "#FFF",
    fontSize: 34,
    fontWeight: "900",
  },

  timer: {
    fontSize: 24,
    fontWeight: "900",
    color: THEME_COLOR,
    fontVariant: ["tabular-nums"],
  },

  timerBadge: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  /* =========================
     SECTION HEADERS
  ========================= */

  sectionLabel: {
    color: "#444",
    fontWeight: "900",
    marginBottom: 16,
    fontSize: 13,
  },

  /* =========================
     PILLS / GRID
  ========================= */

  pillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  pill: {
    width: (width - 52) / 2,
    paddingVertical: 16,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "center",
  },

  pillActive: {
    backgroundColor: THEME_COLOR,
    borderColor: THEME_COLOR,
  },

  pillInactive: {
    backgroundColor: "#121212",
    borderColor: "rgba(255,255,255,0.06)",
  },

  pillText: {
    fontWeight: "900",
    fontSize: 12,
    textAlign: "center",
  },

  /* =========================
     EXERCISE CARDS
  ========================= */

  exerciseCard: {
    marginBottom: 16,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#0C0C0C",
  },

  exerciseTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "900",
  },

  exerciseSub: {
    color: "#777",
    marginTop: 6,
    fontSize: 13,
  },

  /* =========================
     SET INPUTS
  ========================= */

  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },

  setLabel: {
    color: "#888",
    fontWeight: "800",
  },

  /* =========================
     BUTTONS
  ========================= */

  mainButton: {
    height: 70,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
  },

  mainButtonText: {
    fontWeight: "900",
    color: "#000",
    fontSize: 15,
  },

  abortButton: {
    alignItems: "center",
    marginTop: 14,
  },

  abortText: {
    color: ERROR,
    fontWeight: "900",
    fontSize: 13,
  },

  /* =========================
     MISC
  ========================= */

  sub: {
    color: "#777",
    marginTop: 4,
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: "#050505",
  },

  section: {
    color: "#666",
    marginBottom: 20,
    paddingLeft: 15,
    fontWeight: "900",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  btnText: {
    fontWeight: "900",
    color: "#000",
  },

  abort: {
    textAlign: "center",
    marginTop: 12,
    color: ERROR,
    fontWeight: "900",
  },

  btn: {
    height: 60,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: THEME_COLOR,
  },
});
