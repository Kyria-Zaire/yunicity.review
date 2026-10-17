"use client";

import type { FeedReportReason } from "@yunicity/types";
import { FEED_LOAD_MORE_LABEL } from "@yunicity/utils";
import { useEffect, useRef } from "react";

import { FeedCard } from "@/components/feed/feed-card";
import { FeedContextStreamItem } from "@/components/feed/portal/feed-context-stream-item";
import { FeedVideoStreamItem } from "@/components/feed/portal/feed-video-stream-item";
import type { FeedStreamItem } from "@/lib/feed/feed-stream";

type FeedDesktopStreamProps = {
  stream: readonly FeedStreamItem[];
  city: string;
  /*
   * Contenu des modules contextuels. Ces trois props etaient des LITTERAUX
   * VIDES a l'appel : `FeedContextStreamItem` rend `null` quand sa famille n'a
   * pas de contenu, donc aucun module n'apparaissait jamais — quelle que soit
   * la cadence calculee en amont.
   */
  highlights: Parameters<typeof FeedContextStreamItem>[0]["highlights"];
  highlightOffer: Parameters<typeof FeedContextStreamItem>[0]["highlightOffer"];
  trends: Parameters<typeof FeedContextStreamItem>[0]["trends"];
  onToggleLike: Parameters<typeof FeedCard>[0]["onToggleLike"];
  onReport: (postId: string, reason: FeedReportReason) => Promise<void>;
  hasNextPage: boolean;
  isLoadingMore: boolean;
  appendError: string | null;
  onLoadMore: () => Promise<void>;
};

export function FeedDesktopStream({
  stream,
  city,
  highlights,
  highlightOffer,
  trends,
  onToggleLike,
  onReport,
  hasNextPage,
  isLoadingMore,
  appendError,
  onLoadMore,
}: FeedDesktopStreamProps) {
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
    <div className="feed-desktop-stream">
      <ul data-feed-stream-list="" className="feed-desktop-stream-list" aria-label="Publications du fil local">
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
              <li key={item.key} data-feed-stream-item="local-video">
                <FeedVideoStreamItem video={item.video} layout="desktop" />
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
              /* Les familles `tribes` et `local-now` n'entrent pas dans la
                 cadence : le controleur ne les declare jamais disponibles.
                 Leur cabler des donnees mortes n'ajouterait rien. */
              tribes={[]}
              trends={trends}
              layout="desktop"
            />
          );
        })}
      </ul>

      {hasNextPage ? (
        <div className="mt-6 flex flex-col items-center gap-3">
          {/* Marqueur de contrat : le sentinel EXISTE depuis toujours
              (IntersectionObserver ci-dessus) mais n'etait pas adressable, et
              les specs l'attendaient sous ce nom. Convention du depot : la
              surface de contrat est un `data-*`. Aucun comportement change. */}
          <div ref={sentinelRef} data-feed-stream-sentinel="" aria-hidden="true" />
          {appendError ? (
            <div
              role="alert"
              className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              <p>Le chargement des publications suivantes a échoué.</p>
            </div>
          ) : null}
          <button
            type="button"
            disabled={isLoadingMore}
            onClick={() => void onLoadMore()}
            className="min-h-11 rounded-full border border-yunicity-border bg-white px-6 py-2.5 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 active:scale-[0.98] disabled:opacity-50"
          >
            {isLoadingMore
              ? "Chargement…"
              : appendError
                ? "Réessayer"
                : FEED_LOAD_MORE_LABEL}
          </button>
        </div>
      ) : null}
    </div>
  );
}
