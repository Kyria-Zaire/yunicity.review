import { feedTheme } from "@/components/feed/feed-theme";
import { useAuth } from "@/lib/auth-provider";
import type { FeedPost, Tribe, TribeMember } from "@yunicity/types";
import {
  TRIBE_ARCHIVED_BODY,
  TRIBE_ARCHIVED_TITLE,
  TRIBE_CHARTER_LABEL,
  TRIBE_COMPOSER_PLACEHOLDER,
  TRIBE_JOIN_CTA,
  TRIBE_LEAVE_CONFIRM,
  TRIBE_LEAVE_CTA,
  TRIBE_MEMBER_COUNT,
  TRIBE_MEMBERS_TITLE,
  TRIBE_NOT_FOUND,
  TRIBE_PRIVATE_BODY,
  TRIBE_PRIVATE_TITLE,
  TRIBE_PUBLISH_CTA,
  TRIBE_ROLE_LABELS,
  TRIBE_WALL_EMPTY,
  TRIBE_WALL_MEMBERS_ONLY,
  TRIBE_WALL_TITLE,
  TRIBES_RETRY,
  TRIBE_MOD_DELETE_POST,
  TRIBE_MOD_DEMOTE_MOD,
  TRIBE_MOD_EXCLUDE_MEMBER,
  TRIBE_MOD_PROMOTE_MOD,
  authorInitials,
  formatFeedDate,
  tribeCategoryLabel,
  tribeVisibilityLabel,
} from "@yunicity/utils";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

function memberDisplayName(member: TribeMember, currentUserId: string | undefined): string {
  if (currentUserId && member.user_id === currentUserId) {
    return "Vous";
  }
  return `Participant · ${member.user_id.slice(0, 8)}`;
}

function canModerateTribe(role: string | null | undefined): boolean {
  return role === "owner" || role === "moderator";
}

function canManageTribe(role: string | null | undefined): boolean {
  return role === "owner";
}

function TribePostCard({
  post,
  onModeratePress,
}: {
  post: FeedPost;
  onModeratePress?: () => void;
}) {
  const content = (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{authorInitials(post.author.display_name)}</Text>
        </View>
        <View style={styles.postHeaderText}>
          <Text style={styles.postAuthor}>{post.author.display_name}</Text>
          <Text style={styles.postDate}>{formatFeedDate(post.created_at)}</Text>
        </View>
      </View>
      {post.body ? <Text style={styles.postBody}>{post.body}</Text> : null}
    </View>
  );
  if (!onModeratePress) {
    return content;
  }
  return (
    <Pressable onLongPress={onModeratePress} delayLongPress={400}>
      {content}
    </Pressable>
  );
}

function TribeWallComposer({
  onSubmit,
}: {
  onSubmit: (body: string) => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <View style={styles.composer}>
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder={TRIBE_COMPOSER_PLACEHOLDER}
        placeholderTextColor={feedTheme.textMuted}
        multiline
        maxLength={5000}
        style={styles.composerInput}
      />
      <Pressable
        style={[styles.primaryBtn, (!body.trim() || busy) && styles.btnDisabled]}
        disabled={!body.trim() || busy}
        onPress={() => {
          const trimmed = body.trim();
          if (!trimmed) return;
          setBusy(true);
          void onSubmit(trimmed)
            .then(() => setBody(""))
            .finally(() => setBusy(false));
        }}
      >
        <Text style={styles.primaryBtnText}>{busy ? "Publication…" : TRIBE_PUBLISH_CTA}</Text>
      </Pressable>
    </View>
  );
}

export default function TribeDetailScreen() {
  const router = useRouter();
  const { slug, city: cityParam } = useLocalSearchParams<{ slug: string; city?: string }>();
  const { yunicityApi: api, user } = useAuth();
  const city = cityParam ?? user?.city ?? "Reims";
  const [tribe, setTribe] = useState<Tribe | null>(null);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [members, setMembers] = useState<TribeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wallLoading, setWallLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const loadTribe = useCallback(async () => {
    if (!slug) return;
    setError(null);
    try {
      const data = await api.tribes.getTribe(slug, city);
      setTribe(data);
      return data;
    } catch {
      setError(TRIBE_NOT_FOUND);
      return null;
    }
  }, [api.tribes, slug, city]);

  const loadWall = useCallback(
    async (tribeData: Tribe) => {
      if (!slug || !tribeData.viewer_is_member || tribeData.is_archived) {
        setPosts([]);
        return;
      }
      setWallLoading(true);
      try {
        const wall = await api.tribes.listTribePosts(slug, city, { limit: 30 });
        setPosts(wall.items);
      } catch {
        setPosts([]);
      } finally {
        setWallLoading(false);
      }
    },
    [api.tribes, slug, city],
  );

  const loadMembers = useCallback(
    async (tribeData: Tribe) => {
      if (!slug || !tribeData.viewer_is_member || tribeData.is_archived) {
        setMembers([]);
        return;
      }
      try {
        const data = await api.tribes.listTribeMembers(slug, city, { page_size: 50 });
        setMembers(data.items);
      } catch {
        setMembers([]);
      }
    },
    [api.tribes, slug, city],
  );

  const loadAll = useCallback(async () => {
    const data = await loadTribe();
    if (data) {
      await Promise.all([loadWall(data), loadMembers(data)]);
    }
    setLoading(false);
  }, [loadTribe, loadWall, loadMembers]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function onRefresh() {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }

  function handleJoin() {
    if (!slug) return;
    Alert.alert(TRIBE_JOIN_CTA, TRIBE_CHARTER_LABEL, [
      { text: "Annuler", style: "cancel" },
      {
        text: TRIBE_JOIN_CTA,
        onPress: () => {
          setActionBusy(true);
          void api.tribes
            .joinTribe(slug, city, { charter_accepted: true })
            .then(() => loadAll())
            .catch(() => Alert.alert("Impossible de rejoindre pour le moment."))
            .finally(() => setActionBusy(false));
        },
      },
    ]);
  }

  function handleLeave() {
    if (!slug) return;
    Alert.alert(TRIBE_LEAVE_CTA, TRIBE_LEAVE_CONFIRM, [
      { text: "Annuler", style: "cancel" },
      {
        text: TRIBE_LEAVE_CONFIRM,
        style: "destructive",
        onPress: () => {
          setActionBusy(true);
          void api.tribes
            .leaveTribe(slug, city)
            .then(() => loadAll())
            .finally(() => setActionBusy(false));
        },
      },
    ]);
  }

  async function publishPost(body: string) {
    if (!slug) return;
    const created = await api.tribes.createTribePost(slug, city, { body });
    setPosts((prev) => [created, ...prev]);
  }

  function confirmDeletePost(post: FeedPost) {
    if (!slug || !tribe) return;
    const isAuthor = post.author.id === user?.id;
    if (!isAuthor && !canModerateTribe(tribe.viewer_role)) return;
    Alert.alert("Publication", undefined, [
      { text: "Annuler", style: "cancel" },
      {
        text: TRIBE_MOD_DELETE_POST,
        style: "destructive",
        onPress: () => {
          void api.tribes.deleteTribePost(slug, city, post.id).then(() => {
            setPosts((prev) => prev.filter((item) => item.id !== post.id));
          });
        },
      },
    ]);
  }

  function confirmMemberAction(member: TribeMember) {
    if (!slug || !tribe || !canModerateTribe(tribe.viewer_role)) return;
    if (member.role === "owner" || member.user_id === user?.id) return;
    const buttons: {
      text: string;
      style?: "destructive" | "cancel";
      onPress?: () => void;
    }[] = [];
    if (canManageTribe(tribe.viewer_role) && member.role === "member") {
      buttons.push({
        text: TRIBE_MOD_PROMOTE_MOD,
        onPress: () => {
          void api.tribes
            .updateTribeMemberRole(slug, city, member.user_id, { role: "moderator" })
            .then(() => loadAll());
        },
      });
    }
    if (canManageTribe(tribe.viewer_role) && member.role === "moderator") {
      buttons.push({
        text: TRIBE_MOD_DEMOTE_MOD,
        onPress: () => {
          void api.tribes
            .updateTribeMemberRole(slug, city, member.user_id, { role: "member" })
            .then(() => loadAll());
        },
      });
    }
    buttons.push({
      text: TRIBE_MOD_EXCLUDE_MEMBER,
      style: "destructive",
      onPress: () => {
        void api.tribes.removeTribeMember(slug, city, member.user_id).then(() => loadAll());
      },
    });
    buttons.push({ text: "Annuler", style: "cancel" });
    Alert.alert("Membre", undefined, buttons);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={feedTheme.accent} />
      </View>
    );
  }

  if (error || !tribe || !slug) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error ?? TRIBE_NOT_FOUND}</Text>
        <Pressable style={styles.primaryBtn} onPress={() => void loadAll()}>
          <Text style={styles.primaryBtnText}>{TRIBES_RETRY}</Text>
        </Pressable>
      </View>
    );
  }

  const showPrivateGate =
    tribe.visibility === "private_invite" && !tribe.viewer_is_member && !tribe.is_archived;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
      }
    >
      {tribe.cover_image_url ? (
        <Image source={{ uri: tribe.cover_image_url }} style={styles.heroImage} />
      ) : null}
      <Text style={styles.city}>
        {tribe.city} · {tribeCategoryLabel(tribe.category)} ·{" "}
        {tribeVisibilityLabel(tribe.visibility)}
      </Text>
      <Text style={styles.title}>{tribe.name}</Text>
      <Text style={styles.memberCount}>
        {TRIBE_MEMBER_COUNT(tribe.active_member_count, tribe.member_limit)}
      </Text>
      <Text style={styles.description}>{tribe.description}</Text>

      {tribe.is_archived ? (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>{TRIBE_ARCHIVED_TITLE}</Text>
          <Text style={styles.noticeBody}>{TRIBE_ARCHIVED_BODY}</Text>
        </View>
      ) : null}

      {!tribe.is_archived && !showPrivateGate ? (
        <View style={styles.actions}>
          {tribe.viewer_is_member ? (
            <Pressable
              style={styles.secondaryBtn}
              disabled={actionBusy}
              onPress={handleLeave}
            >
              <Text style={styles.secondaryBtnText}>{TRIBE_LEAVE_CTA}</Text>
            </Pressable>
          ) : tribe.visibility === "public" ? (
            <Pressable
              style={[styles.primaryBtn, actionBusy && styles.btnDisabled]}
              disabled={actionBusy}
              onPress={handleJoin}
            >
              <Text style={styles.primaryBtnText}>{TRIBE_JOIN_CTA}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {showPrivateGate ? (
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>{TRIBE_PRIVATE_TITLE}</Text>
          <Text style={styles.noticeBody}>{TRIBE_PRIVATE_BODY}</Text>
        </View>
      ) : null}

      {!showPrivateGate ? (
        <>
          <Text style={styles.sectionTitle}>{TRIBE_WALL_TITLE}</Text>
          {!tribe.viewer_is_member ? (
            <Text style={styles.empty}>{TRIBE_WALL_MEMBERS_ONLY}</Text>
          ) : (
            <>
              <TribeWallComposer onSubmit={publishPost} />
              {wallLoading ? (
                <ActivityIndicator color={feedTheme.accent} style={styles.wallLoader} />
              ) : null}
              {posts.length === 0 && !wallLoading ? (
                <Text style={styles.empty}>{TRIBE_WALL_EMPTY}</Text>
              ) : (
                posts.map((post) => {
                  const canDelete =
                    post.author.id === user?.id || canModerateTribe(tribe.viewer_role);
                  return (
                    <TribePostCard
                      key={post.id}
                      post={post}
                      onModeratePress={canDelete ? () => confirmDeletePost(post) : undefined}
                    />
                  );
                })
              )}
            </>
          )}

          {tribe.viewer_is_member ? (
            <>
              <Text style={styles.sectionTitle}>{TRIBE_MEMBERS_TITLE}</Text>
              {members.length === 0 ? (
                <Text style={styles.empty}>Aucun membre affiché.</Text>
              ) : (
                members.map((member) => (
                  <Pressable
                    key={member.user_id}
                    style={styles.memberRow}
                    onLongPress={() => confirmMemberAction(member)}
                    delayLongPress={400}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(TRIBE_ROLE_LABELS[member.role] ?? "M")[0]}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.memberName}>
                        {memberDisplayName(member, user?.id)}
                      </Text>
                      <Text style={styles.memberRole}>
                        {TRIBE_ROLE_LABELS[member.role] ?? member.role}
                      </Text>
                    </View>
                  </Pressable>
                ))
              )}
            </>
          ) : null}
        </>
      ) : null}

      <Pressable style={styles.backLink} onPress={() => router.back()}>
        <Text style={styles.backLinkText}>Retour</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: feedTheme.bg },
  content: { padding: 16, paddingBottom: 48, gap: 8 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  heroImage: { width: "100%", height: 160, borderRadius: 12, marginBottom: 8 },
  city: { fontSize: 13, color: feedTheme.textMuted },
  title: { fontSize: 26, fontWeight: "700", color: feedTheme.text },
  memberCount: { fontSize: 12, color: feedTheme.textMuted, marginTop: 4 },
  description: { fontSize: 15, lineHeight: 22, color: feedTheme.text, marginVertical: 12 },
  actions: { marginVertical: 8 },
  primaryBtn: {
    alignSelf: "flex-start",
    backgroundColor: feedTheme.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  primaryBtnText: { color: "#fff", fontWeight: "600" },
  secondaryBtn: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: feedTheme.border,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
  },
  secondaryBtnText: { color: feedTheme.text, fontWeight: "600" },
  btnDisabled: { opacity: 0.6 },
  notice: {
    marginVertical: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: feedTheme.border,
    backgroundColor: feedTheme.bgElevated,
  },
  noticeTitle: { fontSize: 15, fontWeight: "600", color: feedTheme.text },
  noticeBody: { fontSize: 14, color: feedTheme.textMuted, marginTop: 6, lineHeight: 20 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: feedTheme.text,
    marginTop: 20,
    marginBottom: 8,
  },
  empty: { fontSize: 14, color: feedTheme.textMuted, marginBottom: 8 },
  composer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: feedTheme.border,
    backgroundColor: feedTheme.bgElevated,
    padding: 12,
    marginBottom: 12,
  },
  composerInput: {
    minHeight: 72,
    fontSize: 15,
    color: feedTheme.text,
    textAlignVertical: "top",
  },
  postCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: feedTheme.border,
    backgroundColor: feedTheme.bgElevated,
    padding: 12,
    marginBottom: 10,
  },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  postHeaderText: { flex: 1 },
  postAuthor: { fontSize: 14, fontWeight: "600", color: feedTheme.text },
  postDate: { fontSize: 12, color: feedTheme.textMuted },
  postBody: { fontSize: 15, lineHeight: 22, color: feedTheme.text },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: feedTheme.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontWeight: "700", color: feedTheme.accent, fontSize: 14 },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: feedTheme.border,
  },
  memberName: { fontSize: 15, fontWeight: "600", color: feedTheme.text },
  memberRole: { fontSize: 13, color: feedTheme.textMuted },
  wallLoader: { marginVertical: 12 },
  error: { color: feedTheme.textMuted, marginBottom: 12, textAlign: "center" },
  backLink: { marginTop: 24 },
  backLinkText: { color: feedTheme.accent, fontWeight: "600" },
});
