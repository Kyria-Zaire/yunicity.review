"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_DEFAULT_MUTED,
  buildVideoTerritoryLines,
  resolveVideoGoCta,
} from "@yunicity/utils";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { LocalVideoActionRail } from "@/components/videos/local-video-action-rail";
import { LocalVideoGoCta } from "@/components/videos/local-video-go-cta";
import { LocalVideoMetaStrip } from "@/components/videos/local-video-meta-strip";
import { LocalVideoTerritoryBadge } from "@/components/videos/local-video-territory-badge";

type LocalVideoSlideProps = {
  item: LocalVideoFeedItem;
  isActive: boolean;
  onOpenComments: () => void;
};

export function LocalVideoSlide({ item, isActive, onOpenComments }: LocalVideoSlideProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(LOCAL_VIDEO_DEFAULT_MUTED);
  const [showPauseHint, setShowPauseHint] = useState(false);

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

  const togglePause = useCallback(() => {
    setIsPaused((value) => !value);
    setShowPauseHint(true);
    window.setTimeout(() => setShowPauseHint(false), 500);
  }, []);

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
        onClick={togglePause}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-neutral-950/90 via-neutral-950/50 to-transparent" />

      <div className="absolute left-4 top-4 z-10 pt-[env(safe-area-inset-top)] md:top-3">
        <LocalVideoTerritoryBadge lines={territory} />
      </div>

      <button
        type="button"
        onClick={toggleMute}
        className="absolute right-4 top-4 z-10 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-neutral-900/55 text-white backdrop-blur-sm"
        aria-label={isMuted ? "Activer le son" : "Couper le son"}
      >
        {isMuted ? <VolumeX className="h-5 w-5" aria-hidden /> : <Volume2 className="h-5 w-5" aria-hidden />}
      </button>

      {showPauseHint ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {isPaused ? (
            <Play className="h-16 w-16 text-white/90" aria-hidden />
          ) : (
            <Pause className="h-16 w-16 text-white/90" aria-hidden />
          )}
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
          onCommentsClick={onOpenComments}
        />
      </div>
    </article>
  );
}
