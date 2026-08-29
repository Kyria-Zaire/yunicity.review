/**
 * Breakpoints canoniques du fil local — bascule nette Mobile / Medium / Desktop.
 *
 * R4B : la frontiere Desktop passe de 1280 a 1024. A 1024px le fil affiche deja
 * la maquette Desktop complete (top nav, rail gauche, colonne, rail droit) ;
 * la geometrie des rails devient fluide entre 1024 et 1280, ou elle rejoint
 * exactement les dimensions Desktop validees.
 */

export const FEED_VIEWPORT_MOBILE_MAX_PX = 639;
export const FEED_VIEWPORT_MEDIUM_MIN_PX = 640;
export const FEED_VIEWPORT_MEDIUM_MAX_PX = 1023;
export const FEED_VIEWPORT_DESKTOP_MIN_PX = 1024;

export const FEED_VIEWPORT_DESKTOP_LARGE_MIN_PX = 1440;

export const FEED_VIEWPORT_MOBILE_MEDIA = `(max-width: ${FEED_VIEWPORT_MOBILE_MAX_PX}px)` as const;
export const FEED_VIEWPORT_MEDIUM_MEDIA =
  `(min-width: ${FEED_VIEWPORT_MEDIUM_MIN_PX}px) and (max-width: ${FEED_VIEWPORT_MEDIUM_MAX_PX}.98px)` as const;
export const FEED_VIEWPORT_DESKTOP_MEDIA =
  `(min-width: ${FEED_VIEWPORT_DESKTOP_MIN_PX}px)` as const;

export type FeedViewportTier = "mobile" | "medium" | "desktop";

export function resolveFeedViewportTier(): FeedViewportTier {
  if (typeof window === "undefined") return "mobile";
  if (window.matchMedia(FEED_VIEWPORT_DESKTOP_MEDIA).matches) return "desktop";
  if (window.matchMedia(FEED_VIEWPORT_MEDIUM_MEDIA).matches) return "medium";
  return "mobile";
}
