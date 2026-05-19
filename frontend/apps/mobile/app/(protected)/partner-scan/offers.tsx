import { useAuth } from "@/lib/auth-provider";
import type { ScanRedeemableOffer } from "@yunicity/types";
import {
  PARTNER_OFFER_TYPE_LABELS,
  humanizeScanError,
  isAuthError,
} from "@yunicity/utils";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function PartnerScanOffersScreen() {
  const router = useRouter();
  const { qr_secret: qrSecret } = useLocalSearchParams<{ qr_secret: string }>();
  const { yunicityApi } = useAuth();
  const [previewLabel, setPreviewLabel] = useState("");
  const [offers, setOffers] = useState<ScanRedeemableOffer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!qrSecret) {
      setError("Code Passport manquant.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await yunicityApi.scan.resolvePassport({ qr_secret: qrSecret });
      setPreviewLabel(data.passport.display_label);
      setOffers(data.offers.filter((o) => !o.already_redeemed));
    } catch (err) {
      setError(
        isAuthError(err)
          ? humanizeScanError(err.code, err.message)
          : "Scan impossible.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [qrSecret, yunicityApi]);

  useEffect(() => {
    void load();
  }, [load]);

  async function redeem(offerId: string) {
    if (!qrSecret) {
      return;
    }
    setBusyId(offerId);
    setError(null);
    try {
      const result = await yunicityApi.scan.redeemOffer({
        offer_id: offerId,
        qr_secret: qrSecret,
      });
      router.replace({
        pathname: "/(protected)/partner-scan/result",
        params: {
          success: "1",
          message: result.message,
          title: result.offer_title,
        },
      });
    } catch (err) {
      setError(
        isAuthError(err)
          ? humanizeScanError(err.code, err.message)
          : "Validation impossible.",
      );
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#d4a574" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>Citoyen reconnu</Text>
      <Text style={styles.title}>{previewLabel}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={offers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={offers.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Aucune offre disponible pour ce lieu. Vérifie qu’une offre est publiée.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            disabled={busyId !== null}
            onPress={() => void redeem(item.id)}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMeta}>
              {item.organization_name} · {PARTNER_OFFER_TYPE_LABELS[item.offer_type]}
            </Text>
            <Text style={styles.cardAction}>
              {busyId === item.id ? "Validation…" : "Valider cette offre"}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0c0a09" },
  container: { flex: 1, padding: 16, backgroundColor: "#0c0a09" },
  kicker: { color: "#d4a574", fontSize: 12, fontWeight: "600" },
  title: { color: "#fafaf9", fontSize: 22, fontWeight: "800", marginBottom: 12 },
  error: { color: "#f87171", marginBottom: 8 },
  card: {
    backgroundColor: "#1c1917",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#292524",
  },
  cardTitle: { color: "#fafaf9", fontWeight: "700", fontSize: 16 },
  cardMeta: { color: "#a8a29e", fontSize: 12, marginTop: 4 },
  cardAction: { color: "#d4a574", fontWeight: "600", marginTop: 10 },
  emptyList: { flexGrow: 1, justifyContent: "center" },
  empty: { color: "#a8a29e", textAlign: "center", lineHeight: 22 },
});
