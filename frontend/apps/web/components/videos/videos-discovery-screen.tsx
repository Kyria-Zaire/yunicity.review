"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_ERROR_MESSAGE,
  LOCAL_VIDEO_RETRY_LABEL,
  VIDEOS_PORTAL_EMPTY,
  VIDEOS_PORTAL_LOADING,
  VIDEOS_PORTAL_LOAD_MORE,
  VIDEOS_PORTAL_MINE_EMPTY,
  VIDEOS_PORTAL_PUBLISH_CTA,
  VIDEOS_PORTAL_SUBSCRIPTIONS_EMPTY,
  VIDEOS_PORTAL_SUBTITLE,
  VIDEOS_PORTAL_TITLE,
} from "@yunicity/utils";
import { ChevronDown, Video } from "lucide-react";
import Link from "next/link";

import { VideosFeaturedHero } from "@/components/videos/videos-featured-hero";
import { VideosGridCard } from "@/components/videos/videos-grid-card";
import { VideosInternalSidebar } from "@/components/videos/videos-internal-sidebar";
import { VideosPortalToolbar } from "@/components/videos/videos-portal-toolbar";
import { VideosSubscriptionsRail } from "@/components/videos/videos-subscriptions-rail";
import { useVideosPortalContext } from "@/hooks/use-videos-portal-context";

type VideosDiscoveryScreenProps = {
  items: readonly LocalVideoFeedItem[];
  isLoading: boolean;
  error: string | null;
  hasMoreFeed: boolean;
  isLoadingMore: boolean;
  onRetry: () => void;
  onLoadMoreFeed: () => void;
};

export function VideosDiscoveryScreen({
  items,
  isLoading,
  error,
  hasMoreFeed,
  isLoadingMore,
  onRetry,
  onLoadMoreFeed,
}: VideosDiscoveryScreenProps) {
  const portal = useVideosPortalContext({ items });

  const emptyMessage =
    portal.tab === "mine"
      ? VIDEOS_PORTAL_MINE_EMPTY
      : portal.tab === "subscriptions"
        ? VIDEOS_PORTAL_SUBSCRIPTIONS_EMPTY
        : VIDEOS_PORTAL_EMPTY;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-3 py-2 sm:px-4 sm:py-4">
      <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{VIDEOS_PORTAL_TITLE}</h1>
          <p className="text-sm text-neutral-600">{VIDEOS_PORTAL_SUBTITLE}</p>
        </div>
        <Link
          href="/videos/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-yunicity-primary px-4 py-2.5 text-xs font-semibold text-white"
        >
          <Video className="h-4 w-4" aria-hidden />
          {VIDEOS_PORTAL_PUBLISH_CTA}
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[16rem_minmax(0,1fr)]">
        <VideosInternalSidebar
          filters={portal.sidebarFilters}
          neighborhoods={portal.neighborhoods}
          items={items}
          onReset={portal.resetSidebarFilters}
          onChange={portal.updateSidebarFilter}
        />

        <div className="min-w-0 space-y-8">
          {isLoading ? (
            <p className="text-sm text-neutral-500" role="status">
              {VIDEOS_PORTAL_LOADING}
            </p>
          ) : error ? (
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
          ) : (
            <>
              <VideosFeaturedHero items={portal.featuredItems} />

              <VideosPortalToolbar
                tab={portal.tab}
                sort={portal.sort}
                onTabChange={portal.setTab}
                onSortChange={portal.setSort}
              />

              {portal.visibleItems.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  {portal.visibleItems.map((item) => (
                    <VideosGridCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-10 text-center text-sm text-neutral-600">
                  {emptyMessage}
                </p>
              )}

              {(portal.hasMore || hasMoreFeed) ? (
                <button
                  type="button"
                  onClick={() => {
                    if (portal.hasMore) {
                      portal.loadMore();
                      return;
                    }
                    onLoadMoreFeed();
                  }}
                  disabled={isLoadingMore}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-neutral-200/90 bg-white py-3.5 text-sm font-semibold text-yunicity-primary shadow-sm transition hover:border-yunicity-primary/30 hover:bg-yunicity-primary-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {VIDEOS_PORTAL_LOAD_MORE}
                  <ChevronDown className="h-4 w-4" aria-hidden />
                </button>
              ) : null}

              <VideosSubscriptionsRail creators={portal.creators} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
