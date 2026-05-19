import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { passportTheme } from "./passport-theme";

export function EmptyPassportState({
  onActivate,
  isActivating,
  error,
}: {
  onActivate: () => void;
  isActivating?: boolean;
  error?: string | null;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.glow} />
      <Text style={styles.eyebrow}>Territoire · Identité · Exploration</Text>
      <Text style={styles.title}>Ton passeport Yunicity t&apos;attend</Text>
      <Text style={styles.body}>
        Active ton identité citoyenne locale : tampons de visite, offres partenaires
        vérifiées, et un QR qui te représentera chez les lieux du territoire.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={[styles.cta, isActivating && styles.ctaDisabled]}
        onPress={onActivate}
        disabled={isActivating}
      >
        {isActivating ? (
          <ActivityIndicator color={passportTheme.bg} />
        ) : (
          <Text style={styles.ctaText}>Activer mon passeport Yunicity</Text>
        )}
      </Pressable>
      <Text style={styles.hint}>Tier Basic · sans paiement · sans engagement</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    padding: 28,
    borderRadius: passportTheme.radius,
    backgroundColor: passportTheme.bgCard,
    borderWidth: 1,
    borderColor: passportTheme.borderAccent,
    gap: 14,
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: -60,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(212,165,116,0.15)",
  },
  eyebrow: {
    color: passportTheme.accent,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    color: passportTheme.text,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 32,
  },
  body: { color: passportTheme.textMuted, fontSize: 15, lineHeight: 22 },
  error: { color: passportTheme.error, fontSize: 13 },
  cta: {
    marginTop: 8,
    backgroundColor: passportTheme.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaDisabled: { opacity: 0.7 },
  ctaText: {
    color: passportTheme.bg,
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.3,
  },
  hint: {
    textAlign: "center",
    color: passportTheme.textSubtle,
    fontSize: 12,
  },
});
