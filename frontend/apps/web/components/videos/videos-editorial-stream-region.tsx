"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import type { VideoPortalCreator, VideosPortalTabId } from "@yunicity/utils";
import {
  LOCAL_VIDEO_ERROR_MESSAGE,
  LOCAL_VIDEO_RETRY_LABEL,
  VIDEOS_MOBILE_RECENT_TITLE,
  VIDEOS_PORTAL_LOADING,
  VIDEOS_SUBSCRIPTIONS_VIEW_ALL,
} from "@yunicity/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { VideosDesktopFeedStream } from "@/components/videos/desktop/videos-desktop-feed-stream";
import {
  VideosMobileFeaturedHero,
  VideosMobileGridCard,
  VideosMobileImmersiveFeed,
  VideosMobileSubscriptionsRail,
} from "@/components/videos/mobile";
import { useVideosViewportTier } from "@/hooks/use-videos-viewport-tier";

export type VideosEditorialStreamRegionProps = {
  tab: VideosPortalTabId;
  isLoading: boolean;
  error: string | null;
  emptyMessage: string;
  visibleItems: readonly LocalVideoFeedItem[];
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
};

/** États + flux vidéo partagé mobile / medium / desktop (C3-VIDEOS-RESPONSIVE-SHELL). */
export function VideosEditorialStreamRegion({
  tab,
  isLoading,
  error,
  emptyMessage,
  visibleItems,
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
}: VideosEditorialStreamRegionProps) {
  const viewportTier = useVideosViewportTier();
  const showDiscoveryImmersive =
    viewportTier === "mobile" &&
    tab === "all" &&
    Boolean(onToggleLike && onShare && onOpenReport && onCommentCountDelta);

  return (
    <div className={className} data-videos-medium-region="stream">
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
          {showDiscoveryImmersive ? (
            <VideosMobileImmersiveFeed
              variant="discovery"
              items={visibleItems}
              processingErrors={processingErrors}
              onDismissProcessing={onDismissProcessing}
              onToggleLike={onToggleLike!}
              onShare={onShare!}
              onOpenReport={onOpenReport!}
              onCommentCountDelta={onCommentCountDelta!}
              onLoadMore={onLoadMoreFeed}
            />
          ) : null}

          <div
            className={`videos-discovery-mobile-only space-y-4 ${showDiscoveryImmersive ? "videos-discovery-mobile-grid-fallback" : ""}`}
          >
            <VideosMobileFeaturedHero items={[...featuredItems]} />

            <div className="flex items-center justify-between gap-3 pt-1">
              <h2 className="text-base font-bold text-neutral-900">{VIDEOS_MOBILE_RECENT_TITLE}</h2>
              <Link
                href="/videos"
                className="inline-flex items-center gap-0.5 text-sm font-semibold text-yunicity-primary"
              >
                {VIDEOS_SUBSCRIPTIONS_VIEW_ALL}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <div className="videos-mobile-grid grid grid-cols-2 gap-3">
              {visibleItems.map((item) => (
                <VideosMobileGridCard key={item.id} item={item} />
              ))}
            </div>

            {loadMore}

            <VideosMobileSubscriptionsRail creators={[...creators]} />
          </div>

          <div className="videos-medium-desktop-stream space-y-5">
            <VideosDesktopFeedStream items={visibleItems} />
            {loadMore}
          </div>
        </>
      ) : null}
    </div>
  );
}
