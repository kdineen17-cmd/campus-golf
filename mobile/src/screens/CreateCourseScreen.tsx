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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, ApiError, NewHoleInput } from "../api";
import { Button } from "../components/Button";
import { HoleCaptureForm } from "../components/HoleCaptureForm";
import { useAuth } from "../context/AuthContext";
import { AppStackParamList, MainTabParamList } from "../navigation/types";
import { colors, fonts, radii, spacing } from "../theme";
import { formatDistance } from "../utils/format";
import { distanceMeters } from "../utils/geo";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "CreateTab">,
  NativeStackScreenProps<AppStackParamList>
>;

export function CreateCourseScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [holes, setHoles] = useState<NewHoleInput[]>([]);
  // Parallel to `holes`, by index — a played hole's stroke count, if logged.
  const [strokes, setStrokes] = useState<(number | undefined)[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function addHole(hole: NewHoleInput, holeStrokes?: number) {
    setHoles((prev) => [...prev, hole]);
    setStrokes((prev) => [...prev, holeStrokes]);
  }

  function removeHole(index: number) {
    setHoles((prev) => prev.filter((_, i) => i !== index));
    setStrokes((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setName("");
    setDescription("");
    setLocation("");
    setHoles([]);
    setStrokes([]);
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

      // If every hole was played while designing, submit the round right
      // away in the same motion. A round needs a score for every hole, so
      // a partially-scored course just saves normally with no round logged.
      if (strokes.length === holes.length && strokes.every((s) => s !== undefined)) {
        try {
          const detail = await api.getCourse(course.id);
          await api.submitRound(
            course.id,
            { holes: detail.holes.map((h, i) => ({ holeId: h.id, strokes: strokes[i]! })) },
            token
          );
        } catch {
          // The course itself saved fine; losing the round log here is a
          // rare edge case (e.g. a transient network blip) and shouldn't
          // block the designer from reaching their new course.
        }
      }

      resetForm();
      navigation.navigate("CourseDetail", { courseId: course.id });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save this course.");
    } finally {
      setSaving(false);
    }
  }

  const canSave = name.trim().length >= 3 && holes.length >= 1 && !saving;
  const scoredCount = strokes.filter((s) => s !== undefined).length;
  const willLogRound = holes.length > 0 && scoredCount === holes.length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top / 2 + spacing.lg }]}>
        <Text style={styles.title}>Design a course</Text>
        <Text style={styles.subtitle}>
          Walk to each tee and landmark, then tap to drop a pin at your live GPS location. Log your
          strokes as you go to play the course while you build it.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Course name (e.g. Riverside Park 9)"
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Location (e.g. Riverside Park)"
          placeholderTextColor={colors.muted}
          value={location}
          onChangeText={setLocation}
        />
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Description (optional)"
          placeholderTextColor={colors.muted}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <HoleCaptureForm
          title={`Hole ${holes.length + 1}`}
          submitLabel="Add hole to course"
          onSubmit={addHole}
          allowScoring
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
                    {strokes[i] !== undefined ? ` · You: ${strokes[i]}` : ""}
                  </Text>
                </View>
                <Text style={styles.remove} onPress={() => removeHole(i)}>
                  Remove
                </Text>
              </View>
            ))}
            {scoredCount > 0 && (
              <Text style={styles.scoreSummary}>
                {willLogRound
                  ? "All holes scored — saving will also log your round."
                  : `${scoredCount} of ${holes.length} holes scored — score every hole to log a round.`}
              </Text>
            )}
          </View>
        )}

        <Button
          title={saving ? "Saving..." : willLogRound ? "Save course & log round" : "Save course"}
          onPress={saveCourse}
          disabled={!canSave}
        />
        {saving && <ActivityIndicator style={{ marginTop: spacing.sm }} />}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sky },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl * 2 },
  title: { fontSize: 27, fontFamily: fonts.displayBlack, color: colors.fairwayDark },
  subtitle: { fontSize: 13, fontFamily: fonts.serifItalic, color: colors.muted },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    fontFamily: fonts.serif,
    color: colors.ink,
  },
  multiline: { minHeight: 70, textAlignVertical: "top" },
  error: { color: colors.danger, fontFamily: fonts.serif, textAlign: "center" },
  sectionTitle: { fontSize: 16, fontFamily: fonts.serifBold, color: colors.ink, marginBottom: spacing.xs },
  holesList: { gap: spacing.xs },
  holeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  holeIndex: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    backgroundColor: colors.fairway,
    color: colors.sky,
    textAlign: "center",
    lineHeight: 24,
    fontFamily: fonts.serifBold,
    fontSize: 12,
    overflow: "hidden",
  },
  holeName: { fontSize: 14, fontFamily: fonts.serifBold, color: colors.ink },
  holeMeta: { fontSize: 12, fontFamily: fonts.serif, color: colors.muted },
  remove: { color: colors.danger, fontFamily: fonts.serifBold, fontSize: 12 },
  scoreSummary: {
    fontSize: 12,
    fontFamily: fonts.serifItalic,
    color: colors.fairway,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});
