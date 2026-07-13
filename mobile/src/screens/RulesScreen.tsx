import { ScrollView, StyleSheet, Text, View } from "react-native";
import { RULE_SECTIONS, RULES_OBJECTIVE, RULES_TITLE } from "../content/rules";
import { colors, spacing } from "../theme";

export function RulesScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{RULES_TITLE}</Text>

      <View style={styles.objectiveCard}>
        <Text style={styles.objectiveLabel}>Objective</Text>
        <Text style={styles.objectiveText}>{RULES_OBJECTIVE}</Text>
      </View>

      {RULE_SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item, i) => (
            <View key={i} style={styles.ruleRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.ruleText}>{item}</Text>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sky },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2, gap: spacing.lg },
  title: { fontSize: 24, fontWeight: "800", color: colors.fairwayDark },
  objectiveCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  objectiveLabel: { fontSize: 12, fontWeight: "700", color: colors.fairway, textTransform: "uppercase" },
  objectiveText: { fontSize: 15, color: colors.ink, lineHeight: 21 },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.ink },
  ruleRow: { flexDirection: "row", gap: spacing.sm },
  bullet: { fontSize: 14, color: colors.fairway, lineHeight: 21 },
  ruleText: { flex: 1, fontSize: 14, color: colors.ink, lineHeight: 21 },
});
