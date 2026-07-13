import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../theme";

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

export function Stepper({ label, value, min, max, onChange }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable
          style={styles.btn}
          disabled={value <= min}
          onPress={() => onChange(Math.max(min, value - 1))}
        >
          <Text style={styles.btnText}>−</Text>
        </Pressable>
        <Text style={styles.value}>{value}</Text>
        <Pressable
          style={styles.btn}
          disabled={value >= max}
          onPress={() => onChange(Math.min(max, value + 1))}
        >
          <Text style={styles.btnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { fontSize: 15, fontWeight: "600", color: colors.ink },
  controls: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.fairway,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { color: "#fff", fontSize: 20, fontWeight: "700", lineHeight: 22 },
  value: { fontSize: 18, fontWeight: "700", width: 28, textAlign: "center", color: colors.ink },
});
