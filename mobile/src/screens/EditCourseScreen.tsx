import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
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
import { api, ApiError } from "../api";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { AppStackParamList } from "../navigation/types";
import { colors, spacing } from "../theme";

type Props = NativeStackScreenProps<AppStackParamList, "EditCourse">;

export function EditCourseScreen({ route, navigation }: Props) {
  const { courseId } = route.params;
  const { token } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const course = await api.getCourse(courseId);
        setName(course.name);
        setDescription(course.description ?? "");
        setLocation(course.location ?? "");
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Could not load this course.");
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  async function save() {
    if (!token) return;
    setError(null);
    setSaving(true);
    try {
      await api.updateCourse(
        courseId,
        { name: name.trim(), description: description.trim() || null, location: location.trim() || null },
        token
      );
      navigation.replace("CourseDetail", { courseId });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const canSave = name.trim().length >= 3 && !saving;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Edit course details</Text>

        <TextInput style={styles.input} placeholder="Course name" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Location" value={location} onChangeText={setLocation} />
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Description (optional)"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Button title="Save changes" onPress={save} disabled={!canSave} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sky },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.sky },
  scroll: { padding: spacing.lg, gap: spacing.md },
  title: { fontSize: 26, fontWeight: "800", color: colors.fairwayDark },
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
});
