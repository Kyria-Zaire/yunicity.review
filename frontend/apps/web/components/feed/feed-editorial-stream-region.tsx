"use client";

import type { FeedPost, FeedReportReason } from "@yunicity/types";
import type { FeedHighlightEvent } from "@yunicity/utils";
import { useEffect, useRef, type ReactNode } from "react";

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
  /** Offre mise en avant — contenu de la famille `local-privilege` du flux. */
  highlightOffer: Parameters<typeof FeedDesktopStream>[0]["highlightOffer"];
  savedEvents: Parameters<typeof FeedSavedEventsPanel>[0]["events"];
  showSaved: boolean;
  onToggleLike: (post: FeedPost) => Promise<void>;
  onReport: (postId: string, reason: FeedReportReason) => Promise<void>;
  /** Suppression de SA publication (PROFILE-POST-MENU-01). */
  onDeletePost?: (postId: string) => Promise<void>;
  onRefresh: () => void;
  hasNextPage: boolean;
  isLoadingMore: boolean;
  appendError: string | null;
  onLoadMore: () => Promise<void>;
  viewHint?: ReactNode;
  reportMessage?: string | null;
  /** Confirmation de suppression, annoncée par le flux lui-même. */
  deleteMessage?: string | null;
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
  highlightOffer,
  savedEvents,
  showSaved,
  onToggleLike,
  onReport,
  onDeletePost,
  onRefresh,
  hasNextPage,
  isLoadingMore,
  appendError,
  onLoadMore,
  viewHint,
  reportMessage,
  deleteMessage,
  interestFilterActive = false,
  interestFilterBlockedCount = 0,
  onDisableInterestFilter,
  streamRegionProps,
  className = "feed-stream-region",
}: FeedEditorialStreamRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);

  /*
   * Focus après une suppression réussie (PROFILE-POST-MENU-01).
   *
   * La carte supprimée EMPORTE le déclencheur du menu qui a ouvert la
   * confirmation : il n'existe plus au moment où la modale se ferme, donc le
   * focus retombe sur `<body>` et la navigation clavier repart du haut de la
   * page. Il est déplacé ici, sur la RÉGION DU FLUX — un ancrage STABLE, qui
   * contient les publications restantes et ne disparaît pas.
   *
   * L'ANNONCE, elle, ne dépend pas du focus : c'est la zone `role="status"`
   * ci-dessous qui la porte, et un lecteur d'écran la restitue sans que rien
   * ne soit focalisé. Les deux mécanismes sont séparés à dessein — le message
   * s'effacera au bout de quelques secondes, le focus doit survivre.
   *
   * `tabIndex={-1}` rend la région focalisable PAR PROGRAMME seulement :
   * l'ordre de tabulation de la page n'est pas modifié.
   */
  useEffect(() => {
    if (!deleteMessage) return;
    regionRef.current?.focus();
  }, [deleteMessage]);

  return (
    <div ref={regionRef} tabIndex={-1} className={className} {...streamRegionProps}>
      {viewHint ? (
        <p className="feed-stream-hint text-xs leading-relaxed text-neutral-500">{viewHint}</p>
      ) : null}
      {reportMessage ? (
        <p className="feed-stream-notice rounded-xl bg-yunicity-primary-soft px-4 py-3 text-sm text-yunicity-primary">
          {reportMessage}
        </p>
      ) : null}
      {deleteMessage ? (
        <p
          role="status"
          data-feed-publication-deleted=""
          className="feed-stream-notice rounded-xl bg-yunicity-primary-soft px-4 py-3 text-sm text-yunicity-primary"
        >
          {deleteMessage}
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
          highlights={highlights}
          highlightOffer={highlightOffer}
          trends={[]}
          onToggleLike={onToggleLike}
          onReport={onReport}
          onDeletePost={onDeletePost}
          hasNextPage={hasNextPage}
          isLoadingMore={isLoadingMore}
          appendError={appendError}
          onLoadMore={onLoadMore}
        />
      ) : null}
    </div>
  );
}
