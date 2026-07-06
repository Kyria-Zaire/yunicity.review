"use client";

import { WebSidebar } from "@/components/layout/web-sidebar";
import { CitizenTopNav } from "@/components/layout/citizen-top-nav";
import { WebMobileFooter, WebMobileHeader } from "@/components/layout/web-mobile-chrome";
import { WebMobileStrategicBottomNav } from "@/components/layout/web-mobile-strategic-bottom-nav";
import { CITIZEN_MOBILE_BOTTOM_NAV_PADDING } from "@/lib/layout/feed-mobile-refonte";
import type { ReactNode } from "react";

type PassportAppShellProps = {
  children: ReactNode;
};

/**
 * Shell Passport :
 * - &lt; 480px : header mobile
 * - 480px–1279px : sidebar icônes + infobulles (comme le reste du web)
 * - 1280px+ : top nav maquette (sidebar masquée)
 */
export function PassportAppShell({ children }: PassportAppShellProps) {
  return (
    <div className="web-shell-page passport-mobile-shell min-h-dvh bg-[#F4F5F7]">
      <WebMobileHeader />

      <div className="web-three-col passport-shell-grid">
        <WebSidebar />

        <div className="web-main-column min-w-0 pt-0 sm:pt-2 xl:pt-0">
          <div className="web-desktop-passport-only">
            <CitizenTopNav />
          </div>
          <div className={`mx-auto w-full max-w-[1400px] xl:max-w-none xl:px-0 ${CITIZEN_MOBILE_BOTTOM_NAV_PADDING}`}>
            {children}
          </div>
        </div>
      </div>

      <WebMobileFooter />
      <WebMobileStrategicBottomNav />
    </div>
  );
}
