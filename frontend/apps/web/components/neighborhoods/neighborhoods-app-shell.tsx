"use client";

import { CitizenTopNav } from "@/components/layout/citizen-top-nav";
import { WebSidebar } from "@/components/layout/web-sidebar";
import { WebMobileFooter, WebMobileHeader } from "@/components/layout/web-mobile-chrome";
import { WebMobileStrategicBottomNav } from "@/components/layout/web-mobile-strategic-bottom-nav";
import { CITIZEN_MOBILE_BOTTOM_NAV_PADDING } from "@/lib/layout/feed-mobile-refonte";
import type { ReactNode } from "react";

type NeighborhoodsAppShellProps = {
  children: ReactNode;
};

/** Shell Quartiers — mobile refonte MOBILE-QUARTIERS-01 + desktop portail existant. */
export function NeighborhoodsAppShell({ children }: NeighborhoodsAppShellProps) {
  return (
    <div className="web-shell-page neighborhoods-mobile-shell min-h-dvh bg-[#F4F5F7]">
      <WebMobileHeader />

      <div className="web-three-col places-shell-grid">
        <WebSidebar />

        <div className="web-main-column min-w-0 pt-0 sm:pt-2 xl:pt-0">
          <div className="web-desktop-neighborhoods-only">
            <CitizenTopNav />
          </div>
          <div className={CITIZEN_MOBILE_BOTTOM_NAV_PADDING}>{children}</div>
        </div>
      </div>

      <WebMobileFooter />
      <WebMobileStrategicBottomNav />
    </div>
  );
}
