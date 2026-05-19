import { feedTheme } from "@/components/feed/feed-theme";
import { useAuth } from "@/lib/auth-provider";
import type { UserNotificationItem } from "@yunicity/types";
import {
  formatNotificationMessage,
  formatNotificationRelativeTime,
} from "@yunicity/utils";
import type { Href } from "expo-router";
import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

function NotificationRow({
  item,
  onPress,
}: {
  item: UserNotificationItem;
  onPress: () => void;
}) {
  const message = formatNotificationMessage(item.type, item.actor_name, item.payload);
  const time = formatNotificationRelativeTime(item.created_at);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, !item.is_read && styles.rowUnread]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {(item.actor_name ?? "Y").slice(0, 1).toUpperCase()}
        </Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
      {!item.is_read ? <View style={styles.dot} /> : null}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { yunicityApi } = useAuth();
  const [items, setItems] = useState<UserNotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await yunicityApi.notifications.listInbox(50);
    setItems(data.items);
    setUnread(data.unread_count);
  }, [yunicityApi]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function handlePress(item: UserNotificationItem) {
    if (!item.is_read) {
      try {
        await yunicityApi.notifications.markNotificationRead(item.id);
        setItems((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)),
        );
        setUnread((c) => Math.max(0, c - 1));
      } catch {
        /* best effort */
      }
    }
    router.push("/(protected)/(tabs)/feed" as Href);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={feedTheme.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unread > 0 ? (
          <Pressable
            onPress={() =>
              void yunicityApi.notifications.markAllNotificationsRead().then(() => {
                setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
                setUnread(0);
              })
            }
          >
            <Text style={styles.markAll}>Tout marquer lu</Text>
          </Pressable>
        ) : null}
      </View>

      {items.length === 0 ? (
        <Text style={styles.empty}>
          Aucune notification pour l&apos;instant. Vos interactions locales apparaîtront ici.
        </Text>
      ) : (
        items.map((item) => (
          <NotificationRow
            key={item.id}
            item={item}
            onPress={() => void handlePress(item)}
          />
        ))
      )}

      <Link href={"/(protected)/(tabs)/feed" as Href} asChild>
        <Pressable style={styles.backLink}>
          <Text style={styles.backLinkText}>Retour au fil local</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: feedTheme.bg },
  content: { padding: 16, paddingBottom: 40, gap: 10 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: "800", color: feedTheme.text },
  markAll: { fontSize: 13, fontWeight: "600", color: feedTheme.accent },
  empty: { color: feedTheme.textMuted, fontSize: 14, lineHeight: 20, marginTop: 12 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: feedTheme.border,
    backgroundColor: feedTheme.bgElevated,
  },
  rowUnread: {
    borderColor: "rgba(42, 47, 255, 0.25)",
    backgroundColor: "rgba(42, 47, 255, 0.06)",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(42, 47, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "700", color: feedTheme.accent, fontSize: 14 },
  body: { flex: 1, gap: 4 },
  message: { fontSize: 14, color: feedTheme.text, lineHeight: 20 },
  time: { fontSize: 12, color: feedTheme.textMuted },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: feedTheme.accent,
    marginTop: 6,
  },
  backLink: { marginTop: 20, alignItems: "center" },
  backLinkText: { color: feedTheme.accent, fontWeight: "600" },
});
