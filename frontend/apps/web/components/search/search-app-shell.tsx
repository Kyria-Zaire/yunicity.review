"use client";

import { CitizenTopNav } from "@/components/layout/citizen-top-nav";
import { WebSidebar } from "@/components/layout/web-sidebar";
import { WebMobileFooter, WebMobileHeader } from "@/components/layout/web-mobile-chrome";
import { WebMobileStrategicBottomNav } from "@/components/layout/web-mobile-strategic-bottom-nav";
import type { ReactNode } from "react";

type SearchAppShellProps = {
  children: ReactNode;
};

/** Shell Recherche globale — navbar basse masquée sur mobile uniquement (CSS). */
export function SearchAppShell({ children }: SearchAppShellProps) {
  return (
    <div className="web-shell-page search-mobile-shell min-h-dvh bg-[#F4F5F7]">
      <WebMobileHeader />

      <div className="web-three-col search-shell-grid">
        <WebSidebar />

        <main className="web-main-column min-w-0 pt-0 sm:pt-2 xl:pt-0">
          <div className="web-desktop-search-only">
            <CitizenTopNav />
          </div>
          <div className="max-[639px]:pb-[env(safe-area-inset-bottom)]">{children}</div>
        </main>
      </div>

      <WebMobileFooter />
      <WebMobileStrategicBottomNav />
    </div>
  );
}
