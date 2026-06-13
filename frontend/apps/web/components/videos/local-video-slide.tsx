"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_DEFAULT_MUTED,
  buildVideoTerritoryLines,
  isDoubleTap,
  resolveVideoGoCta,
} from "@yunicity/utils";
import { Heart, MoreVertical, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { LocalVideoActionRail } from "@/components/videos/local-video-action-rail";
import { LocalVideoGoCta } from "@/components/videos/local-video-go-cta";
import { LocalVideoMetaStrip } from "@/components/videos/local-video-meta-strip";
import { LocalVideoTerritoryBadge } from "@/components/videos/local-video-territory-badge";

const SINGLE_TAP_DELAY_MS = 260;

type LocalVideoSlideProps = {
  item: LocalVideoFeedItem;
  isActive: boolean;
  onOpenComments: () => void;
  onToggleLike: () => void;
  onShare: () => void;
  onOpenReport: () => void;
};

export function LocalVideoSlide({
  item,
  isActive,
  onOpenComments,
  onToggleLike,
  onShare,
  onOpenReport,
}: LocalVideoSlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTapAtRef = useRef<number | null>(null);
  const singleTapTimerRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(LOCAL_VIDEO_DEFAULT_MUTED);
  const [showPauseHint, setShowPauseHint] = useState(false);
  const [likeBurst, setLikeBurst] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);

  const territory = buildVideoTerritoryLines(item);
  const cta = resolveVideoGoCta(item);

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
    };
  }, []);

  const triggerLikeFeedback = useCallback(() => {
    setLikeBurst(true);
    setLikeAnimating(true);
    window.setTimeout(() => setLikeBurst(false), 700);
    window.setTimeout(() => setLikeAnimating(false), 220);
  }, []);

  const handleLike = useCallback(() => {
    triggerLikeFeedback();
    onToggleLike();
  }, [onToggleLike, triggerLikeFeedback]);

  const togglePause = useCallback(() => {
    setIsPaused((value) => !value);
    setShowPauseHint(true);
    window.setTimeout(() => setShowPauseHint(false), 500);
  }, []);

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
        triggerLikeFeedback();
      }
      return;
    }

    lastTapAtRef.current = now;
    singleTapTimerRef.current = window.setTimeout(() => {
      togglePause();
      singleTapTimerRef.current = null;
    }, SINGLE_TAP_DELAY_MS);
  }, [handleLike, item.liked_by_me, togglePause, triggerLikeFeedback]);

  const toggleMute = useCallback(() => {
    setIsMuted((value) => !value);
  }, []);

  return (
    <article
      data-video-slide-id={item.id}
      className="relative h-[100dvh] w-full snap-start snap-always overflow-hidden bg-black md:h-[calc(100dvh-6rem)] md:rounded-2xl"
    >
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
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-neutral-950/90 via-neutral-950/50 to-transparent" />

      <div className="absolute left-4 top-4 z-10 pt-[env(safe-area-inset-top)] md:top-3">
        <LocalVideoTerritoryBadge lines={territory} />
      </div>

      <div className="absolute right-4 top-4 z-10 flex items-center gap-2 pt-[env(safe-area-inset-top)] md:top-3">
        <button
          type="button"
          onClick={onOpenReport}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-neutral-900/55 text-white backdrop-blur-sm"
          aria-label="Options de la vidéo"
        >
          <MoreVertical className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={toggleMute}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-neutral-900/55 text-white backdrop-blur-sm"
          aria-label={isMuted ? "Activer le son" : "Couper le son"}
        >
          {isMuted ? <VolumeX className="h-5 w-5" aria-hidden /> : <Volume2 className="h-5 w-5" aria-hidden />}
        </button>
      </div>

      {showPauseHint ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {isPaused ? (
            <Play className="h-16 w-16 text-white/90" aria-hidden />
          ) : (
            <Pause className="h-16 w-16 text-white/90" aria-hidden />
          )}
        </div>
      ) : null}

      {likeBurst ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <Heart className="h-24 w-24 animate-ping text-rose-400/90 fill-rose-400/80" aria-hidden />
        </div>
      ) : null}

      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-10 flex items-end gap-4 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="min-w-0 flex-1 space-y-3 pb-1">
          <LocalVideoMetaStrip item={item} />
          <LocalVideoGoCta cta={cta} />
        </div>
        <LocalVideoActionRail
          likeCount={item.like_count}
          commentCount={item.comment_count}
          likedByMe={item.liked_by_me}
          likeAnimating={likeAnimating}
          onLikeClick={() => void handleLike()}
          onCommentsClick={onOpenComments}
          onShareClick={() => void onShare()}
        />
      </div>
    </article>
  );
}
