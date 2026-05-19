import { useAuth } from "@/lib/auth-provider";
import type { PartnerOfferManagement, PartnerOfferType } from "@yunicity/types";
import {
  FLASH_PARTNER_HELPER,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  PARTNER_OFFER_REJECTED_HINT,
  PARTNER_OFFER_REJECTED_REASON_LABEL,
  PARTNER_OFFER_REJECTED_SECTION_TITLE,
  PARTNER_OFFER_STATUS_LABELS,
  PARTNER_OFFER_STATUS_MICROCOPY,
  PARTNER_OFFER_STATUS_TONES,
  PARTNER_OFFER_TYPE_LABELS,
  canEditPartnerOffer,
  canSubmitPartnerOffer,
  isAuthError,
} from "@yunicity/utils";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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

export default function PartnerOfferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { yunicityApi } = useAuth();
  const [offer, setOffer] = useState<PartnerOfferManagement | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [offerType, setOfferType] = useState<PartnerOfferType>("drink");
  const [isFlash, setIsFlash] = useState(false);
  const [flashEndsAt, setFlashEndsAt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await yunicityApi.partnerOffers.listOffers({ page_size: 100 });
      const found = data.items.find((o) => o.id === id);
      if (!found) {
        setError("Offre introuvable.");
        return;
      }
      setOffer(found);
      setTitle(found.title);
      setDescription(found.description ?? "");
      setOfferType(found.offer_type);
      setIsFlash(found.is_flash);
      setFlashEndsAt(toDatetimeLocalValue(found.flash_ends_at));
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, [yunicityApi, id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!offer) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await yunicityApi.partnerOffers.updateOffer(offer.id, {
        title: title.trim(),
        description: description.trim() || null,
        offer_type: offerType,
        is_flash: isFlash,
        flash_ends_at:
          isFlash && flashEndsAt.trim()
            ? fromDatetimeLocalValue(flashEndsAt)
            : null,
      });
      setOffer(updated);
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function submitReview() {
    if (!offer) {
      return;
    }
    setBusy(true);
    try {
      const updated = await yunicityApi.partnerOffers.submitOffer(offer.id);
      setOffer(updated);
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Envoi impossible.");
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

  if (!offer) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error ?? "Offre introuvable."}</Text>
      </View>
    );
  }

  const tone = PARTNER_OFFER_STATUS_TONES[offer.offer_status];
  const editable = canEditPartnerOffer(offer.offer_status);
  const submittable = canSubmitPartnerOffer(offer.offer_status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.pill, { backgroundColor: tone.bg, borderColor: tone.border }]}>
        <Text style={[styles.pillText, { color: tone.text }]}>
          {PARTNER_OFFER_STATUS_LABELS[offer.offer_status]}
        </Text>
      </View>
      <Text style={styles.copy}>{PARTNER_OFFER_STATUS_MICROCOPY[offer.offer_status]}</Text>

      {offer.offer_status === "rejected" ? (
        <View style={styles.rejectBox}>
          <Text style={styles.rejectTitle}>{PARTNER_OFFER_REJECTED_SECTION_TITLE}</Text>
          {offer.rejection_reason ? (
            <>
              <Text style={styles.rejectLabel}>{PARTNER_OFFER_REJECTED_REASON_LABEL}</Text>
              <Text style={styles.rejectBody}>{offer.rejection_reason}</Text>
            </>
          ) : null}
          <Text style={styles.rejectHint}>{PARTNER_OFFER_REJECTED_HINT}</Text>
        </View>
      ) : null}

      {editable ? (
        <>
          <Text style={styles.label}>Titre</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} />
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            multiline
          />
          <Text style={styles.meta}>{PARTNER_OFFER_TYPE_LABELS[offerType]}</Text>
          <View style={styles.switchRow}>
            <View style={styles.flashLabelCol}>
              <Text style={styles.label}>Offre flash</Text>
              <Text style={styles.flashHint}>{FLASH_PARTNER_HELPER}</Text>
            </View>
            <Switch value={isFlash} onValueChange={setIsFlash} />
          </View>
          {isFlash ? (
            <>
              <Text style={styles.label}>Fin de la mise en avant</Text>
              <TextInput
                style={styles.input}
                value={flashEndsAt}
                onChangeText={setFlashEndsAt}
                placeholder="2026-05-19T20:00"
                placeholderTextColor="#78716c"
                autoCapitalize="none"
              />
            </>
          ) : null}
          <Pressable style={styles.secondaryBtn} disabled={busy} onPress={() => void save()}>
            <Text style={styles.secondaryBtnText}>{busy ? "…" : "Enregistrer"}</Text>
          </Pressable>
        </>
      ) : (
        <Text style={styles.body}>{offer.description || "Pas de description."}</Text>
      )}

      {submittable ? (
        <Pressable style={styles.cta} disabled={busy} onPress={() => void submitReview()}>
          <Text style={styles.ctaText}>Soumettre à Yunicity</Text>
        </Pressable>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.stats}>
        {offer.redemptions_count} utilisation{offer.redemptions_count !== 1 ? "s" : ""}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0c0a09" },
  container: { flex: 1, backgroundColor: "#0c0a09" },
  content: { padding: 16, paddingBottom: 40 },
  pill: { alignSelf: "flex-start", borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 12, fontWeight: "600" },
  copy: { color: "#d6d3d1", fontSize: 14, marginTop: 8 },
  rejectBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#292524",
    borderWidth: 1,
    borderColor: "#d4a574",
  },
  rejectTitle: { color: "#fafaf9", fontWeight: "700", fontSize: 15 },
  rejectLabel: {
    color: "#d4a574",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 10,
    textTransform: "uppercase",
  },
  rejectBody: { color: "#e7e5e4", marginTop: 4, fontSize: 14, lineHeight: 20 },
  rejectHint: { color: "#a8a29e", marginTop: 10, fontSize: 12, lineHeight: 18 },
  label: { color: "#d6d3d1", fontSize: 13, marginTop: 16, fontWeight: "600" },
  input: {
    backgroundColor: "#1c1917",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#44403c",
    color: "#fafaf9",
    padding: 12,
    marginTop: 6,
  },
  textArea: { minHeight: 80 },
  meta: { color: "#78716c", marginTop: 8, fontSize: 12 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  flashLabelCol: { flex: 1, paddingRight: 12 },
  flashHint: { color: "#78716c", fontSize: 12, marginTop: 4, lineHeight: 16 },
  body: { color: "#d6d3d1", fontSize: 15, marginTop: 16, lineHeight: 22 },
  secondaryBtn: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#44403c",
    alignItems: "center",
  },
  secondaryBtnText: { color: "#fafaf9", fontWeight: "600" },
  cta: {
    marginTop: 20,
    backgroundColor: "#d4a574",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  ctaText: { color: "#0c0a09", fontWeight: "700" },
  error: { color: "#f87171", marginTop: 12 },
  stats: { color: "#78716c", fontSize: 12, marginTop: 16 },
});
