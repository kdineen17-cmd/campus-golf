import { StyleSheet, Text, View } from "react-native";
import { colors, fonts, spacing } from "../theme";
import { HoleMapProps } from "./HoleMapTypes";

export function HoleMap({ style }: HoleMapProps) {
  return (
    <View style={[styles.placeholder, style]}>
      <Text style={styles.text}>Map preview is available in the mobile app</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.fairwayDark,
    padding: spacing.lg,
  },
  text: {
    color: colors.goldBright,
    fontSize: 13,
    fontFamily: fonts.serifItalic,
    textAlign: "center",
  },
});
