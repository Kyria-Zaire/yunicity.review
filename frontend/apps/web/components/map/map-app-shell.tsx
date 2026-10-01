"use client";

import { WebSidebar } from "@/components/layout/web-sidebar";
import { WebMobileFooter, WebMobileHeader } from "@/components/layout/web-mobile-chrome";
import { WebMobileStrategicBottomNav } from "@/components/layout/web-mobile-strategic-bottom-nav";
import type { ReactNode } from "react";

/** Shell Carte — chrome global ; le layout 3 colonnes vit dans MapDesktopScreen. */
export function MapAppShell({ children }: { children: ReactNode }) {
  return (
    <div className="web-shell-page map-mobile-shell min-h-dvh bg-[#F4F5F7]">
      <WebMobileHeader />

      <div className="web-three-col places-shell-grid">
        <WebSidebar />

        <main className="web-main-column min-w-0 pt-0 sm:pt-2 xl:pt-0">
          <div className="pb-16 sm:pb-8 lg:pb-8 xl:pb-10 2xl:pb-12">{children}</div>
        </main>
      </div>

      <WebMobileFooter />
      <WebMobileStrategicBottomNav />
    </div>
  );
}
