import { NAVIGATION_DESKTOP_MIN_PX, NAVIGATION_MOBILE_MAX_PX } from "@/lib/layout/navigation-surfaces";
import type { PopoverPlacement } from "@yunicity/ui/primitives";

export type YunicityMenuHostVariant = "sidebar" | "top-nav" | "mobile-header" | "bottom-nav";

export type YunicityMenuPopoverVariant = YunicityMenuHostVariant | "fab";

/**
 * Une seule instance du chrome monte la surface Menu à la fois.
 * Mobile (≤639) : header mobile (`mobile-header`) — Drawer.
 * Medium (640–1279) : sidebar — Sheet.
 * Desktop (≥1280) : header desktop (`top-nav`) — Popover ancré au déclencheur visible.
 */
export function resolveYunicityMenuHostVariant(width: number): YunicityMenuHostVariant {
  if (width <= 0) return "sidebar";
  if (width <= NAVIGATION_MOBILE_MAX_PX) return "mobile-header";
  if (width < NAVIGATION_DESKTOP_MIN_PX) return "sidebar";
  return "top-nav";
}

export function resolveYunicityMenuPopoverPlacement(
  variant: YunicityMenuPopoverVariant,
): PopoverPlacement {
  if (variant === "top-nav" || variant === "mobile-header") return "bottom-end";
  if (variant === "fab") return "top-end";
  if (variant === "bottom-nav") return "top-start";
  return "right-start";
}
