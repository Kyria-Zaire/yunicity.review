"use client";

import { LOCAL_VIDEO_PLAYBACK_ERROR, VIDEOS_MOBILE_PAUSED_BADGE } from "@yunicity/utils";
import { Heart, Pause, Play } from "lucide-react";

import { VIDEO_IMMERSIVE_FOCUS } from "@/lib/videos/video-playback-a11y";

type LocalVideoSlideOverlaysProps = {
  mediaError: boolean;
  isPaused: boolean;
  showResumeHint: boolean;
  likeBurst: boolean;
  /** Un panneau est ouvert sur cette vidéo (écrans E, F) : pastille « En pause », pas de bouton. */
  suspended?: boolean;
  onResume: () => void;
};

/**
 * Surimpressions de la vidéo : erreur de lecture ; en pause, bouton central « Reprendre
 * la lecture » (écran C, 72 px, voile 60 %) ; repère bref à la reprise ; cœur du J'aime.
 */
export function LocalVideoSlideOverlays({ mediaError, isPaused, showResumeHint, likeBurst, suspended = false, onResume }: LocalVideoSlideOverlaysProps) {
  return (
    <>
      {mediaError ? (
        <p className="pointer-events-none absolute inset-x-0 top-1/2 z-30 px-6 text-center text-sm font-semibold text-white drop-shadow" role="alert">
          {LOCAL_VIDEO_PLAYBACK_ERROR}
        </p>
      ) : null}
      {suspended && isPaused ? (
        <div className="pointer-events-none absolute left-1/2 top-16 z-10 flex h-[30px] -translate-x-1/2 items-center gap-1.5 rounded-full bg-[rgba(17,24,39,0.7)] px-3 text-[13px] font-semibold text-white">
          <Pause className="h-3.5 w-3.5 fill-current" aria-hidden />
          {VIDEOS_MOBILE_PAUSED_BADGE}
        </div>
      ) : null}
      {isPaused && !mediaError && !suspended ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <button
            type="button"
            onClick={onResume}
            aria-label="Reprendre la lecture"
            className={`pointer-events-auto flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[rgba(17,24,39,0.6)] text-white ${VIDEO_IMMERSIVE_FOCUS}`}
          >
            <Play className="ml-1 h-8 w-8 fill-current" aria-hidden />
          </button>
        </div>
      ) : null}
      {showResumeHint && !isPaused ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <Pause className="h-16 w-16 text-white/90" aria-hidden />
        </div>
      ) : null}
      {likeBurst ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <Heart className="h-24 w-24 animate-ping fill-rose-400/80 text-rose-400/90 motion-reduce:animate-none" aria-hidden />
        </div>
      ) : null}
    </>
  );
}
