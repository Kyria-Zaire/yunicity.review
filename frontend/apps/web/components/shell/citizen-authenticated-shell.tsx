"use client";

import { CitizenTopNav } from "@/components/layout/citizen-top-nav";
import { WebSidebar } from "@/components/layout/web-sidebar";
import { WebMobileStrategicBottomNav } from "@/components/layout/web-mobile-strategic-bottom-nav";
import { FeedMobileBottomNav } from "@/components/feed/mobile/feed-mobile-bottom-nav";
import { CITIZEN_MOBILE_BOTTOM_NAV_PADDING } from "@/lib/layout/feed-mobile-refonte";
import type { ReactNode } from "react";

/**
 * CitizenAuthenticatedShell — Shared chrome for authenticated citizen routes.
 *
 * Consolidates global navigation (TopNav, Sidebar, BottomNav) for citizen-facing screens.
 * Provides the responsive layout foundation for Feed and future citizen-scoped routes (D0.2+).
 *
 * Structure:
 * - Top: CitizenTopNav (desktop, ≥1280px)
 * - Left: WebSidebar (sticky, handles CitizenMediumRail for responsive medium breakpoint)
 * - Right: Citizens' content main column
 * - Bottom: barre mobile ancrée (≤639.98px) — feed via FeedMobileBottomNav, autres routes via WebMobileStrategicBottomNav.
 *
 * Responsiveness:
 * - <640px: Mobile chrome only (nav bottom, left sidebar hidden)
 * - 640-1279.98px: Medium rail appears (WebSidebar proprietary)
 * - ≥1280px: Desktop layout (top nav, full sidebar, main content)
 *
 * Classes `.citizen-medium-shell` scope Feed-specific medium styles (M3-M7).
 * Optional `variant` prop allows routes to add scope-specific classes (e.g., `citizen-feed-shell` for Feed D1.1).
 */
export function CitizenAuthenticatedShell({
  children,
  variant,
}: {
  children: ReactNode;
  variant?: string;
}) {
  return (
    <div
      className={`web-shell-page feed-mobile-shell citizen-medium-shell min-h-dvh bg-[#F4F5F7] ${variant || ""}`}
    >
      {/* R7 — chrome global : la top nav ne vit PAS dans le corps Feed. Rendue dans
          la colonne principale, elle heritait du plafond du conteneur Feed (1008px
          utiles) et se faisait rogner des que la variante Tailwind `2xl` ajoute le
          badge Ctrl K et le libelle Notifications (mesure R6A : chevauchement a
          1536 et 1920px). */}
      <div className="web-desktop-feed-only">
        <CitizenTopNav />
      </div>
      <div className="web-three-col places-shell-grid">
        <WebSidebar />
        <main className="web-main-column min-w-0 pt-0 sm:pt-2 xl:pt-0">
          <div className={`feed-app-shell-content flex gap-6 pb-16 lg:pb-20 ${CITIZEN_MOBILE_BOTTOM_NAV_PADDING}`}>
            {children}
          </div>
        </main>
      </div>
      {variant === "citizen-feed-shell" ? (
        <FeedMobileBottomNav />
      ) : (
        <WebMobileStrategicBottomNav />
      )}
    </div>
  );
}
