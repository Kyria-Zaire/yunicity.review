"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_DEFAULT_MUTED,
  isDoubleTap,
  isLocalVideoFeedItemProcessing,
  resolveLocalVideoLayout,
} from "@yunicity/utils";
import { Heart, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { LocalVideoActionRail } from "@/components/videos/local-video-action-rail";
import { LocalVideoMobileMetaOverlay } from "@/components/videos/local-video-mobile-meta-overlay";
import { LocalVideoPlaybackBar } from "@/components/videos/local-video-playback-bar";
import { LocalVideoProcessingSlide } from "@/components/videos/local-video-processing-slide";
import { useDeviceOrientation } from "@/hooks/use-device-orientation";

const SINGLE_TAP_DELAY_MS = 260;
/** Délai avant masquage des overlays pendant la lecture (style Reels / Shorts). */
const CHROME_AUTO_HIDE_MS = 5_000;

type LocalVideoSlideProps = {
  item: LocalVideoFeedItem;
  isActive: boolean;
  pointerOverFeed?: boolean;
  processingError?: string | null;
  onDismissProcessing?: () => void;
  onOpenComments: () => void;
  onToggleLike: () => void;
  onShare: () => void;
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
  onChromeVisibleChange,
}: LocalVideoSlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapAtRef = useRef<number | null>(null);
  const singleTapTimerRef = useRef<number | null>(null);
  const hideChromeTimerRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(LOCAL_VIDEO_DEFAULT_MUTED);
  const [showPauseHint, setShowPauseHint] = useState(false);
  const [likeBurst, setLikeBurst] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
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
    if (!isActive || isPaused) return;
    hideChromeTimerRef.current = window.setTimeout(() => {
      setChromeVisible(false);
      hideChromeTimerRef.current = null;
    }, CHROME_AUTO_HIDE_MS);
  }, [clearHideChromeTimer, isActive, isPaused]);

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
    setChromeVisible(true);
    clearHideChromeTimer();
  }, [item.id, clearHideChromeTimer]);

  useEffect(() => {
    if (!isActive) {
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
    if (!video) return;
    if (isActive && !isPaused) {
      void video.play().catch(() => setIsPaused(true));
    } else {
      video.pause();
    }
  }, [isActive, isPaused]);

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
      />
    );
  }

  return (
    <article
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
            onTimeUpdate={() => {
              const video = videoRef.current;
              if (video) setCurrentTime(video.currentTime);
            }}
          />
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
          onTimeUpdate={() => {
            const video = videoRef.current;
            if (video) setCurrentTime(video.currentTime);
          }}
        />
      )}

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
          <Heart className="h-24 w-24 animate-ping text-rose-400/90 fill-rose-400/80" aria-hidden />
        </div>
      ) : null}

      <div
        className={`videos-slide-bottom-chrome absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pr-[4.75rem] ${chromeTransition} ${
          chromeVisible ? "opacity-100" : "pointer-events-none opacity-0"
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
        className={`videos-slide-action-rail absolute right-3 bottom-[var(--videos-mobile-action-rail-bottom,1.75rem)] z-20 ${chromeTransition} ${
          chromeVisible ? "opacity-100" : "pointer-events-none opacity-0"
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
        />
      </div>
    </article>
  );
}
