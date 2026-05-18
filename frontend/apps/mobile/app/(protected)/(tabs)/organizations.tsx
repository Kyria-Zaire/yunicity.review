import { useAuth } from "@/lib/auth-provider";
import type { OrganizationMeItem } from "@yunicity/types";
import { ORGANIZATION_TYPE_OPTIONS, VERIFICATION_STATUS_LABELS, isAuthError } from "@yunicity/utils";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

function typeLabel(type: string): string {
  return ORGANIZATION_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

export default function OrganizationsTabScreen() {
  const { yunicityApi } = useAuth();
  const [items, setItems] = useState<OrganizationMeItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await yunicityApi.listMyOrganizations();
        if (!cancelled) {
          setItems(data.items);
        }
      } catch (err) {
        if (!cancelled) {
          setError(isAuthError(err) ? err.message : "Erreur de chargement.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [yunicityApi]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Link href="/(protected)/partner-offers" asChild>
        <Pressable style={styles.cta}>
          <Text style={styles.ctaText}>Mes offres pour la ville</Text>
        </Pressable>
      </Link>
      <Link href="/(protected)/organizations/request" asChild>
        <Pressable style={styles.ctaSecondary}>
          <Text style={styles.ctaSecondaryText}>Proposer un lieu</Text>
        </Pressable>
      </Link>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={items.length === 0 ? styles.emptyList : undefined}
        ListEmptyComponent={
          !error ? (
            <Text style={styles.empty}>Aucun lieu — propose le tien à Reims.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardMeta}>
              {typeLabel(item.type)} · {item.city}
            </Text>
            <Text style={styles.badge}>
              {VERIFICATION_STATUS_LABELS[item.verification_status]}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, padding: 16 },
  cta: {
    backgroundColor: "#fafaf9",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  ctaText: { color: "#0c0a09", fontWeight: "700" },
  ctaSecondary: {
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#44403c",
  },
  ctaSecondaryText: { color: "#d6d3d1", fontWeight: "600" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardTitle: { fontSize: 17, fontWeight: "700" },
  cardMeta: { color: "#737373", marginTop: 4, fontSize: 13 },
  badge: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    overflow: "hidden",
  },
  emptyList: { flexGrow: 1, justifyContent: "center" },
  empty: { textAlign: "center", color: "#737373" },
  error: { color: "#dc2626", marginBottom: 8 },
});
