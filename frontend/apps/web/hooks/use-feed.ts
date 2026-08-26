"use client";

import type { FeedPost } from "@yunicity/types";
import { applyFeedLikeToggle, isAuthError } from "@yunicity/utils";
import { useCallback, useRef, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import {
  INITIAL_FEED_PAGINATION_STATE,
  beginFeedPage,
  finishFeedPage,
  rejectFeedPage,
  resolveFeedPage,
} from "@/lib/feed/feed-pagination-state";

const PAGE_SIZE = 20;

export function useFeed({ scopeKey = "feed" }: { scopeKey?: string } = {}) {
  const api = useYunicityApi();
  const [pagination, setPagination] = useState(INITIAL_FEED_PAGINATION_STATE);
  const appendInFlightRef = useRef(false);
  const requestGenerationRef = useRef(0);
  const projectionGenerationRef = useRef(0);
  const scopeKeyRef = useRef(scopeKey);

  // Le changement de vue/filtre ne relance pas /feed, mais rend obsolete une
  // reponse en vol construite pour la projection precedente.
  if (scopeKeyRef.current !== scopeKey) {
    scopeKeyRef.current = scopeKey;
    projectionGenerationRef.current += 1;
  }

  const loadPage = useCallback(
    async (cursor: string | null, mode: "initial" | "refresh" | "more") => {
      if (mode === "more" && appendInFlightRef.current) return;
      if (mode === "more") appendInFlightRef.current = true;

      if (mode !== "more") requestGenerationRef.current += 1;
      const requestGeneration = requestGenerationRef.current;
      const projectionGeneration = projectionGenerationRef.current;

      setPagination((current) => beginFeedPage(current, mode));
      try {
        const response = await api.listFeed({ cursor: cursor ?? undefined, limit: PAGE_SIZE });
        if (
          requestGeneration !== requestGenerationRef.current ||
          (mode === "more" && projectionGeneration !== projectionGenerationRef.current)
        ) {
          return;
        }
        setPagination((current) => resolveFeedPage(current, mode, response));
      } catch (err) {
        if (
          requestGeneration !== requestGenerationRef.current ||
          (mode === "more" && projectionGeneration !== projectionGenerationRef.current)
        ) {
          return;
        }
        const message =
          err instanceof Error ? err.message : "Impossible de charger le fil pour le moment.";
        setPagination((current) =>
          rejectFeedPage(current, mode, message, !isAuthError(err)),
        );
      } finally {
        if (mode === "more") appendInFlightRef.current = false;
        if (requestGeneration === requestGenerationRef.current) {
          setPagination((current) => finishFeedPage(current, mode));
        }
      }
    },
    [api],
  );

  const refresh = useCallback(() => loadPage(null, "refresh"), [loadPage]);
  const loadMore = useCallback(async () => {
    if (
      !pagination.nextCursor ||
      pagination.isLoadingMore ||
      pagination.error ||
      appendInFlightRef.current
    ) {
      return;
    }
    await loadPage(pagination.nextCursor, "more");
  }, [loadPage, pagination.error, pagination.isLoadingMore, pagination.nextCursor]);

  const createPost = useCallback(
    async (body: string, mediaUrl?: string | null) => {
      const created = await api.createFeedPost({
        body,
        media_url: mediaUrl?.trim() ? mediaUrl.trim() : null,
      });
      setPagination((current) => ({ ...current, items: [created, ...current.items] }));
      return created;
    },
    [api],
  );

  const loadInitial = useCallback(() => loadPage(null, "initial"), [loadPage]);

  const toggleLike = useCallback(
    async (post: FeedPost) => {
      const nextLiked = !post.liked_by_me;
      setPagination((current) => ({
        ...current,
        items: current.items.map((item) =>
          item.id === post.id ? applyFeedLikeToggle(item, nextLiked) : item,
        ),
      }));
      try {
        if (nextLiked) {
          await api.likeFeedPost(post.id);
        } else {
          await api.unlikeFeedPost(post.id);
        }
      } catch {
        setPagination((current) => ({
          ...current,
          items: current.items.map((item) =>
            item.id === post.id ? applyFeedLikeToggle(item, post.liked_by_me) : item,
          ),
        }));
        throw new Error("Impossible de mettre à jour le like.");
      }
    },
    [api],
  );

  return {
    items: pagination.items,
    nextCursor: pagination.nextCursor,
    hasNextPage: pagination.nextCursor !== null,
    isLoading: pagination.isLoading,
    isRefreshing: pagination.isRefreshing,
    isLoadingMore: pagination.isLoadingMore,
    error: pagination.error,
    appendError: pagination.appendError,
    loadInitial,
    refresh,
    loadMore,
    createPost,
    toggleLike,
  };
}
