"use client";

import type { FeedPost, FeedReportReason, LocalEvent, PartnerOfferPublic } from "@yunicity/types";
import type { FeedPortalView, FeedDesktopMoment, FeedHighlightEvent } from "@yunicity/utils";
import { FEED_PORTAL_FILTER } from "@yunicity/utils";
import { SlidersHorizontal } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";

import { FeedEmptyState } from "@/components/feed/feed-empty-state";
import { FeedErrorState } from "@/components/feed/feed-error-state";
import { FeedLoadingState } from "@/components/feed/feed-loading-state";
import { FeedSavedEventsPanel } from "@/components/feed/portal/feed-saved-events-panel";
import type { FeedStreamItem } from "@/lib/feed/feed-stream";

import { FeedDesktopComposer } from "./feed-desktop-composer";
import { FeedDesktopLeftRail } from "./feed-desktop-left-rail";
import { FeedDesktopMoments } from "./feed-desktop-moments";
import { FeedDesktopRightRail } from "./feed-desktop-right-rail";
import { FeedDesktopStream } from "./feed-desktop-stream";

type FeedLeftNav =
  | FeedPortalView
  | "home"
  | "for_you"
  | "favorites"
  | "my_events"
  | "my_tribes"
  | "discussions"
  | "stories"
  | "contributions"
  | "saved"
  | "subscriptions"
  | "nearby"
  | null;

type FeedDesktopScreenProps = {
  city: string;
  userFirstName: string;
  userAvatarUrl: string | null;

  activeView: FeedPortalView;
  leftNav: FeedLeftNav;
  onViewChange: (view: FeedPortalView) => void;
  onLeftNavSelect: (nav: FeedLeftNav) => void;

  storyMoments: readonly FeedDesktopMoment[];

  stream: readonly FeedStreamItem[];
  streamLoading: boolean;
  streamError: string | null;

  highlights: readonly FeedHighlightEvent[];
  highlightOffer: PartnerOfferPublic | null;
  trends: Parameters<typeof FeedDesktopStream>[0]["trends"];

  portalEvents: readonly LocalEvent[];
  savedEvents: LocalEvent[];

  onCreatePost: (body: string, mediaUrl?: string | null) => Promise<void>;
  onToggleLike: (post: FeedPost) => Promise<void>;
  onReport: (postId: string, reason: FeedReportReason) => Promise<void>;
  onRefresh: () => void;
  hasNextPage: boolean;
  isLoadingMore: boolean;
  appendError: string | null;
  onLoadMore: () => Promise<void>;

  filterPanelOpen: boolean;
  filterActive: boolean;
  onOpenFilter: (trigger: HTMLButtonElement) => void;
  filterHint?: ReactNode;
};

export function FeedDesktopScreen({
  city,
  userFirstName,
  userAvatarUrl,
  activeView,
  leftNav,
  onViewChange,
  onLeftNavSelect,
  storyMoments,
  stream,
  streamLoading,
  streamError,
  highlights,
  highlightOffer,
  trends,
  portalEvents,
  savedEvents,
  onCreatePost,
  onToggleLike,
  onReport,
  onRefresh,
  hasNextPage,
  isLoadingMore,
  appendError,
  onLoadMore,
  filterPanelOpen,
  filterActive,
  onOpenFilter,
  filterHint,
}: FeedDesktopScreenProps) {
  const showSaved = leftNav === "saved";

  return (
    <div className="feed-desktop-layout">
      <FeedDesktopLeftRail
        city={city}
        activeView={activeView}
        leftNav={leftNav}
        onNavSelect={onLeftNavSelect}
      />

      <div className="feed-desktop-center min-w-0">
        <div className="mb-5 flex items-start justify-between">
          <div className="feed-desktop-greeting">
            <h1 className="feed-desktop-greeting-title">Bonjour {userFirstName}</h1>
            <p className="feed-desktop-greeting-subtitle">Bienvenue sur le fil de {city}</p>
          </div>
          <button
            type="button"
            data-feed-desktop-filter=""
            data-feed-medium-filter-active={filterActive ? "" : undefined}
            onClick={(event: MouseEvent<HTMLButtonElement>) => onOpenFilter(event.currentTarget)}
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
            {FEED_PORTAL_FILTER}
            {filterActive ? <span className="sr-only"> — filtre actif</span> : null}
          </button>
        </div>

        {filterActive && filterHint ? (
          <p className="mb-4 rounded-xl border border-yunicity-primary/20 bg-yunicity-primary-soft/60 px-3 py-2.5 text-xs leading-relaxed text-neutral-700">
            {filterHint}
          </p>
        ) : null}

        {!showSaved ? (
          <FeedDesktopMoments moments={storyMoments} />
        ) : null}

        {!showSaved ? (
          <div className="mt-5">
            <FeedDesktopComposer
              city={city}
              avatarInitial={userFirstName.charAt(0).toUpperCase()}
              avatarUrl={userAvatarUrl}
              onSubmit={onCreatePost}
            />
          </div>
        ) : null}

        <div className="mt-5">
          {streamLoading ? <FeedLoadingState /> : null}
          {!streamLoading && streamError ? <FeedErrorState onRetry={onRefresh} /> : null}
          {!streamLoading && !streamError && showSaved ? (
            <FeedSavedEventsPanel events={savedEvents} city={city} />
          ) : null}
          {!streamLoading && !streamError && !showSaved && stream.length === 0 ? (
            <FeedEmptyState city={city} highlights={[...highlights]} />
          ) : null}
          {!streamLoading && !streamError && !showSaved && stream.length > 0 ? (
            <FeedDesktopStream
              stream={stream}
              city={city}
              trends={trends}
              onToggleLike={onToggleLike}
              onReport={onReport}
              hasNextPage={hasNextPage}
              isLoadingMore={isLoadingMore}
              appendError={appendError}
              onLoadMore={onLoadMore}
            />
          ) : null}
        </div>
      </div>

      <FeedDesktopRightRail events={portalEvents} city={city} highlightOffer={highlightOffer} />
    </div>
  );
}
