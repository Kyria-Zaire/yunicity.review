import { feedTheme } from "@/components/feed/feed-theme";
import { useAuth } from "@/lib/auth-provider";
import type { LocalEvent } from "@yunicity/types";
import {
  EVENTS_EMPTY,
  EVENTS_PAGE_SUBTITLE,
  EVENTS_PAGE_TITLE,
  formatEventDateRange,
  formatEventLocation,
} from "@yunicity/utils";
import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

function EventRow({ event }: { event: LocalEvent }) {
  const router = useRouter();
  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/(protected)/events/${event.id}` as Href)}
    >
      <Text style={styles.cardTitle}>{event.title}</Text>
      <Text style={styles.cardMeta}>{formatEventDateRange(event.starts_at, event.ends_at)}</Text>
      <Text style={styles.cardMeta}>{formatEventLocation(event, event.city)}</Text>
    </Pressable>
  );
}

export default function EventsTabScreen() {
  const { yunicityApi: api } = useAuth();
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.events.listEvents();
      setEvents(response.items);
    } finally {
      setLoading(false);
    }
  }, [api.events]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{EVENTS_PAGE_TITLE}</Text>
      <Text style={styles.subtitle}>{EVENTS_PAGE_SUBTITLE}</Text>
      {loading ? (
        <ActivityIndicator color={feedTheme.accent} style={styles.loader} />
      ) : events.length === 0 ? (
        <Text style={styles.empty}>{EVENTS_EMPTY}</Text>
      ) : (
        <View style={styles.list}>
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: feedTheme.bg },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  title: { fontSize: 22, fontWeight: "700", color: feedTheme.text },
  subtitle: { fontSize: 14, color: feedTheme.textMuted, marginBottom: 8 },
  loader: { marginTop: 24 },
  empty: { color: feedTheme.textMuted, fontSize: 14, lineHeight: 20 },
  list: { gap: 12 },
  card: {
    backgroundColor: feedTheme.bgElevated,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: feedTheme.border,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: feedTheme.text },
  cardMeta: { fontSize: 13, color: feedTheme.textMuted, marginTop: 4 },
});
