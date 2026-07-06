"use client";

import { CitizenTopNav } from "@/components/layout/citizen-top-nav";
import { WebSidebar } from "@/components/layout/web-sidebar";
import { WebMobileFooter, WebMobileHeader } from "@/components/layout/web-mobile-chrome";
import { WebMobileStrategicBottomNav } from "@/components/layout/web-mobile-strategic-bottom-nav";
import { CITIZEN_MOBILE_BOTTOM_NAV_PADDING } from "@/lib/layout/feed-mobile-refonte";
import type { ReactNode } from "react";

type SearchAppShellProps = {
  children: ReactNode;
};

/** Shell Recherche — mobile MOBILE-SEARCH-01 + desktop portail existant. */
export function SearchAppShell({ children }: SearchAppShellProps) {
  return (
    <div className="web-shell-page search-mobile-shell min-h-dvh bg-[#F4F5F7]">
      <WebMobileHeader />

      <div className="web-three-col search-shell-grid">
        <WebSidebar />

        <div className="web-main-column min-w-0 pt-0 sm:pt-2 xl:pt-0">
          <div className="web-desktop-search-only">
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
