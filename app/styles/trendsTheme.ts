import { StyleSheet } from "react-native";

export const THEME = "#CCFF00"
    
export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#080808", paddingTop: 60 },
  header: { paddingHorizontal: 25, marginBottom: 20 },
  brand: { color: THEME, fontSize: 10, fontWeight: "900", letterSpacing: 2 },
  title: { color: "#fff", fontSize: 32, fontWeight: "900", letterSpacing: -1 },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 15,
  },
  donutCard: {
    flex: 1.4,
    backgroundColor: "#121212",
    borderRadius: 24,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1C1C1E",
  },
  donutLegend: { 
    marginLeft: 15, 
    flex: 1, // Allows text to fill space
    justifyContent: 'center' 
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  legendText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  miniCard: {
    flex: 1,
    backgroundColor: "#121212",
    borderRadius: 24,
    padding: 15,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1C1C1E",
  },
  filterStrip: { paddingLeft: 20, marginBottom: 20 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: "#121212",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#222",
  },
  pillActive: { backgroundColor: THEME, borderColor: THEME },
  pillText: { color: "#71717A", fontWeight: "900", fontSize: 10 },
  pillTextActive: { color: "#000" },
  mainChartCard: {
    marginHorizontal: 20,
    backgroundColor: "#121212",
    borderRadius: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1C1C1E",
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 35,
  },
  label: { color: "#52525B", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  value: { color: "#fff", fontSize: 24, fontWeight: "900" },
  subLabel: {
    color: "#52525B",
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  avgText: { color: THEME, fontSize: 10, fontWeight: "900" },
  axisText: { color: "#3F3F46", fontSize: 9, fontWeight: "800" },
  barTopLabel: {
    color: THEME,
    fontSize: 8,
    fontWeight: "900",
    marginBottom: 4,
    textAlign: "center",
  },
});