"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import type {
  VideoPortalCreator,
  VideosPortalSidebarFilters,
  VideosPortalTabId,
} from "@yunicity/utils";
import {
  LOCAL_VIDEO_ERROR_MESSAGE,
  LOCAL_VIDEO_RETRY_LABEL,
  VIDEOS_MOBILE_RECENT_TITLE,
  VIDEOS_MOBILE_TAB_FOR_YOU,
  VIDEOS_PORTAL_LOADING,
  VIDEOS_TAB_NEW,
  VIDEOS_TAB_TRENDING,
  countVideosPortalActiveFilters,
  isVideosPortalSidebarDefault,
  summarizeVideosPortalActiveFilters,
} from "@yunicity/utils";
import { useCallback, useRef, useState, type ReactNode } from "react";

import { VideosDesktopFeedStream } from "@/components/videos/desktop/videos-desktop-feed-stream";
import {
  VideosMediumDirectStatePanel,
  type VideosMediumDirectState,
} from "@/components/videos/medium/videos-medium-direct-state";
import { VideosMediumVerticalFeed } from "@/components/videos/medium/videos-medium-vertical-feed";
import {
  VideosMobileFeaturedHero,
  VideosMobileGridCard,
  VideosMobileImmersiveFeed,
  VideosMobileSubscriptionsRail,
} from "@/components/videos/mobile";
import { isVideosMobileFeedView } from "@/components/videos/mobile/videos-mobile-feed-top-bar";
import { VideosMobileFiltersSheet } from "@/components/videos/mobile/videos-mobile-filters-sheet";
import { VideosMobileImmersiveState } from "@/components/videos/mobile/videos-mobile-immersive-state";
import { VideosMobileSearchDialog } from "@/components/videos/mobile/videos-mobile-search-dialog";
import { useVideosViewportTier } from "@/hooks/use-videos-viewport-tier";

export type VideosEditorialStreamRegionProps = {
  tab: VideosPortalTabId;
  isLoading: boolean;
  error: string | null;
  emptyMessage: string;
  visibleItems: readonly LocalVideoFeedItem[];
  /** Fil immersif mobile : vue + filtres, sans recherche overlay. */
  immersiveItems?: readonly LocalVideoFeedItem[];
  /** `?video=` — medium place la cible en tête ; mobile détail géré ailleurs. */
  deepLinkVideoId?: string | null;
  /** Medium : ouverture directe bloquante (chargement, F4, C7) — remplace le fil. */
  mediumDirectState?: VideosMediumDirectState | null;
  featuredItems: readonly LocalVideoFeedItem[];
  creators: readonly VideoPortalCreator[];
  onRetry: () => void;
  loadMore: ReactNode;
  className?: string;
  processingErrors?: Record<string, string | null | undefined>;
  onDismissProcessing?: (videoId: string) => void;
  onToggleLike?: (item: LocalVideoFeedItem) => void;
  onShare?: (item: LocalVideoFeedItem) => void;
  onOpenReport?: (videoId: string) => void;
  onCommentCountDelta?: (videoId: string, delta: number) => void;
  onLoadMoreFeed?: () => void;
  onTabChange?: (tab: VideosPortalTabId) => void;
  sidebarFilters?: VideosPortalSidebarFilters;
  neighborhoods?: string[];
  sourceItems?: readonly LocalVideoFeedItem[];
  onResetSidebarFilters?: () => void;
  onUpdateSidebarFilter?: <K extends keyof VideosPortalSidebarFilters>(
    key: K,
    value: VideosPortalSidebarFilters[K],
  ) => void;
  hasMoreFeed?: boolean;
  isLoadingMore?: boolean;
  onLoadMorePages?: () => Promise<void> | void;
  /** Erreur locale « Charger plus » (desktop C1) — grille conservée. */
  loadMoreError?: boolean;
  onRetryLoadMore?: () => void;
};

function viewLabelForTab(tab: VideosPortalTabId): string {
  if (tab === "trending") return VIDEOS_TAB_TRENDING;
  if (tab === "new") return VIDEOS_TAB_NEW;
  return VIDEOS_MOBILE_TAB_FOR_YOU;
}

/** États + flux vidéo partagé mobile / medium / desktop (C3-VIDEOS-RESPONSIVE-SHELL). */
export function VideosEditorialStreamRegion({
  tab,
  isLoading,
  error,
  emptyMessage,
  visibleItems,
  immersiveItems,
  deepLinkVideoId = null,
  mediumDirectState = null,
  featuredItems,
  creators,
  onRetry,
  loadMore,
  className = "videos-stream-region",
  processingErrors = {},
  onDismissProcessing,
  onToggleLike,
  onShare,
  onOpenReport,
  onCommentCountDelta,
  onLoadMoreFeed,
  onTabChange,
  sidebarFilters,
  neighborhoods = [],
  sourceItems = [],
  onResetSidebarFilters,
  onUpdateSidebarFilter,
  hasMoreFeed = false,
  isLoadingMore = false,
  onLoadMorePages,
  loadMoreError = false,
  onRetryLoadMore,
}: VideosEditorialStreamRegionProps) {
  const viewportTier = useVideosViewportTier();
  const feedForImmersive = immersiveItems ?? visibleItems;
  // D-Q1 (14/11) : sur mobile, Pour vous, Tendances et Nouveautés vivent dans le fil
  // immersif, avec leurs états ; l'ancien catalogue mobile n'est plus affiché.
  const immersive =
    viewportTier === "mobile" && isVideosMobileFeedView(tab) && onToggleLike && onShare && onOpenReport && onCommentCountDelta
      ? { onToggleLike, onShare, onOpenReport, onCommentCountDelta }
      : null;
  // L5 : medium = fil vertical (pas le catalogue cartes). Desktop inchangé.
  const mediumFeed =
    viewportTier === "medium" && onToggleLike && onShare && onOpenReport && onCommentCountDelta
      ? { onToggleLike, onShare, onOpenReport, onCommentCountDelta }
      : null;
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [focusVideoId, setFocusVideoId] = useState<string | null>(null);
  const [searchLoadError, setSearchLoadError] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  const filtersActive = sidebarFilters ? !isVideosPortalSidebarDefault(sidebarFilters) : false;
  const activeFilterCount = sidebarFilters ? countVideosPortalActiveFilters(sidebarFilters) : 0;
  const viewLabel = viewLabelForTab(tab);

  const openFilters = useCallback(() => setFiltersOpen(true), []);
  const openSearch = useCallback(() => setSearchOpen(true), []);

  const topFilters =
    sidebarFilters && onUpdateSidebarFilter && onResetSidebarFilters
      ? {
          activeCount: activeFilterCount,
          open: filtersOpen,
          onOpen: openFilters,
          buttonRef: filterButtonRef,
        }
      : undefined;
  const topSearch = {
    open: searchOpen,
    onOpen: openSearch,
    buttonRef: searchButtonRef,
  };

  const handleSearchMore = useCallback(async () => {
    if (!onLoadMorePages) return;
    setSearchLoadError(false);
    try {
      await onLoadMorePages();
    } catch {
      setSearchLoadError(true);
    }
  }, [onLoadMorePages]);

  if (mediumFeed) {
    // VIDEO-MEDIUM-DIRECT-STATES-01 — état bloquant : fil (et lecture automatique) non monté.
    if (mediumDirectState) {
      return (
        <div className={className} data-videos-medium-region="direct-state">
          <VideosMediumDirectStatePanel state={mediumDirectState} />
        </div>
      );
    }

    const mediumItems = immersiveItems ?? visibleItems;
    const emptyKind = (() => {
      if (isLoading) return "loading" as const;
      if (error) return "error" as const;
      if (mediumItems.length > 0) return null;
      return "empty" as const;
    })();

    return (
      <div className={className} data-videos-medium-region="vertical-feed">
        {emptyKind === "loading" ? (
          <p className="text-sm text-neutral-500" role="status">
            {VIDEOS_PORTAL_LOADING}
          </p>
        ) : null}
        {emptyKind === "error" ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center">
            <p className="text-sm text-red-800">{LOCAL_VIDEO_ERROR_MESSAGE}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 text-sm font-semibold text-yunicity-primary hover:underline"
            >
              {LOCAL_VIDEO_RETRY_LABEL}
            </button>
          </div>
        ) : null}
        {emptyKind === "empty" ? (
          <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-10 text-center text-sm text-neutral-600">
            {emptyMessage}
          </p>
        ) : null}
        {!emptyKind ? (
          <VideosMediumVerticalFeed
            items={mediumItems}
            focusVideoId={deepLinkVideoId}
            sharedEntry={Boolean(deepLinkVideoId)}
            processingErrors={processingErrors}
            onDismissProcessing={onDismissProcessing}
            onToggleLike={mediumFeed.onToggleLike}
            onShare={mediumFeed.onShare}
            onOpenReport={mediumFeed.onOpenReport}
            onCommentCountDelta={mediumFeed.onCommentCountDelta}
            onLoadMore={onLoadMoreFeed}
          />
        ) : null}
      </div>
    );
  }

  if (immersive) {
    const emptyKind = (() => {
      if (isLoading) return "loading" as const;
      if (error) return "error" as const;
      if (feedForImmersive.length > 0) return null;
      if (filtersActive && hasMoreFeed) return "criteria-more" as const;
      if (filtersActive) return "criteria" as const;
      return "empty" as const;
    })();

    return (
      <div className={className} data-videos-medium-region="stream">
        {emptyKind ? (
          <VideosMobileImmersiveState
            kind={emptyKind}
            tab={tab}
            onTabChange={onTabChange}
            onRetry={onRetry}
            criteriaSummary={
              sidebarFilters && filtersActive
                ? summarizeVideosPortalActiveFilters(sidebarFilters, sourceItems)
                : undefined
            }
            onResetFilters={onResetSidebarFilters}
            onLoadMoreCriteria={onLoadMorePages ? () => void handleSearchMore() : undefined}
            isLoadingMore={isLoadingMore}
            filters={topFilters}
            search={topSearch}
          />
        ) : (
          <VideosMobileImmersiveFeed
            variant="discovery"
            tab={tab}
            onTabChange={onTabChange}
            items={feedForImmersive}
            focusVideoId={focusVideoId}
            processingErrors={processingErrors}
            onDismissProcessing={onDismissProcessing}
            onToggleLike={immersive.onToggleLike}
            onShare={immersive.onShare}
            onOpenReport={immersive.onOpenReport}
            onCommentCountDelta={immersive.onCommentCountDelta}
            onLoadMore={onLoadMoreFeed}
            externalSuspended={searchOpen || filtersOpen}
            filters={topFilters}
            search={topSearch}
          />
        )}

        {sidebarFilters && onUpdateSidebarFilter && onResetSidebarFilters ? (
          <VideosMobileFiltersSheet
            open={filtersOpen}
            viewLabel={viewLabel}
            filters={sidebarFilters}
            neighborhoods={neighborhoods}
            items={sourceItems}
            resultCount={feedForImmersive.length}
            loadedCount={sourceItems.length}
            onClose={() => setFiltersOpen(false)}
            onReset={onResetSidebarFilters}
            onChange={onUpdateSidebarFilter}
            returnFocusRef={filterButtonRef}
          />
        ) : null}

        <VideosMobileSearchDialog
          open={searchOpen}
          viewLabel={viewLabel}
          items={feedForImmersive}
          activeVideoId={focusVideoId}
          hasMoreFeed={hasMoreFeed}
          isLoadingMore={isLoadingMore}
          loadMoreError={searchLoadError}
          onClose={() => setSearchOpen(false)}
          onSelectVideo={(videoId) => {
            setFocusVideoId(videoId);
            setSearchOpen(false);
          }}
          onSearchMore={() => void handleSearchMore()}
          onClearLoadError={() => setSearchLoadError(false)}
        />
      </div>
    );
  }

  return (
    <div className={className} data-videos-medium-region="stream">
      {/* Catalogue mobile (≤639) — états locaux ; medium a déjà returné plus haut. */}
      <div className="videos-discovery-mobile-only space-y-4">
        {isLoading ? (
          <p className="text-sm text-neutral-500" role="status">
            {VIDEOS_PORTAL_LOADING}
          </p>
        ) : null}

        {!isLoading && error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center">
            <p className="text-sm text-red-800">{LOCAL_VIDEO_ERROR_MESSAGE}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 text-sm font-semibold text-yunicity-primary hover:underline"
            >
              {LOCAL_VIDEO_RETRY_LABEL}
            </button>
          </div>
        ) : null}

        {!isLoading && !error && visibleItems.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-10 text-center text-sm text-neutral-600">
            {emptyMessage}
          </p>
        ) : null}

        {!isLoading && !error && visibleItems.length > 0 ? (
          <>
            <VideosMobileFeaturedHero items={[...featuredItems]} />

            <h2 className="pt-1 text-base font-bold text-neutral-900">{VIDEOS_MOBILE_RECENT_TITLE}</h2>

            <div className="videos-mobile-grid grid grid-cols-2 gap-3">
              {visibleItems.map((item) => (
                <VideosMobileGridCard key={item.id} item={item} />
              ))}
            </div>

            {loadMore}

            <VideosMobileSubscriptionsRail creators={[...creators]} />
          </>
        ) : null}
      </div>

      {/* Desktop ≥1024 — grille mixte C1 (Lot 7) ; lecteurs Lot 8 hors scope. */}
      <div className="videos-medium-desktop-stream space-y-5">
        <VideosDesktopFeedStream
          items={visibleItems}
          isLoading={isLoading}
          error={error}
          emptyMessage={emptyMessage}
          onRetry={onRetry}
          loadMore={loadMore}
          hasMore={hasMoreFeed}
          isLoadingMore={isLoadingMore}
          onLoadMore={onLoadMoreFeed}
          loadMoreError={loadMoreError}
          onRetryLoadMore={onRetryLoadMore ?? onLoadMoreFeed}
        />
      </div>
    </div>
  );
}
