"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_PLAYBACK_FALLBACK,
  LOCAL_VIDEO_SHARED_BADGE,
  isLocalVideoFeedItemProcessing,
  resolveLocalVideoLayout,
  resolveLocalVideoLayoutFromDims,
} from "@yunicity/utils";
import { Link2, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";

import { LocalVideoActionRail } from "@/components/videos/local-video-action-rail";
import { LocalVideoMobileMetaOverlay } from "@/components/videos/local-video-mobile-meta-overlay";
import { LocalVideoPlaybackBar } from "@/components/videos/local-video-playback-bar";
import { LocalVideoProcessingSlide } from "@/components/videos/local-video-processing-slide";
import { LocalVideoProgressThread } from "@/components/videos/local-video-progress-thread";
import {
  LocalVideoLandscapeStage,
  LocalVideoMediumLandscapeStage,
  LocalVideoMediumPortraitStage,
  LocalVideoPortraitFrame,
} from "@/components/videos/local-video-slide-frames";
import { LocalVideoSlideOverlays } from "@/components/videos/local-video-slide-overlays";
import { useSlideChrome } from "@/hooks/use-slide-chrome";
import { usePauseWhileOpen } from "@/hooks/use-pause-while-open";
import { useSlideGestures } from "@/hooks/use-slide-gestures";
import { VIDEO_IMMERSIVE_FOCUS } from "@/lib/videos/video-playback-a11y";

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
  /**
   * `immersive` : mobile plein cadre (défaut).
   * `medium` : v1.2 — cadre au ratio média + colonne latérale (≠ R-PAN).
   */
  presentation?: "immersive" | "medium";
  mediumNav?: {
    onPrevious: () => void;
    onNext: () => void;
    canPrevious: boolean;
    canNext: boolean;
  } | null;
  /** Medium : bascule son (bouton dans le cadre vidéo, maquette v1.2). */
  onToggleMute?: () => void;
  /** Medium : badge « Vidéo partagée » dans le cadre (une seule fois). */
  showSharedBadge?: boolean;
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
  presentation = "immersive",
  mediumNav = null,
  onToggleMute,
  showSharedBadge = false,
}: LocalVideoSlideProps) {
  const articleRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  useSlideInert(articleRef, isActive);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaError, setMediaError] = useState(false);
  /** Intrinsèques lues une fois si l'API n'a pas de dimensions — évite un basculement paysage→portrait. */
  const [probedDims, setProbedDims] = useState<{ width: number; height: number } | null>(null);

  // Remise à zéro par vidéo, déclarée AVANT les hooks de lecture : ses effets s'exécutent
  // ensuite et peuvent mettre en pause (panneau déjà ouvert) sans être écrasés ici.
  useEffect(() => {
    setCurrentTime(0);
    setIsPaused(false);
    setMediaError(false);
    setProbedDims(null);
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

  const mediaWidth = item.media_width ?? probedDims?.width ?? null;
  const mediaHeight = item.media_height ?? probedDims?.height ?? null;
  const resolvedLayout =
    presentation === "medium"
      ? resolveLocalVideoLayoutFromDims(mediaWidth, mediaHeight)
      : resolveLocalVideoLayout(item);
  // Medium sans dims : attendre les métadonnées (pas de composition inventée).
  const layout = resolvedLayout ?? (presentation === "medium" ? null : "landscape");
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

  const objectFitClass =
    presentation === "medium"
      ? isPortrait
        ? "object-cover"
        : "object-contain"
      : isPortrait
        ? "object-cover"
        : "object-contain";

  const sharedBadgeNode =
    presentation === "medium" && showSharedBadge ? (
      <div
        role="status"
        className="pointer-events-none absolute left-3 top-3 z-20 flex h-8 items-center gap-1.5 rounded-full bg-[rgba(17,24,39,0.75)] px-3 text-[13px] font-semibold text-white"
        data-videos-medium-shared-badge=""
      >
        <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {LOCAL_VIDEO_SHARED_BADGE}
      </div>
    ) : null;

  const parts = {
    video: (
      <video
        ref={videoRef}
        src={item.media_url}
        poster={item.thumbnail_url}
        className={`absolute inset-0 h-full w-full ${objectFitClass}`}
        playsInline
        loop
        muted={isMuted}
        preload="metadata"
        onClick={gestures.handleVideoTap}
        onError={handleMediaError}
        onLoadedMetadata={() => {
          if (item.media_width && item.media_height) return;
          const element = videoRef.current;
          if (!element || element.videoWidth <= 0 || element.videoHeight <= 0) return;
          setProbedDims((prev) => prev ?? { width: element.videoWidth, height: element.videoHeight });
        }}
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
        surface={presentation === "medium" && layout === "landscape" ? "panel" : "overlay"}
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
        surface={
          presentation === "medium" ? "side" : isPortrait ? "overlay" : "stage"
        }
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
    muteControl:
      presentation === "medium" && onToggleMute ? (
        <button
          type="button"
          aria-label={isMuted ? "Activer le son" : "Couper le son"}
          onClick={onToggleMute}
          className={`absolute right-1.5 top-1.5 z-20 flex h-11 w-11 items-center justify-center text-white ${VIDEO_IMMERSIVE_FOCUS}`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(17,24,39,0.6)]">
            {isMuted ? (
              <VolumeX className="h-[18px] w-[18px]" aria-hidden />
            ) : (
              <Volume2 className="h-[18px] w-[18px]" aria-hidden />
            )}
          </span>
        </button>
      ) : null,
    bandRef,
    actionsRef,
    onChromeFocus: chrome.handleChromeFocus,
    onChromeBlur: chrome.handleChromeBlur,
  };

  const mediumReady = presentation === "medium" && layout != null;
  const mediumPortrait = mediumReady && isPortrait;
  const mediumLandscape = mediumReady && !isPortrait;

  return (
    <article
      ref={articleRef}
      data-video-slide-id={item.id}
      data-videos-media-layout={layout ?? "pending"}
      data-videos-slide-presentation={presentation}
      data-videos-slide-chrome-visible={chromeVisible ? "" : undefined}
      className={`relative h-full min-h-full w-full snap-start snap-always overflow-hidden ${
        presentation === "medium" ? "bg-white" : isPortrait ? "bg-black" : "bg-[#111827]"
      }`}
    >
      {mediumPortrait ? (
        <LocalVideoMediumPortraitStage
          {...parts}
          nav={isActive ? mediumNav : null}
          mediaWidth={mediaWidth}
          mediaHeight={mediaHeight}
          sharedBadge={sharedBadgeNode}
        />
      ) : mediumLandscape ? (
        <LocalVideoMediumLandscapeStage
          {...parts}
          nav={isActive ? mediumNav : null}
          mediaWidth={mediaWidth}
          mediaHeight={mediaHeight}
          sharedBadge={sharedBadgeNode}
          onFullscreen={() => enterVideoFullscreen(videoRef.current)}
        />
      ) : presentation === "medium" ? (
        <div
          className="relative h-full w-full bg-white"
          data-videos-medium-layout-pending=""
          aria-busy="true"
        >
          {/* Vidéo montée (métadonnées) sans composer une fausse orientation. */}
          <div className="pointer-events-none absolute inset-0 opacity-0">{parts.video}</div>
        </div>
      ) : isPortrait ? (
        <LocalVideoPortraitFrame {...parts} />
      ) : (
        <LocalVideoLandscapeStage
          {...parts}
          aspectRatio={`${mediaWidth ?? 16} / ${mediaHeight ?? 9}`}
          onFullscreen={() => enterVideoFullscreen(videoRef.current)}
        />
      )}
    </article>
  );
}
