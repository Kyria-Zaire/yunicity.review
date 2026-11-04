import type { KeyboardEvent } from "react";

/** Cible tactile minimale WCAG (44×44 px) — hit-area invisible, icône inchangée. */
export const VIDEO_TOUCH_TARGET =
  "inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center";

/** Anneau focus sur fond sombre (immersif mobile). */
export const VIDEO_IMMERSIVE_FOCUS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80";

/** Anneau focus sur fond clair (cartes, sidebar). */
export const VIDEO_CANVAS_FOCUS =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary";

/** Bouton Suivre indisponible — neutre, sans apparence de CTA primaire actif. */
export const VIDEO_FOLLOW_DISABLED_CLASS =
  "inline-flex shrink-0 cursor-not-allowed items-center justify-center rounded-full border border-neutral-300 bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-500";

export function formatVideoClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

/** Annonce AT du slider : « 0:05 sur 0:42 ». */
export function formatVideoProgressValueText(currentTime: number, duration: number): string {
  if (duration <= 0) return "";
  return `${formatVideoClock(currentTime)} sur ${formatVideoClock(duration)}`;
}

export type VideoProgressSeekHandler = (ratio: number) => void;

/** Clavier slider : flèches ±5 s, Home/End. Aucun seek si durée ≤ 0. */
export function handleVideoProgressKeyDown(
  event: KeyboardEvent,
  currentTime: number,
  duration: number,
  onSeekRatio: VideoProgressSeekHandler,
): void {
  if (duration <= 0) return;

  const handledKeys = ["ArrowLeft", "ArrowRight", "Home", "End"] as const;
  if (!handledKeys.includes(event.key as (typeof handledKeys)[number])) return;

  event.preventDefault();

  let nextTime = currentTime;
  if (event.key === "ArrowRight") nextTime = Math.min(duration, currentTime + 5);
  if (event.key === "ArrowLeft") nextTime = Math.max(0, currentTime - 5);
  if (event.key === "Home") nextTime = 0;
  if (event.key === "End") nextTime = duration;

  onSeekRatio(nextTime / duration);
}

export function scrollIntoViewRespectingReducedMotion(
  element: Element | null | undefined,
  options?: ScrollIntoViewOptions,
): void {
  if (!element) return;
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  element.scrollIntoView({
    block: options?.block ?? "start",
    inline: options?.inline ?? "nearest",
    behavior: reduceMotion ? "auto" : (options?.behavior ?? "auto"),
  });
}
