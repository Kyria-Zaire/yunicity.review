import { Link, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function PartnerScanHubScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>Validation sur place</Text>
      <Text style={styles.title}>Scanner un Passport</Text>
      <Text style={styles.subtitle}>
        Scanne le QR du citoyen ou saisis son code — puis valide l’offre en quelques secondes.
      </Text>

      <Pressable style={styles.cta} onPress={() => router.push("/(protected)/partner-scan/scan")}>
        <Text style={styles.ctaText}>Ouvrir le scanner</Text>
      </Pressable>

      <Link href="/(protected)/partner-scan/manual" asChild>
        <Pressable style={styles.secondary}>
          <Text style={styles.secondaryText}>Saisir le code manuellement</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#0c0a09" },
  kicker: { color: "#d4a574", fontWeight: "600", fontSize: 13 },
  title: { color: "#fafaf9", fontSize: 26, fontWeight: "800", marginTop: 6 },
  subtitle: { color: "#a8a29e", fontSize: 14, lineHeight: 20, marginTop: 10 },
  cta: {
    marginTop: 28,
    backgroundColor: "#fafaf9",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  ctaText: { color: "#0c0a09", fontWeight: "700", fontSize: 16 },
  secondary: {
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#44403c",
  },
  secondaryText: { color: "#d6d3d1", fontWeight: "600" },
});
