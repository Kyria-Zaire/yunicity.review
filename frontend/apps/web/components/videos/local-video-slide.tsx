"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_DEFAULT_MUTED,
  LOCAL_VIDEO_PLAYBACK_ERROR,
  LOCAL_VIDEO_PLAYBACK_FALLBACK,
  isDoubleTap,
  isLocalVideoFeedItemProcessing,
  resolveLocalVideoLayout,
} from "@yunicity/utils";
import { Heart, Pause, Play } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type RefObject,
} from "react";

import { LocalVideoActionRail } from "@/components/videos/local-video-action-rail";
import { LocalVideoMobileMetaOverlay } from "@/components/videos/local-video-mobile-meta-overlay";
import { LocalVideoPlaybackBar } from "@/components/videos/local-video-playback-bar";
import { LocalVideoProcessingSlide } from "@/components/videos/local-video-processing-slide";
import { useDeviceOrientation } from "@/hooks/use-device-orientation";

const SINGLE_TAP_DELAY_MS = 260;
/** Délai avant masquage des overlays pendant la lecture (style Reels / Shorts). */
const CHROME_AUTO_HIDE_MS = 5_000;

/**
 * Chrome masqué : transparent au pointeur pour TOUS ses descendants.
 * Les racines internes (méta, barre de lecture, rail) déclarent
 * `pointer-events-auto` ; sans le `!important` descendant, elles restaient
 * ciblables invisibles et interceptaient l'appui destiné au `<video>`
 * (VIDEO-MOBILE-CHROME-RETURN-01).
 */
const CHROME_HIDDEN_CLASS = "pointer-events-none opacity-0 [&_*]:!pointer-events-none";

/**
 * Focus clavier (et non focus posé par un clic) : seul cas où le chrome doit
 * rester visible tant qu'il contient le focus.
 */
function isKeyboardFocus(target: EventTarget): boolean {
  if (!(target instanceof Element)) return false;
  try {
    return target.matches(":focus-visible");
  } catch {
    // Moteur sans `:focus-visible` : on garde le chrome visible — un focus
    // invisible est le défaut à éviter, un chrome affiché ne l'est pas.
    return true;
  }
}

/** Slide inactive : inert + aria-hidden pour exclure clavier et TA sans démonter le snap. */
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

type LocalVideoSlideProps = {
  item: LocalVideoFeedItem;
  isActive: boolean;
  pointerOverFeed?: boolean;
  processingError?: string | null;
  onDismissProcessing?: () => void;
  onOpenComments: () => void;
  onToggleLike: () => void;
  onShare: () => void;
  onOpenReport: () => void;
  onChromeVisibleChange?: (visible: boolean) => void;
};

export function LocalVideoSlide({
  item,
  isActive,
  pointerOverFeed = false,
  processingError,
  onDismissProcessing,
  onOpenComments,
  onToggleLike,
  onShare,
  onOpenReport,
  onChromeVisibleChange,
}: LocalVideoSlideProps) {
  const articleRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapAtRef = useRef<number | null>(null);
  useSlideInert(articleRef, isActive);
  const singleTapTimerRef = useRef<number | null>(null);
  const hideChromeTimerRef = useRef<number | null>(null);
  const bottomChromeRef = useRef<HTMLDivElement>(null);
  const actionRailRef = useRef<HTMLDivElement>(null);
  /** Vrai tant qu'un focus clavier est dans le chrome : suspend le masquage automatique. */
  const keyboardFocusInChromeRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(LOCAL_VIDEO_DEFAULT_MUTED);
  const [showPauseHint, setShowPauseHint] = useState(false);
  const [likeBurst, setLikeBurst] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaError, setMediaError] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);

  const layout = resolveLocalVideoLayout(item);
  const isPortrait = layout === "portrait";
  const deviceOrientation = useDeviceOrientation();
  const isDeviceLandscape = deviceOrientation === "landscape";
  /** Paysage sur téléphone vertical — rotation CSS silencieuse, sans bouton ni overlay. */
  const useDiscreetLandscapeRotation = !isPortrait && !isDeviceLandscape;
  const duration = item.duration_seconds ?? 0;
  const isPlaying = isActive && !isPaused;

  const clearHideChromeTimer = useCallback(() => {
    if (hideChromeTimerRef.current != null) {
      window.clearTimeout(hideChromeTimerRef.current);
      hideChromeTimerRef.current = null;
    }
  }, []);

  const scheduleChromeHide = useCallback(() => {
    clearHideChromeTimer();
    if (!isActive || isPaused || keyboardFocusInChromeRef.current) return;
    hideChromeTimerRef.current = window.setTimeout(() => {
      hideChromeTimerRef.current = null;
      if (keyboardFocusInChromeRef.current) return;
      setChromeVisible(false);
    }, CHROME_AUTO_HIDE_MS);
  }, [clearHideChromeTimer, isActive, isPaused]);

  const isInsideChrome = useCallback((node: Node): boolean => {
    return Boolean(
      bottomChromeRef.current?.contains(node) || actionRailRef.current?.contains(node),
    );
  }, []);

  /** Focus clavier entrant : chrome réaffiché immédiatement, masquage suspendu. */
  const handleChromeFocus = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      if (!isKeyboardFocus(event.target)) return;
      keyboardFocusInChromeRef.current = true;
      clearHideChromeTimer();
      setChromeVisible(true);
    },
    [clearHideChromeTimer],
  );

  /** Focus sorti du chrome (pas un passage entre deux commandes) : masquage réarmé. */
  const handleChromeBlur = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      const next = event.relatedTarget;
      if (next instanceof Node && isInsideChrome(next)) return;
      if (!keyboardFocusInChromeRef.current) return;
      keyboardFocusInChromeRef.current = false;
      scheduleChromeHide();
    },
    [isInsideChrome, scheduleChromeHide],
  );

  const revealChrome = useCallback(
    (autoHide: boolean) => {
      setChromeVisible(true);
      clearHideChromeTimer();
      if (autoHide && isActive && !isPaused) {
        scheduleChromeHide();
      }
    },
    [clearHideChromeTimer, isActive, isPaused, scheduleChromeHide],
  );

  useEffect(() => {
    if (!isActive) return;
    onChromeVisibleChange?.(chromeVisible);
  }, [chromeVisible, isActive, onChromeVisibleChange]);

  useEffect(() => {
    setCurrentTime(0);
    setIsPaused(false);
    setMediaError(false);
    setChromeVisible(true);
    keyboardFocusInChromeRef.current = false;
    clearHideChromeTimer();
  }, [item.id, clearHideChromeTimer]);

  useEffect(() => {
    if (!isActive) {
      // Slide rendue inert : le focus en sort sans garantie d'événement blur.
      keyboardFocusInChromeRef.current = false;
      setChromeVisible(true);
      clearHideChromeTimer();
      return;
    }
    if (isPaused) {
      setChromeVisible(true);
      clearHideChromeTimer();
      return;
    }
    revealChrome(true);
  }, [isActive, isPaused, revealChrome, clearHideChromeTimer]);

  useEffect(() => {
    if (!isActive) return;
    if (pointerOverFeed) {
      revealChrome(true);
      return;
    }
    if (!isPaused) {
      scheduleChromeHide();
    }
  }, [isActive, isPaused, pointerOverFeed, revealChrome, scheduleChromeHide]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || mediaError) return;
    if (isActive && !isPaused) {
      void video.play().catch(() => setIsPaused(true));
    } else {
      video.pause();
    }
  }, [isActive, isPaused, mediaError]);

  const handleMediaError = useCallback(() => {
    setMediaError(true);
    setIsPaused(true);
    videoRef.current?.pause();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current != null) {
        window.clearTimeout(singleTapTimerRef.current);
      }
      clearHideChromeTimer();
    };
  }, [clearHideChromeTimer]);

  const triggerLikeFeedback = useCallback(() => {
    setLikeBurst(true);
    setLikeAnimating(true);
    window.setTimeout(() => setLikeBurst(false), 700);
    window.setTimeout(() => setLikeAnimating(false), 220);
  }, []);

  const handleLike = useCallback(() => {
    revealChrome(true);
    triggerLikeFeedback();
    onToggleLike();
  }, [onToggleLike, revealChrome, triggerLikeFeedback]);

  const togglePause = useCallback(() => {
    setIsPaused((wasPaused) => {
      const next = !wasPaused;
      if (next) {
        setChromeVisible(true);
        clearHideChromeTimer();
      } else {
        revealChrome(true);
      }
      return next;
    });
    setShowPauseHint(true);
    window.setTimeout(() => setShowPauseHint(false), 500);
  }, [clearHideChromeTimer, revealChrome]);

  const handleVideoTap = useCallback(() => {
    const now = Date.now();
    if (isDoubleTap(lastTapAtRef.current, now)) {
      if (singleTapTimerRef.current != null) {
        window.clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapAtRef.current = null;
      if (!item.liked_by_me) {
        handleLike();
      } else {
        revealChrome(true);
        triggerLikeFeedback();
      }
      return;
    }

    lastTapAtRef.current = now;
    singleTapTimerRef.current = window.setTimeout(() => {
      if (!chromeVisible && isPlaying) {
        setIsPaused(true);
        setChromeVisible(true);
        clearHideChromeTimer();
      } else {
        togglePause();
      }
      singleTapTimerRef.current = null;
    }, SINGLE_TAP_DELAY_MS);
  }, [
    chromeVisible,
    clearHideChromeTimer,
    handleLike,
    isPlaying,
    item.liked_by_me,
    revealChrome,
    togglePause,
    triggerLikeFeedback,
  ]);

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

  const chromeTransition =
    "transition-opacity duration-300 ease-out motion-reduce:transition-none";

  if (isLocalVideoFeedItemProcessing(item)) {
    return (
      <LocalVideoProcessingSlide
        item={item}
        errorMessage={processingError}
        onDismiss={onDismissProcessing}
        isActive={isActive}
      />
    );
  }

  return (
    <article
      ref={articleRef}
      data-video-slide-id={item.id}
      data-videos-media-layout={layout}
      data-videos-slide-chrome-visible={chromeVisible ? "" : undefined}
      className="relative h-full min-h-full w-full snap-start snap-always overflow-hidden bg-black"
    >
      {useDiscreetLandscapeRotation ? (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            src={item.media_url}
            poster={item.thumbnail_url}
            className="h-[100vw] w-[100vh] rotate-90 object-cover"
            playsInline
            loop
            muted={isMuted}
            preload="metadata"
            onClick={handleVideoTap}
            onError={handleMediaError}
            onTimeUpdate={() => {
              const video = videoRef.current;
              if (video) setCurrentTime(video.currentTime);
            }}
          >
            {LOCAL_VIDEO_PLAYBACK_FALLBACK}
          </video>
        </div>
      ) : (
        <video
          ref={videoRef}
          src={item.media_url}
          poster={item.thumbnail_url}
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          loop
          muted={isMuted}
          preload="metadata"
          onClick={handleVideoTap}
          onError={handleMediaError}
          onTimeUpdate={() => {
            const video = videoRef.current;
            if (video) setCurrentTime(video.currentTime);
          }}
        >
          {LOCAL_VIDEO_PLAYBACK_FALLBACK}
        </video>
      )}

      {mediaError ? (
        <p
          className="pointer-events-none absolute inset-x-0 bottom-[38%] z-30 px-6 text-center text-sm font-semibold text-white drop-shadow"
          role="alert"
        >
          {LOCAL_VIDEO_PLAYBACK_ERROR}
        </p>
      ) : null}

      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-neutral-950/45 ${chromeTransition} ${
          chromeVisible ? "opacity-100" : "opacity-0"
        }`}
      />

      {showPauseHint ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          {isPaused ? (
            <Play className="h-16 w-16 text-white/90" aria-hidden />
          ) : (
            <Pause className="h-16 w-16 text-white/90" aria-hidden />
          )}
        </div>
      ) : null}

      {likeBurst ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <Heart className="h-24 w-24 animate-ping text-rose-400/90 fill-rose-400/80 motion-reduce:animate-none" aria-hidden />
        </div>
      ) : null}

      <div
        ref={bottomChromeRef}
        onFocus={handleChromeFocus}
        onBlur={handleChromeBlur}
        className={`videos-slide-bottom-chrome absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pr-[4.75rem] ${chromeTransition} ${
          // Visible : conteneur transparent au pointeur, seuls les éléments
          // interactifs (pointer-events-auto) captent l'appui.
          chromeVisible ? "pointer-events-none opacity-100" : CHROME_HIDDEN_CLASS
        }`}
      >
        <div className="min-w-0 space-y-2">
          <LocalVideoMobileMetaOverlay item={item} />
          <LocalVideoPlaybackBar
            currentTime={currentTime}
            duration={duration}
            isPaused={isPaused}
            isMuted={isMuted}
            onTogglePause={() => {
              revealChrome(true);
              togglePause();
            }}
            onToggleMute={() => {
              revealChrome(true);
              setIsMuted((value) => !value);
            }}
            onSeek={handleSeek}
          />
        </div>
      </div>

      <div
        ref={actionRailRef}
        onFocus={handleChromeFocus}
        onBlur={handleChromeBlur}
        className={`videos-slide-action-rail absolute right-3 bottom-[var(--videos-mobile-action-rail-bottom,1.75rem)] z-20 ${chromeTransition} ${
          chromeVisible ? "opacity-100" : CHROME_HIDDEN_CLASS
        }`}
      >
        <LocalVideoActionRail
          item={item}
          likeCount={item.like_count}
          commentCount={item.comment_count}
          likedByMe={item.liked_by_me}
          likeAnimating={likeAnimating}
          onLikeClick={() => void handleLike()}
          onCommentsClick={() => {
            revealChrome(true);
            onOpenComments();
          }}
          onShareClick={() => {
            revealChrome(true);
            void onShare();
          }}
          onReportClick={() => {
            revealChrome(true);
            onOpenReport();
          }}
        />
      </div>
    </article>
  );
}
