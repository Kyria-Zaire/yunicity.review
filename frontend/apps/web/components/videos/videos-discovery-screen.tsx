"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  extractVideoPortalTopics,
  isVideosPortalSidebarDefault,
  VIDEOS_PORTAL_EMPTY,
  VIDEOS_PORTAL_LOAD_MORE,
  VIDEOS_PORTAL_MINE_EMPTY,
  VIDEOS_PORTAL_SUBSCRIPTIONS_EMPTY,
} from "@yunicity/utils";
import { ChevronDown } from "lucide-react";
import { useRef, useState } from "react";

import { VideosFilterSheet } from "@/components/videos/videos-filter-sheet";
import { VideosResponsiveShell } from "@/components/videos/videos-responsive-shell";
import { useVideosPortalContext } from "@/hooks/use-videos-portal-context";

type VideosDiscoveryScreenProps = {
  city: string;
  items: readonly LocalVideoFeedItem[];
  isLoading: boolean;
  error: string | null;
  hasMoreFeed: boolean;
  isLoadingMore: boolean;
  onRetry: () => void;
  onLoadMoreFeed: () => void;
  processingErrors?: Record<string, string | null | undefined>;
  onDismissProcessing?: (videoId: string) => void;
  onToggleLike?: (item: LocalVideoFeedItem) => void;
  onShare?: (item: LocalVideoFeedItem) => void;
  onOpenReport?: (videoId: string) => void;
  onCommentCountDelta?: (videoId: string, delta: number) => void;
};

export function VideosDiscoveryScreen({
  city,
  items,
  isLoading,
  error,
  hasMoreFeed,
  isLoadingMore,
  onRetry,
  onLoadMoreFeed,
  processingErrors,
  onDismissProcessing,
  onToggleLike,
  onShare,
  onOpenReport,
  onCommentCountDelta,
}: VideosDiscoveryScreenProps) {
  const portal = useVideosPortalContext({ items });
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);

  const emptyMessage =
    portal.tab === "mine"
      ? VIDEOS_PORTAL_MINE_EMPTY
      : portal.tab === "subscriptions"
        ? VIDEOS_PORTAL_SUBSCRIPTIONS_EMPTY
        : VIDEOS_PORTAL_EMPTY;

  const loadMore = () => {
    if (portal.hasMore) {
      portal.loadMore();
      return;
    }
    onLoadMoreFeed();
  };

  const handleImmersiveLoadMore = () => {
    loadMore();
  };

  const filterActive = !isVideosPortalSidebarDefault(portal.sidebarFilters);
  const topics = extractVideoPortalTopics(portal.filteredItems, 4);

  const loadMoreButton =
    portal.hasMore || hasMoreFeed ? (
      <button
        type="button"
        onClick={loadMore}
        disabled={isLoadingMore}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-neutral-200/90 bg-white py-3.5 text-sm font-semibold text-yunicity-primary shadow-sm transition hover:border-yunicity-primary/30 hover:bg-yunicity-primary-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {VIDEOS_PORTAL_LOAD_MORE}
        <ChevronDown className="h-4 w-4" aria-hidden />
      </button>
    ) : null;

  return (
    <>
      <VideosResponsiveShell
        city={city}
        tab={portal.tab}
        sort={portal.sort}
        onTabChange={portal.setTab}
        onSortChange={portal.setSort}
        searchQuery={portal.searchQuery}
        onSearchChange={portal.setSearchQuery}
        mobileFilterOpen={mobileFilterOpen}
        onToggleMobileFilter={() => setMobileFilterOpen((open) => !open)}
        sidebarFilters={portal.sidebarFilters}
        neighborhoods={portal.neighborhoods}
        sourceItems={items}
        onResetSidebarFilters={portal.resetSidebarFilters}
        onUpdateSidebarFilter={portal.updateSidebarFilter}
        visibleItems={portal.visibleItems}
        filteredItems={portal.filteredItems}
        featuredItems={portal.featuredItems}
        creators={portal.creators}
        topics={topics}
        onTopicSelect={(type) => portal.updateSidebarFilter("category", type)}
        filterPanelOpen={filterPanelOpen}
        filterActive={filterActive}
        onOpenFilter={() => setFilterPanelOpen(true)}
        filterButtonRef={filterButtonRef}
        isLoading={isLoading}
        error={error}
        emptyMessage={emptyMessage}
        onRetry={onRetry}
        loadMore={loadMoreButton}
        processingErrors={processingErrors}
        onDismissProcessing={onDismissProcessing}
        onToggleLike={onToggleLike}
        onShare={onShare}
        onOpenReport={onOpenReport}
        onCommentCountDelta={onCommentCountDelta}
        onLoadMoreFeed={handleImmersiveLoadMore}
      />

      <VideosFilterSheet
        open={filterPanelOpen}
        onOpenChange={setFilterPanelOpen}
        filters={portal.sidebarFilters}
        neighborhoods={portal.neighborhoods}
        items={items}
        onReset={portal.resetSidebarFilters}
        onChange={portal.updateSidebarFilter}
        returnFocusRef={filterButtonRef}
      />
    </>
  );
}
