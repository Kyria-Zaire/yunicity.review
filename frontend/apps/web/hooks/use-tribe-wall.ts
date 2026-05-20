"use client";

import type { FeedPost, FeedReportReason } from "@yunicity/types";
import { applyFeedLikeToggle, mergeFeedItems, isAuthError } from "@yunicity/utils";
import { useCallback, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

const PAGE_SIZE = 20;

export function useTribeWall(slug: string, city: string, enabled: boolean) {
  const api = useYunicityApi();
  const [items, setItems] = useState<FeedPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (cursor: string | null, mode: "initial" | "more") => {
      if (!enabled) {
        return;
      }
      if (mode === "initial") {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      try {
        const response = await api.tribes.listTribePosts(slug, city, {
          cursor: cursor ?? undefined,
          limit: PAGE_SIZE,
        });
        setItems((prev) =>
          mode === "more" ? mergeFeedItems(prev, response.items) : response.items,
        );
        setNextCursor(response.next_cursor);
      } catch (err) {
        if (!isAuthError(err)) {
          setError(
            err instanceof Error ? err.message : "Impossible de charger le mur pour le moment.",
          );
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [api.tribes, slug, city, enabled],
  );

  const refresh = useCallback(() => loadPage(null, "initial"), [loadPage]);

  const loadMore = useCallback(() => {
    if (!nextCursor || loadingMore) {
      return;
    }
    void loadPage(nextCursor, "more");
  }, [loadPage, loadingMore, nextCursor]);

  const createPost = useCallback(
    async (body: string, mediaUrl?: string | null) => {
      const created = await api.tribes.createTribePost(slug, city, {
        body,
        media_url: mediaUrl?.trim() ? mediaUrl.trim() : null,
      });
      setItems((prev) => [created, ...prev]);
      return created;
    },
    [api.tribes, slug, city],
  );

  const toggleLike = useCallback(
    async (post: FeedPost) => {
      const nextLiked = !post.liked_by_me;
      setItems((prev) =>
        prev.map((item) => (item.id === post.id ? applyFeedLikeToggle(item, nextLiked) : item)),
      );
      try {
        if (nextLiked) {
          await api.likeFeedPost(post.id);
        } else {
          await api.unlikeFeedPost(post.id);
        }
      } catch {
        setItems((prev) =>
          prev.map((item) =>
            item.id === post.id ? applyFeedLikeToggle(item, post.liked_by_me) : item,
          ),
        );
      }
    },
    [api],
  );

  const reportPost = useCallback(
    async (postId: string, reason: FeedReportReason) => {
      await api.reportFeedPost(postId, { reason });
    },
    [api],
  );

  const deletePost = useCallback(
    async (postId: string) => {
      await api.tribes.deleteTribePost(slug, city, postId);
      setItems((prev) => prev.filter((item) => item.id !== postId));
    },
    [api.tribes, slug, city],
  );

  return {
    items,
    loading,
    loadingMore,
    error,
    nextCursor,
    refresh,
    loadMore,
    createPost,
    toggleLike,
    reportPost,
    deletePost,
  };
}
