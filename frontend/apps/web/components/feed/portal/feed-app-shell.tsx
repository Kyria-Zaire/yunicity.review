"use client";

import { CitizenTopNav } from "@/components/layout/citizen-top-nav";
import { WebSidebar } from "@/components/layout/web-sidebar";
import { WebMobileStrategicBottomNav } from "@/components/layout/web-mobile-strategic-bottom-nav";
import { CITIZEN_MOBILE_BOTTOM_NAV_PADDING } from "@/lib/layout/feed-mobile-refonte";
import type { ReactNode } from "react";

export function FeedAppShell({
  children,
  rightRail,
}: {
  children: ReactNode;
  rightRail?: ReactNode;
}) {
  return (
    <div className="web-shell-page feed-mobile-shell min-h-dvh bg-[#F4F5F7]">
      <div className="web-three-col places-shell-grid">
        <WebSidebar />
        <div className="web-main-column min-w-0 pt-0 sm:pt-2 xl:pt-0">
          <div className="web-desktop-feed-only">
            <CitizenTopNav />
          </div>
          <div className={`flex gap-6 pb-16 lg:pb-20 ${CITIZEN_MOBILE_BOTTOM_NAV_PADDING}`}>
            {children}
            {rightRail ? (
              <aside className="hidden w-72 shrink-0 2xl:block">
                <div className="sticky top-24 space-y-4">{rightRail}</div>
              </aside>
            ) : null}
          </div>
        </div>
      </div>
      <WebMobileStrategicBottomNav />
    </div>
  );
}
