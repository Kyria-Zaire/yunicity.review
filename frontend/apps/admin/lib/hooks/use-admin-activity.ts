"use client";

import type {
  AdminActivityFeed,
  AdminActivityFilterCategory,
  AdminActivitySummary,
} from "@yunicity/types";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-provider";

export function useAdminActivity(initialCategory: AdminActivityFilterCategory = "all") {
  const { adminActivityApi } = useAuth();
  const [summary, setSummary] = useState<AdminActivitySummary | null>(null);
  const [feed, setFeed] = useState<AdminActivityFeed | null>(null);
  const [category, setCategory] = useState<AdminActivityFilterCategory>(initialCategory);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reloadSummary = useCallback(async () => {
    setIsLoadingSummary(true);
    setError(null);
    try {
      const data = await adminActivityApi.getActivitySummary();
      setSummary(data);
    } catch (err) {
      setSummary(null);
      setError(
        err instanceof Error ? err.message : "Impossible de charger le résumé d'activité.",
      );
    } finally {
      setIsLoadingSummary(false);
    }
  }, [adminActivityApi]);

  const reloadFeed = useCallback(async () => {
    setIsLoadingFeed(true);
    setError(null);
    setCursor(null);
    try {
      const data = await adminActivityApi.getActivityFeed({ category, limit: 25 });
      setFeed(data);
      setCursor(data.next_cursor);
    } catch (err) {
      setFeed(null);
      setError(
        err instanceof Error ? err.message : "Impossible de charger le fil d'activité.",
      );
    } finally {
      setIsLoadingFeed(false);
    }
  }, [adminActivityApi, category]);

  const loadMore = useCallback(async () => {
    if (!cursor || isLoadingMore) {
      return;
    }
    setIsLoadingMore(true);
    try {
      const data = await adminActivityApi.getActivityFeed({
        category,
        limit: 25,
        cursor,
      });
      setFeed((current) =>
        current
          ? {
              ...data,
              items: [...current.items, ...data.items],
            }
          : data,
      );
      setCursor(data.next_cursor);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de charger plus d'activité.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [adminActivityApi, category, cursor, isLoadingMore]);

  const reload = useCallback(async () => {
    await Promise.all([reloadSummary(), reloadFeed()]);
  }, [reloadSummary, reloadFeed]);

  useEffect(() => {
    void reloadSummary();
  }, [reloadSummary]);

  useEffect(() => {
    void reloadFeed();
  }, [reloadFeed]);

  return {
    summary,
    feed,
    category,
    setCategory,
    isLoadingSummary,
    isLoadingFeed,
    isLoadingMore,
    error,
    reload,
    loadMore,
    hasMore: Boolean(cursor),
  };
}
