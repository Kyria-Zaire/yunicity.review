"use client";

import { CitizenTopNav } from "@/components/layout/citizen-top-nav";
import { WebSidebar } from "@/components/layout/web-sidebar";
import { WebMobileFooter, WebMobileHeader } from "@/components/layout/web-mobile-chrome";
import { WebMobileStrategicBottomNav } from "@/components/layout/web-mobile-strategic-bottom-nav";
import { CITIZEN_MOBILE_BOTTOM_NAV_PADDING } from "@/lib/layout/feed-mobile-refonte";
import type { ReactNode } from "react";

/** Shell « Proposer un lieu » — mobile MOBILE-ORG-REQUEST-01 + desktop existant. */
export function OrganizationRequestAppShell({ children }: { children: ReactNode }) {
  return (
    <div className="web-shell-page org-request-mobile-shell min-h-dvh bg-[#F4F5F7]">
      <WebMobileHeader />

      <div className="web-three-col org-request-shell-grid">
        <WebSidebar />

        <div className="web-main-column min-w-0 pt-0 sm:pt-2 xl:pt-0">
          <div className="web-desktop-org-request-only">
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
