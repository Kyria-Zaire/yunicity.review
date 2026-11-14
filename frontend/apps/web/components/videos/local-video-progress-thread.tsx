"use client";

import { formatVideoProgressValueText } from "@/lib/videos/video-playback-a11y";

type LocalVideoProgressThreadProps = {
  currentTime: number;
  duration: number;
  className?: string;
};

/**
 * Fil de progression de 2 px (écran A) : la barre de lecture repliée. Lecture seule ;
 * la barre complète (écran B) revient à l'appui ou au focus clavier.
 */
export function LocalVideoProgressThread({ currentTime, duration, className = "" }: LocalVideoProgressThreadProps) {
  const progress = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const valueText = formatVideoProgressValueText(currentTime, duration);

  return (
    <div
      role="progressbar"
      aria-label="Progression de la lecture"
      aria-valuemin={0}
      aria-valuemax={duration > 0 ? duration : 0}
      aria-valuenow={duration > 0 ? Math.floor(currentTime) : 0}
      aria-valuetext={valueText || undefined}
      className={`pointer-events-none h-0.5 w-full bg-white/35 ${className}`}
    >
      <div className="h-0.5 bg-white" style={{ width: `${progress}%` }} />
    </div>
  );
}
