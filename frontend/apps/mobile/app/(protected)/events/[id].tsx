import { feedTheme } from "@/components/feed/feed-theme";
import { useAuth } from "@/lib/auth-provider";
import type { LocalEvent } from "@yunicity/types";
import {
  EVENT_INTEREST_CTA,
  EVENT_INTEREST_SAVED,
  formatEventDateRange,
  formatEventLocation,
} from "@yunicity/utils";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { yunicityApi: api } = useAuth();
  const [event, setEvent] = useState<LocalEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setEvent(await api.events.getEvent(id));
    } finally {
      setLoading(false);
    }
  }, [api.events, id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleInterest() {
    if (!event) return;
    setToggling(true);
    try {
      const result = await api.events.toggleInterest(event.id);
      setEvent({ ...event, interested_by_me: result.interested });
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={feedTheme.accent} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Moment introuvable.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{event.title}</Text>
      <Text style={styles.meta}>{formatEventDateRange(event.starts_at, event.ends_at)}</Text>
      <Text style={styles.meta}>{formatEventLocation(event, event.city)}</Text>
      {event.description ? <Text style={styles.body}>{event.description}</Text> : null}
      <Pressable
        style={[styles.cta, event.interested_by_me && styles.ctaSaved]}
        disabled={toggling}
        onPress={() => void toggleInterest()}
      >
        <Text style={styles.ctaText}>
          {event.interested_by_me ? EVENT_INTEREST_SAVED : EVENT_INTEREST_CTA}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: feedTheme.bg },
  content: { padding: 16, gap: 12 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "700", color: feedTheme.text },
  meta: { fontSize: 14, color: feedTheme.textMuted },
  body: { fontSize: 15, lineHeight: 22, color: feedTheme.text, marginTop: 8 },
  muted: { color: feedTheme.textMuted },
  cta: {
    marginTop: 16,
    backgroundColor: feedTheme.accent,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaSaved: { backgroundColor: feedTheme.border },
  ctaText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});
