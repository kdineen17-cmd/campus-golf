import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api, ApiError, NewHoleInput } from "../api";
import { Button } from "../components/Button";
import { HoleCaptureForm } from "../components/HoleCaptureForm";
import { useAuth } from "../context/AuthContext";
import { AppStackParamList, MainTabParamList } from "../navigation/types";
import { colors, spacing } from "../theme";
import { formatDistance } from "../utils/format";
import { distanceMeters } from "../utils/geo";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "CreateTab">,
  NativeStackScreenProps<AppStackParamList>
>;

export function CreateCourseScreen({ navigation }: Props) {
  const { token } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [holes, setHoles] = useState<NewHoleInput[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function addHole(hole: NewHoleInput) {
    setHoles((prev) => [...prev, hole]);
  }

  function removeHole(index: number) {
    setHoles((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setName("");
    setDescription("");
    setLocation("");
    setHoles([]);
  }

  async function saveCourse() {
    if (!token) return;
    setError(null);
    setSaving(true);
    try {
      const course = await api.createCourse(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          location: location.trim() || undefined,
          holes,
        },
        token
      );
      resetForm();
      navigation.navigate("CourseDetail", { courseId: course.id });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save this course.");
    } finally {
      setSaving(false);
    }
  }

  const canSave = name.trim().length >= 3 && holes.length >= 1 && !saving;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Design a course</Text>
        <Text style={styles.subtitle}>
          Walk to each tee and landmark, then tap to drop a pin at your live GPS location.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Course name (e.g. Riverside Park 9)"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Location (e.g. Riverside Park)"
          value={location}
          onChangeText={setLocation}
        />
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <HoleCaptureForm
          title={`Hole ${holes.length + 1}`}
          submitLabel="Add hole to course"
          onSubmit={addHole}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        {holes.length > 0 && (
          <View style={styles.holesList}>
            <Text style={styles.sectionTitle}>Holes so far ({holes.length})</Text>
            {holes.map((h, i) => (
              <View key={i} style={styles.holeRow}>
                <Text style={styles.holeIndex}>{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.holeName}>{h.name || `Hole ${i + 1}`}</Text>
                  <Text style={styles.holeMeta}>
                    Par {h.par} · {formatDistance(distanceMeters(h.tee, h.hole))}
                  </Text>
                </View>
                <Text style={styles.remove} onPress={() => removeHole(i)}>
                  Remove
                </Text>
              </View>
            ))}
          </View>
        )}

        <Button title={saving ? "Saving..." : "Save course"} onPress={saveCourse} disabled={!canSave} />
        {saving && <ActivityIndicator style={{ marginTop: spacing.sm }} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sky },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  title: { fontSize: 26, fontWeight: "800", color: colors.fairwayDark },
  subtitle: { fontSize: 13, color: colors.muted },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
  },
  multiline: { minHeight: 70, textAlignVertical: "top" },
  error: { color: colors.danger, textAlign: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.ink, marginBottom: spacing.xs },
  holesList: { gap: spacing.xs },
  holeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  holeIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.fairway,
    color: "#fff",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "700",
    fontSize: 12,
    overflow: "hidden",
  },
  holeName: { fontSize: 14, fontWeight: "600", color: colors.ink },
  holeMeta: { fontSize: 12, color: colors.muted },
  remove: { color: colors.danger, fontSize: 12, fontWeight: "600" },
});
