"use client";

import { Pause, Play } from "lucide-react";

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
  onTogglePause: () => void;
  onSeek: (ratio: number) => void;
};

/**
 * Barre de lecture mobile v2.3 (écran B) : pause, progression, durée. Le son est dans la
 * barre haute du fil ; repliée, la barre devient le fil de progression de 2 px.
 */
export function LocalVideoPlaybackBar({
  currentTime,
  duration,
  isPaused,
  onTogglePause,
  onSeek,
}: LocalVideoPlaybackBarProps) {
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const valueText = formatVideoProgressValueText(currentTime, duration);

  return (
    <div className="pointer-events-auto -mx-3 mt-1.5 flex h-12 items-center gap-1">
      <button
        type="button"
        onClick={onTogglePause}
        className={`${VIDEO_TOUCH_TARGET} rounded-full text-white transition hover:bg-white/10 ${VIDEO_IMMERSIVE_FOCUS}`}
        aria-label={isPaused ? "Lire la vidéo" : "Mettre en pause"}
        aria-pressed={!isPaused}
      >
        {isPaused ? <Play className="ml-0.5 h-[22px] w-[22px] fill-current" aria-hidden /> : <Pause className="h-[22px] w-[22px]" aria-hidden />}
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
        className={`relative flex h-11 min-w-0 flex-1 cursor-pointer items-center ${VIDEO_IMMERSIVE_FOCUS}`}
      >
        <div className="relative h-1 w-full rounded-full bg-white/35">
          <div className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${progress}%` }} />
          <div
            className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
            style={{ left: `${progress}%` }}
            aria-hidden
          />
        </div>
      </div>

      <span className="w-[84px] shrink-0 text-center text-[13px] tabular-nums text-white" aria-hidden>
        {formatVideoClock(currentTime)} / {formatVideoClock(duration)}
      </span>
    </div>
  );
}
