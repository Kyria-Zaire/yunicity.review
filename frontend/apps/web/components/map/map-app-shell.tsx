"use client";

import { CitizenTopNav } from "@/components/layout/citizen-top-nav";
import { WebSidebar } from "@/components/layout/web-sidebar";
import { WebMobileFooter, WebMobileHeader } from "@/components/layout/web-mobile-chrome";
import { WebMobileStrategicBottomNav } from "@/components/layout/web-mobile-strategic-bottom-nav";
import type { ReactNode } from "react";

/**
 * Shell Carte — chrome global ; le layout 3 colonnes vit dans MapDesktopScreen.
 *
 * MAP-HEADER-01 : l'en-tête commun est monté en tête de la colonne principale,
 * comme sur les autres shells. Il n'est AFFICHÉ qu'à partir de 1024 px
 * (`globals.css`, bloc carte ≥ 1024) : sous ce seuil, le rail medium et la
 * barre du bas portent la navigation, et les règles carte < 1024 le masquent.
 */
export function MapAppShell({ children }: { children: ReactNode }) {
  return (
    <div className="web-shell-page map-mobile-shell min-h-dvh bg-[#F4F5F7]">
      <WebMobileHeader />

      <div className="web-three-col places-shell-grid">
        <WebSidebar />

        <main className="web-main-column min-w-0 pt-0 sm:pt-2 xl:pt-0">
          <CitizenTopNav />
          <div className="pb-16 sm:pb-8 lg:pb-8 xl:pb-10 2xl:pb-12">{children}</div>
        </main>
      </div>

      <WebMobileFooter />
      <WebMobileStrategicBottomNav />
    </div>
  );
}
