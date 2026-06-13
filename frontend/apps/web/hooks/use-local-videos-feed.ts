"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  isSessionExpiredAuthError,
} from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useGeo } from "@/providers/geo-provider";

const DEFAULT_CITY = "Reims";
const PAGE_SIZE = 12;

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

  const fetchPage = useCallback(
    async (cursor?: string | null, append = false) => {
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
        setItems((prev) => (append ? [...prev, ...response.items] : response.items));
        setNextCursor(response.next_cursor);
      } catch (err) {
        if (isSessionExpiredAuthError(err)) {
          setSessionExpired(true);
          setError(null);
        } else {
          setError("load_failed");
        }
        if (!append) setItems([]);
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

  return {
    items,
    city,
    nextCursor,
    isLoading,
    isLoadingMore,
    error,
    sessionExpired,
    refresh: () => fetchPage(null, false),
    loadMore: () => {
      if (nextCursor) void fetchPage(nextCursor, true);
    },
    updateItem,
  };
}
