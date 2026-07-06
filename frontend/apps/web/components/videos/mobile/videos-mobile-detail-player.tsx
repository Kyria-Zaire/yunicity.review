"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import { formatLocalVideoDuration } from "@yunicity/utils";
import { MapPin, Maximize2, Pause, Play } from "lucide-react";
import { useCallback, useRef, useState } from "react";

type VideosMobileDetailPlayerProps = {
  item: LocalVideoFeedItem;
  onEnded?: () => void;
};

function formatPlayerClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

/** Lecteur vidéo mobile — overlay play, lieu, barre de progression (MOBILE-VIDEOS-02). */
export function VideosMobileDetailPlayer({ item, onEnded }: VideosMobileDetailPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const duration = item.duration_seconds ?? 0;
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const cityLabel = item.city?.trim() || "Reims";

  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      try {
        await video.play();
        setIsPlaying(true);
      } catch {
        /* autoplay bloqué */
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
  }, []);

  const handleSeek = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      if (!video || duration <= 0) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      video.currentTime = ratio * duration;
      setCurrentTime(video.currentTime);
    },
    [duration],
  );

  const handleFullscreen = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (video.requestFullscreen) {
        await video.requestFullscreen();
      }
    } catch {
      /* plein écran indisponible */
    }
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-neutral-950 shadow-md ring-1 ring-neutral-200/80">
      <video
        ref={videoRef}
        src={item.media_url}
        poster={item.thumbnail_url}
        playsInline
        className="aspect-video w-full bg-black object-cover"
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
      />

      <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-yunicity-primary/95 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
        <MapPin className="h-3 w-3" aria-hidden />
        {cityLabel}
      </span>

      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
        {formatLocalVideoDuration(duration)}
      </span>

      {!isPlaying ? (
        <button
          type="button"
          onClick={() => void togglePlay()}
          className="absolute inset-0 flex items-center justify-center bg-black/15"
          aria-label="Lire la vidéo"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/90 bg-black/25 text-white backdrop-blur-sm">
            <Play className="ml-0.5 h-6 w-6 fill-current" aria-hidden />
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => void togglePlay()}
          className="absolute inset-0 flex items-center justify-center bg-transparent"
          aria-label="Mettre en pause"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/35 text-white opacity-0 transition hover:opacity-100 focus-visible:opacity-100">
            <Pause className="h-5 w-5" aria-hidden />
          </span>
        </button>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent px-3 pb-3 pt-8">
        <div
          role="slider"
          aria-label="Progression de la lecture"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={Math.floor(currentTime)}
          tabIndex={0}
          onClick={handleSeek}
          onKeyDown={(event) => {
            const video = videoRef.current;
            if (!video) return;
            if (event.key === "ArrowRight") video.currentTime = Math.min(duration, video.currentTime + 5);
            if (event.key === "ArrowLeft") video.currentTime = Math.max(0, video.currentTime - 5);
          }}
          className="group flex cursor-pointer items-center gap-2"
        >
          <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/30">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-yunicity-primary"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="shrink-0 text-[11px] font-semibold tabular-nums text-white">
            {formatPlayerClock(currentTime)}
          </span>
          <span className="shrink-0 text-[11px] font-medium tabular-nums text-white/75">
            {formatPlayerClock(duration)}
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void handleFullscreen();
            }}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/90 hover:bg-white/15"
            aria-label="Plein écran"
          >
            <Maximize2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
