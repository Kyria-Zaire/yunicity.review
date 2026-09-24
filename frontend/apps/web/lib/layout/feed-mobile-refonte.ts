/** Breakpoint fil local MOBILE-REFONDE-01 — chrome mobile jusqu'à 639px inclus. */
export {
  FEED_VIEWPORT_DESKTOP_MIN_PX,
  FEED_VIEWPORT_MEDIUM_MAX_PX,
  FEED_VIEWPORT_MEDIUM_MIN_PX,
  FEED_VIEWPORT_MOBILE_MAX_PX,
  FEED_VIEWPORT_MOBILE_MAX_PX as FEED_MOBILE_REFONTE_MAX_PX,
} from "@/lib/layout/feed-breakpoints";

export const FEED_MOBILE_REFONTE_CLASS = "max-[639px]" as const;

/** Hauteur barre mobile ancrée (hors safe area). */
export const CITIZEN_MOBILE_DOCKED_NAV_HEIGHT = "3.25rem";

/** Marge au-dessus de la barre ancrée — FAB et éléments fixed. */
export const CITIZEN_MOBILE_FLOATING_NAV_BOTTOM_GAP = "0.75rem";

/** Breakpoint CSS mobile : visible strictement avant 640px (dernier px mobile = 639). */
export const CITIZEN_MOBILE_BOTTOM_NAV_MEDIA = "(width < 640px)" as const;

/** Padding bas contenu — barre ancrée + safe area (sans marge flottante). */
export const CITIZEN_MOBILE_BOTTOM_NAV_PADDING =
  `max-[639px]:pb-[calc(${CITIZEN_MOBILE_DOCKED_NAV_HEIGHT}+env(safe-area-inset-bottom))]` as const;
