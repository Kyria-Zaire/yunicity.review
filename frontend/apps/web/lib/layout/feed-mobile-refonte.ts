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

/**
 * Hauteur RÉELLE de la barre basse mobile, publiée sur `<html>` par la barre
 * elle-même (`useCitizenBottomNavHeight`) : bordure et zone de sécurité
 * comprises, 0 quand la barre est masquée ou absente.
 */
export const CITIZEN_BOTTOM_NAV_HEIGHT_VAR = "--citizen-bottom-nav-h" as const;

/**
 * Padding bas contenu — réserve EXACTE sous la barre basse mobile.
 *
 * BOTTOM-NAV-RESERVE-01 : la classe est écrite EN TOUTES LETTRES. Tailwind lit
 * le source sans l'exécuter : l'ancienne classe, assemblée par interpolation,
 * n'était jamais générée (0 occurrence dans le CSS de production). Elle suit
 * désormais la hauteur mesurée : rien n'est réservé pour une barre masquée.
 */
export const CITIZEN_MOBILE_BOTTOM_NAV_PADDING =
  "max-[639px]:pb-[var(--citizen-bottom-nav-h,0px)]" as const;
