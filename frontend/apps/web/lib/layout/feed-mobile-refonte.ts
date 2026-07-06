/** Breakpoint fil local MOBILE-REFONDE-01 — chrome mobile jusqu'à 639px inclus. */
export const FEED_MOBILE_REFONTE_MAX_PX = 639;

export const FEED_MOBILE_REFONTE_CLASS = "max-[639px]" as const;

/** Padding bas contenu — barre flottante + marge + safe area (MOBILE-REFONDE-01). */
export const CITIZEN_MOBILE_FLOATING_NAV_BOTTOM_GAP = "1.75rem";

export const CITIZEN_MOBILE_BOTTOM_NAV_PADDING =
  "max-[639px]:pb-[calc(6rem+env(safe-area-inset-bottom))]" as const;
