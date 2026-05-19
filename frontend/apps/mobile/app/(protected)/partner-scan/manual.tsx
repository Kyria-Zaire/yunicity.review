import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function PartnerScanManualScreen() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function submit() {
    const trimmed = code.trim();
    if (!trimmed) {
      return;
    }
    router.push({
      pathname: "/(protected)/partner-scan/offers",
      params: { qr_secret: trimmed },
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Code Passport</Text>
      <Text style={styles.hint}>Colle le code affiché sous le QR ou fourni par le citoyen.</Text>
      <TextInput
        style={styles.input}
        value={code}
        onChangeText={setCode}
        placeholder="YNCP1:… ou code court"
        placeholderTextColor="#78716c"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable style={styles.cta} onPress={submit}>
        <Text style={styles.ctaText}>Continuer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#0c0a09" },
  title: { color: "#fafaf9", fontSize: 22, fontWeight: "800" },
  hint: { color: "#a8a29e", marginTop: 8, marginBottom: 16, lineHeight: 20 },
  input: {
    backgroundColor: "#1c1917",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#44403c",
    color: "#fafaf9",
    padding: 14,
    fontSize: 15,
  },
  cta: {
    marginTop: 20,
    backgroundColor: "#d4a574",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  ctaText: { color: "#0c0a09", fontWeight: "700" },
});
