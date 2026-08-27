import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { api, ApiError, UserProfile } from "../api";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { AppStackParamList } from "../navigation/types";
import { colors, fonts, radii, spacing } from "../theme";
import { formatDistance, formatDuration, formatHoleCount } from "../utils/format";

type Props = NativeStackScreenProps<AppStackParamList, "FriendProfile">;

type Tab = "rounds" | "courses";

export function FriendProfileScreen({ route, navigation }: Props) {
  const { userId, username } = route.params;
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>("rounds");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFriend, setNotFriend] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: username });
  }, [navigation, username]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      setNotFriend(false);
      const data = await api.getUserProfile(userId, token);
      setProfile(data);
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setNotFriend(true);
      } else {
        setError(e instanceof ApiError ? e.message : "Could not load this profile.");
      }
    }
  }, [token, userId]);

  useEffect(() => {
    load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function addFriend() {
    if (!token) return;
    setSendingRequest(true);
    setError(null);
    try {
      await api.sendFriendRequest(username, token);
      setRequestSent(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not send that friend request.");
    } finally {
      setSendingRequest(false);
    }
  }

  if (notFriend) {
    return (
      <View style={styles.notFriendContainer}>
        <Text style={styles.title}>{username}</Text>
        <Text style={styles.notFriendText}>
          {requestSent
            ? `Friend request sent to ${username}.`
            : `You're not friends with ${username} yet — add them to see their rounds, courses, and friends.`}
        </Text>
        {error && <Text style={styles.error}>{error}</Text>}
        {!requestSent && <Button title="Add as friend" onPress={addFriend} loading={sendingRequest} />}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{username}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{profile?.roundsPlayed ?? 0}</Text>
            <Text style={styles.statLabel}>rounds played</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{profile?.coursesCreated ?? 0}</Text>
            <Text style={styles.statLabel}>courses created</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{profile?.friendsCount ?? 0}</Text>
            <Text style={styles.statLabel}>friends</Text>
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
          <Text style={[styles.tabText, tab === "courses" && styles.tabTextActive]}>Courses Created</Text>
        </Pressable>
      </View>

      {profile === null && !error && <ActivityIndicator style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {tab === "rounds" ? (
        <FlatList
          data={profile?.rounds ?? []}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            profile !== null ? <Text style={styles.empty}>No rounds yet.</Text> : null
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
          data={profile?.courses ?? []}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            profile !== null ? <Text style={styles.empty}>{username} hasn't created a course yet.</Text> : null
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sky },
  notFriendContainer: {
    flex: 1,
    backgroundColor: colors.sky,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  notFriendText: { fontSize: 15, fontFamily: fonts.serif, color: colors.ink, textAlign: "center" },
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
});
