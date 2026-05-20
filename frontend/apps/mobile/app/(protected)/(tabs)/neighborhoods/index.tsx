import { feedTheme } from "@/components/feed/feed-theme";
import { useAuth } from "@/lib/auth-provider";
import type { Neighborhood } from "@yunicity/types";
import {
  NEIGHBORHOOD_DISCOVER_CTA,
  NEIGHBORHOODS_EMPTY,
  NEIGHBORHOODS_ERROR,
  NEIGHBORHOODS_LOADING,
  NEIGHBORHOODS_PAGE_SUBTITLE,
  NEIGHBORHOODS_PAGE_TITLE,
  NEIGHBORHOODS_RETRY,
  neighborhoodAmbianceLine,
} from "@yunicity/utils";
import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

function NeighborhoodCardMobile({
  hood,
  city,
  onPress,
}: {
  hood: Neighborhood;
  city: string;
  onPress: () => void;
}) {
  const ambiance = neighborhoodAmbianceLine(hood.ambiance);
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View
        style={[
          styles.cardCover,
          hood.accent_color ? { backgroundColor: hood.accent_color } : null,
        ]}
      >
        <Text style={styles.cardCoverTitle}>{hood.display_name}</Text>
      </View>
      <View style={styles.cardBody}>
        {ambiance ? <Text style={styles.ambiance}>{ambiance}</Text> : null}
        {hood.short_description ? (
          <Text style={styles.description} numberOfLines={3}>
            {hood.short_description}
          </Text>
        ) : null}
        <Text style={styles.cta}>{NEIGHBORHOOD_DISCOVER_CTA}</Text>
      </View>
    </Pressable>
  );
}

export default function NeighborhoodsTabScreen() {
  const router = useRouter();
  const { yunicityApi: api, user } = useAuth();
  const city = user?.city ?? "Reims";
  const [items, setItems] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.neighborhoods.listNeighborhoods({ city, page_size: 20 });
      setItems(data.items);
    } catch {
      setError(NEIGHBORHOODS_ERROR);
    } finally {
      setLoading(false);
    }
  }, [api.neighborhoods, city]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.srOnly}>{NEIGHBORHOODS_LOADING}</Text>
        <ActivityIndicator color={feedTheme.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={() => void load()}>
          <Text style={styles.retryText}>{NEIGHBORHOODS_RETRY}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{NEIGHBORHOODS_PAGE_TITLE}</Text>
        <Text style={styles.subtitle}>{NEIGHBORHOODS_PAGE_SUBTITLE}</Text>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
        ListEmptyComponent={<Text style={styles.empty}>{NEIGHBORHOODS_EMPTY}</Text>}
        renderItem={({ item }) => (
          <NeighborhoodCardMobile
            hood={item}
            city={city}
            onPress={() =>
              router.push(
                `/(protected)/neighborhoods/${item.slug}?city=${encodeURIComponent(city)}` as Href,
              )
            }
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: feedTheme.bg },
  header: { padding: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: "700", color: feedTheme.text },
  subtitle: { fontSize: 14, color: feedTheme.textMuted, marginTop: 6, lineHeight: 20 },
  list: { padding: 16, paddingTop: 8, gap: 14, paddingBottom: 40 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: feedTheme.border,
    backgroundColor: feedTheme.bgElevated,
    overflow: "hidden",
  },
  cardCover: {
    minHeight: 120,
    justifyContent: "flex-end",
    padding: 14,
    backgroundColor: "#f5f5f5",
  },
  cardCoverTitle: { fontSize: 18, fontWeight: "700", color: feedTheme.text },
  cardBody: { padding: 14, gap: 6 },
  ambiance: { fontSize: 13, color: feedTheme.accent, fontWeight: "500" },
  description: { fontSize: 14, color: feedTheme.textMuted, lineHeight: 20 },
  cta: { marginTop: 8, fontSize: 14, fontWeight: "600", color: feedTheme.accent },
  empty: { color: feedTheme.textMuted, textAlign: "center", marginTop: 24 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  srOnly: { position: "absolute", width: 1, height: 1, opacity: 0 },
  error: { color: feedTheme.textMuted, marginBottom: 12, textAlign: "center" },
  retryBtn: {
    backgroundColor: feedTheme.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  retryText: { color: "#fff", fontWeight: "600" },
});
