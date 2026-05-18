import type { PassportTierCode } from "@yunicity/types";
import { PASSPORT_TIER_META } from "@yunicity/utils";
import { StyleSheet, Text, View } from "react-native";

import { passportTheme } from "./passport-theme";

export function PassportTierBadge({ code }: { code: PassportTierCode }) {
  const meta = PASSPORT_TIER_META[code];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: meta.accentMuted, borderColor: meta.border },
      ]}
    >
      <Text style={[styles.label, { color: meta.accent }]}>{meta.label}</Text>
      <Text style={styles.hint}>{meta.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  hint: {
    fontSize: 12,
    color: passportTheme.textMuted,
    lineHeight: 16,
  },
});
