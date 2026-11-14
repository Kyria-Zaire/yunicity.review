"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  VIDEOS_MOBILE_SEARCH_PAGES_PER_PRESS,
  isSessionExpiredAuthError,
} from "@yunicity/utils";
import { useCallback, useEffect, useRef, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useGeo } from "@/providers/geo-provider";

const DEFAULT_CITY = "Reims";
const PAGE_SIZE = 12;

export type LoadMorePagesResult = {
  pagesLoaded: number;
  hasMore: boolean;
  error: boolean;
};

function dedupeById(
  existing: readonly LocalVideoFeedItem[],
  incoming: readonly LocalVideoFeedItem[],
): LocalVideoFeedItem[] {
  const seen = new Set(existing.map((item) => item.id));
  const merged = [...existing];
  for (const item of incoming) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }
  return merged;
}

export function useLocalVideosFeed() {
  const api = useYunicityApi();
  const { currentPosition } = useGeo();
  const [items, setItems] = useState<LocalVideoFeedItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [city, setCity] = useState(DEFAULT_CITY);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const nextCursorRef = useRef<string | null>(null);
  const loadLockRef = useRef(false);

  useEffect(() => {
    nextCursorRef.current = nextCursor;
  }, [nextCursor]);

  const fetchPage = useCallback(
    async (cursor?: string | null, append = false): Promise<LoadMorePagesResult & { ok: boolean }> => {
      if (append) setIsLoadingMore(true);
      else setIsLoading(true);
      setError(null);
      setSessionExpired(false);
      try {
        const response = await api.listLocalVideos({
          city: DEFAULT_CITY,
          cursor: cursor ?? undefined,
          limit: PAGE_SIZE,
          latitude: currentPosition?.latitude,
          longitude: currentPosition?.longitude,
        });
        setCity(response.city);
        setItems((prev) => (append ? dedupeById(prev, response.items) : response.items));
        setNextCursor(response.next_cursor);
        nextCursorRef.current = response.next_cursor;
        return {
          ok: true,
          pagesLoaded: 1,
          hasMore: Boolean(response.next_cursor),
          error: false,
        };
      } catch (err) {
        if (isSessionExpiredAuthError(err)) {
          setSessionExpired(true);
          setError(null);
        } else {
          setError("load_failed");
        }
        if (!append) setItems([]);
        return { ok: false, pagesLoaded: 0, hasMore: Boolean(nextCursorRef.current), error: true };
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [api, currentPosition?.latitude, currentPosition?.longitude],
  );

  useEffect(() => {
    void fetchPage(null, false);
  }, [fetchPage]);

  const updateItem = useCallback(
    (videoId: string, updater: (item: LocalVideoFeedItem) => LocalVideoFeedItem) => {
      setItems((prev) =>
        prev.map((item) => (item.id === videoId ? updater(item) : item)),
      );
    },
    [],
  );

  const loadMore = useCallback(() => {
    if (loadLockRef.current || !nextCursorRef.current) return;
    loadLockRef.current = true;
    void fetchPage(nextCursorRef.current, true).finally(() => {
      loadLockRef.current = false;
    });
  }, [fetchPage]);

  /**
   * Charge au plus `maxPages` pages suivantes (recherche R3 / filtres soft-empty).
   * Une seule demande à la fois ; dédoublonnage par identifiant.
   */
  const loadMorePages = useCallback(
    async (maxPages: number = VIDEOS_MOBILE_SEARCH_PAGES_PER_PRESS): Promise<LoadMorePagesResult> => {
      if (loadLockRef.current) {
        return { pagesLoaded: 0, hasMore: Boolean(nextCursorRef.current), error: false };
      }
      loadLockRef.current = true;
      let pagesLoaded = 0;
      try {
        while (pagesLoaded < maxPages && nextCursorRef.current) {
          const result = await fetchPage(nextCursorRef.current, true);
          if (!result.ok) {
            return { pagesLoaded, hasMore: Boolean(nextCursorRef.current), error: true };
          }
          pagesLoaded += 1;
        }
        return { pagesLoaded, hasMore: Boolean(nextCursorRef.current), error: false };
      } finally {
        loadLockRef.current = false;
      }
    },
    [fetchPage],
  );

  return {
    items,
    city,
    nextCursor,
    isLoading,
    isLoadingMore,
    error,
    sessionExpired,
    refresh: () => fetchPage(null, false),
    loadMore,
    loadMorePages,
    updateItem,
  };
}
