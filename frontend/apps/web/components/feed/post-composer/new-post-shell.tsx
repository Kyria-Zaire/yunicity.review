"use client";

import { CitizenTopNav } from "@/components/layout/citizen-top-nav";
import { WebMobileHeader } from "@/components/layout/web-mobile-chrome";
import { WebMobileStrategicBottomNav } from "@/components/layout/web-mobile-strategic-bottom-nav";
import { WebSidebar } from "@/components/layout/web-sidebar";
import { useMobileChromeInsets } from "@/hooks/use-mobile-chrome-insets";
import { CITIZEN_MOBILE_BOTTOM_NAV_PADDING } from "@/lib/layout/feed-mobile-refonte";
import { useRef, type ReactNode } from "react";

/**
 * Shell du composeur de publication — mobile / medium / desktop (FEED-NEW-UX-01).
 *
 * Transposé du patron `EventCreateAppShell` : le chrome citoyen est emprunté
 * tel quel, jamais réinventé. Une composition unique s'adapte aux trois
 * formats, au lieu de deux vues montées puis départagées par CSS — l'ancien
 * écran rendait ses deux arbres en même temps, et jsdom les voyait tous les
 * deux, d'où les doubles boutons « Publier ».
 */
export function NewPostShell({ children }: { children: ReactNode }) {
  const racine = useRef<HTMLDivElement>(null);
  useMobileChromeInsets(racine);

  return (
    <div ref={racine} className="web-shell-page new-post-shell min-h-dvh">
      <WebMobileHeader />

      <div className="web-three-col places-shell-grid">
        <WebSidebar />

        <main className="web-main-column min-w-0 pt-0 sm:pt-2 xl:pt-0">
          <div className="hidden min-[1024px]:block">
            <CitizenTopNav />
          </div>
          <div className={`new-post-content ${CITIZEN_MOBILE_BOTTOM_NAV_PADDING}`}>{children}</div>
        </main>
      </div>

      <WebMobileStrategicBottomNav />
    </div>
  );
}
