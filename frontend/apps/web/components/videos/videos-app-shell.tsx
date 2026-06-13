"use client";

import { CitizenTopNav } from "@/components/layout/citizen-top-nav";
import { WebSidebar } from "@/components/layout/web-sidebar";
import { WebMobileFooter, WebMobileHeader } from "@/components/layout/web-mobile-chrome";
import type { ReactNode } from "react";

/** Immersive shell for the vertical video feed (C2-S2) — aligné feed/map/search. */
export function VideosAppShell({ children }: { children: ReactNode }) {
  return (
    <div className="web-shell-page min-h-dvh bg-[#F4F5F7]">
      <WebMobileHeader />

      <div className="web-three-col places-shell-grid">
        <WebSidebar />

        <div className="web-main-column min-w-0 pt-0 sm:pt-2 xl:pt-0">
          <CitizenTopNav />
          <div className="relative min-h-[calc(100dvh-5rem)] w-full md:min-h-[calc(100dvh-6rem)] xl:min-h-[calc(100dvh-4.25rem-1rem)]">
            {children}
          </div>
        </div>
      </div>

      <WebMobileFooter />
    </div>
  );
}
