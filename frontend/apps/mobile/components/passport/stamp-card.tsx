import type { PassportStamp } from "@yunicity/types";
import { formatPassportDate, formatStampDisplayLine, formatStampSubtitle } from "@yunicity/utils";
import { StyleSheet, Text, View } from "react-native";

import { passportTheme } from "./passport-theme";

function sealGlyph(stamp: PassportStamp): string {
  if (stamp.kind === "memory") {
    const icon = stamp.icon ?? "seal";
    if (icon === "flash") return "◇";
    if (icon === "scan") return "◎";
    if (icon === "place") return "◆";
  }
  return "✦";
}

export function StampCard({ stamp }: { stamp: PassportStamp }) {
  const line = formatStampDisplayLine(stamp);
  const subtitle = formatStampSubtitle(stamp);
  const dateLabel = formatPassportDate(stamp.stamped_at);

  return (
    <View style={styles.card}>
      <View style={styles.seal}>
        <Text style={styles.sealText}>{sealGlyph(stamp)}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.line}>{line}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <Text style={styles.meta}>{dateLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
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
    borderColor: passportTheme.accent,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: passportTheme.accentSoft,
  },
  sealText: { color: passportTheme.accent, fontSize: 16, fontWeight: "600" },
  content: { flex: 1, gap: 4 },
  line: { color: passportTheme.text, fontWeight: "600", fontSize: 15, lineHeight: 20 },
  subtitle: { color: passportTheme.textMuted, fontSize: 13, lineHeight: 18 },
  meta: { color: passportTheme.textMuted, fontSize: 12, marginTop: 2 },
});
