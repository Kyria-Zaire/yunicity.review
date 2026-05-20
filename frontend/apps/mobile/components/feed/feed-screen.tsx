import type { FeedComment, FeedPost, FeedReportReason } from "@yunicity/types";
import {
  FEED_COMPOSER_PLACEHOLDER,
  FEED_EMPTY_BODY,
  FEED_EMPTY_TITLE,
  FEED_ERROR_BODY,
  FEED_ERROR_TITLE,
  FEED_LOAD_MORE_LABEL,
  FEED_PASSPORT_BADGE,
  FEED_REPORT_LABEL,
  FEED_REPORT_REASON_LABELS,
  authorInitials,
  formatFeedDate,
  formatOfferValidUntil,
  PARTNER_OFFER_TYPE_LABELS,
} from "@yunicity/utils";
import { Link } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { FlashOfferBadge } from "@/components/flash-offer-badge";
import { NeighborhoodBadgeMobile } from "@/components/neighborhoods/neighborhood-badge";
import { feedTheme } from "@/components/feed/feed-theme";
import { useFeed } from "@/hooks/use-feed";
import { useAuth } from "@/lib/auth-provider";

const REPORT_REASONS: FeedReportReason[] = ["spam", "inappropriate", "other"];

function FeedComposerMobile({ onSubmit }: { onSubmit: (body: string) => Promise<void> }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <View style={styles.composer}>
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder={FEED_COMPOSER_PLACEHOLDER}
        placeholderTextColor={feedTheme.textMuted}
        multiline
        maxLength={4000}
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
        <Text style={styles.primaryBtnText}>{busy ? "Publication…" : "Publier"}</Text>
      </Pressable>
    </View>
  );
}

function FeedCardMobile({
  post,
  onLike,
  onReport,
}: {
  post: FeedPost;
  onLike: () => void;
  onReport: (reason: FeedReportReason) => void;
}) {
  const { yunicityApi: api, user } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [commentBody, setCommentBody] = useState("");
  const isOffer = post.type === "offer";
  const offerTypeLabel =
    post.offer?.offer_type && post.offer.offer_type in PARTNER_OFFER_TYPE_LABELS
      ? PARTNER_OFFER_TYPE_LABELS[post.offer.offer_type as keyof typeof PARTNER_OFFER_TYPE_LABELS]
      : "Avantage";

  const loadComments = useCallback(async () => {
    const response = await api.listFeedComments(post.id, { limit: 50 });
    setComments(response.items);
  }, [api, post.id]);

  return (
    <View style={[styles.card, isOffer && styles.cardOffer]}>
      {isOffer ? (
        <View style={styles.offerBadges}>
          <FlashOfferBadge offer={post.offer} />
          <Text style={styles.passportBadge}>{FEED_PASSPORT_BADGE}</Text>
          <Text style={styles.meta}>{offerTypeLabel}</Text>
          {!post.offer?.is_flash && formatOfferValidUntil(post.offer?.valid_until) ? (
            <Text style={styles.meta}>{formatOfferValidUntil(post.offer?.valid_until)}</Text>
          ) : null}
        </View>
      ) : null}
      <View style={styles.authorRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{authorInitials(post.author.display_name)}</Text>
        </View>
        <View style={styles.authorMeta}>
          <Text style={styles.authorName}>{post.author.display_name}</Text>
          <Text style={styles.meta}>
            {post.city ? `${post.city} · ` : ""}
            {formatFeedDate(post.created_at)}
          </Text>
          {post.neighborhood_summary ? (
            <NeighborhoodBadgeMobile summary={post.neighborhood_summary} city={post.city} />
          ) : null}
        </View>
      </View>
      {post.title ? <Text style={styles.title}>{post.title}</Text> : null}
      {post.body ? <Text style={styles.body}>{post.body}</Text> : null}
      {post.media_url ? (
        <Image source={{ uri: post.media_url }} style={styles.media} resizeMode="cover" />
      ) : null}
      {isOffer ? (
        <Link href="/(protected)/(tabs)/passport" asChild>
          <Pressable>
            <Text style={styles.link}>Voir dans mon Passport</Text>
          </Pressable>
        </Link>
      ) : null}
      <View style={styles.actions}>
        <Pressable onPress={onLike} style={styles.actionBtn} accessibilityRole="button">
          <Text style={[styles.actionText, post.liked_by_me && styles.actionActive]}>
            {post.liked_by_me ? "Aimé" : "J’aime"}
            {post.like_count > 0 ? ` · ${post.like_count}` : ""}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            const next = !commentsOpen;
            setCommentsOpen(next);
            if (next) void loadComments();
          }}
          style={styles.actionBtn}
        >
          <Text style={styles.actionText}>
            Commentaires{post.comment_count > 0 ? ` · ${post.comment_count}` : ""}
          </Text>
        </Pressable>
        <Pressable onPress={() => setReportOpen((v) => !v)} style={styles.actionBtn}>
          <Text style={styles.actionMuted}>{FEED_REPORT_LABEL}</Text>
        </Pressable>
      </View>
      {reportOpen ? (
        <View style={styles.reportMenu}>
          {REPORT_REASONS.map((reason) => (
            <Pressable
              key={reason}
              onPress={() => {
                onReport(reason);
                setReportOpen(false);
              }}
              style={styles.reportItem}
            >
              <Text style={styles.reportItemText}>{FEED_REPORT_REASON_LABELS[reason]}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {commentsOpen ? (
        <View style={styles.comments}>
          {comments.map((c) => (
            <View key={c.id} style={styles.comment}>
              <Text style={styles.commentAuthor}>{c.author_display_name}</Text>
              <Text style={styles.commentBody}>{c.body}</Text>
              {user?.id === c.user_id ? (
                <Pressable onPress={() => void api.deleteFeedComment(c.id).then(loadComments)}>
                  <Text style={styles.actionMuted}>Supprimer</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
          <View style={styles.commentRow}>
            <TextInput
              value={commentBody}
              onChangeText={setCommentBody}
              placeholder="Commentaire…"
              style={styles.commentInput}
              maxLength={500}
            />
            <Pressable
              onPress={() => {
                const trimmed = commentBody.trim();
                if (!trimmed) return;
                void api.createFeedComment(post.id, { body: trimmed }).then(() => {
                  setCommentBody("");
                  return loadComments();
                });
              }}
            >
              <Text style={styles.link}>Envoyer</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function FeedScreen() {
  const { yunicityApi: api } = useAuth();
  const feed = useFeed();
  const [reportToast, setReportToast] = useState<string | null>(null);

  const { loadInitial, refresh, loadMore, items, isLoading, isRefreshing, isLoadingMore, error, nextCursor, createPost, toggleLike } =
    feed;

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const header = (
    <View style={styles.headerBlock}>
      <Text style={styles.screenTitle}>Fil local</Text>
      <Text style={styles.screenSubtitle}>Vie et avantages près de chez vous</Text>
      <FeedComposerMobile
        onSubmit={async (body) => {
          await createPost(body);
        }}
      />
      {reportToast ? <Text style={styles.toast}>{reportToast}</Text> : null}
    </View>
  );

  if (isLoading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={feedTheme.accent} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={items}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => void refresh()} tintColor={feedTheme.accent} />
      }
      ListEmptyComponent={
        !error ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{FEED_EMPTY_TITLE}</Text>
            <Text style={styles.emptyBody}>{FEED_EMPTY_BODY}</Text>
          </View>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{FEED_ERROR_TITLE}</Text>
            <Text style={styles.emptyBody}>{FEED_ERROR_BODY}</Text>
            <Pressable style={styles.primaryBtn} onPress={() => void refresh()}>
              <Text style={styles.primaryBtnText}>Réessayer</Text>
            </Pressable>
          </View>
        )
      }
      renderItem={({ item }) => (
        <FeedCardMobile
          post={item}
          onLike={() => void toggleLike(item)}
          onReport={(reason) =>
            void api.reportFeedPost(item.id, { reason }).then(() => {
              setReportToast("Signalement envoyé.");
              setTimeout(() => setReportToast(null), 3000);
            })
          }
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListFooterComponent={
        nextCursor ? (
          <Pressable
            style={[styles.loadMore, isLoadingMore && styles.btnDisabled]}
            disabled={isLoadingMore}
            onPress={() => void loadMore()}
          >
            <Text style={styles.loadMoreText}>
              {isLoadingMore ? "Chargement…" : FEED_LOAD_MORE_LABEL}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.footerPad} />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: feedTheme.bg },
  listContent: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: feedTheme.bg },
  headerBlock: { marginBottom: 16, gap: 8 },
  screenTitle: { fontSize: 26, fontWeight: "700", color: feedTheme.text },
  screenSubtitle: { fontSize: 14, color: feedTheme.textMuted, marginBottom: 8 },
  composer: {
    backgroundColor: feedTheme.bgElevated,
    borderRadius: feedTheme.radiusSm,
    borderWidth: 1,
    borderColor: feedTheme.border,
    padding: 12,
    gap: 10,
  },
  composerInput: {
    minHeight: 72,
    fontSize: 15,
    color: feedTheme.text,
    textAlignVertical: "top",
  },
  primaryBtn: {
    backgroundColor: feedTheme.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnText: { color: feedTheme.bg, fontWeight: "700", fontSize: 15 },
  btnDisabled: { opacity: 0.5 },
  card: {
    backgroundColor: feedTheme.bg,
    borderRadius: feedTheme.radiusSm,
    borderWidth: 1,
    borderColor: feedTheme.border,
    padding: 16,
    gap: 10,
  },
  cardOffer: { backgroundColor: feedTheme.bgElevated },
  offerBadges: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  passportBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: feedTheme.accent,
    backgroundColor: feedTheme.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
  },
  authorRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: feedTheme.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: feedTheme.accent, fontWeight: "700", fontSize: 13 },
  authorMeta: { flex: 1 },
  authorName: { fontSize: 15, fontWeight: "600", color: feedTheme.text },
  meta: { fontSize: 12, color: feedTheme.textMuted },
  title: { fontSize: 17, fontWeight: "700", color: feedTheme.text },
  body: { fontSize: 15, lineHeight: 22, color: feedTheme.text },
  media: { width: "100%", height: 200, borderRadius: 12 },
  link: { fontSize: 14, fontWeight: "600", color: feedTheme.accent },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 4 },
  actionBtn: { minHeight: 44, justifyContent: "center" },
  actionText: { fontSize: 14, color: feedTheme.textMuted },
  actionActive: { color: feedTheme.accent, fontWeight: "600" },
  actionMuted: { fontSize: 13, color: feedTheme.textMuted },
  reportMenu: {
    borderWidth: 1,
    borderColor: feedTheme.border,
    borderRadius: 10,
    overflow: "hidden",
  },
  reportItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: feedTheme.border },
  reportItemText: { fontSize: 14, color: feedTheme.text },
  comments: { gap: 8, marginTop: 4 },
  comment: {
    backgroundColor: feedTheme.bgElevated,
    padding: 10,
    borderRadius: 10,
  },
  commentAuthor: { fontSize: 13, fontWeight: "600", color: feedTheme.text },
  commentBody: { fontSize: 14, color: feedTheme.text, marginTop: 2 },
  commentRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: feedTheme.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 44,
  },
  separator: { height: 16 },
  empty: { padding: 24, alignItems: "center", gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: feedTheme.text, textAlign: "center" },
  emptyBody: { fontSize: 14, color: feedTheme.textMuted, textAlign: "center", lineHeight: 20 },
  loadMore: {
    marginTop: 8,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: feedTheme.border,
    alignItems: "center",
  },
  loadMoreText: { fontSize: 14, fontWeight: "600", color: feedTheme.text },
  footerPad: { height: 24 },
  toast: {
    fontSize: 13,
    color: feedTheme.accent,
    backgroundColor: feedTheme.accentSoft,
    padding: 10,
    borderRadius: 10,
  },
});
