"use client";

import type { FeedReportReason } from "@yunicity/types";
import { FEED_LOAD_MORE_LABEL } from "@yunicity/utils";
import { useEffect, useRef } from "react";

import { FeedCard } from "@/components/feed/feed-card";
import { FeedContextStreamItem } from "@/components/feed/portal/feed-context-stream-item";
import { FeedVideoStreamItem } from "@/components/feed/portal/feed-video-stream-item";
import type { FeedStreamItem } from "@/lib/feed/feed-stream";

type FeedStreamListProps = {
  stream: readonly FeedStreamItem[];
  city: string;
  highlights: Parameters<typeof FeedContextStreamItem>[0]["highlights"];
  highlightOffer: Parameters<typeof FeedContextStreamItem>[0]["highlightOffer"];
  tribes: Parameters<typeof FeedContextStreamItem>[0]["tribes"];
  trends: Parameters<typeof FeedContextStreamItem>[0]["trends"];
  onToggleLike: Parameters<typeof FeedCard>[0]["onToggleLike"];
  onReport: (postId: string, reason: FeedReportReason) => Promise<void>;
  hasNextPage: boolean;
  isLoadingMore: boolean;
  appendError: string | null;
  onLoadMore: () => Promise<void>;
};

export function FeedStreamList({
  stream,
  city,
  highlights,
  highlightOffer,
  tribes,
  trends,
  onToggleLike,
  onReport,
  hasNextPage,
  isLoadingMore,
  appendError,
  onLoadMore,
}: FeedStreamListProps) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isLoadingMore || appendError) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void onLoadMore();
      },
      { rootMargin: "0px 0px 320px", threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [appendError, hasNextPage, isLoadingMore, onLoadMore]);

  return (
    <>
      <ul data-feed-stream-list="" className="feed-stream-list" aria-label="Publications du fil local">
        {stream.map((item: FeedStreamItem) => {
          if (item.kind === "post") {
            return (
              <li key={item.key} data-feed-stream-item="post" data-feed-post-id={item.post.id}>
                <FeedCard post={item.post} onToggleLike={onToggleLike} onReport={onReport} />
              </li>
            );
          }

          if (item.kind === "local-video") {
            return (
              <li key={item.key} data-feed-stream-item="local-video" className="feed-stream-local-video">
                <FeedVideoStreamItem video={item.video} />
              </li>
            );
          }

          return (
            <FeedContextStreamItem
              key={item.key}
              family={item.family}
              city={city}
              highlights={highlights}
              highlightOffer={highlightOffer}
              tribes={tribes}
              trends={trends}
            />
          );
        })}
      </ul>

      {hasNextPage ? (
        <div className="feed-stream-pagination">
          <div ref={sentinelRef} data-feed-stream-sentinel="" aria-hidden="true" />
          {appendError ? (
            <div
              role="alert"
              data-feed-append-error=""
              className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              <p>Le chargement des publications suivantes a échoué. Vos publications déjà chargées restent disponibles.</p>
            </div>
          ) : null}
          <button
            type="button"
            disabled={isLoadingMore}
            onClick={() => void onLoadMore()}
            className="min-h-11 rounded-full border border-yunicity-border bg-white px-6 py-2.5 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 disabled:opacity-50"
          >
            {isLoadingMore
              ? "Chargement..."
              : appendError
                ? "Réessayer le chargement"
                : FEED_LOAD_MORE_LABEL}
          </button>
        </div>
      ) : null}
    </>
  );
}
