import { StyleSheet } from "react-native";

export const THEME = "#CCFF00";
export const ERROR = "#FF453A";
export const BG = "#080808";
export const CARD = "#121212";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  content: { flex: 1, paddingHorizontal: 25 },
  header: { marginTop: 30, marginBottom: 20 },
  brand: {
    color: THEME,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1.5,
  },
  userBadge: {
    backgroundColor: "#1A1A1A",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  userEmail: { color: THEME, fontSize: 10, fontWeight: "900" },
  settingsScroll: { flex: 1 },
  group: { marginBottom: 22 },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  groupLabel: { 
    color: "#52525B", 
    fontSize: 9, 
    fontWeight: "900", 
    letterSpacing: 1.5, 
    marginBottom: 10 
  },
  pillGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pill: { 
    flex: 1, 
    backgroundColor: "#080808", // Darker than the card for depth
    paddingVertical: 12, 
    borderRadius: 10, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: "#222" 
  },
  pillActive: { 
    backgroundColor: THEME, 
    borderColor: THEME 
  },
  freqPill: {
    width: 40,
    height: 40,
    backgroundColor: CARD,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1C1C1E",
  },
  pillText: { color: "#71717A", fontSize: 10, fontWeight: "900" },
  pillTextActive: { color: "#000" }, // Keep text black on green background
  calibrateBtn: { 
    backgroundColor: "#FFF", // White button stands out against the dark card
    height: 56, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 10 
  },
  saveBtn: {
    backgroundColor: THEME,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  saveBtnText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 1,
  },
  statusCard: {
    backgroundColor: CARD,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#1C1C1E",
    marginBottom: 12,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME,
  },
  statusLabel: { color: "#52525B", fontSize: 8, fontWeight: "900" },
  statusValue: {
    color: "#52525B",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  logoutBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  logoutText: { color: "#FFF", fontSize: 11, fontWeight: "900" },
  terminateBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  terminateText: { color: ERROR, fontSize: 11, fontWeight: "900" },
commandDeck: {
    backgroundColor: CARD, // #121212
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1C1C1E",
    marginTop: 10,
    marginBottom: 20,
  },
  calibrateBtnText: { color: "#000", fontWeight: "900", fontSize: 13, letterSpacing: 1 },
  footerActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 10, 
    marginTop: 10, 
    marginBottom: 40 
  },
  footerLink: { color: "#3F3F46", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  restLabel: { color: "#71717A", fontSize: 12, fontWeight: "800" }, // Muted the green here
  restContainer: {
    marginTop: 12,
    paddingLeft: 2, // Aligns with the start of the pills
  },
  sessionArea: {
    marginTop: 10,
    marginBottom: 50,
    paddingHorizontal: 5,
  },
  secondaryBtn: {
    flex: 1,
    height: 44, // Smaller, compact height
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
    backgroundColor: "transparent",
  },
  dangerBorder: {
    borderColor: "#331111", // Subtle dark red border
  },
  secondaryBtnText: {
    color: "#71717A",
    fontWeight: "900",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  versionText: {
    color: "#27272A",
    fontSize: 8,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 20,
    letterSpacing: 2,
  },
});