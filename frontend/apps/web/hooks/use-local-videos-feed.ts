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
  /** Identifiants réellement ajoutés (Lot 8 R-ORD / R-VIDE). */
  newIds?: string[];
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
  /** Erreur de pagination seule — ne vide pas la grille déjà affichée (Lot 7 / D3). */
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const nextCursorRef = useRef<string | null>(null);
  const loadLockRef = useRef(false);

  useEffect(() => {
    nextCursorRef.current = nextCursor;
  }, [nextCursor]);

  const itemsRef = useRef<LocalVideoFeedItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const fetchPage = useCallback(
    async (
      cursor?: string | null,
      append = false,
    ): Promise<LoadMorePagesResult & { ok: boolean; pageIds: string[] }> => {
      if (append) {
        setIsLoadingMore(true);
        setLoadMoreError(false);
      } else {
        setIsLoading(true);
        setError(null);
        setLoadMoreError(false);
      }
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
        const previousIds = new Set(itemsRef.current.map((item) => item.id));
        setItems((prev) => (append ? dedupeById(prev, response.items) : response.items));
        setNextCursor(response.next_cursor);
        nextCursorRef.current = response.next_cursor;
        const pageIds = append
          ? response.items.map((item) => item.id).filter((id) => !previousIds.has(id))
          : response.items.map((item) => item.id);
        if (append) {
          itemsRef.current = dedupeById(itemsRef.current, response.items);
        } else {
          itemsRef.current = response.items;
        }
        return {
          ok: true,
          pagesLoaded: 1,
          hasMore: Boolean(response.next_cursor),
          error: false,
          pageIds,
          newIds: pageIds,
        };
      } catch (err) {
        if (isSessionExpiredAuthError(err)) {
          setSessionExpired(true);
          if (!append) setError(null);
        } else if (append) {
          // Pagination : conserver les items, signaler localement.
          setLoadMoreError(true);
        } else {
          setError("load_failed");
          setItems([]);
        }
        return {
          ok: false,
          pagesLoaded: 0,
          hasMore: Boolean(nextCursorRef.current),
          error: true,
          pageIds: [],
          newIds: [],
        };
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
        return {
          pagesLoaded: 0,
          hasMore: Boolean(nextCursorRef.current),
          error: false,
          newIds: [],
        };
      }
      loadLockRef.current = true;
      let pagesLoaded = 0;
      const newIds: string[] = [];
      try {
        while (pagesLoaded < maxPages && nextCursorRef.current) {
          const result = await fetchPage(nextCursorRef.current, true);
          if (!result.ok) {
            return {
              pagesLoaded,
              hasMore: Boolean(nextCursorRef.current),
              error: true,
              newIds,
            };
          }
          newIds.push(...(result.pageIds ?? []));
          pagesLoaded += 1;
          // R-VIDE : dès qu'une vidéo correspondante est ajoutée, on s'arrête.
          if (result.pageIds.length > 0) break;
        }
        return {
          pagesLoaded,
          hasMore: Boolean(nextCursorRef.current),
          error: false,
          newIds,
        };
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
    loadMoreError,
    sessionExpired,
    refresh: () => fetchPage(null, false),
    loadMore,
    loadMorePages,
    clearLoadMoreError: () => setLoadMoreError(false),
    updateItem,
  };
}
