import { screenTheme as t } from "@/constants/screen-theme";
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
        placeholderTextColor={t.textMuted}
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
  container: { flex: 1, padding: 20, backgroundColor: t.bg },
  title: { color: t.text, fontSize: 22, fontWeight: "800" },
  hint: { color: t.textMuted, marginTop: 8, marginBottom: 16, lineHeight: 20 },
  input: {
    backgroundColor: t.bgElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: t.border,
    color: t.text,
    padding: 14,
    fontSize: 15,
  },
  cta: {
    marginTop: 20,
    backgroundColor: t.accent,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  ctaText: { color: t.bg, fontWeight: "700" },
});
