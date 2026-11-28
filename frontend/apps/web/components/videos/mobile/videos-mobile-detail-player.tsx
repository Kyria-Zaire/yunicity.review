"use client";

import type { LocalVideoFeedItem } from "@yunicity/types";
import {
  LOCAL_VIDEO_PLAYBACK_ERROR,
  LOCAL_VIDEO_PLAYBACK_FALLBACK,
  formatLocalVideoDuration,
} from "@yunicity/utils";
import { MapPin, Maximize2, Pause, Play } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { VIDEO_IMMERSIVE_FOCUS, VIDEO_TOUCH_TARGET, formatVideoClock,
  formatVideoProgressValueText,
  handleVideoProgressKeyDown,
} from "@/lib/videos/video-playback-a11y";
import { resolveMobileDetailObjectFit, isPortraitMediumDetail } from "@/lib/videos/video-detail-object-fit";

type VideosMobileDetailPlayerProps = {
  item: LocalVideoFeedItem;
  onEnded?: () => void;
  /** Detail medium : portrait entier visible (contain), paysage inchangé. */
  portraitContain?: boolean;
};

/** Lecteur vidéo mobile — overlay play, lieu, barre de progression (MOBILE-VIDEOS-02). */
export function VideosMobileDetailPlayer({ item, onEnded, portraitContain = false }: VideosMobileDetailPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaError, setMediaError] = useState(false);
  const duration = item.duration_seconds ?? 0;
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const valueText = formatVideoProgressValueText(currentTime, duration);
  const cityLabel = item.city?.trim() || "Reims";

  const togglePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video || mediaError) return;
    if (video.paused) {
      try {
        await video.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [mediaError]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
  }, []);

  const seekToRatio = useCallback(
    (ratio: number) => {
      const video = videoRef.current;
      if (!video || duration <= 0) return;
      video.currentTime = ratio * duration;
      setCurrentTime(video.currentTime);
    },
    [duration],
  );

  const handleSeekClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (duration <= 0) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      seekToRatio(ratio);
    },
    [duration, seekToRatio],
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

  const handleMediaError = useCallback(() => {
    setMediaError(true);
    setIsPlaying(false);
    videoRef.current?.pause();
  }, []);

  const objectFitClass = resolveMobileDetailObjectFit(
    item.media_width,
    item.media_height,
    portraitContain,
  );
  const isPortraitMedium = isPortraitMediumDetail(
    item.media_width,
    item.media_height,
    portraitContain,
  );

  // Couches (VIDEO-MEDIUM-CONTROLS-01) — la vidéo est opaque : toute commande doit être déclarée
  // au-dessus d'elle, jamais laissée à l'ordre du DOM. `isolate` confine ces z-index au lecteur.
  // z-0 poster · z-10 vidéo · z-20 badges puis Lire / Pause (pleine surface) · z-30 barre basse, erreur.
  // Les badges partagent la couche de Lire et le précèdent dans le DOM : le voile de Lire les couvre au
  // repos, comme avant ; ils restent au-dessus de la vidéo et ne captent aucun appui.
  return (
    <div className="relative isolate overflow-hidden rounded-2xl bg-neutral-950 shadow-md ring-1 ring-neutral-200/80">
      {isPortraitMedium && !isPlaying && !mediaError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbnail_url}
          alt=""
          className="absolute inset-0 z-0 h-full w-full bg-black object-contain object-center"
        />
      ) : null}
      <video
        ref={videoRef}
        src={item.media_url}
        poster={isPortraitMedium ? undefined : item.thumbnail_url}
        playsInline
        className={`relative z-10 aspect-video w-full bg-black ${objectFitClass} ${
          isPortraitMedium && !isPlaying && !mediaError ? "pointer-events-none opacity-0" : ""
        }`}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          onEnded?.();
        }}
        onError={handleMediaError}
      >
        {LOCAL_VIDEO_PLAYBACK_FALLBACK}
      </video>

      {mediaError ? (
        <p className="pointer-events-none absolute inset-x-0 bottom-16 z-30 px-3 text-center text-sm font-semibold text-white" role="alert">
          {LOCAL_VIDEO_PLAYBACK_ERROR}
        </p>
      ) : null}

      <span className="pointer-events-none absolute left-3 top-3 z-20 inline-flex items-center gap-1 rounded-full bg-yunicity-primary/95 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
        <MapPin className="h-3 w-3" aria-hidden />
        {cityLabel}
      </span>

      <span className="pointer-events-none absolute right-3 top-3 z-20 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
        {formatLocalVideoDuration(duration)}
      </span>

      {!mediaError && !isPlaying ? (
        <button
          type="button"
          onClick={() => void togglePlay()}
          className={`absolute inset-0 z-20 flex items-center justify-center bg-black/15 ${VIDEO_IMMERSIVE_FOCUS} focus-visible:ring-inset`}
          aria-label="Lire la vidéo"
          aria-pressed={false}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/90 bg-black/25 text-white backdrop-blur-sm">
            <Play className="ml-0.5 h-6 w-6 fill-current" aria-hidden />
          </span>
        </button>
      ) : !mediaError ? (
        <button
          type="button"
          onClick={() => void togglePlay()}
          className={`absolute inset-0 z-20 flex items-center justify-center bg-transparent ${VIDEO_IMMERSIVE_FOCUS} focus-visible:ring-inset`}
          aria-label="Mettre en pause"
          aria-pressed
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/35 text-white">
            <Pause className="h-5 w-5" aria-hidden />
          </span>
        </button>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/70 via-black/35 to-transparent px-3 pb-3 pt-8">
        <div className="flex items-center gap-2">
          <div
            role="slider"
            aria-label="Progression de la lecture"
            aria-valuemin={0}
            aria-valuemax={duration > 0 ? duration : 0}
            aria-valuenow={duration > 0 ? Math.floor(currentTime) : 0}
            aria-valuetext={valueText || undefined}
            tabIndex={duration > 0 && !mediaError ? 0 : -1}
            onClick={handleSeekClick}
            onKeyDown={(event) => {
              handleVideoProgressKeyDown(event, currentTime, duration, seekToRatio);
            }}
            className={`group pointer-events-auto flex min-h-11 min-w-0 flex-1 cursor-pointer items-center rounded-full ${VIDEO_IMMERSIVE_FOCUS}`}
          >
            <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/30">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-yunicity-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="sr-only" aria-live="off">
            {valueText}
          </span>
          <span className="shrink-0 text-[11px] font-semibold tabular-nums text-white" aria-hidden>
            {formatVideoClock(currentTime)}
          </span>
          <button
            type="button"
            onClick={() => void handleFullscreen()}
            className={`${VIDEO_TOUCH_TARGET} pointer-events-auto rounded-full text-white/90 hover:bg-white/15 ${VIDEO_IMMERSIVE_FOCUS}`}
            aria-label="Plein écran"
          >
            <Maximize2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
