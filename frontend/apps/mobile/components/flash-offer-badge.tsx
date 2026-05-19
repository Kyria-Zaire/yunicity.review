import { FLASH_BADGE_LABEL, formatFlashTimerLabel, type FlashTimerInput } from "@yunicity/utils";
import { StyleSheet, Text, View } from "react-native";

export function FlashOfferBadge({ offer }: { offer: FlashTimerInput | null | undefined }) {
  if (!offer?.is_flash) {
    return null;
  }
  const timer = formatFlashTimerLabel({
    is_flash: true,
    remaining_hours: offer.remaining_hours,
    remaining_minutes: offer.remaining_minutes,
    flash_ends_at: offer.flash_ends_at,
  });

  return (
    <View style={styles.row}>
      <Text style={styles.badge}>{FLASH_BADGE_LABEL}</Text>
      {timer ? <Text style={styles.timer}>{timer}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  badge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2A2FFF",
    backgroundColor: "rgba(42, 47, 255, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  timer: { fontSize: 12, color: "#737373" },
});
