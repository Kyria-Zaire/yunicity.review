"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";

type LocalVideoPlaybackBarProps = {
  currentTime: number;
  duration: number;
  isPaused: boolean;
  isMuted: boolean;
  onTogglePause: () => void;
  onToggleMute: () => void;
  onSeek: (ratio: number) => void;
};

function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

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

  return (
    <div className="pointer-events-auto flex items-center gap-2.5 pt-2">
      <button
        type="button"
        onClick={onTogglePause}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/95 transition hover:bg-white/10"
        aria-label={isPaused ? "Lire la vidéo" : "Mettre en pause"}
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
        aria-valuemax={duration}
        aria-valuenow={Math.floor(currentTime)}
        tabIndex={0}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
          onSeek(ratio);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") onSeek(Math.min(1, (currentTime + 5) / Math.max(duration, 1)));
          if (event.key === "ArrowLeft") onSeek(Math.max(0, (currentTime - 5) / Math.max(duration, 1)));
        }}
        className="relative h-1 min-w-0 flex-1 cursor-pointer overflow-hidden rounded-full bg-white/30"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-yunicity-primary"
          style={{ width: `${progress}%` }}
        />
      </div>

      <span className="shrink-0 text-[11px] font-semibold tabular-nums text-white/90">
        {formatClock(currentTime)}
      </span>

      <button
        type="button"
        onClick={onToggleMute}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/95 transition hover:bg-white/10"
        aria-label={isMuted ? "Activer le son" : "Couper le son"}
      >
        {isMuted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  );
}
