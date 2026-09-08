import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { api, ApiError, RoundDetail } from "../api";
import { AppStackParamList } from "../navigation/types";
import { colors, fonts, radii, spacing } from "../theme";
import { formatDuration } from "../utils/format";

type Props = NativeStackScreenProps<AppStackParamList, "RoundDetail">;

export function RoundDetailScreen({ route }: Props) {
  const { courseId, roundId } = route.params;
  const [round, setRound] = useState<RoundDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getRound(courseId, roundId);
      setRound(data);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load this round.");
    }
  }, [courseId, roundId]);

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

  if (!round) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const totalPar = round.holes.reduce((sum, h) => sum + h.par, 0);
  const relativeToPar = round.totalStrokes - totalPar;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{round.course.name}</Text>
      <Text style={styles.subtitle}>
        {round.player.username} · {new Date(round.completedAt).toLocaleDateString()}
      </Text>

      <View style={styles.totalsRow}>
        <Text style={styles.totalStrokes}>{round.totalStrokes}</Text>
        <Text style={styles.totalLabel}>
          strokes · {relativeToPar === 0 ? "even par" : relativeToPar > 0 ? `+${relativeToPar}` : relativeToPar}
          {round.durationSecs != null ? ` · ${formatDuration(round.durationSecs)}` : ""}
        </Text>
      </View>

      {round.holes.map((h) => {
        const holeRelative = h.strokes - h.par;
        return (
          <View key={h.holeId} style={styles.scoreRow}>
            <Text style={styles.scoreHole}>{h.index + 1}</Text>
            <Text style={styles.scoreName}>{h.name || `Hole ${h.index + 1}`}</Text>
            <Text style={styles.scorePar}>Par {h.par}</Text>
            <Text style={styles.scoreStrokes}>{h.strokes}</Text>
            <Text style={styles.scoreRelative}>
              {holeRelative === 0 ? "E" : holeRelative > 0 ? `+${holeRelative}` : holeRelative}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.sky },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.sky },
  error: { color: colors.danger, fontFamily: fonts.serif, textAlign: "center", padding: spacing.md },
  title: { fontSize: 27, fontFamily: fonts.displayBlack, color: colors.fairwayDark },
  subtitle: { fontSize: 14, fontFamily: fonts.serifItalic, color: colors.muted, marginBottom: spacing.sm },
  totalsRow: { alignItems: "center", marginVertical: spacing.md },
  totalStrokes: { fontSize: 56, fontFamily: fonts.displayBlack, color: colors.fairwayDark },
  totalLabel: { fontSize: 14, fontFamily: fonts.serif, color: colors.muted },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scoreHole: { width: 20, fontFamily: fonts.serifBold, color: colors.ink },
  scoreName: { flex: 1, fontSize: 14, fontFamily: fonts.serif, color: colors.ink },
  scorePar: { fontSize: 12, fontFamily: fonts.serif, color: colors.muted },
  scoreStrokes: { fontSize: 17, fontFamily: fonts.displayBlack, color: colors.fairway, width: 32, textAlign: "right" },
  scoreRelative: { fontSize: 12, fontFamily: fonts.serif, color: colors.muted, width: 24, textAlign: "right" },
});
