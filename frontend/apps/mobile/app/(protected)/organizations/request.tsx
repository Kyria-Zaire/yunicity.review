import { useAuth } from "@/lib/auth-provider";
import type { OrganizationRequestPayload, OrganizationType } from "@yunicity/types";
import { ORGANIZATION_TYPE_OPTIONS, isAuthError } from "@yunicity/utils";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const SUCCESS_MESSAGE =
  "Votre demande est en cours de vérification par l'équipe Yunicity.";

export default function OrganizationRequestScreen() {
  const { yunicityApi } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<OrganizationType>("commerce");
  const [city, setCity] = useState("Reims");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    setError(null);
    setIsSubmitting(true);
    const payload: OrganizationRequestPayload = {
      name: name.trim(),
      type,
      city: city.trim(),
      address: address.trim() || undefined,
      website: website.trim() || undefined,
      instagram: instagram.trim() || undefined,
      description: description.trim() || undefined,
    };
    try {
      await yunicityApi.createOrganizationRequest(payload);
      setSubmitted(true);
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Envoi impossible.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <View style={styles.successBox}>
        <Text style={styles.successTitle}>Demande envoyée</Text>
        <Text style={styles.successText}>{SUCCESS_MESSAGE}</Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => router.replace("/(protected)/(tabs)/organizations")}
        >
          <Text style={styles.primaryBtnText}>Voir mes lieux</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.hint}>
        Formulaire simple — la vérification arrive après.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.label}>Nom</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Type</Text>
      <View style={styles.typeRow}>
        {ORGANIZATION_TYPE_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            style={[styles.typeChip, type === option.value && styles.typeChipOn]}
            onPress={() => setType(option.value)}
          >
            <Text style={type === option.value ? styles.typeChipTextOn : undefined}>
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Ville</Text>
      <TextInput style={styles.input} value={city} onChangeText={setCity} />

      <Text style={styles.label}>Adresse</Text>
      <TextInput style={styles.input} value={address} onChangeText={setAddress} />

      <Text style={styles.label}>Site web</Text>
      <TextInput style={styles.input} value={website} onChangeText={setWebsite} />

      <Text style={styles.label}>Instagram</Text>
      <TextInput style={styles.input} value={instagram} onChangeText={setInstagram} />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Pressable style={styles.primaryBtn} onPress={() => void submit()} disabled={isSubmitting}>
        <Text style={styles.primaryBtnText}>{isSubmitting ? "…" : "Envoyer"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8, paddingBottom: 40 },
  hint: { color: "#525252", marginBottom: 8 },
  label: { fontWeight: "600", marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
  },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  typeChipOn: { backgroundColor: "#171717", borderColor: "#171717" },
  typeChipTextOn: { color: "#fff" },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: "#171717",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "600" },
  error: { color: "#dc2626" },
  successBox: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#ecfdf5",
  },
  successTitle: { fontSize: 20, fontWeight: "700", color: "#065f46" },
  successText: { color: "#047857", lineHeight: 22 },
});
