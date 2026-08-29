"use client";

import type { FeedPost, FeedReportReason } from "@yunicity/types";
import type { FeedHighlightEvent } from "@yunicity/utils";
import type { ReactNode } from "react";

import { FeedDesktopStream } from "@/components/feed/desktop/feed-desktop-stream";
import { FeedEmptyState } from "@/components/feed/feed-empty-state";
import { FeedErrorState } from "@/components/feed/feed-error-state";
import { FeedLoadingState } from "@/components/feed/feed-loading-state";
import { FeedSavedEventsPanel } from "@/components/feed/portal/feed-saved-events-panel";
import type { FeedStreamItem } from "@/lib/feed/feed-stream";

export type FeedEditorialStreamRegionProps = {
  city: string;
  stream: readonly FeedStreamItem[];
  streamLoading: boolean;
  streamError: string | null;
  highlights: readonly FeedHighlightEvent[];
  savedEvents: Parameters<typeof FeedSavedEventsPanel>[0]["events"];
  showSaved: boolean;
  onToggleLike: (post: FeedPost) => Promise<void>;
  onReport: (postId: string, reason: FeedReportReason) => Promise<void>;
  onRefresh: () => void;
  hasNextPage: boolean;
  isLoadingMore: boolean;
  appendError: string | null;
  onLoadMore: () => Promise<void>;
  viewHint?: ReactNode;
  reportMessage?: string | null;
  interestFilterActive?: boolean;
  interestFilterBlockedCount?: number;
  onDisableInterestFilter?: () => void;
  streamRegionProps?: Record<string, string | undefined>;
  className?: string;
};

/** États de chargement, vide, sauvegardes et flux paginé — partagé medium / mobile. */
export function FeedEditorialStreamRegion({
  city,
  stream,
  streamLoading,
  streamError,
  highlights,
  savedEvents,
  showSaved,
  onToggleLike,
  onReport,
  onRefresh,
  hasNextPage,
  isLoadingMore,
  appendError,
  onLoadMore,
  viewHint,
  reportMessage,
  interestFilterActive = false,
  interestFilterBlockedCount = 0,
  onDisableInterestFilter,
  streamRegionProps,
  className = "feed-stream-region",
}: FeedEditorialStreamRegionProps) {
  return (
    <div className={className} {...streamRegionProps}>
      {viewHint ? (
        <p className="feed-stream-hint text-xs leading-relaxed text-neutral-500">{viewHint}</p>
      ) : null}
      {reportMessage ? (
        <p className="feed-stream-notice rounded-xl bg-yunicity-primary-soft px-4 py-3 text-sm text-yunicity-primary">
          {reportMessage}
        </p>
      ) : null}
      {streamLoading ? <FeedLoadingState /> : null}
      {!streamLoading && streamError ? <FeedErrorState onRetry={onRefresh} /> : null}
      {!streamLoading && !streamError && showSaved ? (
        <FeedSavedEventsPanel events={savedEvents} city={city} />
      ) : null}
      {!streamLoading && !streamError && !showSaved && stream.length === 0 ? (
        interestFilterActive && interestFilterBlockedCount > 0 ? (
          <div className="feed-desktop-surface rounded-2xl border border-dashed border-yunicity-border bg-white p-8 text-center">
            <p className="text-base font-semibold text-neutral-900">
              Aucune publication ne correspond à vos centres d&apos;intérêt
            </p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">
              Désactivez le filtre ou ajustez vos préférences pour voir plus de contenu local.
            </p>
            {onDisableInterestFilter ? (
              <button
                type="button"
                onClick={onDisableInterestFilter}
                className="mt-4 rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Désactiver le filtre
              </button>
            ) : null}
          </div>
        ) : (
          <FeedEmptyState city={city} highlights={[...highlights]} />
        )
      ) : null}
      {!streamLoading && !streamError && !showSaved && stream.length > 0 ? (
        <FeedDesktopStream
          stream={stream}
          city={city}
          trends={[]}
          onToggleLike={onToggleLike}
          onReport={onReport}
          hasNextPage={hasNextPage}
          isLoadingMore={isLoadingMore}
          appendError={appendError}
          onLoadMore={onLoadMore}
        />
      ) : null}
    </div>
  );
}
