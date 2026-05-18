import type { PassportStamp } from "@yunicity/types";
import { formatPassportDate } from "@yunicity/utils";
import { StyleSheet, Text, View } from "react-native";

import { passportTheme } from "./passport-theme";

export function StampCard({ stamp }: { stamp: PassportStamp }) {
  return (
    <View style={styles.card}>
      <View style={styles.seal}>
        <Text style={styles.sealText}>✦</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.org}>{stamp.organization.name}</Text>
        <Text style={styles.meta}>
          {stamp.organization.city} · {formatPassportDate(stamp.stamped_at)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: passportTheme.bgElevated,
    borderRadius: passportTheme.radiusSm,
    padding: 14,
    borderWidth: 1,
    borderColor: passportTheme.border,
  },
  seal: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: passportTheme.gold,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,165,116,0.12)",
  },
  sealText: { color: passportTheme.gold, fontSize: 18 },
  content: { flex: 1, gap: 4 },
  org: { color: passportTheme.text, fontWeight: "600", fontSize: 15 },
  meta: { color: passportTheme.textMuted, fontSize: 12 },
});
