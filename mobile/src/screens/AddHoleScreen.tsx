import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { api, ApiError, NewHoleInput } from "../api";
import { HoleCaptureForm } from "../components/HoleCaptureForm";
import { useAuth } from "../context/AuthContext";
import { AppStackParamList } from "../navigation/types";
import { colors, fonts, spacing } from "../theme";

type Props = NativeStackScreenProps<AppStackParamList, "AddHole">;

export function AddHoleScreen({ route, navigation }: Props) {
  const { courseId } = route.params;
  const { token } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(hole: NewHoleInput) {
    if (!token) return;
    setError(null);
    setSubmitting(true);
    try {
      await api.addHole(courseId, hole, token);
      navigation.replace("CourseDetail", { courseId });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not add this hole.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Add a hole</Text>
        <Text style={styles.subtitle}>
          Walk to the new tee and landmark, then tap to drop a pin at your live GPS location.
        </Text>

        <HoleCaptureForm title="New hole" submitLabel="Add hole" onSubmit={submit} submitting={submitting} />

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sky },
  scroll: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 27, fontFamily: fonts.displayBlack, color: colors.fairwayDark },
  subtitle: { fontSize: 13, fontFamily: fonts.serifItalic, color: colors.muted },
  error: { color: colors.danger, fontFamily: fonts.serif, textAlign: "center" },
});
