"use client";

import { CitizenTopNav } from "@/components/layout/citizen-top-nav";
import { WebSidebar } from "@/components/layout/web-sidebar";
import { WebMobileFooter, WebMobileHeader } from "@/components/layout/web-mobile-chrome";
import { WebMobileStrategicBottomNav } from "@/components/layout/web-mobile-strategic-bottom-nav";
import type { ReactNode } from "react";

type StoriesAppShellProps = {
  children: ReactNode;
  rightRail?: ReactNode;
  /** Plein écran mobile pour /stories/new (MOBILE-NEW-STORY-01). */
  variant?: "portal" | "new-story";
};

export function StoriesAppShell({
  children,
  rightRail,
  variant = "portal",
}: StoriesAppShellProps) {
  const shellClass =
    variant === "new-story" ? "stories-new-mobile-shell" : "stories-portal-shell";

  return (
    <div className={`web-shell-page ${shellClass} min-h-dvh bg-[#F4F5F7]`}>
      {variant === "portal" ? <WebMobileHeader /> : null}

      <div className="web-three-col places-shell-grid">
        <WebSidebar />
        <div className="web-main-column min-w-0 pt-0 sm:pt-2 xl:pt-0">
          {variant === "portal" ? <CitizenTopNav /> : null}
          <div
            className={
              variant === "new-story"
                ? "pb-[max(0.75rem,env(safe-area-inset-bottom))]"
                : "flex gap-6 pb-16 lg:pb-20 max-[639.98px]:pb-[calc(6rem+env(safe-area-inset-bottom))]"
            }
          >
            {children}
            {rightRail ? (
              <aside className="hidden w-72 shrink-0 2xl:block">
                <div className="sticky top-24 space-y-4">{rightRail}</div>
              </aside>
            ) : null}
          </div>
        </div>
      </div>

      {variant === "portal" ? <WebMobileFooter /> : null}
      {variant === "portal" ? <WebMobileStrategicBottomNav /> : null}
    </div>
  );
}
