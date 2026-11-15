"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_DEFAULT_MUTED,
  LOCAL_VIDEO_SHARED_BADGE,
  reorderLocalVideoFeedForFocus,
} from "@yunicity/utils";
import { Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LocalVideoDescriptionSheet } from "@/components/videos/local-video-description-sheet";
import { LocalVideoFeedViewport } from "@/components/videos/local-video-feed-viewport";
import { LocalVideoMoreMenu } from "@/components/videos/local-video-more-menu";
import { VideoCommentsSheet } from "@/components/videos/video-comments-sheet";
import { useActiveReportVideoId } from "@/lib/videos/active-report-video-context";
import { VIDEO_CANVAS_FOCUS, VIDEO_TOUCH_TARGET } from "@/lib/videos/video-playback-a11y";

type VideosMediumVerticalFeedProps = {
  items: readonly LocalVideoFeedItem[];
  /** Identifiant issu de `?video=` — placé en tête sans doublon. */
  focusVideoId?: string | null;
  /** Affiche le badge « Vidéo partagée » tant que le focus URL est actif. */
  sharedEntry?: boolean;
  processingErrors?: Record<string, string | null | undefined>;
  onDismissProcessing?: (videoId: string) => void;
  onToggleLike: (item: LocalVideoFeedItem) => void;
  onShare: (item: LocalVideoFeedItem) => void;
  onOpenReport: (videoId: string) => void;
  onCommentCountDelta: (videoId: string, delta: number) => void;
  onLoadMore?: () => void;
};

/**
 * VIDEO-REFONTE-L5-MEDIUM-01 — fil vertical medium (640–1023).
 * Rail citoyen + hero-header restent dans le shell ; ce composant remplace le catalogue.
 * Réutilise `LocalVideoFeedViewport` (snap / autoplay) sans hook immersif Safari mobile.
 */
export function VideosMediumVerticalFeed({
  items,
  focusVideoId = null,
  sharedEntry = false,
  processingErrors = {},
  onDismissProcessing,
  onToggleLike,
  onShare,
  onOpenReport,
  onCommentCountDelta,
  onLoadMore,
}: VideosMediumVerticalFeedProps) {
  const feedItems = useMemo(
    () => reorderLocalVideoFeedForFocus(items, focusVideoId),
    [focusVideoId, items],
  );
  const [programmaticFocusId, setProgrammaticFocusId] = useState<string | null>(focusVideoId);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(
    focusVideoId ?? feedItems[0]?.id ?? null,
  );
  const [commentsVideoId, setCommentsVideoId] = useState<string | null>(null);
  const [descriptionVideoId, setDescriptionVideoId] = useState<string | null>(null);
  const [moreVideoId, setMoreVideoId] = useState<string | null>(null);
  const panelTriggerRef = useRef<HTMLElement | null>(null);
  const activeReportVideoId = useActiveReportVideoId();
  const [isMuted, setIsMuted] = useState(LOCAL_VIDEO_DEFAULT_MUTED);
  const [pointerOverFeed, setPointerOverFeed] = useState(false);

  useEffect(() => {
    setProgrammaticFocusId(focusVideoId);
    if (focusVideoId) setActiveVideoId(focusVideoId);
  }, [focusVideoId]);

  const panelSuspendedId =
    commentsVideoId ?? descriptionVideoId ?? moreVideoId ?? activeReportVideoId;
  const suspendedVideoId = panelSuspendedId;

  const commentsVideo = useMemo(
    () => feedItems.find((item) => item.id === commentsVideoId) ?? null,
    [commentsVideoId, feedItems],
  );
  const descriptionVideo = useMemo(
    () => feedItems.find((item) => item.id === descriptionVideoId) ?? null,
    [descriptionVideoId, feedItems],
  );

  const activeIndex = useMemo(() => {
    if (!activeVideoId) return -1;
    return feedItems.findIndex((item) => item.id === activeVideoId);
  }, [activeVideoId, feedItems]);

  const goRelative = useCallback(
    (delta: number) => {
      if (activeIndex < 0) return;
      const next = feedItems[activeIndex + delta];
      if (!next) return;
      setProgrammaticFocusId(next.id);
      setActiveVideoId(next.id);
      if (activeIndex + delta >= feedItems.length - 2) {
        onLoadMore?.();
      }
    },
    [activeIndex, feedItems, onLoadMore],
  );

  const showSharedBadge =
    sharedEntry && Boolean(focusVideoId) && activeVideoId === focusVideoId;

  return (
    <div
      className="videos-medium-vertical-feed"
      data-videos-medium-vertical-feed=""
      onMouseEnter={() => setPointerOverFeed(true)}
      onMouseLeave={() => setPointerOverFeed(false)}
    >
      <div className="videos-medium-vertical-toolbar">
        <button
          type="button"
          className={`${VIDEO_TOUCH_TARGET} ${VIDEO_CANVAS_FOCUS} ml-auto rounded-full border border-neutral-200 bg-white text-neutral-800`}
          aria-label={isMuted ? "Activer le son" : "Couper le son"}
          onClick={() => setIsMuted((value) => !value)}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" aria-hidden />
          ) : (
            <Volume2 className="h-5 w-5" aria-hidden />
          )}
        </button>
      </div>

      {showSharedBadge ? (
        <p className="videos-medium-shared-badge" role="status">
          {LOCAL_VIDEO_SHARED_BADGE}
        </p>
      ) : null}

      <div className="videos-medium-vertical-stage">
        <LocalVideoFeedViewport
          items={feedItems}
          focusVideoId={programmaticFocusId}
          pointerOverFeed={pointerOverFeed}
          isMuted={isMuted}
          processingErrors={processingErrors}
          onDismissProcessing={onDismissProcessing}
          onActiveVideoChange={setActiveVideoId}
          onOpenComments={setCommentsVideoId}
          onToggleLike={onToggleLike}
          onShare={onShare}
          onOpenMore={(videoId, trigger) => {
            panelTriggerRef.current = trigger;
            setMoreVideoId(videoId);
          }}
          onOpenDescription={(videoId, trigger) => {
            panelTriggerRef.current = trigger;
            setDescriptionVideoId(videoId);
          }}
          suspendedVideoId={suspendedVideoId}
          onEndReached={onLoadMore}
          presentation="medium"
          mediumNav={{
            onPrevious: () => goRelative(-1),
            onNext: () => goRelative(1),
            canPrevious: activeIndex > 0,
            canNext: activeIndex >= 0 && activeIndex < feedItems.length - 1,
          }}
        />
      </div>

      <LocalVideoDescriptionSheet
        video={descriptionVideo}
        returnFocusRef={panelTriggerRef}
        onClose={() => setDescriptionVideoId(null)}
      />

      <LocalVideoMoreMenu
        open={Boolean(moreVideoId)}
        returnFocusRef={panelTriggerRef}
        onClose={() => setMoreVideoId(null)}
        onReport={() => {
          const videoId = moreVideoId;
          setMoreVideoId(null);
          if (videoId) onOpenReport(videoId);
        }}
      />

      <VideoCommentsSheet
        open={Boolean(commentsVideo)}
        video={commentsVideo}
        onClose={() => setCommentsVideoId(null)}
        onCommentCountDelta={onCommentCountDelta}
      />
    </div>
  );
}
