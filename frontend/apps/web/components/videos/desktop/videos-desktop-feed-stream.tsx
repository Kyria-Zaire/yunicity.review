"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import type { ReactNode } from "react";

import { VideosDesktopGrid } from "@/components/videos/desktop/videos-desktop-grid";

type VideosDesktopFeedStreamProps = {
  items: readonly LocalVideoFeedItem[];
  isLoading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  onRetry?: () => void;
  loadMore?: ReactNode;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  loadMoreError?: boolean;
  onRetryLoadMore?: () => void;
};

/**
 * Flux desktop ≥1024 — grille mixte C1 (Lot 7). Remplace les cartes split sombre.
 * Anciennes cartes portrait/paysage conservées hors import (nettoyage Lot 10).
 */
export function VideosDesktopFeedStream({
  items,
  isLoading = false,
  error = null,
  emptyMessage = "Aucune vidéo pour le moment.",
  onRetry = () => undefined,
  loadMore = null,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  loadMoreError = false,
  onRetryLoadMore,
}: VideosDesktopFeedStreamProps) {
  return (
    <VideosDesktopGrid
      items={items}
      isLoading={isLoading}
      error={error}
      emptyMessage={emptyMessage}
      onRetry={onRetry}
      loadMore={loadMore}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      onLoadMore={onLoadMore}
      loadMoreError={loadMoreError}
      onRetryLoadMore={onRetryLoadMore}
    />
  );
}
