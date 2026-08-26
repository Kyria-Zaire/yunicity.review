"use client";

import { CitizenTopNav } from "@/components/layout/citizen-top-nav";
import { WebSidebar } from "@/components/layout/web-sidebar";
import { WebMobileStrategicBottomNav } from "@/components/layout/web-mobile-strategic-bottom-nav";
import { CITIZEN_MOBILE_BOTTOM_NAV_PADDING } from "@/lib/layout/feed-mobile-refonte";
import type { ReactNode } from "react";

/**
 * CitizenAuthenticatedShell — Shared chrome for authenticated citizen routes.
 *
 * Consolidates global navigation (TopNav, Sidebar, BottomNav) for citizen-facing screens.
 * Provides the responsive layout foundation for Feed and future citizen-scoped routes (D0.2+).
 *
 * Structure:
 * - Top: CitizenTopNav (desktop, ≥1280px)
 * - Left: WebSidebar (sticky, handles CitizenMediumRail for responsive medium breakpoint)
 * - Right: Citizens' content main column
 * - Bottom: WebMobileStrategicBottomNav (mobile, ≤639.98px, fixed float)
 *
 * Responsiveness:
 * - <640px: Mobile chrome only (nav bottom, left sidebar hidden)
 * - 640-1279.98px: Medium rail appears (WebSidebar proprietary)
 * - ≥1280px: Desktop layout (top nav, full sidebar, main content)
 *
 * Classes `.citizen-medium-shell` scope Feed-specific medium styles (M3-M7).
 */
export function CitizenAuthenticatedShell({ children }: { children: ReactNode }) {
  return (
    <div className="web-shell-page feed-mobile-shell citizen-medium-shell min-h-dvh bg-[#F4F5F7]">
      <div className="web-three-col places-shell-grid">
        <WebSidebar />
        <main className="web-main-column min-w-0 pt-0 sm:pt-2 xl:pt-0">
          <div className="web-desktop-feed-only">
            <CitizenTopNav />
          </div>
          <div className={`feed-app-shell-content flex gap-6 pb-16 lg:pb-20 ${CITIZEN_MOBILE_BOTTOM_NAV_PADDING}`}>
            {children}
          </div>
        </main>
      </div>
      <WebMobileStrategicBottomNav />
    </div>
  );
}
