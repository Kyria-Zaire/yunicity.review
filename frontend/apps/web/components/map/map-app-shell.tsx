"use client";

import { CitizenTopNav } from "@/components/layout/citizen-top-nav";
import { WebSidebar } from "@/components/layout/web-sidebar";
import { WebMobileFooter, WebMobileHeader } from "@/components/layout/web-mobile-chrome";
import { WebMobileStrategicBottomNav } from "@/components/layout/web-mobile-strategic-bottom-nav";
import { CITIZEN_MOBILE_BOTTOM_NAV_PADDING } from "@/lib/layout/feed-mobile-refonte";
import type { ReactNode } from "react";

/** Shell Carte — mobile refonte MOBILE-MAP-01 + desktop portail existant. */
export function MapAppShell({
  children,
  rightRail,
}: {
  children: ReactNode;
  rightRail?: ReactNode;
}) {
  return (
    <div className="web-shell-page map-mobile-shell min-h-dvh bg-[#F4F5F7]">
      <WebMobileHeader />

      <div className="web-three-col places-shell-grid">
        <WebSidebar />

        <div className="web-main-column min-w-0 pt-0 sm:pt-2 xl:pt-0">
          <div className="web-desktop-map-only">
            <CitizenTopNav />
          </div>
          <div className={`flex gap-4 pb-16 lg:gap-6 lg:pb-20 ${CITIZEN_MOBILE_BOTTOM_NAV_PADDING}`}>
            {children}
            {rightRail ? (
              <aside className="web-desktop-map-only hidden w-80 shrink-0 2xl:block">
                <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto">
                  {rightRail}
                </div>
              </aside>
            ) : null}
          </div>
        </div>
      </div>

      <WebMobileFooter />
      <WebMobileStrategicBottomNav />
    </div>
  );
}
