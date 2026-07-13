import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { api, ApiError, CourseDetail, LatLng } from "../api";
import { Button } from "../components/Button";
import { HoleMap } from "../components/HoleMap";
import { MapMarkerSpec } from "../components/HoleMapTypes";
import { Stepper } from "../components/Stepper";
import { useAuth } from "../context/AuthContext";
import { AppStackParamList } from "../navigation/types";
import { colors, spacing } from "../theme";
import { formatDistance, formatDuration } from "../utils/format";
import { distanceMeters } from "../utils/geo";
import { ensureLocationPermission } from "../utils/location";
import { regionForPoints } from "../utils/region";

type Props = NativeStackScreenProps<AppStackParamList, "Play">;
type Phase = "loading" | "playing" | "summary" | "submitted";

export function PlayScreen({ route, navigation }: Props) {
  const { courseId } = route.params;
  const { token } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [holeIndex, setHoleIndex] = useState(0);
  const [strokes, setStrokes] = useState<number[]>([]);
  const [playerLocation, setPlayerLocation] = useState<LatLng | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ isCourseRecord: boolean } | null>(null);

  const startedAt = useRef<number>(Date.now());
  const watchSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getCourse(courseId);
        setCourse(data);
        setStrokes(new Array(data.holes.length).fill(1));
        setPhase("playing");
        startedAt.current = Date.now();
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Could not load this course.");
      }
    })();
  }, [courseId]);

  useEffect(() => {
    if (phase !== "playing") return;
    let cancelled = false;
    (async () => {
      try {
        await ensureLocationPermission();
        if (cancelled) return;
        watchSubscription.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 2, timeInterval: 3000 },
          (pos) => setPlayerLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        );
      } catch {
        // Live tracking is a nice-to-have; scoring still works without it.
      }
    })();
    return () => {
      cancelled = true;
      watchSubscription.current?.remove();
      watchSubscription.current = null;
    };
  }, [phase]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (phase === "loading" || !course) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (phase === "playing") {
    const hole = course.holes[holeIndex];
    const isLast = holeIndex === course.holes.length - 1;
    const distanceToHole = playerLocation ? distanceMeters(playerLocation, hole.hole) : null;
    const region = regionForPoints(
      playerLocation ? [hole.tee, hole.hole, playerLocation] : [hole.tee, hole.hole]
    );
    const markers: MapMarkerSpec[] = [
      { id: "tee", lat: hole.tee.lat, lng: hole.tee.lng, color: colors.fairway, title: "Tee" },
      { id: "hole", lat: hole.hole.lat, lng: hole.hole.lng, color: colors.gold, title: hole.name ?? `Hole ${hole.index + 1}` },
      ...(playerLocation
        ? [{ id: "player", lat: playerLocation.lat, lng: playerLocation.lng, color: "#1E88E5", title: "You" }]
        : []),
    ];
    const polylines = [{ id: "route", points: [hole.tee, hole.hole], color: colors.fairway }];

    return (
      <View style={styles.container}>
        <HoleMap style={styles.map} region={region} markers={markers} polylines={polylines} live />

        <View style={styles.body}>
          <Text style={styles.holeLabel}>
            Hole {holeIndex + 1} of {course.holes.length}
          </Text>
          <Text style={styles.holeName}>{hole.name || `Hole ${holeIndex + 1}`}</Text>
          <Text style={styles.holeMeta}>
            Par {hole.par} · {formatDistance(hole.distanceMeters)} tee to hole
          </Text>
          {distanceToHole != null && (
            <Text style={styles.liveDistance}>{formatDistance(distanceToHole)} from you to the hole</Text>
          )}

          <View style={styles.strokesCard}>
            <Stepper
              label="Strokes"
              value={strokes[holeIndex]}
              min={1}
              max={30}
              onChange={(v) =>
                setStrokes((prev) => prev.map((s, i) => (i === holeIndex ? v : s)))
              }
            />
          </View>

          <View style={styles.navRow}>
            {holeIndex > 0 && (
              <View style={styles.navButton}>
                <Button title="Previous" variant="secondary" onPress={() => setHoleIndex((i) => i - 1)} />
              </View>
            )}
            <View style={styles.navButton}>
              <Button
                title={isLast ? "Finish round" : "Next hole"}
                onPress={() => (isLast ? setPhase("summary") : setHoleIndex((i) => i + 1))}
              />
            </View>
          </View>
        </View>
      </View>
    );
  }

  const totalStrokes = strokes.reduce((sum, s) => sum + s, 0);
  const totalPar = course.holes.reduce((sum, h) => sum + h.par, 0);
  const relativeToPar = totalStrokes - totalPar;
  const durationSecs = Math.round((Date.now() - startedAt.current) / 1000);

  async function submit() {
    if (!token || !course) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.submitRound(
        courseId,
        {
          durationSecs,
          holes: course.holes.map((h, i) => ({ holeId: h.id, strokes: strokes[i] })),
        },
        token
      );
      setSubmitResult({ isCourseRecord: result.isCourseRecord });
      setPhase("submitted");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not submit this round.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.summaryContainer}>
      <Text style={styles.title}>{phase === "submitted" ? "Round complete!" : "Review your round"}</Text>
      <Text style={styles.courseName}>{course.name}</Text>

      {phase === "submitted" && submitResult?.isCourseRecord && (
        <View style={styles.recordBanner}>
          <Text style={styles.recordText}>🏆 New course record!</Text>
        </View>
      )}

      <View style={styles.totalsRow}>
        <Text style={styles.totalStrokes}>{totalStrokes}</Text>
        <Text style={styles.totalLabel}>
          strokes · {relativeToPar === 0 ? "even par" : relativeToPar > 0 ? `+${relativeToPar}` : relativeToPar} ·{" "}
          {formatDuration(durationSecs)}
        </Text>
      </View>

      {course.holes.map((h, i) => (
        <View key={h.id} style={styles.scoreRow}>
          <Text style={styles.scoreHole}>{i + 1}</Text>
          <Text style={styles.scoreName}>{h.name || `Hole ${i + 1}`}</Text>
          <Text style={styles.scorePar}>Par {h.par}</Text>
          <Text style={styles.scoreStrokes}>{strokes[i]}</Text>
        </View>
      ))}

      {error && <Text style={styles.error}>{error}</Text>}

      {phase === "summary" && (
        <>
          <Button title="Submit round" onPress={submit} loading={submitting} />
          <Button title="Back to scoring" variant="secondary" onPress={() => setPhase("playing")} />
        </>
      )}

      {phase === "submitted" && (
        <Button title="Back to course" onPress={() => navigation.replace("CourseDetail", { courseId })} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sky },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.sky },
  error: { color: colors.danger, textAlign: "center", padding: spacing.md },
  map: { width: "100%", height: 260 },
  body: { padding: spacing.lg, gap: spacing.sm },
  holeLabel: { fontSize: 13, color: colors.muted, fontWeight: "600" },
  holeName: { fontSize: 24, fontWeight: "800", color: colors.fairwayDark },
  holeMeta: { fontSize: 14, color: colors.muted },
  liveDistance: { fontSize: 14, color: colors.fairway, fontWeight: "600" },
  strokesCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  navRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  navButton: { flex: 1 },
  summaryContainer: { padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.sky },
  title: { fontSize: 26, fontWeight: "800", color: colors.fairwayDark },
  courseName: { fontSize: 15, color: colors.muted, marginBottom: spacing.sm },
  recordBanner: {
    backgroundColor: "#FFF3CD",
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  recordText: { fontSize: 16, fontWeight: "800", color: colors.gold },
  totalsRow: { alignItems: "center", marginVertical: spacing.md },
  totalStrokes: { fontSize: 48, fontWeight: "800", color: colors.fairwayDark },
  totalLabel: { fontSize: 14, color: colors.muted },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scoreHole: { width: 20, fontWeight: "700", color: colors.ink },
  scoreName: { flex: 1, fontSize: 14, color: colors.ink },
  scorePar: { fontSize: 12, color: colors.muted },
  scoreStrokes: { fontSize: 16, fontWeight: "800", color: colors.fairway, width: 30, textAlign: "right" },
});
