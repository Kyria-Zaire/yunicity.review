"use client";

import { CitizenYunicityMenu } from "@/components/layout/citizen-yunicity-menu";
import { CITIZEN_MOBILE_FLOATING_NAV_BOTTOM_GAP } from "@/lib/layout/feed-mobile-refonte";
import { Z_INDEX } from "@/lib/layout/z-index";

/**
 * FAB Menu Yunicity — mobile (≤639px), ancré à droite au-dessus de la bottom nav.
 * Symétrique du FAB Create Hub (gauche) sur le fil local.
 */
export function CitizenYunicityMenuFab() {
  return (
    <div
      className="citizen-yunicity-menu-fab pointer-events-none fixed hidden max-[639px]:block"
      style={{
        zIndex: Z_INDEX.YUNICITY_MENU_FAB,
        right: "max(1rem, env(safe-area-inset-right))",
        bottom: `calc(6rem + ${CITIZEN_MOBILE_FLOATING_NAV_BOTTOM_GAP} + env(safe-area-inset-bottom, 0px))`,
      }}
    >
      <div className="pointer-events-auto">
        <CitizenYunicityMenu variant="fab" />
      </div>
    </div>
  );
}
