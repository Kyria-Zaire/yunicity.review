import { feedTheme } from "@/components/feed/feed-theme";
import { useAuth } from "@/lib/auth-provider";
import { TRIBE_CHARTER_LABEL, TRIBE_JOIN_CTA } from "@yunicity/utils";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function TribeInvitationScreen() {
  const router = useRouter();
  const { token, slug, city: cityParam } = useLocalSearchParams<{
    token?: string;
    slug?: string;
    city?: string;
  }>();
  const { yunicityApi: api, user } = useAuth();
  const city = cityParam ?? user?.city ?? "Reims";
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    if (!token?.trim()) {
      setError("Lien d’invitation incomplet.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.tribes.acceptTribeInvitation(token.trim(), { charter_accepted: true });
      setAccepted(true);
      if (slug) {
        router.replace(
          `/(protected)/tribes/${slug}?city=${encodeURIComponent(city)}` as Href,
        );
      } else {
        router.replace("/(protected)/(tabs)/tribes" as Href);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invitation invalide ou expirée.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Lien d’invitation incomplet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Invitation tribu</Text>
      <Text style={styles.body}>
        Vous avez reçu un lien personnel pour rejoindre une tribu à {city}.
      </Text>
      <Text style={styles.charter}>{TRIBE_CHARTER_LABEL}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {accepted ? (
        <ActivityIndicator color={feedTheme.accent} style={styles.loader} />
      ) : (
        <Pressable
          style={[styles.primaryBtn, loading && styles.btnDisabled]}
          disabled={loading}
          onPress={() => void accept()}
        >
          <Text style={styles.primaryBtnText}>
            {loading ? "Acceptation…" : TRIBE_JOIN_CTA}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: feedTheme.bg, padding: 24 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "700", color: feedTheme.text },
  body: { fontSize: 15, lineHeight: 22, color: feedTheme.textMuted, marginTop: 12 },
  charter: { fontSize: 14, lineHeight: 20, color: feedTheme.text, marginTop: 16 },
  error: { fontSize: 14, color: feedTheme.error, marginTop: 12 },
  loader: { marginTop: 24 },
  primaryBtn: {
    marginTop: 24,
    backgroundColor: feedTheme.accent,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  btnDisabled: { opacity: 0.6 },
});
