"use client";

import type { SearchGroupKey, SearchGroups, SearchResponse, SearchTypeFilter } from "@yunicity/types";
import { emptySearchGroups, isSearchQueryReady } from "@yunicity/utils";
import { useCallback, useEffect, useRef, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

const DEBOUNCE_MS = 300;
const ALL_MODE_LIMIT = 8;
const SINGLE_MODE_LIMIT = 20;

function mergeGroupItems(
  previous: SearchGroups,
  next: SearchGroups,
  key: SearchGroupKey,
  append: boolean,
): SearchGroups {
  if (!append) return next;
  const prevItems = previous[key].items;
  const nextItems = next[key].items;
  const seen = new Set(prevItems.map((item) => item.id));
  const merged = [...prevItems];
  for (const item of nextItems) {
    if (!seen.has(item.id)) merged.push(item);
  }
  return {
    ...next,
    [key]: {
      ...next[key],
      items: merged,
    },
  };
}

export function useSearch(defaultCity: string) {
  const api = useYunicityApi();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<SearchTypeFilter>("all");
  const [city, setCity] = useState(defaultCity);
  const [groups, setGroups] = useState<SearchGroups>(emptySearchGroups());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    setCity(defaultCity);
  }, [defaultCity]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const runSearch = useCallback(
    async (options?: { page?: number; append?: boolean; type?: SearchTypeFilter }) => {
      const q = debouncedQuery;
      if (!isSearchQueryReady(q)) {
        setGroups(emptySearchGroups());
        setHasMore(false);
        setError(null);
        setHasSearched(false);
        return;
      }

      const activeType = options?.type ?? typeFilter;
      const activePage = options?.page ?? page;
      const append = options?.append ?? false;
      const limit = activeType === "all" ? ALL_MODE_LIMIT : SINGLE_MODE_LIMIT;

      const id = ++requestId.current;
      setLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const response: SearchResponse = await api.searchLocal({
          q,
          city,
          type: activeType,
          page: activePage,
          limit,
        });
        if (id !== requestId.current) return;

        setGroups((prev) => {
          if (activeType === "all" || !append) return response.groups;
          const keyMap: Record<SearchTypeFilter, SearchGroupKey> = {
            all: "events",
            post: "posts",
            event: "events",
            organization: "organizations",
            offer: "offers",
            tribe: "tribes",
            user: "users",
            neighborhood: "neighborhoods",
          };
          return mergeGroupItems(prev, response.groups, keyMap[activeType], true);
        });
        setHasMore(response.has_more);
        setPage(activePage);
      } catch {
        if (id !== requestId.current) return;
        setError("search_failed");
        if (!append) setGroups(emptySearchGroups());
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [api, city, debouncedQuery, page, typeFilter],
  );

  useEffect(() => {
    setPage(1);
    void runSearch({ page: 1, append: false });
  }, [debouncedQuery, typeFilter, city]);

  const loadMoreForGroup = useCallback(
    (groupKey: SearchGroupKey) => {
      const typeMap: Record<SearchGroupKey, SearchTypeFilter> = {
        events: "event",
        organizations: "organization",
        posts: "post",
        offers: "offer",
        tribes: "tribe",
        users: "user",
        neighborhoods: "neighborhood",
      };
      const nextType = typeMap[groupKey];
      const nextPage = typeFilter === nextType ? page + 1 : 2;
      setTypeFilter(nextType);
      setPage(nextPage);
      void runSearch({ page: nextPage, append: true, type: nextType });
    },
    [page, runSearch, typeFilter],
  );

  const retry = useCallback(() => {
    void runSearch({ page, append: false });
  }, [page, runSearch]);

  return {
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    city,
    setCity,
    groups,
    loading,
    error,
    hasSearched,
    hasMore,
    loadMoreForGroup,
    retry,
    isQueryReady: isSearchQueryReady(debouncedQuery),
  };
}
