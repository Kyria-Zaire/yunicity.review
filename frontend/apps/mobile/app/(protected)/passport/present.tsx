import { useAuth } from "@/lib/auth-provider";
import { passportTheme } from "@/components/passport/passport-theme";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { isAuthError } from "@yunicity/utils";

export default function PresentPassportScreen() {
  const router = useRouter();
  const { yunicityApi } = useAuth();
  const { width } = useWindowDimensions();
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [passportNumber, setPassportNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await yunicityApi.getPassportQr();
      setQrPayload(data.qr_payload);
      setPassportNumber(data.passport_number);
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Impossible d’afficher ton Passport.");
    } finally {
      setIsLoading(false);
    }
  }, [yunicityApi]);

  useEffect(() => {
    void load();
  }, [load]);

  const qrSize = Math.min(width - 80, 320);

  return (
    <View style={styles.screen}>
      <Pressable style={styles.close} onPress={() => router.back()}>
        <Text style={styles.closeText}>Fermer</Text>
      </Pressable>

      <Text style={styles.kicker}>Présenter mon passeport</Text>
      <Text style={styles.hint}>Montre cet écran au partenaire — rapide et simple.</Text>

      {isLoading ? (
        <ActivityIndicator color={passportTheme.accent} size="large" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : qrPayload ? (
        <View style={styles.qrWrap}>
          <QRCode value={qrPayload} size={qrSize} backgroundColor="#fafaf9" color="#0c0a09" />
        </View>
      ) : null}

      {passportNumber ? <Text style={styles.number}>{passportNumber}</Text> : null}
      <Text style={styles.footer}>Identité citoyenne Yunicity · Reims</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fafaf9",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  close: { position: "absolute", top: 48, right: 24 },
  closeText: { color: "#57534e", fontWeight: "600" },
  kicker: { fontSize: 22, fontWeight: "800", color: "#0c0a09", textAlign: "center" },
  hint: { fontSize: 14, color: "#78716c", textAlign: "center", marginTop: 8, marginBottom: 24 },
  qrWrap: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e7e5e4",
  },
  number: { marginTop: 20, fontSize: 16, fontWeight: "600", color: "#44403c", letterSpacing: 1 },
  footer: { marginTop: 12, fontSize: 12, color: "#a8a29e" },
  error: { color: "#b91c1c", textAlign: "center" },
});
