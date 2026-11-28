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
  filterVideosPortalItemsBySearch,
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
  // VIDEO-03 — par defaut on rend le classement territorial du serveur.
  // « Les plus recents » reste disponible, mais comme choix explicite.
  const [sort, setSort] = useState<VideosPortalSortId>("relevance");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(VIDEOS_PORTAL_PAGE_SIZE);

  const playableItems = useMemo(
    () => items.filter(isLocalVideoFeedItemPlayable),
    [items],
  );

  const neighborhoods = useMemo(
    () => listVideoPortalNeighborhoods(playableItems),
    [playableItems],
  );

  /** Fil + filtres + vue, sans la recherche overlay mobile (R1–R4). */
  const feedItems = useMemo(
    () =>
      sortVideosPortalItems(
        filterVideosPortalItems(playableItems, sidebarFilters, tab, user?.id),
        sort,
        tab,
      ),
    [playableItems, sidebarFilters, sort, tab, user?.id],
  );

  /** Catalogue medium/desktop : conserve la recherche textuelle sur le fil filtré. */
  const filteredItems = useMemo(
    () => filterVideosPortalItemsBySearch(feedItems, searchQuery),
    [feedItems, searchQuery],
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
    searchQuery,
    neighborhoods,
    featuredItems,
    /** Fil immersif mobile : vue + filtres, sans recherche overlay. */
    feedItems,
    visibleItems,
    filteredItems,
    creators,
    playableCount: playableItems.length,
    hasMore: visibleCount < filteredItems.length,
    loadMore: () => setVisibleCount((count) => count + VIDEOS_PORTAL_PAGE_SIZE),
    resetSidebarFilters,
    updateSidebarFilter,
    setTab: changeTab,
    setSort: changeSort,
    setSearchQuery,
  };
}
