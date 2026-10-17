"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";

import {
  VIDEO_IMMERSIVE_FOCUS,
  VIDEO_TOUCH_TARGET,
  formatVideoClock,
  formatVideoProgressValueText,
  handleVideoProgressKeyDown,
} from "@/lib/videos/video-playback-a11y";

type LocalVideoPlaybackBarProps = {
  currentTime: number;
  duration: number;
  isPaused: boolean;
  isMuted: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onSeek: (ratio: number) => void;
};

/** Barre de lecture bas d'écran — style Reels / YouTube Shorts. */
export function LocalVideoPlaybackBar({
  currentTime,
  duration,
  isPaused,
  isMuted,
  onTogglePause,
  onToggleMute,
  onSeek,
}: LocalVideoPlaybackBarProps) {
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const valueText = formatVideoProgressValueText(currentTime, duration);

  return (
    <div className="pointer-events-auto flex items-center gap-2.5 pt-2">
      <button
        type="button"
        onClick={onTogglePause}
        className={`${VIDEO_TOUCH_TARGET} rounded-full text-white/95 transition hover:bg-white/10 ${VIDEO_IMMERSIVE_FOCUS}`}
        aria-label={isPaused ? "Lire la vidéo" : "Mettre en pause"}
        aria-pressed={!isPaused}
      >
        {isPaused ? (
          <Play className="ml-0.5 h-4 w-4 fill-current" aria-hidden />
        ) : (
          <Pause className="h-4 w-4" aria-hidden />
        )}
      </button>

      <div
        role="slider"
        aria-label="Progression de la lecture"
        aria-valuemin={0}
        aria-valuemax={duration > 0 ? duration : 0}
        aria-valuenow={duration > 0 ? Math.floor(currentTime) : 0}
        aria-valuetext={valueText || undefined}
        tabIndex={duration > 0 ? 0 : -1}
        onClick={(event) => {
          if (duration <= 0) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
          onSeek(ratio);
        }}
        onKeyDown={(event) => {
          handleVideoProgressKeyDown(event, currentTime, duration, onSeek);
        }}
        className={`relative flex min-h-11 min-w-0 flex-1 cursor-pointer items-center rounded-full ${VIDEO_IMMERSIVE_FOCUS}`}
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

      <span className="shrink-0 text-[11px] font-semibold tabular-nums text-white/90" aria-hidden>
        {formatVideoClock(currentTime)}
      </span>

      <button
        type="button"
        onClick={onToggleMute}
        className={`${VIDEO_TOUCH_TARGET} rounded-full text-white/95 transition hover:bg-white/10 ${VIDEO_IMMERSIVE_FOCUS}`}
        aria-label={isMuted ? "Activer le son" : "Couper le son"}
        aria-pressed={isMuted}
      >
        {isMuted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  );
}
