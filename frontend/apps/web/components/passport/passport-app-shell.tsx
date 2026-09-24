"use client";

import { WebSidebar } from "@/components/layout/web-sidebar";
import { CitizenTopNav } from "@/components/layout/citizen-top-nav";
import { WebMobileFooter, WebMobileHeader } from "@/components/layout/web-mobile-chrome";
import { WebMobileStrategicBottomNav } from "@/components/layout/web-mobile-strategic-bottom-nav";
import { CITIZEN_MOBILE_BOTTOM_NAV_PADDING } from "@/lib/layout/feed-mobile-refonte";
import type { ReactNode } from "react";

type PassportAppShellProps = {
  children: ReactNode;
  variant?: "default" | "offer-detail";
};

/**
 * Shell Passport :
 * - ≤639px : header mobile (ou header fiche offre si variant offer-detail)
 * - 640px–1279px : sidebar icônes + infobulles
 * - 1280px+ : top nav maquette
 */
export function PassportAppShell({ children, variant = "default" }: PassportAppShellProps) {
  const shellClass =
    variant === "offer-detail"
      ? "web-shell-page passport-mobile-shell passport-offer-detail-shell min-h-dvh bg-[#F4F5F7]"
      : "web-shell-page passport-mobile-shell min-h-dvh bg-[#F4F5F7]";

  const mainPaddingClass =
    variant === "offer-detail"
      ? "mx-auto w-full max-w-[1400px] xl:max-w-none xl:px-0 max-[639px]:pb-[env(safe-area-inset-bottom)]"
      : `mx-auto w-full max-w-[1400px] xl:max-w-none xl:px-0 ${CITIZEN_MOBILE_BOTTOM_NAV_PADDING}`;

  return (
    <div className={shellClass}>
      <WebMobileHeader />

      <div className="web-three-col passport-shell-grid">
        <WebSidebar />

        <main className="web-main-column min-w-0 pt-0 sm:pt-2 xl:pt-0">
          <div className="web-desktop-passport-only">
            <CitizenTopNav />
          </div>
          <div className={mainPaddingClass}>{children}</div>
        </main>
      </div>

      <WebMobileFooter />
      {variant === "offer-detail" ? null : <WebMobileStrategicBottomNav />}
    </div>
  );
}
