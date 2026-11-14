"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_PLAYBACK_FALLBACK,
  isLocalVideoFeedItemProcessing,
  resolveLocalVideoLayout,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";

import { LocalVideoActionRail } from "@/components/videos/local-video-action-rail";
import { LocalVideoMobileMetaOverlay } from "@/components/videos/local-video-mobile-meta-overlay";
import { LocalVideoPlaybackBar } from "@/components/videos/local-video-playback-bar";
import { LocalVideoProcessingSlide } from "@/components/videos/local-video-processing-slide";
import { LocalVideoProgressThread } from "@/components/videos/local-video-progress-thread";
import { LocalVideoLandscapeStage, LocalVideoPortraitFrame } from "@/components/videos/local-video-slide-frames";
import { LocalVideoSlideOverlays } from "@/components/videos/local-video-slide-overlays";
import { useSlideChrome } from "@/hooks/use-slide-chrome";
import { usePauseWhileOpen } from "@/hooks/use-pause-while-open";
import { useSlideGestures } from "@/hooks/use-slide-gestures";

/** Diapositive inactive : inert + aria-hidden pour exclure clavier et TA sans démonter le snap. */
function useSlideInert(articleRef: RefObject<HTMLElement | null>, isActive: boolean): void {
  useEffect(() => {
    const element = articleRef.current;
    if (!element) return;
    element.inert = !isActive;
    if (isActive) {
      element.removeAttribute("aria-hidden");
    } else {
      element.setAttribute("aria-hidden", "true");
    }
  }, [articleRef, isActive]);
}

type FullscreenCapableVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

/** Plein écran : API standard, sinon lecteur natif d'iOS (Safari iPhone n'a pas la première). */
function enterVideoFullscreen(video: FullscreenCapableVideo | null): void {
  if (!video) return;
  if (typeof video.requestFullscreen === "function") {
    video.requestFullscreen().catch(() => video.webkitEnterFullscreen?.());
    return;
  }
  video.webkitEnterFullscreen?.();
}

type LocalVideoSlideProps = {
  item: LocalVideoFeedItem;
  isActive: boolean;
  /** Son coupé : réglage du fil (pastille de la barre haute), commun à toutes les vidéos. */
  isMuted: boolean;
  pointerOverFeed?: boolean;
  processingError?: string | null;
  onDismissProcessing?: () => void;
  onOpenComments: () => void;
  onToggleLike: () => void;
  onShare: () => void;
  /** « … » (écran I) ; reçoit le bouton, cible du retour du focus. */
  onOpenMore: (trigger: HTMLElement) => void;
  /** « plus » de la légende (écran E) ; reçoit le bouton. */
  onOpenDescription: (trigger: HTMLElement) => void;
  /** Un panneau est ouvert sur cette vidéo : pause, reprise seulement si elle jouait. */
  suspended?: boolean;
  onChromeVisibleChange?: (visible: boolean) => void;
};

/**
 * Diapositive du fil immersif mobile v2.3 (écrans A, B, C, D, K, L).
 * Appui : pause et retour de la barre ; second appui : reprise ; double appui : J'aime.
 */
export function LocalVideoSlide({
  item,
  isActive,
  isMuted,
  pointerOverFeed = false,
  processingError,
  onDismissProcessing,
  onOpenComments,
  onToggleLike,
  onShare,
  onOpenMore,
  onOpenDescription,
  suspended = false,
  onChromeVisibleChange,
}: LocalVideoSlideProps) {
  const articleRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  useSlideInert(articleRef, isActive);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaError, setMediaError] = useState(false);

  // Remise à zéro par vidéo, déclarée AVANT les hooks de lecture : ses effets s'exécutent
  // ensuite et peuvent mettre en pause (panneau déjà ouvert) sans être écrasés ici.
  useEffect(() => {
    setCurrentTime(0);
    setIsPaused(false);
    setMediaError(false);
  }, [item.id]);

  const containers = useMemo(() => [bandRef, actionsRef] as const, []);
  const chrome = useSlideChrome({ itemId: item.id, isActive, isPaused, pointerOverFeed, containers, onChromeVisibleChange });
  const { chromeVisible, revealChrome } = chrome;
  const gestures = useSlideGestures({
    likedByMe: item.liked_by_me,
    isPlaying: isActive && !isPaused,
    chrome,
    setIsPaused,
    onToggleLike,
  });
  const { togglePause } = gestures;
  usePauseWhileOpen(suspended, isActive && !isPaused, setIsPaused);

  const layout = resolveLocalVideoLayout(item);
  const isPortrait = layout === "portrait";
  const duration = item.duration_seconds ?? 0;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || mediaError) return;
    if (isActive && !isPaused) {
      void video.play().catch(() => setIsPaused(true));
    } else {
      video.pause();
    }
  }, [isActive, isPaused, mediaError]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = isMuted;
  }, [isMuted]);

  const handleMediaError = useCallback(() => {
    setMediaError(true);
    setIsPaused(true);
    videoRef.current?.pause();
  }, []);

  const handleSeek = useCallback(
    (ratio: number) => {
      const video = videoRef.current;
      if (!video || duration <= 0) return;
      video.currentTime = ratio * duration;
      setCurrentTime(video.currentTime);
      revealChrome(true);
    },
    [duration, revealChrome],
  );

  const resumeOrPause = useCallback(() => {
    revealChrome(true);
    togglePause();
  }, [revealChrome, togglePause]);

  if (isLocalVideoFeedItemProcessing(item)) {
    return (
      <LocalVideoProcessingSlide item={item} errorMessage={processingError} onDismiss={onDismissProcessing} isActive={isActive} />
    );
  }

  const parts = {
    video: (
      <video
        ref={videoRef}
        src={item.media_url}
        poster={item.thumbnail_url}
        className={`absolute inset-0 h-full w-full ${isPortrait ? "object-cover" : "object-contain"}`}
        playsInline
        loop
        muted={isMuted}
        preload="metadata"
        onClick={gestures.handleVideoTap}
        onError={handleMediaError}
        onTimeUpdate={() => {
          const element = videoRef.current;
          if (element) setCurrentTime(element.currentTime);
        }}
      >
        {LOCAL_VIDEO_PLAYBACK_FALLBACK}
      </video>
    ),
    overlays: (
      <LocalVideoSlideOverlays
        mediaError={mediaError}
        isPaused={isPaused}
        showResumeHint={gestures.showResumeHint}
        likeBurst={gestures.likeBurst}
        suspended={suspended}
        onResume={resumeOrPause}
      />
    ),
    meta: (
      <LocalVideoMobileMetaOverlay
        item={item}
        onExpandDescription={(trigger) => {
          revealChrome(true);
          onOpenDescription(trigger);
        }}
      />
    ),
    bar: chromeVisible ? (
      <LocalVideoPlaybackBar
        currentTime={currentTime}
        duration={duration}
        isPaused={isPaused}
        onTogglePause={resumeOrPause}
        onSeek={handleSeek}
      />
    ) : null,
    thread: chromeVisible ? null : <LocalVideoProgressThread currentTime={currentTime} duration={duration} />,
    actions: (
      <LocalVideoActionRail
        likeCount={item.like_count}
        commentCount={item.comment_count}
        likedByMe={item.liked_by_me}
        likeAnimating={gestures.likeAnimating}
        surface={isPortrait ? "overlay" : "stage"}
        onLikeClick={gestures.handleLike}
        onCommentsClick={() => {
          revealChrome(true);
          onOpenComments();
        }}
        onShareClick={() => {
          revealChrome(true);
          onShare();
        }}
        onMoreClick={(trigger) => {
          revealChrome(true);
          onOpenMore(trigger);
        }}
      />
    ),
    bandRef,
    actionsRef,
    onChromeFocus: chrome.handleChromeFocus,
    onChromeBlur: chrome.handleChromeBlur,
  };

  return (
    <article
      ref={articleRef}
      data-video-slide-id={item.id}
      data-videos-media-layout={layout}
      data-videos-slide-chrome-visible={chromeVisible ? "" : undefined}
      className={`relative h-full min-h-full w-full snap-start snap-always overflow-hidden ${isPortrait ? "bg-black" : "bg-[#111827]"}`}
    >
      {isPortrait ? (
        <LocalVideoPortraitFrame {...parts} />
      ) : (
        <LocalVideoLandscapeStage
          {...parts}
          aspectRatio={`${item.media_width ?? 16} / ${item.media_height ?? 9}`}
          onFullscreen={() => enterVideoFullscreen(videoRef.current)}
        />
      )}
    </article>
  );
}
