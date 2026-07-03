"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import type {
  VideosPortalSidebarFilters,
  VideosPortalSortId,
  VideosPortalTabId,
} from "@yunicity/utils";
import {
  DEFAULT_VIDEOS_PORTAL_SIDEBAR_FILTERS,
  VIDEOS_PORTAL_PAGE_SIZE,
  extractVideoPortalCreators,
  filterVideosPortalItems,
  isLocalVideoFeedItemPlayable,
  listVideoPortalNeighborhoods,
  pickFeaturedVideos,
  sortVideosPortalItems,
} from "@yunicity/utils";
import { useMemo, useState } from "react";

import { useAuth } from "@/lib/auth/auth-provider";

type UseVideosPortalContextOptions = {
  items: readonly LocalVideoFeedItem[];
};

export function useVideosPortalContext({ items }: UseVideosPortalContextOptions) {
  const { user } = useAuth();
  const [sidebarFilters, setSidebarFilters] = useState<VideosPortalSidebarFilters>(
    DEFAULT_VIDEOS_PORTAL_SIDEBAR_FILTERS,
  );
  const [tab, setTab] = useState<VideosPortalTabId>("all");
  const [sort, setSort] = useState<VideosPortalSortId>("recent");
  const [visibleCount, setVisibleCount] = useState(VIDEOS_PORTAL_PAGE_SIZE);

  const playableItems = useMemo(
    () => items.filter(isLocalVideoFeedItemPlayable),
    [items],
  );

  const neighborhoods = useMemo(
    () => listVideoPortalNeighborhoods(playableItems),
    [playableItems],
  );

  const filteredItems = useMemo(
    () =>
      sortVideosPortalItems(
        filterVideosPortalItems(playableItems, sidebarFilters, tab, user?.id),
        sort,
        tab,
      ),
    [playableItems, sidebarFilters, sort, tab, user?.id],
  );

  const visibleItems = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount],
  );

  const featuredItems = useMemo(() => pickFeaturedVideos(playableItems, 4), [playableItems]);
  const creators = useMemo(() => extractVideoPortalCreators(playableItems, 8), [playableItems]);

  const resetSidebarFilters = () => {
    setSidebarFilters(DEFAULT_VIDEOS_PORTAL_SIDEBAR_FILTERS);
    setVisibleCount(VIDEOS_PORTAL_PAGE_SIZE);
  };

  const updateSidebarFilter = <K extends keyof VideosPortalSidebarFilters>(
    key: K,
    value: VideosPortalSidebarFilters[K],
  ) => {
    setSidebarFilters((prev) => ({ ...prev, [key]: value }));
    setVisibleCount(VIDEOS_PORTAL_PAGE_SIZE);
  };

  const changeTab = (nextTab: VideosPortalTabId) => {
    setTab(nextTab);
    setVisibleCount(VIDEOS_PORTAL_PAGE_SIZE);
  };

  const changeSort = (nextSort: VideosPortalSortId) => {
    setSort(nextSort);
    setVisibleCount(VIDEOS_PORTAL_PAGE_SIZE);
  };

  return {
    sidebarFilters,
    tab,
    sort,
    neighborhoods,
    featuredItems,
    visibleItems,
    filteredItems,
    creators,
    hasMore: visibleCount < filteredItems.length,
    loadMore: () => setVisibleCount((count) => count + VIDEOS_PORTAL_PAGE_SIZE),
    resetSidebarFilters,
    updateSidebarFilter,
    setTab: changeTab,
    setSort: changeSort,
  };
}
