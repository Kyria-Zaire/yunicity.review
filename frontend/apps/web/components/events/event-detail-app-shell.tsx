"use client";

import { CitizenTopNav } from "@/components/layout/citizen-top-nav";
import { WebSidebar } from "@/components/layout/web-sidebar";
import { WebMobileFooter, WebMobileHeader } from "@/components/layout/web-mobile-chrome";
import { WebMobileStrategicBottomNav } from "@/components/layout/web-mobile-strategic-bottom-nav";
import { CITIZEN_MOBILE_BOTTOM_NAV_PADDING } from "@/lib/layout/feed-mobile-refonte";
import type { ReactNode } from "react";

/** Shell détail événement — mobile (≤639), medium (640–1023) et desktop (≥1024). */
export function EventDetailAppShell({
  children,
  leftRail,
  rightRail,
}: {
  children: ReactNode;
  leftRail?: ReactNode;
  rightRail?: ReactNode;
}) {
  return (
    <div className="web-shell-page event-detail-mobile-shell min-h-dvh bg-[#F4F5F7]">
      <WebMobileHeader />
      <div className="web-three-col places-shell-grid">
        <WebSidebar />
        <main className="web-main-column min-w-0 pt-0 sm:pt-2 xl:pt-0">
          <div className="web-desktop-event-detail-only">
            <CitizenTopNav />
          </div>
          <div className={`flex gap-4 lg:gap-6 lg:pb-20 ${CITIZEN_MOBILE_BOTTOM_NAV_PADDING}`}>
            {leftRail ? (
              <aside className="hidden w-72 shrink-0 xl:block">
                <div className="sticky top-24 space-y-4">{leftRail}</div>
              </aside>
            ) : null}
            <div className="min-w-0 flex-1">{children}</div>
            {rightRail ? (
              <aside className="hidden w-80 shrink-0 2xl:block">
                <div className="sticky top-24 max-h-[calc(100dvh-7rem)] space-y-4 overflow-y-auto">
                  {rightRail}
                </div>
              </aside>
            ) : null}
          </div>
        </main>
      </div>
      <WebMobileFooter />
      <WebMobileStrategicBottomNav />
    </div>
  );
}
