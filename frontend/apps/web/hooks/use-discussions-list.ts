"use client";

import type { DiscussionCategoryId, DiscussionThread, FeedPost } from "@yunicity/types";
import { DISCUSSIONS_ERROR, applyFeedLikeToggle, mergeDiscussionThreads } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

export function useDiscussionsList(category: DiscussionCategoryId) {
  const api = useYunicityApi();
  const [items, setItems] = useState<DiscussionThread[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(
    async (cursor: string | null, mode: "initial" | "more") => {
      if (mode === "initial") setIsLoading(true);
      else setIsLoadingMore(true);
      setError(null);
      try {
        const response = await api.listDiscussions({
          category,
          cursor: cursor ?? undefined,
        });
        setItems((prev) =>
          mode === "more" ? mergeDiscussionThreads(prev, response.items) : response.items,
        );
        setNextCursor(response.next_cursor);
      } catch (err) {
        setError(err instanceof Error ? err.message : DISCUSSIONS_ERROR);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [api, category],
  );

  useEffect(() => {
    void loadPage(null, "initial");
  }, [loadPage]);

  const toggleLike = useCallback(
    async (post: FeedPost) => {
      const nextLiked = !post.liked_by_me;
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== post.id) return item;
          const toggled = applyFeedLikeToggle(item, nextLiked);
          return { ...item, liked_by_me: toggled.liked_by_me, like_count: toggled.like_count };
        }),
      );
      try {
        if (nextLiked) await api.likeFeedPost(post.id);
        else await api.unlikeFeedPost(post.id);
      } catch {
        setItems((prev) =>
          prev.map((item) => {
            if (item.id !== post.id) return item;
            const toggled = applyFeedLikeToggle(item, post.liked_by_me);
            return { ...item, liked_by_me: toggled.liked_by_me, like_count: toggled.like_count };
          }),
        );
        throw new Error("Impossible de mettre à jour le like.");
      }
    },
    [api],
  );

  return {
    items,
    nextCursor,
    isLoading,
    isLoadingMore,
    error,
    loadMore: () => {
      if (nextCursor && !isLoadingMore) void loadPage(nextCursor, "more");
    },
    refresh: () => void loadPage(null, "initial"),
    toggleLike,
  };
}
