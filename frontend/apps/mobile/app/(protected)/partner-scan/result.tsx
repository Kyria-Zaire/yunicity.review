import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function PartnerScanResultScreen() {
  const router = useRouter();
  const { success, message, title } = useLocalSearchParams<{
    success?: string;
    message?: string;
    title?: string;
  }>();

  const ok = success === "1";

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{ok ? "✓" : "…"}</Text>
      <Text style={styles.title}>{ok ? "C’est validé !" : "Pas cette fois"}</Text>
      {title ? <Text style={styles.offer}>{title}</Text> : null}
      <Text style={styles.message}>
        {message ?? (ok ? "Avantage appliqué avec succès." : "Réessaie ou contacte Yunicity.")}
      </Text>
      <Pressable style={styles.cta} onPress={() => router.replace("/(protected)/partner-scan")}>
        <Text style={styles.ctaText}>Retour au scanner</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0c0a09",
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: { fontSize: 48, color: "#d4a574" },
  title: { color: "#fafaf9", fontSize: 26, fontWeight: "800", marginTop: 12 },
  offer: { color: "#e7e5e4", fontSize: 16, marginTop: 8 },
  message: { color: "#a8a29e", textAlign: "center", marginTop: 12, lineHeight: 22 },
  cta: {
    marginTop: 28,
    backgroundColor: "#fafaf9",
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  ctaText: { color: "#0c0a09", fontWeight: "700" },
});
