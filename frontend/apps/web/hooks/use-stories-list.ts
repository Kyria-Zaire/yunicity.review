"use client";

import type { StoryCategoryId, StoryItem, StoryTabId } from "@yunicity/types";
import { mergeStoryItems } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

export function useStoriesList(tab: StoryTabId, category: StoryCategoryId) {
  const api = useYunicityApi();
  const [items, setItems] = useState<StoryItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (cursor?: string | null, append = false) => {
      if (append) setIsLoadingMore(true);
      else setIsLoading(true);
      setError(null);
      try {
        const response = await api.listStories({
          tab,
          category,
          cursor: cursor ?? undefined,
        });
        setItems((prev) => (append ? mergeStoryItems(prev, response.items) : response.items));
        setNextCursor(response.next_cursor);
      } catch {
        setError("load_failed");
        if (!append) setItems([]);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [api, category, tab],
  );

  useEffect(() => {
    void fetchPage(null, false);
  }, [fetchPage]);

  return {
    items,
    nextCursor,
    isLoading,
    isLoadingMore,
    error,
    refresh: () => fetchPage(null, false),
    loadMore: () => {
      if (nextCursor) void fetchPage(nextCursor, true);
    },
  };
}
