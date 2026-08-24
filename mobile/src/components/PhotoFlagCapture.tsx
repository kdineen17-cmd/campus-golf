import { Ionicons } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { GestureResponderEvent, Image, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, fonts, radii, spacing } from "../theme";
import { Button } from "./Button";

interface Props {
  photo: string | null;
  flagX: number | null;
  flagY: number | null;
  onChange: (photo: string | null, flagX: number | null, flagY: number | null) => void;
}

// Resized/compressed well below the 3mb server-side cap — a tee-box photo
// doesn't need to be much bigger than this to be useful as a flag-position
// reference, and keeping it small keeps course payloads light.
const MAX_WIDTH = 1000;
const JPEG_QUALITY = 0.6;

export function PhotoFlagCapture({ photo, flagX, flagY, onChange }: Props) {
  const [taking, setTaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

  async function takePhoto() {
    setError(null);
    setTaking(true);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setError("Camera permission is required to take a tee-box photo.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (result.canceled || !result.assets[0]) return;

      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: MAX_WIDTH } }],
        { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      if (!manipulated.base64) {
        setError("Could not process that photo. Try again.");
        return;
      }
      // A new photo invalidates any previously-marked flag position.
      onChange(`data:image/jpeg;base64,${manipulated.base64}`, null, null);
    } catch {
      setError("Could not take a photo. Try again.");
    } finally {
      setTaking(false);
    }
  }

  function markFlag(e: GestureResponderEvent) {
    if (!photo || frameSize.width === 0 || frameSize.height === 0) return;
    const { locationX, locationY } = e.nativeEvent;
    onChange(
      photo,
      Math.min(1, Math.max(0, locationX / frameSize.width)),
      Math.min(1, Math.max(0, locationY / frameSize.height))
    );
  }

  function onFrameLayout(e: LayoutChangeEvent) {
    setFrameSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height });
  }

  return (
    <View style={styles.container}>
      {photo ? (
        <>
          <Pressable onPress={markFlag} onLayout={onFrameLayout} style={styles.frame}>
            <Image source={{ uri: photo }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            {flagX !== null && flagY !== null && (
              <View
                pointerEvents="none"
                style={[styles.flagMarker, { left: `${flagX * 100}%`, top: `${flagY * 100}%` }]}
              >
                <Ionicons name="flag" size={26} color={colors.danger} />
              </View>
            )}
          </Pressable>
          <Text style={styles.hint}>
            {flagX === null ? "Tap the photo to mark the flag" : "Tap again to move the flag"}
          </Text>
          <Button title="Retake photo" variant="secondary" onPress={takePhoto} loading={taking} />
        </>
      ) : (
        <Button title="Take tee box photo (optional)" variant="secondary" onPress={takePhoto} loading={taking} />
      )}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  frame: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: radii.sm,
    overflow: "hidden",
    backgroundColor: colors.ink,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flagMarker: { position: "absolute", marginLeft: -13, marginTop: -26 },
  hint: { fontSize: 12, fontFamily: fonts.serifItalic, color: colors.muted, textAlign: "center" },
  error: { color: colors.danger, fontFamily: fonts.serif, textAlign: "center" },
});
