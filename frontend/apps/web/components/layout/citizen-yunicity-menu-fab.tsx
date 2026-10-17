"use client";

import { CitizenYunicityMenu } from "@/components/layout/citizen-yunicity-menu";
import { CITIZEN_MOBILE_DOCKED_NAV_HEIGHT, CITIZEN_MOBILE_FLOATING_NAV_BOTTOM_GAP } from "@/lib/layout/feed-mobile-refonte";
import { Z_INDEX } from "@/lib/layout/z-index";

/**
 * FAB Menu Yunicity — mobile (≤639px), ancré au-dessus de la barre basse ancrée.
 */
export function CitizenYunicityMenuFab() {
  return (
    <div
      className="citizen-yunicity-menu-fab pointer-events-none fixed hidden max-[639.98px]:block"
      style={{
        zIndex: Z_INDEX.YUNICITY_MENU_FAB,
        right: "max(1rem, env(safe-area-inset-right))",
        bottom: `calc(${CITIZEN_MOBILE_DOCKED_NAV_HEIGHT} + ${CITIZEN_MOBILE_FLOATING_NAV_BOTTOM_GAP} + env(safe-area-inset-bottom, 0px))`,
      }}
    >
      <div className="pointer-events-auto">
        <CitizenYunicityMenu variant="fab" />
      </div>
    </div>
  );
}
