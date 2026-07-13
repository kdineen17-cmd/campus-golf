import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps, useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { api, ApiError, RoundHistoryEntry } from "../api";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { AppStackParamList, MainTabParamList } from "../navigation/types";
import { colors, spacing } from "../theme";
import { formatDuration } from "../utils/format";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "ProfileTab">,
  NativeStackScreenProps<AppStackParamList>
>;

export function ProfileScreen({ navigation }: Props) {
  const { user, token, logout } = useAuth();
  const [rounds, setRounds] = useState<RoundHistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      setRounds(await api.getMyRounds(token));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load your rounds.");
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const roundsPlayed = rounds?.length ?? 0;
  const coursesPlayed = rounds ? new Set(rounds.map((r) => r.course.id)).size : 0;

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
        </View>
      </View>

      {rounds === null && !error && <ActivityIndicator style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={rounds ?? []}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
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
                <Text style={styles.courseName}>{item.course.name}</Text>
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
  title: { fontSize: 28, fontWeight: "800", color: colors.fairwayDark },
  statsRow: { flexDirection: "row", gap: spacing.xl, marginTop: spacing.md },
  statBlock: { alignItems: "flex-start" },
  statValue: { fontSize: 24, fontWeight: "800", color: colors.fairway },
  statLabel: { fontSize: 12, color: colors.muted },
  error: { color: colors.danger, textAlign: "center", marginTop: spacing.lg },
  list: { paddingHorizontal: spacing.md, gap: spacing.sm },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  courseName: { fontSize: 15, fontWeight: "600", color: colors.ink },
  meta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  strokes: { fontSize: 18, fontWeight: "800", color: colors.fairway, width: 32, textAlign: "right" },
  relative: { fontSize: 12, color: colors.muted, width: 28, textAlign: "right" },
  footer: { padding: spacing.lg, gap: spacing.sm },
});
