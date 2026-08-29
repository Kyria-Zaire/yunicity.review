"use client";

import type { FeedPost, FeedReportReason, LocalEvent } from "@yunicity/types";
import type { FeedHighlightEvent, FeedDesktopMoment } from "@yunicity/utils";
import type { ReactNode, RefObject } from "react";

import { FeedDesktopComposer } from "@/components/feed/desktop/feed-desktop-composer";
import { FeedDesktopMoments } from "@/components/feed/desktop/feed-desktop-moments";
import { FeedEditorialEveningFeatured } from "@/components/feed/feed-editorial-evening-featured";
import {
  FeedEditorialStreamRegion,
  type FeedEditorialStreamRegionProps,
} from "@/components/feed/feed-editorial-stream-region";
import { FeedSavedEventsPanel } from "@/components/feed/portal/feed-saved-events-panel";

type FeedEditorialMainColumnProps = Omit<
  FeedEditorialStreamRegionProps,
  "streamRegionProps"
> & {
  userFirstName: string;
  userAvatarUrl: string | null;
  portalEvents: readonly LocalEvent[];
  storyMoments: readonly FeedDesktopMoment[];
  onCreatePost: (body: string, mediaUrl?: string | null) => Promise<void>;
  composerRef?: RefObject<HTMLDivElement>;
  filterHint?: ReactNode;
  interestFilterActive?: boolean;
};

/** Colonne éditoriale unique — stories, compositeur, soir, featured, flux (medium + mobile). */
export function FeedEditorialMainColumn({
  city,
  userFirstName,
  userAvatarUrl,
  portalEvents,
  storyMoments,
  onCreatePost,
  composerRef,
  filterHint,
  interestFilterActive = false,
  showSaved,
  stream,
  streamLoading,
  streamError,
  highlights,
  savedEvents,
  onToggleLike,
  onReport,
  onRefresh,
  hasNextPage,
  isLoadingMore,
  appendError,
  onLoadMore,
  viewHint,
  reportMessage,
  interestFilterBlockedCount = 0,
  onDisableInterestFilter,
}: FeedEditorialMainColumnProps) {
  return (
    <>
      {!showSaved ? (
        <div data-feed-medium-region="stories" data-feed-medium-surface="primary">
          <FeedDesktopMoments moments={storyMoments} />
        </div>
      ) : null}

      {!showSaved ? (
        <div
          id="feed-composer"
          ref={composerRef}
          data-feed-medium-region="composer"
          data-feed-medium-surface="primary"
          className="scroll-mt-28"
        >
          <FeedDesktopComposer
            city={city}
            avatarInitial={userFirstName.charAt(0).toUpperCase()}
            avatarUrl={userAvatarUrl}
            onSubmit={onCreatePost}
          />
        </div>
      ) : null}

      {!showSaved ? (
        <FeedEditorialEveningFeatured events={portalEvents} city={city} markPrimarySurface />
      ) : null}

      {!showSaved && interestFilterActive && filterHint ? (
        <p className="rounded-xl border border-yunicity-primary/20 bg-yunicity-primary-soft/60 px-3 py-2.5 text-xs leading-relaxed text-neutral-700">
          {filterHint}
        </p>
      ) : null}

      <FeedEditorialStreamRegion
        city={city}
        stream={stream}
        streamLoading={streamLoading}
        streamError={streamError}
        highlights={highlights}
        savedEvents={savedEvents}
        showSaved={showSaved}
        onToggleLike={onToggleLike}
        onReport={onReport}
        onRefresh={onRefresh}
        hasNextPage={hasNextPage}
        isLoadingMore={isLoadingMore}
        appendError={appendError}
        onLoadMore={onLoadMore}
        viewHint={viewHint}
        reportMessage={reportMessage}
        interestFilterActive={interestFilterActive}
        interestFilterBlockedCount={interestFilterBlockedCount}
        onDisableInterestFilter={onDisableInterestFilter}
        streamRegionProps={{ "data-feed-medium-region": "stream" }}
      />
    </>
  );
}

export type { FeedEditorialMainColumnProps };
