import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Fragment, useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { api, ApiError, CourseDetail, LeaderboardEntry } from "../api";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { AppStackParamList } from "../navigation/types";
import { colors, spacing } from "../theme";
import { formatDistance, formatDuration } from "../utils/format";
import { regionForPoints } from "../utils/region";

type Props = NativeStackScreenProps<AppStackParamList, "CourseDetail">;

export function CourseDetailScreen({ route, navigation }: Props) {
  const { courseId } = route.params;
  const { user, token } = useAuth();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [courseData, leaderboardData] = await Promise.all([
        api.getCourse(courseId),
        api.getLeaderboard(courseId),
      ]);
      setCourse(courseData);
      setLeaderboard(leaderboardData);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load this course.");
    }
  }, [courseId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const allPoints = course.holes.flatMap((h) => [h.tee, h.hole]);
  const region = regionForPoints(allPoints);
  const isCreator = user?.id === course.creator.id;

  function confirmDelete() {
    Alert.alert("Delete course?", `"${course!.name}" and all of its rounds will be removed permanently.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: deleteCourse },
    ]);
  }

  async function deleteCourse() {
    if (!token) return;
    setDeleting(true);
    try {
      await api.deleteCourse(courseId, token);
      navigation.navigate("MainTabs");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not delete this course.");
      setDeleting(false);
    }
  }

  return (
    <ScrollView style={styles.container}>
      <MapView style={styles.map} initialRegion={region}>
        {course.holes.map((hole) => (
          <Fragment key={hole.id}>
            <Marker
              coordinate={{ latitude: hole.tee.lat, longitude: hole.tee.lng }}
              pinColor={colors.fairway}
              title={`Hole ${hole.index + 1} tee`}
            />
            <Marker
              coordinate={{ latitude: hole.hole.lat, longitude: hole.hole.lng }}
              pinColor={colors.gold}
              title={hole.name ?? `Hole ${hole.index + 1}`}
              description={`Par ${hole.par}`}
            />
            <Polyline
              coordinates={[
                { latitude: hole.tee.lat, longitude: hole.tee.lng },
                { latitude: hole.hole.lat, longitude: hole.hole.lng },
              ]}
              strokeColor={colors.fairway}
              strokeWidth={3}
            />
          </Fragment>
        ))}
      </MapView>

      <View style={styles.body}>
        <Text style={styles.title}>{course.name}</Text>
        {course.location && <Text style={styles.location}>{course.location}</Text>}
        {course.description && <Text style={styles.description}>{course.description}</Text>}

        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>{course.holeCount} holes</Text>
          <Text style={styles.metaItem}>Par {course.totalPar}</Text>
          <Text style={styles.metaItem}>{formatDistance(course.totalDistanceMeters)}</Text>
        </View>
        <Text style={styles.creator}>Designed by {course.creator.username}</Text>

        <Button title="Play this course" onPress={() => navigation.navigate("Play", { courseId })} />

        <Text style={styles.sectionTitle}>Holes</Text>
        {course.holes.map((hole) => (
          <View key={hole.id} style={styles.holeRow}>
            <Text style={styles.holeIndex}>{hole.index + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.holeName}>{hole.name || `Hole ${hole.index + 1}`}</Text>
              <Text style={styles.holeMeta}>
                Par {hole.par} · {formatDistance(hole.distanceMeters)}
              </Text>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Course record</Text>
        {leaderboard.length === 0 && (
          <Text style={styles.empty}>No rounds yet — be the first to set the record.</Text>
        )}
        {leaderboard.map((entry) => (
          <View key={`${entry.player.id}-${entry.rank}`} style={styles.leaderRow}>
            <Text style={styles.leaderRank}>{entry.rank}</Text>
            <Text style={styles.leaderName}>{entry.player.username}</Text>
            <Text style={styles.leaderStrokes}>{entry.totalStrokes} strokes</Text>
            {entry.durationSecs != null && (
              <Text style={styles.leaderDuration}>{formatDuration(entry.durationSecs)}</Text>
            )}
          </View>
        ))}

        {isCreator && (
          <View style={styles.dangerZone}>
            <Button title="Delete course" variant="danger" onPress={confirmDelete} loading={deleting} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sky },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.sky },
  error: { color: colors.danger, padding: spacing.lg, textAlign: "center" },
  map: { width: "100%", height: 260 },
  body: { padding: spacing.lg, gap: spacing.sm },
  title: { fontSize: 26, fontWeight: "800", color: colors.fairwayDark },
  location: { fontSize: 14, color: colors.muted },
  description: { fontSize: 14, color: colors.ink, marginTop: spacing.xs },
  metaRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  metaItem: { fontSize: 14, fontWeight: "600", color: colors.fairway },
  creator: { fontSize: 12, color: colors.muted, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.ink, marginTop: spacing.lg },
  holeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  holeIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.fairway,
    color: "#fff",
    textAlign: "center",
    lineHeight: 28,
    fontWeight: "700",
    overflow: "hidden",
  },
  holeName: { fontSize: 15, fontWeight: "600", color: colors.ink },
  holeMeta: { fontSize: 12, color: colors.muted },
  empty: { color: colors.muted, fontSize: 13 },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leaderRank: { width: 20, fontWeight: "700", color: colors.gold },
  leaderName: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.ink },
  leaderStrokes: { fontSize: 13, color: colors.fairway, fontWeight: "600" },
  leaderDuration: { fontSize: 12, color: colors.muted, marginLeft: spacing.sm },
  dangerZone: { marginTop: spacing.xl },
});
