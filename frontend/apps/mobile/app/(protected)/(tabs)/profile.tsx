import { PushNotificationsCard } from "@/components/push-notifications-card";
import { screenTheme as t } from "@/constants/screen-theme";
import { useAuth } from "@/lib/auth-provider";
import type { ProfileMe, ProfileVisibility } from "@yunicity/types";
import {
  INTEREST_LABELS,
  PROFILE_INTERESTS,
  VISIBILITY_OPTIONS,
  isAuthError,
} from "@yunicity/utils";
import type { Href } from "expo-router";
import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ProfileTabScreen() {
  const { yunicityApi, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileMe | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<ProfileVisibility>("public");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await yunicityApi.getProfileMe();
      setProfile(data);
      setDisplayName(data.display_name ?? "");
      setBio(data.bio ?? "");
      setCity(data.city ?? "");
      setInterests(data.interests);
      setVisibility(data.visibility);
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Erreur de chargement.");
    } finally {
      setIsLoading(false);
    }
  }, [yunicityApi]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await yunicityApi.updateProfileMe({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        city: city.trim() || null,
        interests,
        visibility,
      });
      setProfile(updated);
      setMessage("Profil enregistré.");
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Échec.");
    } finally {
      setIsSaving(false);
    }
  }

  async function completeOnboarding() {
    setIsSaving(true);
    try {
      const updated = await yunicityApi.completeProfileOnboarding({ city, interests });
      setProfile(updated);
      setMessage("Profil activé.");
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Ville + intérêt requis.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {profile ? (
        <View style={styles.hero}>
          <Text style={styles.username}>@{profile.username}</Text>
          <Text style={styles.title}>{profile.display_name ?? profile.username}</Text>
        </View>
      ) : null}

      <Link href={"/(protected)/notifications" as Href} asChild>
        <Pressable style={styles.notifLink}>
          <Text style={styles.notifLinkText}>Notifications</Text>
          <Text style={styles.notifLinkHint}>Activité sur vos publications</Text>
        </Pressable>
      </Link>

      <Link href={"/(protected)/search" as Href} asChild>
        <Pressable style={styles.notifLink}>
          <Text style={styles.notifLinkText}>Recherche</Text>
          <Text style={styles.notifLinkHint}>Événements, lieux, tribus et quartiers</Text>
        </Pressable>
      </Link>

      {!profile?.onboarding_completed ? (
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Active ton profil</Text>
          <Text style={styles.bannerText}>Ville + au moins un intérêt.</Text>
          <Pressable style={styles.primaryBtn} onPress={() => void completeOnboarding()}>
            <Text style={styles.primaryBtnText}>Activer</Text>
          </Pressable>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}

      <Text style={styles.label}>Nom affiché</Text>
      <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />

      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={bio}
        onChangeText={setBio}
        multiline
      />

      <Text style={styles.label}>Ville</Text>
      <TextInput style={styles.input} value={city} onChangeText={setCity} />

      <Text style={styles.label}>Intérêts</Text>
      <View style={styles.chips}>
        {PROFILE_INTERESTS.map((tag) => {
          const selected = interests.includes(tag);
          return (
            <Pressable
              key={tag}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() =>
                setInterests((prev) =>
                  selected ? prev.filter((t) => t !== tag) : [...prev, tag],
                )
              }
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {INTEREST_LABELS[tag] ?? tag}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Visibilité</Text>
      {VISIBILITY_OPTIONS.map((option) => (
        <Pressable
          key={option.value}
          style={[styles.radio, visibility === option.value && styles.radioSelected]}
          onPress={() => setVisibility(option.value)}
        >
          <Text style={styles.radioLabel}>{option.label}</Text>
        </Pressable>
      ))}

      <Pressable style={styles.primaryBtn} onPress={() => void save()} disabled={isSaving}>
        <Text style={styles.primaryBtnText}>{isSaving ? "…" : "Enregistrer"}</Text>
      </Pressable>

      <PushNotificationsCard />

      <Pressable
        style={styles.secondaryBtn}
        onPress={async () => {
          await logout();
          router.replace("/login");
        }}
      >
        <Text style={styles.secondaryBtnText}>Déconnexion</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 20, gap: 10, paddingBottom: 40 },
  hero: { marginBottom: 8 },
  notifLink: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  notifLinkText: { fontWeight: "700", fontSize: 15, color: t.accent },
  notifLinkHint: { fontSize: 12, color: "#737373", marginTop: 4 },
  username: { color: "#737373", fontSize: 14 },
  title: { fontSize: 24, fontWeight: "700" },
  banner: {
    backgroundColor: "#fffbeb",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fde68a",
    marginBottom: 8,
  },
  bannerTitle: { fontWeight: "700", color: "#92400e" },
  bannerText: { color: "#b45309", marginTop: 4, fontSize: 13 },
  label: { fontWeight: "600", marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  chipSelected: { backgroundColor: t.accentSoft, borderColor: t.accent },
  chipText: { fontSize: 13, color: "#404040" },
  chipTextSelected: { color: t.accent, fontWeight: "600" },
  radio: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
  },
  radioSelected: { borderColor: t.accent, backgroundColor: t.accentSoft },
  radioLabel: { fontWeight: "500" },
  primaryBtn: {
    marginTop: 12,
    backgroundColor: t.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: t.bg, fontWeight: "600" },
  secondaryBtn: { marginTop: 8, padding: 12, alignItems: "center" },
  secondaryBtnText: { color: "#525252" },
  error: { color: "#dc2626", fontSize: 13 },
  success: { color: "#16a34a", fontSize: 13 },
});
