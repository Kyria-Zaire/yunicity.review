import { usePushNotifications } from "@/hooks/use-push-notifications";
import { Pressable, StyleSheet, Text, View } from "react-native";

export function PushNotificationsCard() {
  const { status, error, isRegistering, activate, deactivate } = usePushNotifications(true);

  const statusLabel =
    status === "enabled"
      ? "Activées"
      : status === "denied"
        ? "Permission refusée"
        : status === "error"
          ? "Erreur"
          : status === "loading"
            ? "Chargement…"
            : "Désactivées";

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Notifications Yunicity</Text>
      <Text style={styles.body}>
        Recevez les confirmations de vos avantages et les nouvelles importantes de vos lieux.
      </Text>
      <Text style={styles.status}>État : {statusLabel}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {status === "enabled" ? (
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => void deactivate()}
          disabled={isRegistering}
        >
          <Text style={styles.secondaryBtnText}>
            {isRegistering ? "…" : "Désactiver les notifications"}
          </Text>
        </Pressable>
      ) : (
        <Pressable
          style={styles.primaryBtn}
          onPress={() => void activate()}
          disabled={isRegistering || status === "loading"}
        >
          <Text style={styles.primaryBtnText}>
            {isRegistering ? "…" : "Activer les notifications"}
          </Text>
        </Pressable>
      )}
      {status === "denied" ? (
        <Text style={styles.hint}>
          Activez les notifications dans les réglages de votre téléphone pour Yunicity.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "#fafafa",
    gap: 8,
  },
  title: { fontSize: 16, fontWeight: "700" },
  body: { fontSize: 13, color: "#525252", lineHeight: 18 },
  status: { fontSize: 13, fontWeight: "600", color: "#171717" },
  hint: { fontSize: 12, color: "#737373" },
  error: { color: "#dc2626", fontSize: 13 },
  primaryBtn: {
    marginTop: 4,
    backgroundColor: "#171717",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "600" },
  secondaryBtn: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#d4d4d4",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  secondaryBtnText: { color: "#404040", fontWeight: "600" },
});
