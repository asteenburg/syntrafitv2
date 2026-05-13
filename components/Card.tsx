import { Text, View } from "react-native";
import { theme } from "../app/theme";

export function Card({ title, subtitle }: any) {
  return (
    <View
      style={{
        backgroundColor: theme.card,
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: theme.border,
        marginBottom: 12,
      }}
    >
      <Text style={{ color: theme.text, fontWeight: "700", fontSize: 16 }}>
        {title}
      </Text>
      <Text style={{ color: theme.muted, marginTop: 6 }}>
        {subtitle}
      </Text>
    </View>
  );
}