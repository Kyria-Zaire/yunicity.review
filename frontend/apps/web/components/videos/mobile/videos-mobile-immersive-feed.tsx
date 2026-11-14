"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import { LOCAL_VIDEO_DEFAULT_MUTED, type VideosPortalTabId } from "@yunicity/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LocalVideoFeedViewport } from "@/components/videos/local-video-feed-viewport";
import { VideosMobileFeedTopBar } from "@/components/videos/mobile/videos-mobile-feed-top-bar";
import { VideoCommentsSheet } from "@/components/videos/video-comments-sheet";

type VideosMobileImmersiveFeedProps = {
  items: readonly LocalVideoFeedItem[];
  focusVideoId?: string | null;
  variant: "discovery" | "detail";
  /** Vue affichée (D-Q1) : Pour vous, Tendances ou Nouveautés. */
  tab?: VideosPortalTabId;
  onTabChange?: (tab: VideosPortalTabId) => void;
  processingErrors?: Record<string, string | null | undefined>;
  onDismissProcessing?: (videoId: string) => void;
  onToggleLike: (item: LocalVideoFeedItem) => void;
  onShare: (item: LocalVideoFeedItem) => void;
  onOpenReport: (videoId: string) => void;
  onCommentCountDelta: (videoId: string, delta: number) => void;
  onLoadMore?: () => void;
};

/**
 * Fil vertical plein écran mobile (≤639px), v2.3 — découverte (Pour vous, Tendances,
 * Nouveautés) ou lien partagé ?video=. Barre haute en surimpression (écran A).
 */
export function VideosMobileImmersiveFeed({
  items,
  focusVideoId = null,
  variant,
  tab = "all",
  onTabChange,
  processingErrors = {},
  onDismissProcessing,
  onToggleLike,
  onShare,
  onOpenReport,
  onCommentCountDelta,
  onLoadMore,
}: VideosMobileImmersiveFeedProps) {
  const router = useRouter();
  const [commentsVideoId, setCommentsVideoId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(LOCAL_VIDEO_DEFAULT_MUTED);
  const [pointerOverFeed, setPointerOverFeed] = useState(false);
  const detailUrlSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const feedItems = useMemo(() => [...items], [items]);

  const commentsVideo = useMemo(
    () => feedItems.find((item) => item.id === commentsVideoId) ?? null,
    [commentsVideoId, feedItems],
  );

  useEffect(
    () => () => {
      if (detailUrlSyncTimeoutRef.current) {
        clearTimeout(detailUrlSyncTimeoutRef.current);
      }
    },
    [],
  );

  const handleActiveVideoChange = useCallback(
    (videoId: string | null) => {
      // Discovery reste sur /videos — pas de ?video= à chaque snap (évite bascule détail + boucle RSC).
      if (variant === "discovery") return;
      if (!videoId || videoId === focusVideoId) return;

      if (detailUrlSyncTimeoutRef.current) {
        clearTimeout(detailUrlSyncTimeoutRef.current);
      }

      detailUrlSyncTimeoutRef.current = setTimeout(() => {
        router.replace(`/videos?video=${encodeURIComponent(videoId)}`, { scroll: false });
      }, 450);
    },
    [focusVideoId, router, variant],
  );

  return (
    <div
      className="videos-mobile-immersive-feed flex h-full max-h-full min-h-0 flex-col overflow-hidden bg-black"
      data-videos-discovery-immersive={variant === "discovery" ? "" : undefined}
      data-videos-immersive-mobile=""
      onMouseEnter={() => setPointerOverFeed(true)}
      onMouseLeave={() => setPointerOverFeed(false)}
    >
      <div className="videos-immersive-stage relative min-h-0 flex-1 overflow-hidden">
        <VideosMobileFeedTopBar
          variant={variant}
          tab={tab}
          onTabChange={onTabChange}
          sound={{ isMuted, onToggle: () => setIsMuted((value) => !value) }}
        />

        <LocalVideoFeedViewport
          items={feedItems}
          focusVideoId={focusVideoId}
          pointerOverFeed={pointerOverFeed}
          isMuted={isMuted}
          processingErrors={processingErrors}
          onDismissProcessing={onDismissProcessing}
          onActiveVideoChange={handleActiveVideoChange}
          onOpenComments={setCommentsVideoId}
          onToggleLike={onToggleLike}
          onShare={onShare}
          onOpenReport={onOpenReport}
          onEndReached={onLoadMore}
        />
      </div>

      {commentsVideo ? (
        <VideoCommentsSheet
          open={Boolean(commentsVideoId)}
          video={commentsVideo}
          onClose={() => setCommentsVideoId(null)}
          onCommentCountDelta={onCommentCountDelta}
        />
      ) : null}
    </div>
  );
}
