"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import { LOCAL_VIDEO_DEFAULT_MUTED, type VideosPortalTabId } from "@yunicity/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type Ref } from "react";

import { LocalVideoDescriptionSheet } from "@/components/videos/local-video-description-sheet";
import { LocalVideoFeedViewport } from "@/components/videos/local-video-feed-viewport";
import { LocalVideoMoreMenu } from "@/components/videos/local-video-more-menu";
import { VideosMobileFeedTopBar } from "@/components/videos/mobile/videos-mobile-feed-top-bar";
import { VideoCommentsSheet } from "@/components/videos/video-comments-sheet";
import { useVideosMobileImmersiveViewport } from "@/hooks/use-videos-mobile-immersive-viewport";
import { useActiveReportVideoId } from "@/lib/videos/active-report-video-context";

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
  /** Suspension externe (recherche / filtres ouverts). */
  externalSuspended?: boolean;
  filters?: {
    activeCount: number;
    open: boolean;
    onOpen: () => void;
    buttonRef?: Ref<HTMLButtonElement>;
  };
  search?: {
    open: boolean;
    onOpen: () => void;
    buttonRef?: Ref<HTMLButtonElement>;
  };
};

/**
 * Fil vertical plein écran mobile (≤639px), v2.3 — découverte (Pour vous, Tendances,
 * Nouveautés) ou lien partagé ?video=. Barre haute en surimpression (écran A + F1).
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
  externalSuspended = false,
  filters,
  search,
}: VideosMobileImmersiveFeedProps) {
  const router = useRouter();
  useVideosMobileImmersiveViewport(true);
  const [commentsVideoId, setCommentsVideoId] = useState<string | null>(null);
  const [descriptionVideoId, setDescriptionVideoId] = useState<string | null>(null);
  const [moreVideoId, setMoreVideoId] = useState<string | null>(null);
  /** Déclencheur du panneau ouvert : cible explicite du retour du focus (WebKit). */
  const panelTriggerRef = useRef<HTMLElement | null>(null);
  const activeReportVideoId = useActiveReportVideoId();
  const [activeVideoId, setActiveVideoId] = useState<string | null>(focusVideoId);
  // Règle des panneaux : la vidéo concernée reste en pause tant qu'un panneau est ouvert.
  const panelSuspendedId = commentsVideoId ?? descriptionVideoId ?? moreVideoId ?? activeReportVideoId;
  const suspendedVideoId = externalSuspended
    ? (panelSuspendedId ?? activeVideoId ?? focusVideoId ?? items[0]?.id ?? null)
    : panelSuspendedId;
  const [isMuted, setIsMuted] = useState(LOCAL_VIDEO_DEFAULT_MUTED);
  const [pointerOverFeed, setPointerOverFeed] = useState(false);
  const detailUrlSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const feedItems = useMemo(() => [...items], [items]);

  const commentsVideo = useMemo(
    () => feedItems.find((item) => item.id === commentsVideoId) ?? null,
    [commentsVideoId, feedItems],
  );
  const descriptionVideo = useMemo(
    () => feedItems.find((item) => item.id === descriptionVideoId) ?? null,
    [descriptionVideoId, feedItems],
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
      setActiveVideoId(videoId);
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
          filters={variant === "discovery" ? filters : undefined}
          search={variant === "discovery" ? search : undefined}
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
