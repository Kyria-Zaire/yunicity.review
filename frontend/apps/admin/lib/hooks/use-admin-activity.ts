"use client";

import type {
  AdminActivityFeed,
  AdminActivityFilterCategory,
} from "@yunicity/types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { mapAdminError } from "@/lib/admin-query";
import { useAuth } from "@/lib/auth/auth-provider";

const FEED_PAGE_SIZE = 25;

export function useAdminActivity(initialCategory: AdminActivityFilterCategory = "all") {
  const { adminActivityApi } = useAuth();
  const [category, setCategory] = useState<AdminActivityFilterCategory>(initialCategory);

  const summaryQuery = useQuery({
    queryKey: ["admin", "activity", "summary"],
    queryFn: () => adminActivityApi.getActivitySummary(),
  });

  const feedQuery = useInfiniteQuery({
    queryKey: ["admin", "activity", "feed", "list", { category }],
    queryFn: ({ pageParam }) =>
      adminActivityApi.getActivityFeed({
        category,
        limit: FEED_PAGE_SIZE,
        cursor: pageParam ?? undefined,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  });

  const pages = feedQuery.data?.pages ?? [];
  const lastPage = pages[pages.length - 1];
  const feed: AdminActivityFeed | null = lastPage
    ? {
        generated_at: lastPage.generated_at,
        items: pages.flatMap((page) => page.items),
        next_cursor: lastPage.next_cursor,
      }
    : null;

  const summaryRefetch = summaryQuery.refetch;
  const feedRefetch = feedQuery.refetch;
  const reload = useCallback(async () => {
    await Promise.all([summaryRefetch(), feedRefetch()]);
  }, [summaryRefetch, feedRefetch]);

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feedQuery;
  const loadMore = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }
    await fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const error =
    mapAdminError(summaryQuery.error, "Impossible de charger le résumé d'activité.") ??
    mapAdminError(feedQuery.error, "Impossible de charger le fil d'activité.");

  return {
    summary: summaryQuery.data ?? null,
    feed,
    category,
    setCategory,
    isLoadingSummary: summaryQuery.isPending,
    isLoadingFeed: feedQuery.isPending,
    isLoadingMore: isFetchingNextPage,
    error,
    reload,
    loadMore,
    hasMore: Boolean(hasNextPage),
  };
}
