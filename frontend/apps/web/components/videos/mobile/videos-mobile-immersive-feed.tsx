"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FeedMobileHeader } from "@/components/feed/mobile/feed-mobile-header";
import { LocalVideoFeedViewport } from "@/components/videos/local-video-feed-viewport";
import { VideoCommentsSheet } from "@/components/videos/video-comments-sheet";

type VideosMobileImmersiveFeedProps = {
  items: readonly LocalVideoFeedItem[];
  focusVideoId?: string | null;
  variant: "discovery" | "detail";
  processingErrors?: Record<string, string | null | undefined>;
  onDismissProcessing?: (videoId: string) => void;
  onToggleLike: (item: LocalVideoFeedItem) => void;
  onShare: (item: LocalVideoFeedItem) => void;
  onOpenReport: (videoId: string) => void;
  onCommentCountDelta: (videoId: string, delta: number) => void;
  onLoadMore?: () => void;
};

/**
 * Feed vertical plein écran mobile (≤639px) — discovery « Pour vous » ou détail ?video=.
 */
export function VideosMobileImmersiveFeed({
  items,
  focusVideoId = null,
  variant,
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
  const [slideChromeVisible, setSlideChromeVisible] = useState(true);
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
      onMouseEnter={() => {
        setPointerOverFeed(true);
        setSlideChromeVisible(true);
      }}
      onMouseLeave={() => setPointerOverFeed(false)}
    >
      <div className="videos-immersive-mobile-chrome shrink-0">
        <FeedMobileHeader />
      </div>

      <div className="videos-immersive-stage relative min-h-0 flex-1 overflow-hidden">
        {variant === "detail" ? (
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 z-50 px-3 pb-2 pt-3 transition-opacity duration-300 ease-out motion-reduce:transition-none ${
              slideChromeVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <Link
              href="/videos"
              className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full bg-neutral-950/45 text-white transition hover:bg-neutral-950/60"
              aria-label="Retour aux vidéos"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
            </Link>
          </div>
        ) : null}

        <LocalVideoFeedViewport
          items={feedItems}
          focusVideoId={focusVideoId}
          pointerOverFeed={pointerOverFeed}
          processingErrors={processingErrors}
          onDismissProcessing={onDismissProcessing}
          onActiveVideoChange={handleActiveVideoChange}
          onOpenComments={setCommentsVideoId}
          onToggleLike={onToggleLike}
          onShare={onShare}
          onOpenReport={onOpenReport}
          onEndReached={onLoadMore}
          onSlideChromeVisible={setSlideChromeVisible}
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
