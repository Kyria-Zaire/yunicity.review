import type { PassportMe } from "@yunicity/types";
import {
  PASSPORT_LEVEL_ABOUT_TITLE,
  PASSPORT_LEVEL_PROGRESS_HINT,
  PASSPORT_TIER_META,
  PASSPORT_TIER_SIGNIFICANCE,
  formatPassportProgressionHint,
} from "@yunicity/utils";
import { StyleSheet, Text, View } from "react-native";

import { passportTheme } from "./passport-theme";

export function PassportLevelAbout({ passport }: { passport: PassportMe }) {
  const tier = PASSPORT_TIER_META[passport.tier.code];
  const significance = PASSPORT_TIER_SIGNIFICANCE[passport.tier.code];
  const progressionText = formatPassportProgressionHint(
    passport.progression?.hint,
    passport.progression?.points_to_next,
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{PASSPORT_LEVEL_ABOUT_TITLE}</Text>
      <View
        style={[
          styles.badge,
          { backgroundColor: tier.accentMuted, borderColor: tier.border },
        ]}
      >
        <Text style={[styles.badgeLabel, { color: tier.accent }]}>{tier.label}</Text>
      </View>
      <Text style={styles.body}>{significance}</Text>
      <Text style={styles.muted}>{PASSPORT_LEVEL_PROGRESS_HINT}</Text>
      {progressionText ? <Text style={styles.progress}>{progressionText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: passportTheme.bgElevated,
    borderRadius: passportTheme.radiusSm,
    borderWidth: 1,
    borderColor: passportTheme.border,
    padding: 16,
    gap: 8,
  },
  title: { fontSize: 15, fontWeight: "700", color: passportTheme.text },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeLabel: { fontSize: 12, fontWeight: "700" },
  body: { fontSize: 14, color: passportTheme.text, lineHeight: 20 },
  muted: { fontSize: 12, color: passportTheme.textMuted, lineHeight: 18 },
  progress: { fontSize: 13, color: passportTheme.textMuted, marginTop: 4 },
});
