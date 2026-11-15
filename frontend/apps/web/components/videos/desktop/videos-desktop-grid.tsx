"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_ERROR_MESSAGE,
  LOCAL_VIDEO_RETRY_LABEL,
  VIDEOS_PORTAL_LOADING,
  VIDEOS_PORTAL_LOAD_MORE,
  VIDEOS_PORTAL_PUBLISH_CTA,
} from "@yunicity/utils";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { VideosDesktopGridTile } from "@/components/videos/desktop/videos-desktop-grid-tile";
import { VIDEO_CANVAS_FOCUS } from "@/lib/videos/video-playback-a11y";

export type VideosDesktopGridProps = {
  items: readonly LocalVideoFeedItem[];
  isLoading: boolean;
  error: string | null;
  emptyMessage: string;
  onRetry: () => void;
  /** Bouton « Charger plus » fourni par le shell, ou rendu interne si absent. */
  loadMore?: ReactNode;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  /** Erreur locale de pagination — la grille reste affichée. */
  loadMoreError?: boolean;
  onRetryLoadMore?: () => void;
};

function GridSkeletons() {
  const skeletons = [
    { key: "s1", aspect: "9 / 16" },
    { key: "s2", aspect: "16 / 9" },
    { key: "s3", aspect: "9 / 16" },
    { key: "s4", aspect: "16 / 9" },
    { key: "s5", aspect: "9 / 16" },
    { key: "s6", aspect: "16 / 9" },
  ];
  return (
    <div
      className="videos-desktop-grid"
      data-videos-desktop-grid=""
      data-videos-desktop-grid-state="loading"
      role="status"
      aria-busy="true"
      aria-label={VIDEOS_PORTAL_LOADING}
    >
      {skeletons.map((skeleton) => (
        <div key={skeleton.key} className="videos-desktop-grid-tile mb-4 break-inside-avoid">
          <div
            className="animate-pulse rounded-2xl bg-neutral-200"
            style={{ aspectRatio: skeleton.aspect }}
          />
          <div className="mt-2 space-y-1.5 px-0.5">
            <div className="h-3.5 w-[80%] animate-pulse rounded bg-neutral-200" />
            <div className="h-3 w-[40%] animate-pulse rounded bg-neutral-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Grille mixte desktop C1 — vignettes images portrait/paysage, états
 * loading / vide / erreur, pagination locale sans écraser la grille.
 */
export function VideosDesktopGrid({
  items,
  isLoading,
  error,
  emptyMessage,
  onRetry,
  loadMore = null,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  loadMoreError = false,
  onRetryLoadMore,
}: VideosDesktopGridProps) {
  if (isLoading && items.length === 0) {
    return <GridSkeletons />;
  }

  if (error && items.length === 0) {
    return (
      <div
        className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center"
        data-videos-desktop-grid-state="error"
        role="alert"
      >
        <p className="text-sm text-red-800">{LOCAL_VIDEO_ERROR_MESSAGE}</p>
        <button
          type="button"
          onClick={onRetry}
          className={`mt-3 text-sm font-semibold text-yunicity-primary hover:underline ${VIDEO_CANVAS_FOCUS}`}
        >
          {LOCAL_VIDEO_RETRY_LABEL}
        </button>
      </div>
    );
  }

  if (!error && items.length === 0) {
    return (
      <div
        className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-10 text-center"
        data-videos-desktop-grid-state="empty"
      >
        <p className="text-sm text-neutral-600">{emptyMessage}</p>
        <Link
          href="/videos/new"
          className={`mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-yunicity-primary px-5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover ${VIDEO_CANVAS_FOCUS}`}
        >
          {VIDEOS_PORTAL_PUBLISH_CTA}
        </Link>
      </div>
    );
  }

  const pagination =
    loadMore ??
    (hasMore ? (
      <button
        type="button"
        onClick={onLoadMore}
        disabled={isLoadingMore}
        className={`flex w-full items-center justify-center gap-2 rounded-full border border-neutral-200/90 bg-white py-3.5 text-sm font-semibold text-yunicity-primary shadow-sm transition hover:border-yunicity-primary/30 hover:bg-yunicity-primary-soft disabled:cursor-not-allowed disabled:opacity-60 ${VIDEO_CANVAS_FOCUS}`}
      >
        {VIDEOS_PORTAL_LOAD_MORE}
        <ChevronDown className="h-4 w-4" aria-hidden />
      </button>
    ) : null);

  return (
    <div data-videos-desktop-grid-state="ready">
      <div className="videos-desktop-grid" data-videos-desktop-grid="">
        {items.map((item) => (
          <VideosDesktopGridTile key={item.id} item={item} />
        ))}
      </div>

      {loadMoreError ? (
        <div
          className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-center"
          data-videos-desktop-load-more-error=""
          role="alert"
        >
          <p className="text-sm text-amber-900">Impossible de charger la suite.</p>
          <button
            type="button"
            onClick={onRetryLoadMore ?? onLoadMore}
            className={`mt-2 text-sm font-semibold text-yunicity-primary hover:underline ${VIDEO_CANVAS_FOCUS}`}
          >
            {LOCAL_VIDEO_RETRY_LABEL}
          </button>
        </div>
      ) : null}

      {pagination ? <div className="mt-4">{pagination}</div> : null}
    </div>
  );
}
