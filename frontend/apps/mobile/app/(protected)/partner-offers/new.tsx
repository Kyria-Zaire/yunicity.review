import { useAuth } from "@/lib/auth-provider";
import type { OrganizationMeItem, PartnerOfferType } from "@yunicity/types";
import {
  isAuthError,
  listOfferManageableOrganizations,
} from "@yunicity/utils";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

const TYPES: { value: PartnerOfferType; label: string }[] = [
  { value: "drink", label: "Boisson" },
  { value: "discount", label: "Réduction" },
  { value: "gift", label: "Cadeau" },
  { value: "event_access", label: "Événement" },
  { value: "custom", label: "Sur mesure" },
];

export default function NewPartnerOfferScreen() {
  const router = useRouter();
  const { yunicityApi } = useAuth();
  const [orgId, setOrgId] = useState("");
  const [orgs, setOrgs] = useState<OrganizationMeItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [offerType, setOfferType] = useState<PartnerOfferType>("drink");
  const [submitAfter, setSubmitAfter] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void yunicityApi.listMyOrganizations().then((data) => {
      const m = listOfferManageableOrganizations(data.items);
      setOrgs(m);
      if (m[0]) {
        setOrgId(m[0].id);
      }
      setLoading(false);
    });
  }, [yunicityApi]);

  async function handleCreate() {
    if (!orgId || !title.trim()) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await yunicityApi.partnerOffers.createOffer({
        organization_id: orgId,
        title: title.trim(),
        description: description.trim() || null,
        offer_type: offerType,
      });
      if (submitAfter) {
        await yunicityApi.partnerOffers.submitOffer(created.id);
      }
      router.replace(`/(protected)/partner-offers/${created.id}`);
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Création impossible.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#d4a574" />
      </View>
    );
  }

  if (orgs.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Organisation non éligible pour le moment.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Proposer une offre</Text>
      <Text style={styles.hint}>Titre, description, type — Yunicity valide avant publication.</Text>

      {orgs.length > 1 ? (
        <Text style={styles.label}>Lieu : {orgs.find((o) => o.id === orgId)?.name}</Text>
      ) : null}

      <Text style={styles.label}>Titre</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Ex. Café offert aux Passport"
        placeholderTextColor="#78716c"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="Ce que vivent les citoyens chez toi…"
        placeholderTextColor="#78716c"
      />

      <Text style={styles.label}>Type</Text>
      <View style={styles.typeRow}>
        {TYPES.map((t) => (
          <Pressable
            key={t.value}
            onPress={() => setOfferType(t.value)}
            style={[styles.typeChip, offerType === t.value && styles.typeChipActive]}
          >
            <Text style={[styles.typeChipText, offerType === t.value && styles.typeChipTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Envoyer à Yunicity après création</Text>
        <Switch value={submitAfter} onValueChange={setSubmitAfter} />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.cta, busy && styles.ctaDisabled]}
        disabled={busy}
        onPress={() => void handleCreate()}
      >
        <Text style={styles.ctaText}>{busy ? "Enregistrement…" : "Créer l'offre"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0c0a09" },
  container: { flex: 1, backgroundColor: "#0c0a09" },
  content: { padding: 16, paddingBottom: 40 },
  title: { color: "#fafaf9", fontSize: 22, fontWeight: "800" },
  hint: { color: "#a8a29e", fontSize: 14, marginTop: 6, marginBottom: 16 },
  label: { color: "#d6d3d1", fontSize: 13, fontWeight: "600", marginTop: 12 },
  input: {
    backgroundColor: "#1c1917",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#44403c",
    color: "#fafaf9",
    padding: 12,
    marginTop: 6,
    fontSize: 15,
  },
  textArea: { minHeight: 88, textAlignVertical: "top" },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  typeChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#44403c",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typeChipActive: { backgroundColor: "#d4a574", borderColor: "#d4a574" },
  typeChipText: { color: "#a8a29e", fontSize: 12 },
  typeChipTextActive: { color: "#0c0a09", fontWeight: "700" },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
  cta: {
    backgroundColor: "#fafaf9",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: "#0c0a09", fontWeight: "700" },
  error: { color: "#f87171", marginTop: 12 },
  empty: { color: "#a8a29e", padding: 16 },
});
