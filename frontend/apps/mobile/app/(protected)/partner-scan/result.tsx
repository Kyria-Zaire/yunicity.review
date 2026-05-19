import { screenTheme as t } from "@/constants/screen-theme";
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
      <Text style={[styles.emoji, ok && styles.emojiOk]}>{ok ? "✓" : "…"}</Text>
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
    backgroundColor: t.bg,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  emoji: { fontSize: 48, color: t.textMuted },
  emojiOk: { color: t.success },
  title: { color: t.text, fontSize: 26, fontWeight: "800", marginTop: 12 },
  offer: { color: t.text, fontSize: 16, marginTop: 8 },
  message: { color: t.textMuted, textAlign: "center", marginTop: 12, lineHeight: 22 },
  cta: {
    marginTop: 28,
    backgroundColor: t.accent,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  ctaText: { color: t.bg, fontWeight: "700" },
});
