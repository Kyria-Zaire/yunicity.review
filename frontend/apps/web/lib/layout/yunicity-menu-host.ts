import { NAVIGATION_DESKTOP_MIN_PX, NAVIGATION_MOBILE_MAX_PX } from "@/lib/layout/navigation-surfaces";
import type { PopoverPlacement } from "@yunicity/ui/primitives";

export type YunicityMenuHostVariant =
  | "sidebar"
  | "medium-rail"
  | "top-nav"
  | "mobile-header"
  | "bottom-nav";

export type YunicityMenuPopoverVariant = YunicityMenuHostVariant | "fab";

/**
 * Une seule instance du chrome monte la surface Menu à la fois.
 * Mobile (≤639) : header mobile (`mobile-header`) — Drawer.
 * Medium (640–1279) : hôte medium — Sheet.
 * Desktop (≥1280) : header desktop (`top-nav`) — Popover ancré au déclencheur visible.
 *
 * ── C3-CITIZEN-MEDIUM-SHELL-R1B ──────────────────────────────────────────────
 * La bande medium hébergeait la surface sous la variante `sidebar`. Depuis que
 * `WebSidebar` monte AUSSI le rail citoyen, deux instances portaient cette même
 * variante et s'élisaient toutes deux hôtes : la restitution du focus ne
 * fonctionnait que parce que l'aside était monté avant le rail. L'hôte medium
 * porte donc désormais une variante DISTINCTE.
 *
 * ── C3-CITIZEN-MEDIUM-SHELL-R1C : apparence ≠ élection ───────────────────────
 * R1B faisait varier la PROP `variant` selon l'éligibilité de la route, ce qui
 * changeait l'APPARENCE de la sidebar historique sur les routes exclues — y
 * compris à 1280 px, où elle perdait son déclencheur étendu. Les deux notions
 * sont désormais séparées :
 *
 *   `variant`            → apparence, CONSTANTE par composant.
 *   `mediumRailPresent`  → fait global, transmis explicitement.
 *
 * Dans la bande medium, l'hôte est le rail quand il existe, et l'aside
 * historique sinon — cas des routes exclues, où le Menu doit continuer de
 * fonctionner. Hors de cette bande, la politique historique est intacte, quelle
 * que soit la valeur du fait global.
 */
export type YunicityMenuHostContext = {
  /** Le rail citoyen medium est-il rendu sur cette route ? */
  mediumRailPresent: boolean;
};

export function resolveYunicityMenuHostVariant(
  width: number,
  context?: YunicityMenuHostContext,
): YunicityMenuHostVariant {
  // Par défaut le rail est considéré présent : c'est le cas de toutes les
  // routes citoyennes, et un défaut « absent » ferait héberger la sidebar en
  // même temps que le rail — exactement la collision corrigée en R1B.
  const hoteMedium: YunicityMenuHostVariant =
    context?.mediumRailPresent === false ? "sidebar" : "medium-rail";
  if (width <= 0) return hoteMedium;
  if (width <= NAVIGATION_MOBILE_MAX_PX) return "mobile-header";
  if (width < NAVIGATION_DESKTOP_MIN_PX) return hoteMedium;
  return "top-nav";
}

export function resolveYunicityMenuPopoverPlacement(
  variant: YunicityMenuPopoverVariant,
): PopoverPlacement {
  if (variant === "top-nav" || variant === "mobile-header") return "bottom-end";
  if (variant === "fab") return "top-end";
  if (variant === "bottom-nav") return "top-start";
  // `medium-rail` partage le placement de `sidebar` : aucun delta visuel.
  return "right-start";
}
