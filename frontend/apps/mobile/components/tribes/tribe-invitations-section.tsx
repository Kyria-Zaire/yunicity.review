import { feedTheme } from "@/components/feed/feed-theme";
import { useAuth } from "@/lib/auth-provider";
import type { TribeInvitationPending } from "@yunicity/types";
import {
  TRIBE_CHARTER_LABEL,
  TRIBE_INVITATIONS_ACCEPT,
  TRIBE_INVITATIONS_DECLINE,
  TRIBE_INVITATIONS_SECTION_BODY,
  TRIBE_INVITATIONS_SECTION_TITLE,
} from "@yunicity/utils";
import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

export function TribeInvitationsSectionMobile() {
  const { yunicityApi: api } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<TribeInvitationPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.tribes.listMyTribeInvitations();
      setItems(data.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [api.tribes]);

  useEffect(() => {
    void load();
  }, [load]);

  async function accept(invitation: TribeInvitationPending) {
    setBusyId(invitation.id);
    try {
      const member = await api.tribes.acceptTribeInvitationById(invitation.id, {
        charter_accepted: true,
      });
      const slug = member.tribe_slug ?? invitation.tribe_slug;
      const city = member.tribe_city ?? invitation.tribe_city;
      router.push(`/(protected)/tribes/${slug}?city=${encodeURIComponent(city)}` as Href);
    } finally {
      setBusyId(null);
    }
  }

  async function decline(invitation: TribeInvitationPending) {
    setBusyId(invitation.id);
    try {
      await api.tribes.declineTribeInvitation(invitation.id);
      await load();
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.box}>
        <ActivityIndicator color={feedTheme.accent} />
      </View>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.box}>
      <Text style={styles.title}>{TRIBE_INVITATIONS_SECTION_TITLE}</Text>
      <Text style={styles.body}>{TRIBE_INVITATIONS_SECTION_BODY}</Text>
      {items.map((invitation) => (
        <View key={invitation.id} style={styles.card}>
          <Text style={styles.tribeName}>{invitation.tribe_name}</Text>
          <Text style={styles.meta}>{invitation.tribe_city}</Text>
          <Text style={styles.charter}>{TRIBE_CHARTER_LABEL}</Text>
          <View style={styles.actions}>
            <Pressable
              style={[styles.acceptBtn, busyId === invitation.id && styles.disabled]}
              disabled={busyId === invitation.id}
              onPress={() => void accept(invitation)}
            >
              <Text style={styles.acceptText}>{TRIBE_INVITATIONS_ACCEPT}</Text>
            </Pressable>
            <Pressable
              style={styles.declineBtn}
              disabled={busyId === invitation.id}
              onPress={() => void decline(invitation)}
            >
              <Text style={styles.declineText}>{TRIBE_INVITATIONS_DECLINE}</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: feedTheme.border,
    backgroundColor: feedTheme.bgElevated,
  },
  title: { fontSize: 16, fontWeight: "600", color: feedTheme.text },
  body: { fontSize: 13, color: feedTheme.textMuted, marginTop: 4, lineHeight: 18 },
  card: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: feedTheme.border,
  },
  tribeName: { fontSize: 15, fontWeight: "600", color: feedTheme.text },
  meta: { fontSize: 13, color: feedTheme.textMuted, marginTop: 2 },
  charter: { fontSize: 12, color: feedTheme.textMuted, marginTop: 6 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  acceptBtn: {
    backgroundColor: feedTheme.accent,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  acceptText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  declineBtn: {
    borderWidth: 1,
    borderColor: feedTheme.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  declineText: { color: feedTheme.text, fontSize: 14 },
  disabled: { opacity: 0.6 },
});
