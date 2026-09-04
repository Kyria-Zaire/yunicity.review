"use client";

import { FeedMobileBottomNav } from "@/components/feed/mobile/feed-mobile-bottom-nav";
import { CitizenTopNav } from "@/components/layout/citizen-top-nav";
import { WebSidebar } from "@/components/layout/web-sidebar";
import { WebMobileFooter } from "@/components/layout/web-mobile-chrome";
import { CITIZEN_MOBILE_BOTTOM_NAV_PADDING } from "@/lib/layout/feed-mobile-refonte";
import type { ReactNode } from "react";

/** Shell Vidéos — mobile refonte MOBILE-VIDEOS-01 + desktop portail existant. */
export function VideosAppShell({
  children,
  detailMode = false,
  immersiveMode = false,
}: {
  children: ReactNode;
  detailMode?: boolean;
  immersiveMode?: boolean;
}) {
  return (
    <div
      className={`web-shell-page videos-mobile-shell min-h-dvh bg-[#F4F5F7] ${
        detailMode ? "videos-detail-mode" : ""
      } ${immersiveMode ? "videos-immersive-mode" : ""}`}
    >
      <div className="web-three-col places-shell-grid">
        <WebSidebar />

        <main className="web-main-column min-w-0 pt-0 sm:pt-2 xl:pt-0">
          <div className="web-desktop-videos-only">
            <CitizenTopNav />
          </div>
          <div
            className={`relative w-full min-h-[calc(100dvh-5rem)] md:min-h-[calc(100dvh-6rem)] xl:min-h-[calc(100dvh-4.25rem-1rem)] ${CITIZEN_MOBILE_BOTTOM_NAV_PADDING}`}
          >
            {children}
          </div>
        </main>
      </div>

      <WebMobileFooter />
      <FeedMobileBottomNav />
    </div>
  );
}
