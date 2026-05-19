import type { PartnerOffer } from "@yunicity/types";
import { PARTNER_OFFER_TYPE_LABELS } from "@yunicity/utils";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { passportTheme } from "./passport-theme";

export function OfferCard({
  offer,
  onRedeem,
  isRedeeming,
  disabled,
}: {
  offer: PartnerOffer;
  onRedeem: () => void;
  isRedeeming?: boolean;
  disabled?: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.type}>{PARTNER_OFFER_TYPE_LABELS[offer.offer_type]}</Text>
        <Text style={styles.org}>{offer.organization.name}</Text>
      </View>
      <Text style={styles.title}>{offer.title}</Text>
      {offer.description ? <Text style={styles.desc}>{offer.description}</Text> : null}
      <Pressable
        style={[styles.btn, (disabled || isRedeeming) && styles.btnDisabled]}
        onPress={onRedeem}
        disabled={disabled || isRedeeming}
      >
        {isRedeeming ? (
          <ActivityIndicator color={passportTheme.bg} size="small" />
        ) : (
          <Text style={styles.btnText}>Utiliser</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: passportTheme.bgElevated,
    borderRadius: passportTheme.radiusSm,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: passportTheme.border,
  },
  header: { gap: 2 },
  type: {
    fontSize: 11,
    fontWeight: "700",
    color: passportTheme.accent,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  org: { fontSize: 12, color: passportTheme.textMuted },
  title: { fontSize: 17, fontWeight: "700", color: passportTheme.text },
  desc: { fontSize: 13, color: passportTheme.textMuted, lineHeight: 18 },
  btn: {
    marginTop: 4,
    backgroundColor: passportTheme.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: passportTheme.bg, fontWeight: "700", fontSize: 15 },
});
