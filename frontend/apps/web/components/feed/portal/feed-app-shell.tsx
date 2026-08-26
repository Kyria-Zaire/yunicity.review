"use client";

import { CitizenTopNav } from "@/components/layout/citizen-top-nav";
import { WebSidebar } from "@/components/layout/web-sidebar";
import { WebMobileStrategicBottomNav } from "@/components/layout/web-mobile-strategic-bottom-nav";
import { CITIZEN_MOBILE_BOTTOM_NAV_PADDING } from "@/lib/layout/feed-mobile-refonte";
import type { ReactNode } from "react";

export function FeedAppShell({ children }: { children: ReactNode }) {
  return (
    <div className="web-shell-page feed-mobile-shell citizen-medium-shell min-h-dvh bg-[#F4F5F7]">
      <div className="web-three-col places-shell-grid">
        {/* C3-FEED-M2 : trois shells explicites pour le Feed.
            < 640      -> shell mobile gele (les deux rails sont masques) ;
            640-1279.98 -> `FeedMediumRail`, le rail desktop est masque ;
            >= 1280    -> `WebSidebar` desktop inchange, le rail medium masque.
            La bascule est portee par des classes bornees et SCOPEES a
            `.citizen-medium-shell` : seul un shell qui MONTE explicitement le rail
            citoyen porte cette classe, aucune autre famille de routes n'est
            touchee (C3-FEED-M2.4). */}
        {/* C3-CITIZEN-MEDIUM-SHELL-R1A : le rail citoyen n'est plus monté ici.
            `WebSidebar` en est le propriétaire unique et le rend lui-même
            lorsque la route est éligible. La classe `.citizen-medium-shell`
            reste : elle scope encore les styles Feed medium M3 à M7. */}
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
