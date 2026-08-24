import { Ionicons } from "@expo/vector-icons";
import { Image, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { colors, radii } from "../theme";

interface Props {
  photo: string;
  flag: { x: number; y: number } | null;
  style?: StyleProp<ViewStyle>;
}

export function HolePhotoView({ photo, flag, style }: Props) {
  return (
    <View style={[styles.frame, style]}>
      <Image source={{ uri: photo }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      {flag && (
        <View pointerEvents="none" style={[styles.flagMarker, { left: `${flag.x * 100}%`, top: `${flag.y * 100}%` }]}>
          <Ionicons name="flag" size={22} color={colors.danger} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    aspectRatio: 4 / 3,
    borderRadius: radii.sm,
    overflow: "hidden",
    backgroundColor: colors.ink,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flagMarker: { position: "absolute", marginLeft: -11, marginTop: -22 },
});
