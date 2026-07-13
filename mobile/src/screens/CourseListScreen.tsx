import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api, ApiError, CourseSummary } from "../api";
import { useAuth } from "../context/AuthContext";
import { AppStackParamList, MainTabParamList } from "../navigation/types";
import { colors, spacing } from "../theme";
import { formatDistance } from "../utils/format";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "CoursesTab">,
  NativeStackScreenProps<AppStackParamList>
>;

export function CourseListScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState<CourseSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await api.listCourses();
      setCourses(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load courses.");
    }
  }, []);

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Courses</Text>
          <Text style={styles.subtitle}>Signed in as {user?.username}</Text>
        </View>
        <Pressable onPress={logout}>
          <Text style={styles.logout}>Log out</Text>
        </Pressable>
      </View>

      {courses === null && !error && <ActivityIndicator style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={courses ?? []}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          courses !== null ? (
            <Text style={styles.empty}>
              No courses yet. Walk your favorite park and create the first one from the Create tab.
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => navigation.navigate("CourseDetail", { courseId: item.id })}
          >
            <Text style={styles.cardTitle}>{item.name}</Text>
            {item.location && <Text style={styles.cardLocation}>{item.location}</Text>}
            <View style={styles.cardMetaRow}>
              <Text style={styles.cardMeta}>{item.holeCount} holes</Text>
              <Text style={styles.cardMeta}>Par {item.totalPar}</Text>
              <Text style={styles.cardMeta}>{formatDistance(item.totalDistanceMeters)}</Text>
            </View>
            <Text style={styles.cardCreator}>by {item.creator.username}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sky },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: { fontSize: 28, fontWeight: "800", color: colors.fairwayDark },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
  logout: { color: colors.danger, fontSize: 14, marginTop: spacing.xs },
  error: { color: colors.danger, textAlign: "center", marginTop: spacing.lg },
  list: { padding: spacing.md, gap: spacing.md },
  empty: { color: colors.muted, textAlign: "center", marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 18, fontWeight: "700", color: colors.ink },
  cardLocation: { fontSize: 13, color: colors.muted, marginTop: 2 },
  cardMetaRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  cardMeta: { fontSize: 13, color: colors.fairway, fontWeight: "600" },
  cardCreator: { fontSize: 12, color: colors.muted, marginTop: spacing.xs },
});
