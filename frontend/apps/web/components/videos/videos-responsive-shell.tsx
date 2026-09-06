"use client";

import type { LocalVideoFeedItem, LocalVideoTypeId } from "@yunicity/types";
import type {
  VideoPortalCreator,
  VideoPortalTopic,
  VideosPortalSidebarFilters,
  VideosPortalSortId,
  VideosPortalTabId,
} from "@yunicity/utils";
import {
  formatVideosPortalSubtitle,
  VIDEOS_DESKTOP_FILTER_OPEN,
  VIDEOS_PORTAL_TITLE,
  VIDEOS_TAB_FOR_YOU,
  VIDEOS_TAB_NEARBY,
  VIDEOS_TAB_SUBSCRIPTIONS,
} from "@yunicity/utils";
import { SlidersHorizontal } from "lucide-react";
import type { ReactNode, RefObject } from "react";

import { VideosDesktopLeftRail } from "@/components/videos/desktop/videos-desktop-left-rail";
import { VideosDesktopRightRail } from "@/components/videos/desktop/videos-desktop-right-rail";
import {
  VideosMobileHeader,
  VideosMobileSearch,
  VideosMobileViewPills,
} from "@/components/videos/mobile";
import { VideosMediumHeader } from "@/components/videos/portal/videos-medium-header";
import { VideosEditorialStreamRegion } from "@/components/videos/videos-editorial-stream-region";
import { VideosInternalSidebar } from "@/components/videos/videos-internal-sidebar";
import { VideosPortalToolbar } from "@/components/videos/videos-portal-toolbar";

type VideosResponsiveShellProps = {
  city: string;
  tab: VideosPortalTabId;
  sort: VideosPortalSortId;
  onTabChange: (tab: VideosPortalTabId) => void;
  onSortChange: (sort: VideosPortalSortId) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  mobileFilterOpen: boolean;
  onToggleMobileFilter: () => void;
  sidebarFilters: VideosPortalSidebarFilters;
  neighborhoods: Parameters<typeof VideosInternalSidebar>[0]["neighborhoods"];
  sourceItems: readonly LocalVideoFeedItem[];
  onResetSidebarFilters: () => void;
  onUpdateSidebarFilter: Parameters<typeof VideosInternalSidebar>[0]["onChange"];
  visibleItems: readonly LocalVideoFeedItem[];
  filteredItems: readonly LocalVideoFeedItem[];
  featuredItems: readonly LocalVideoFeedItem[];
  creators: readonly VideoPortalCreator[];
  topics: readonly VideoPortalTopic[];
  onTopicSelect: (type: LocalVideoTypeId) => void;
  filterPanelOpen: boolean;
  filterActive: boolean;
  onOpenFilter: (trigger: HTMLButtonElement) => void;
  filterButtonRef?: RefObject<HTMLButtonElement>;
  isLoading: boolean;
  error: string | null;
  emptyMessage: string;
  onRetry: () => void;
  loadMore: ReactNode;
  processingErrors?: Record<string, string | null | undefined>;
  onDismissProcessing?: (videoId: string) => void;
  onToggleLike?: (item: LocalVideoFeedItem) => void;
  onShare?: (item: LocalVideoFeedItem) => void;
  onOpenReport?: (videoId: string) => void;
  onCommentCountDelta?: (videoId: string, delta: number) => void;
  onLoadMoreFeed?: () => void;
};

const DESKTOP_TABS = [
  { id: "all" as const, label: VIDEOS_TAB_FOR_YOU },
  { id: "nearby" as const, label: VIDEOS_TAB_NEARBY },
  { id: "subscriptions" as const, label: VIDEOS_TAB_SUBSCRIPTIONS },
];

/**
 * Squelette responsive du portail Vidéos — C3-VIDEOS-RESPONSIVE-SHELL.
 *
 * UN seul arbre DOM pour mobile, medium et desktop. Seules les media queries
 * dans `globals.css` décident de l'affichage — aucun matchMedia ici.
 */
export function VideosResponsiveShell({
  city,
  tab,
  sort,
  onTabChange,
  onSortChange,
  searchQuery,
  onSearchChange,
  mobileFilterOpen,
  onToggleMobileFilter,
  sidebarFilters,
  neighborhoods,
  sourceItems,
  onResetSidebarFilters,
  onUpdateSidebarFilter,
  visibleItems,
  filteredItems,
  featuredItems,
  creators,
  topics,
  onTopicSelect,
  filterPanelOpen,
  filterActive,
  onOpenFilter,
  filterButtonRef,
  isLoading,
  error,
  emptyMessage,
  onRetry,
  loadMore,
  processingErrors,
  onDismissProcessing,
  onToggleLike,
  onShare,
  onOpenReport,
  onCommentCountDelta,
  onLoadMoreFeed,
}: VideosResponsiveShellProps) {
  const upNext = filteredItems
    .filter((item) => !visibleItems.some((visible) => visible.id === item.id))
    .slice(0, 4);

  return (
    <div className="videos-shell videos-desktop-layout">
      <VideosDesktopLeftRail city={city} activeTab={tab} onTabChange={onTabChange} />

      <div className="videos-main-column videos-desktop-center min-w-0">
        <div
          className={`videos-discovery-mobile-only min-w-0 space-y-4 px-4 pb-2 pt-1 ${
            tab === "all" ? "videos-discovery-mobile-chrome" : ""
          }`}
        >
          <VideosMobileHeader />
          <VideosMobileSearch
            value={searchQuery}
            onChange={onSearchChange}
            filterOpen={mobileFilterOpen}
            onToggleFilter={onToggleMobileFilter}
          />
          <VideosMobileViewPills activeTab={tab} onTabChange={onTabChange} />
          {mobileFilterOpen ? (
            <VideosInternalSidebar
              filters={sidebarFilters}
              neighborhoods={neighborhoods}
              items={sourceItems}
              onReset={onResetSidebarFilters}
              onChange={onUpdateSidebarFilter}
            />
          ) : null}
        </div>

        <VideosMediumHeader
          city={city}
          filterPanelOpen={filterPanelOpen}
          filterActive={filterActive}
          onOpenFilter={onOpenFilter}
          filterButtonRef={filterButtonRef}
        />

        <div className="videos-shell-desktop-header flex items-start justify-between gap-4">
          <div>
            <h1 className="feed-desktop-greeting-title">{VIDEOS_PORTAL_TITLE}</h1>
            <p className="feed-desktop-greeting-subtitle">{formatVideosPortalSubtitle(city)}</p>
          </div>
          <button
            ref={filterButtonRef}
            type="button"
            data-videos-desktop-filter=""
            data-videos-filter-active={filterActive ? "" : undefined}
            onClick={(event) => onOpenFilter(event.currentTarget)}
            aria-expanded={filterPanelOpen}
            aria-haspopup="dialog"
            aria-pressed={filterActive}
            className={`mt-1 inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium shadow-sm transition active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 ${
              filterActive
                ? "border-yunicity-primary bg-yunicity-primary-soft text-yunicity-primary"
                : filterPanelOpen
                  ? "border-neutral-400 bg-neutral-50 text-neutral-800"
                  : "border-neutral-200/90 bg-white text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
            {VIDEOS_DESKTOP_FILTER_OPEN}
            {filterActive ? <span className="sr-only"> — filtre actif</span> : null}
          </button>
        </div>

        <div className="videos-portal-toolbar">
          <VideosPortalToolbar
            tab={tab}
            sort={sort}
            onTabChange={onTabChange}
            onSortChange={onSortChange}
            desktopTabs={DESKTOP_TABS}
          />
        </div>

        <VideosEditorialStreamRegion
          tab={tab}
          isLoading={isLoading}
          error={error}
          emptyMessage={emptyMessage}
          visibleItems={visibleItems}
          featuredItems={featuredItems}
          creators={creators}
          onRetry={onRetry}
          loadMore={loadMore}
          processingErrors={processingErrors}
          onDismissProcessing={onDismissProcessing}
          onToggleLike={onToggleLike}
          onShare={onShare}
          onOpenReport={onOpenReport}
          onCommentCountDelta={onCommentCountDelta}
          onLoadMoreFeed={onLoadMoreFeed}
          onTabChange={onTabChange}
        />
      </div>

      <VideosDesktopRightRail
        upNext={upNext}
        creators={creators}
        topics={topics}
        onTopicSelect={onTopicSelect}
      />
    </div>
  );
}
