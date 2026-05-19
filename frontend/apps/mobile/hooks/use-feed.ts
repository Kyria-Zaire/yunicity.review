import type { FeedPost } from "@yunicity/types";
import { applyFeedLikeToggle, mergeFeedItems } from "@yunicity/utils";
import { useCallback, useState } from "react";

import { useAuth } from "@/lib/auth-provider";

const PAGE_SIZE = 20;

export function useFeed() {
  const { yunicityApi: api } = useAuth();
  const [items, setItems] = useState<FeedPost[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (cursor: string | null, mode: "initial" | "refresh" | "more") => {
      if (mode === "initial") {
        setIsLoading(true);
      } else if (mode === "refresh") {
        setIsRefreshing(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);
      try {
        const response = await api.listFeed({ cursor: cursor ?? undefined, limit: PAGE_SIZE });
        setItems((prev) =>
          mode === "more" ? mergeFeedItems(prev, response.items) : response.items,
        );
        setNextCursor(response.next_cursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Impossible de charger le fil.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    [api],
  );

  const loadInitial = useCallback(() => loadPage(null, "initial"), [loadPage]);
  const refresh = useCallback(() => loadPage(null, "refresh"), [loadPage]);
  const loadMore = useCallback(() => {
    if (!nextCursor || isLoadingMore) {
      return;
    }
    void loadPage(nextCursor, "more");
  }, [isLoadingMore, loadPage, nextCursor]);

  const createPost = useCallback(
    async (body: string, mediaUrl?: string | null) => {
      const created = await api.createFeedPost({
        body,
        media_url: mediaUrl?.trim() ? mediaUrl.trim() : null,
      });
      setItems((prev) => [created, ...prev]);
      return created;
    },
    [api],
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

  return {
    items,
    nextCursor,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    loadInitial,
    refresh,
    loadMore,
    createPost,
    toggleLike,
  };
}
