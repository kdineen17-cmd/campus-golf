import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CompositeScreenProps } from "@react-navigation/native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { api, ApiError, CourseSummary, LatLng } from "../api";
import { AppStackParamList, MainTabParamList } from "../navigation/types";
import { colors, fonts, radii, spacing } from "../theme";
import { formatDistance, formatHoleCount } from "../utils/format";
import { distanceMeters } from "../utils/geo";
import { getCurrentLatLng } from "../utils/location";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "CoursesTab">,
  NativeStackScreenProps<AppStackParamList>
>;

export function CourseListScreen({ navigation }: Props) {
  const [courses, setCourses] = useState<CourseSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

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

  useEffect(() => {
    getCurrentLatLng()
      .then(setUserLocation)
      .catch(() => {
        // Nearby sorting is a nice-to-have; the list still works without it.
      });
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const sortedCourses = useMemo(() => {
    if (!courses) return [];
    if (!userLocation) return courses;
    return [...courses].sort((a, b) => {
      const distA = a.firstTee ? distanceMeters(userLocation, a.firstTee) : Infinity;
      const distB = b.firstTee ? distanceMeters(userLocation, b.firstTee) : Infinity;
      return distA - distB;
    });
  }, [courses, userLocation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Courses</Text>
        <Text style={styles.subtitle}>
          {userLocation ? "Sorted by distance from you" : "Most recently created"}
        </Text>
      </View>

      {courses === null && !error && <ActivityIndicator style={{ marginTop: spacing.xl }} />}
      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        data={sortedCourses}
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
        renderItem={({ item }) => {
          const distance =
            userLocation && item.firstTee ? distanceMeters(userLocation, item.firstTee) : null;
          return (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate("CourseDetail", { courseId: item.id })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                {distance != null && <Text style={styles.cardDistance}>{formatDistance(distance)}</Text>}
              </View>
              {item.location && <Text style={styles.cardLocation}>{item.location}</Text>}
              <View style={styles.cardMetaRow}>
                <Text style={styles.cardMeta}>{formatHoleCount(item.holeCount)}</Text>
                <Text style={styles.cardMeta}>Par {item.totalPar}</Text>
                <Text style={styles.cardMeta}>{formatDistance(item.totalDistanceMeters)}</Text>
              </View>
              <Text style={styles.cardCreator}>by {item.creator.username}</Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sky },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  title: { fontSize: 30, fontFamily: fonts.displayBlack, color: colors.fairwayDark },
  subtitle: { fontSize: 13, fontFamily: fonts.serifItalic, color: colors.muted, marginTop: 2 },
  error: { color: colors.danger, fontFamily: fonts.serif, textAlign: "center", marginTop: spacing.lg },
  list: { padding: spacing.md, gap: spacing.md },
  empty: {
    color: colors.muted,
    fontFamily: fonts.serif,
    textAlign: "center",
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardTitle: { fontSize: 19, fontFamily: fonts.display, color: colors.ink, flex: 1 },
  cardDistance: { fontSize: 13, fontFamily: fonts.serifBold, color: colors.fairway, marginLeft: spacing.sm },
  cardLocation: { fontSize: 13, fontFamily: fonts.serifItalic, color: colors.muted, marginTop: 2 },
  cardMetaRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  cardMeta: { fontSize: 13, fontFamily: fonts.serifBold, color: colors.fairway },
  cardCreator: { fontSize: 12, fontFamily: fonts.serif, color: colors.muted, marginTop: spacing.xs },
});
