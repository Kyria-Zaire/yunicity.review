import { feedTheme } from "@/components/feed/feed-theme";
import { EventMap } from "@/components/map/event-map";
import { useMapBbox } from "@/hooks/use-map-bbox";
import { useMapEvents } from "@/hooks/use-map-events";
import { useAuth } from "@/lib/auth-provider";
import type { MapEventItem } from "@yunicity/types";
import Mapbox from "@rnmapbox/maps";
import {
  DEFAULT_MAP_CITY,
  MAP_EMPTY,
  MAP_EMPTY_HINT,
  MAP_ERROR,
  MAP_LOADING,
  MAP_PAGE_SUBTITLE,
  MAP_PAGE_TITLE,
  MAP_RETRY,
  MAP_TOKEN_MISSING_EXPO,
  MAP_TRUNCATED_HINT,
  MAP_VIEW_EVENT,
  mapEventPopupDate,
  mapEventPopupLocation,
} from "@yunicity/utils";
import { useRouter, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MAPBOX_TOKEN =
  process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ??
  process.env.EXPO_PUBLIC_MAPBOX_TOKEN ??
  "";

export function EventMapScreen() {
  const router = useRouter();
  const { yunicityApi, user } = useAuth();
  const [profileCity, setProfileCity] = useState(user?.city ?? DEFAULT_MAP_CITY);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const { bbox, updateFromBounds } = useMapBbox();
  const { events, loading, error, truncated, hasLoaded, retry } = useMapEvents(
    profileCity,
    bbox,
  );

  useEffect(() => {
    if (MAPBOX_TOKEN) {
      Mapbox.setAccessToken(MAPBOX_TOKEN);
    }
  }, []);

  useEffect(() => {
    void yunicityApi.getProfileMe().then((profile) => {
      if (profile.city) setProfileCity(profile.city);
    });
  }, [yunicityApi]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  const showInitialLoading = !hasLoaded && loading;
  const showEmpty = hasLoaded && !loading && !error && events.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <View style={styles.header}>
        <Text style={styles.title}>{MAP_PAGE_TITLE}</Text>
        <Text style={styles.subtitle}>{MAP_PAGE_SUBTITLE}</Text>
      </View>

      {!MAPBOX_TOKEN ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{MAP_TOKEN_MISSING_EXPO}</Text>
        </View>
      ) : (
        <View style={styles.mapWrap}>
          <EventMap
            city={profileCity}
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={setSelectedEventId}
            onBboxChange={updateFromBounds}
            onRecenterPress={() => setSelectedEventId(null)}
          />
        </View>
      )}

      {showInitialLoading ? (
        <View style={styles.statusRow}>
          <ActivityIndicator color={feedTheme.accent} />
          <Text style={styles.statusText}>{MAP_LOADING}</Text>
        </View>
      ) : null}

      {error ? (
        <View style={styles.bannerError}>
          <Text style={styles.bannerText}>{MAP_ERROR}</Text>
          <Pressable onPress={retry}>
            <Text style={styles.retryText}>{MAP_RETRY}</Text>
          </Pressable>
        </View>
      ) : null}

      {showEmpty ? (
        <View style={styles.banner}>
          <Text style={styles.emptyTitle}>{MAP_EMPTY}</Text>
          <Text style={styles.statusText}>{MAP_EMPTY_HINT}</Text>
        </View>
      ) : null}

      {truncated && events.length > 0 ? (
        <Text style={styles.hint}>{MAP_TRUNCATED_HINT}</Text>
      ) : null}

      {loading && hasLoaded ? (
        <Text style={styles.hint}>{MAP_LOADING}</Text>
      ) : null}

      {selectedEvent ? (
        <EventCallout
          event={selectedEvent}
          onClose={() => setSelectedEventId(null)}
          onOpenDetail={() =>
            router.push(`/(protected)/events/${selectedEvent.id}` as Href)
          }
        />
      ) : null}
    </SafeAreaView>
  );
}

function EventCallout({
  event,
  onClose,
  onOpenDetail,
}: {
  event: MapEventItem;
  onClose: () => void;
  onOpenDetail: () => void;
}) {
  return (
    <View style={styles.callout}>
      <View style={styles.calloutHeader}>
        <Text style={styles.calloutTitle}>{event.title}</Text>
        <Pressable onPress={onClose} hitSlop={8}>
          <Text style={styles.calloutClose}>×</Text>
        </Pressable>
      </View>
      <Text style={styles.calloutMeta}>{mapEventPopupDate(event)}</Text>
      <Text style={styles.calloutMeta}>{mapEventPopupLocation(event)}</Text>
      {event.description ? (
        <Text style={styles.calloutBody} numberOfLines={3}>
          {event.description}
        </Text>
      ) : null}
      <Pressable style={styles.calloutCta} onPress={onOpenDetail}>
        <Text style={styles.calloutCtaText}>{MAP_VIEW_EVENT}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: feedTheme.bg },
  header: { paddingHorizontal: 16, paddingBottom: 8, gap: 4 },
  title: { fontSize: 26, fontWeight: "700", color: feedTheme.text },
  subtitle: { fontSize: 14, color: feedTheme.textMuted, lineHeight: 20 },
  mapWrap: { flex: 1, marginHorizontal: 16, marginBottom: 8 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
  statusText: { fontSize: 13, color: feedTheme.textMuted },
  banner: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: feedTheme.border,
    backgroundColor: "#fff",
  },
  bannerError: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
    alignItems: "center",
    gap: 8,
  },
  bannerText: { fontSize: 14, color: feedTheme.text, textAlign: "center" },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: feedTheme.text, marginBottom: 4 },
  retryText: { fontSize: 14, fontWeight: "600", color: feedTheme.accent },
  hint: {
    fontSize: 12,
    color: feedTheme.textMuted,
    textAlign: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  callout: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: feedTheme.border,
    backgroundColor: "#fff",
    gap: 6,
  },
  calloutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  calloutTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: feedTheme.text },
  calloutClose: { fontSize: 22, color: feedTheme.textMuted, lineHeight: 22 },
  calloutMeta: { fontSize: 13, color: feedTheme.textMuted },
  calloutBody: { fontSize: 13, color: "#525252", lineHeight: 18 },
  calloutCta: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: feedTheme.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  calloutCtaText: { fontSize: 13, fontWeight: "600", color: feedTheme.bg },
});
