import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps, useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { api, ApiError, CourseSummary, RoundHistoryEntry } from "../api";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { AppStackParamList, MainTabParamList } from "../navigation/types";
import { colors, fonts, radii, spacing } from "../theme";
import { formatDistance, formatDuration, formatHoleCount } from "../utils/format";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "ProfileTab">,
  NativeStackScreenProps<AppStackParamList>
>;

type Tab = "rounds" | "courses";

export function ProfileScreen({ navigation }: Props) {
  const { user, token, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("rounds");
  const [rounds, setRounds] = useState<RoundHistoryEntry[] | null>(null);
  const [courses, setCourses] = useState<CourseSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const [roundsData, coursesData] = await Promise.all([api.getMyRounds(token), api.getMyCourses(token)]);
      setRounds(roundsData);
      setCourses(coursesData);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load your profile.");
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const roundsPlayed = rounds?.length ?? 0;
  const coursesPlayed = rounds ? new Set(rounds.map((r) => r.course.id)).size : 0;
  const coursesCreated = courses?.length ?? 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{user?.username}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{roundsPlayed}</Text>
            <Text style={styles.statLabel}>rounds played</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{coursesPlayed}</Text>
            <Text style={styles.statLabel}>courses played</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{coursesCreated}</Text>
            <Text style={styles.statLabel}>courses created</Text>
          </View>
        </View>
      </View>

      <View style={styles.tabRow}>
        <Pressable style={[styles.tabButton, tab === "rounds" && styles.tabButtonActive]} onPress={() => setTab("rounds")}>
          <Text style={[styles.tabText, tab === "rounds" && styles.tabTextActive]}>Round History</Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, tab === "courses" && styles.tabButtonActive]}
          onPress={() => setTab("courses")}
        >
          <Text style={[styles.tabText, tab === "courses" && styles.tabTextActive]}>My Courses</Text>
        </Pressable>
      </View>

      {rounds === null && courses === null && !error && <ActivityIndicator style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {tab === "rounds" ? (
        <FlatList
          data={rounds ?? []}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            rounds !== null ? (
              <Text style={styles.empty}>No rounds yet — play a course to start your history.</Text>
            ) : null
          }
          renderItem={({ item }) => {
            const relative = item.totalStrokes - item.course.totalPar;
            return (
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{item.course.name}</Text>
                  <Text style={styles.meta}>
                    {new Date(item.completedAt).toLocaleDateString()}
                    {item.durationSecs != null ? ` · ${formatDuration(item.durationSecs)}` : ""}
                  </Text>
                </View>
                <Text style={styles.strokes}>{item.totalStrokes}</Text>
                <Text style={styles.relative}>
                  {relative === 0 ? "E" : relative > 0 ? `+${relative}` : relative}
                </Text>
              </View>
            );
          }}
        />
      ) : (
        <FlatList
          data={courses ?? []}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            courses !== null ? (
              <Text style={styles.empty}>
                You haven't designed a course yet — head to the Create tab to walk your first one.
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => navigation.navigate("CourseDetail", { courseId: item.id })}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.meta}>
                  {formatHoleCount(item.holeCount)} · Par {item.totalPar} · {formatDistance(item.totalDistanceMeters)}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <View style={styles.footer}>
        <Button title="Official Rules" variant="secondary" onPress={() => navigation.navigate("Rules")} />
        <Button title="Log out" variant="danger" onPress={logout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sky },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  title: { fontSize: 30, fontFamily: fonts.displayBlack, color: colors.fairwayDark },
  statsRow: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.md },
  statBlock: { alignItems: "flex-start" },
  statValue: { fontSize: 24, fontFamily: fonts.display, color: colors.fairway },
  statLabel: {
    fontSize: 10,
    fontFamily: fonts.serifBold,
    color: colors.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radii.sm,
    overflow: "hidden",
  },
  tabButton: { flex: 1, paddingVertical: spacing.sm, alignItems: "center" },
  tabButtonActive: { backgroundColor: colors.fairway },
  tabText: { fontSize: 13, fontFamily: fonts.serifBold, color: colors.fairwayDark },
  tabTextActive: { color: colors.sky },
  error: { color: colors.danger, fontFamily: fonts.serif, textAlign: "center", marginTop: spacing.lg },
  list: { padding: spacing.md, gap: spacing.sm },
  empty: {
    color: colors.muted,
    fontFamily: fonts.serifItalic,
    textAlign: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  rowTitle: { fontSize: 15, fontFamily: fonts.serifBold, color: colors.ink },
  meta: { fontSize: 12, fontFamily: fonts.serif, color: colors.muted, marginTop: 2 },
  strokes: { fontSize: 19, fontFamily: fonts.displayBlack, color: colors.fairway, width: 32, textAlign: "right" },
  relative: { fontSize: 12, fontFamily: fonts.serif, color: colors.muted, width: 28, textAlign: "right" },
  footer: { padding: spacing.lg, gap: spacing.sm },
});
