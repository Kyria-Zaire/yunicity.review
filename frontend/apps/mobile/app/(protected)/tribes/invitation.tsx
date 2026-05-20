import { feedTheme } from "@/components/feed/feed-theme";
import { useAuth } from "@/lib/auth-provider";
import {
  TRIBE_CHARTER_LABEL,
  TRIBE_INVITATIONS_LINK_HINT,
  TRIBE_JOIN_CTA,
} from "@yunicity/utils";
import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
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
  const [manualToken, setManualToken] = useState(token ?? "");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    const value = manualToken.trim();
    if (!value) {
      setError("Collez le token reçu dans votre lien d’invitation.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const member = await api.tribes.acceptTribeInvitation(value, {
        charter_accepted: true,
      });
      setAccepted(true);
      const targetSlug = member.tribe_slug ?? slug;
      const targetCity = member.tribe_city ?? city;
      if (targetSlug) {
        router.replace(
          `/(protected)/tribes/${targetSlug}?city=${encodeURIComponent(targetCity)}` as Href,
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

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Invitation tribu</Text>
      <Text style={styles.body}>{TRIBE_INVITATIONS_LINK_HINT}</Text>
      <TextInput
        value={manualToken}
        onChangeText={setManualToken}
        placeholder="Token d’invitation"
        placeholderTextColor={feedTheme.textMuted}
        autoCapitalize="none"
        style={styles.input}
      />
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
  input: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: feedTheme.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: feedTheme.text,
    backgroundColor: feedTheme.bgElevated,
  },
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
