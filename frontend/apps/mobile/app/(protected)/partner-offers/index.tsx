import { useAuth } from "@/lib/auth-provider";
import type { OrganizationMeItem, PartnerOfferManagement, PartnerOfferStatus } from "@yunicity/types";
import {
  PARTNER_OFFERS_EMPTY_BODY,
  PARTNER_OFFERS_EMPTY_CTA,
  PARTNER_OFFERS_EMPTY_TITLE,
  PARTNER_OFFER_STATUS_LABELS,
  PARTNER_OFFER_STATUS_MICROCOPY,
  PARTNER_OFFER_STATUS_TONES,
  PARTNER_OFFER_TYPE_LABELS,
  formatPassportDate,
  isAuthError,
  listOfferManageableOrganizations,
} from "@yunicity/utils";
import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

function StatusPill({ status }: { status: PartnerOfferStatus }) {
  const tone = PARTNER_OFFER_STATUS_TONES[status];
  return (
    <View style={[styles.pill, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <Text style={[styles.pillText, { color: tone.text }]}>
        {PARTNER_OFFER_STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

export default function PartnerOffersHubScreen() {
  const router = useRouter();
  const { yunicityApi } = useAuth();
  const [orgs, setOrgs] = useState<OrganizationMeItem[]>([]);
  const [items, setItems] = useState<PartnerOfferManagement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const manageable = useMemo(() => listOfferManageableOrganizations(orgs), [orgs]);
  const orgNames = useMemo(() => new Map(orgs.map((o) => [o.id, o.name])), [orgs]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [orgData, offerData] = await Promise.all([
        yunicityApi.listMyOrganizations(),
        yunicityApi.partnerOffers.listOffers({ page_size: 100 }),
      ]);
      setOrgs(orgData.items);
      setItems(offerData.items);
    } catch (err) {
      setError(isAuthError(err) ? err.message : "Impossible de charger tes offres.");
    } finally {
      setIsLoading(false);
    }
  }, [yunicityApi]);

  useEffect(() => {
    void load();
  }, [load]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#d4a574" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>Participation locale</Text>
      <Text style={styles.title}>Tes offres pour la ville</Text>
      <Text style={styles.subtitle}>
        Propose une expérience aux citoyens Yunicity — validée avec bienveillance par notre équipe.
      </Text>

      {manageable.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>
            {orgs.length === 0
              ? "Rejoins le territoire"
              : "Ton lieu n’est pas encore prêt"}
          </Text>
          <Text style={styles.emptyBody}>
            {orgs.length === 0
              ? "Propose ton commerce ou association à Reims pour publier des offres Passport."
              : "Dès que ton organisation est vérifiée et que tu es admin, tu pourras créer des offres."}
          </Text>
        </View>
      ) : (
        <>
          {items.length > 0 ? (
            <Pressable style={styles.cta} onPress={() => router.push("/(protected)/partner-offers/new")}>
              <Text style={styles.ctaText}>{PARTNER_OFFERS_EMPTY_CTA}</Text>
            </Pressable>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={items.length === 0 ? styles.emptyList : undefined}
            ListEmptyComponent={
              !error ? (
                <View style={styles.emptyOfferBox}>
                  <Text style={styles.emptyTitle}>{PARTNER_OFFERS_EMPTY_TITLE}</Text>
                  <Text style={styles.emptyBody}>{PARTNER_OFFERS_EMPTY_BODY}</Text>
                  <Pressable
                    style={styles.cta}
                    onPress={() => router.push("/(protected)/partner-offers/new")}
                  >
                    <Text style={styles.ctaText}>{PARTNER_OFFERS_EMPTY_CTA}</Text>
                  </Pressable>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <Link href={`/(protected)/partner-offers/${item.id}`} asChild>
                <Pressable style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <StatusPill status={item.offer_status} />
                  </View>
                  <Text style={styles.cardMeta}>
                    {orgNames.get(item.organization_id) ?? "Ton lieu"} ·{" "}
                    {PARTNER_OFFER_TYPE_LABELS[item.offer_type]}
                  </Text>
                  <Text style={styles.cardCopy}>
                    {PARTNER_OFFER_STATUS_MICROCOPY[item.offer_status]}
                  </Text>
                  <Text style={styles.cardDates}>
                    {formatPassportDate(item.valid_from)} → {formatPassportDate(item.valid_until)} ·{" "}
                    {item.redemptions_count} utilisation{item.redemptions_count !== 1 ? "s" : ""}
                  </Text>
                </Pressable>
              </Link>
            )}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0c0a09" },
  container: { flex: 1, padding: 16, backgroundColor: "#0c0a09" },
  kicker: { color: "#d4a574", fontSize: 13, fontWeight: "600" },
  title: { color: "#fafaf9", fontSize: 26, fontWeight: "800", marginTop: 4 },
  subtitle: { color: "#a8a29e", fontSize: 14, marginTop: 8, lineHeight: 20 },
  cta: {
    backgroundColor: "#fafaf9",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 16,
  },
  ctaText: { color: "#0c0a09", fontWeight: "700", fontSize: 15 },
  card: {
    backgroundColor: "#1c1917",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#292524",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "flex-start" },
  cardTitle: { color: "#fafaf9", fontSize: 17, fontWeight: "700", flex: 1 },
  pill: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  pillText: { fontSize: 11, fontWeight: "600" },
  cardMeta: { color: "#a8a29e", fontSize: 12, marginTop: 6 },
  cardCopy: { color: "#d6d3d1", fontSize: 13, marginTop: 8 },
  cardDates: { color: "#78716c", fontSize: 11, marginTop: 8 },
  emptyBox: {
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#44403c",
    backgroundColor: "#1c1917",
  },
  emptyTitle: { color: "#fafaf9", fontSize: 17, fontWeight: "700" },
  emptyBody: { color: "#a8a29e", fontSize: 14, marginTop: 8, lineHeight: 20, textAlign: "center" },
  emptyList: { flexGrow: 1, paddingTop: 8 },
  emptyOfferBox: {
    marginTop: 8,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#44403c",
    backgroundColor: "#1c1917",
    alignItems: "center",
  },
  error: { color: "#f87171", marginBottom: 8 },
});
