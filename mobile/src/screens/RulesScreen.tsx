import { ScrollView, StyleSheet, Text, View } from "react-native";
import { RULE_SECTIONS, RULES_OBJECTIVE, RULES_TITLE } from "../content/rules";
import { colors, fonts, radii, spacing } from "../theme";

export function RulesScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{RULES_TITLE}</Text>
      <View style={styles.titleRule} />

      <View style={styles.objectiveCard}>
        <Text style={styles.objectiveLabel}>Objective</Text>
        <Text style={styles.objectiveText}>{RULES_OBJECTIVE}</Text>
      </View>

      {RULE_SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionRule} />
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
  title: { fontSize: 24, fontFamily: fonts.displayBlack, color: colors.fairwayDark, lineHeight: 30 },
  titleRule: { width: 64, height: 2, backgroundColor: colors.gold, marginTop: -spacing.sm },
  objectiveCard: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  objectiveLabel: {
    fontSize: 12,
    fontFamily: fonts.serifBold,
    color: colors.fairway,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  objectiveText: { fontSize: 15, fontFamily: fonts.serifItalic, color: colors.ink, lineHeight: 21 },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 18, fontFamily: fonts.display, color: colors.ink },
  sectionRule: { width: 32, height: 2, backgroundColor: colors.gold, marginTop: -spacing.xs },
  ruleRow: { flexDirection: "row", gap: spacing.sm },
  bullet: { fontSize: 14, color: colors.gold, lineHeight: 21 },
  ruleText: { flex: 1, fontSize: 14, fontFamily: fonts.serif, color: colors.ink, lineHeight: 21 },
});
