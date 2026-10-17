/**
 * Breakpoints canoniques du portail Vidéos — alignés Feed R4.
 *
 * Mobile ≤639 · Medium 640–1023 · Desktop ≥1024.
 * Le layout ne s'appuie pas sur matchMedia côté shell : ces constantes servent
 * aux tests et à la documentation CSS.
 */

export const VIDEOS_VIEWPORT_MOBILE_MAX_PX = 639;
export const VIDEOS_VIEWPORT_MEDIUM_MIN_PX = 640;
export const VIDEOS_VIEWPORT_MEDIUM_MAX_PX = 1023;
export const VIDEOS_VIEWPORT_DESKTOP_MIN_PX = 1024;

/** @deprecated Préférer VIDEOS_VIEWPORT_DESKTOP_MEDIA */
export const VIDEOS_VIEWPORT_DESKTOP_MIN_QUERY = "(min-width: 1024px)" as const;

export const VIDEOS_VIEWPORT_MOBILE_MEDIA =
  `(max-width: ${VIDEOS_VIEWPORT_MOBILE_MAX_PX}px)` as const;
export const VIDEOS_VIEWPORT_MEDIUM_MEDIA =
  `(min-width: ${VIDEOS_VIEWPORT_MEDIUM_MIN_PX}px) and (max-width: ${VIDEOS_VIEWPORT_MEDIUM_MAX_PX}.98px)` as const;
export const VIDEOS_VIEWPORT_DESKTOP_MEDIA =
  `(min-width: ${VIDEOS_VIEWPORT_DESKTOP_MIN_PX}px)` as const;

export type VideosViewportTier = "mobile" | "medium" | "desktop";
