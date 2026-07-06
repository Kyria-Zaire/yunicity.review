"use client";

import { YunicityLogo } from "@/components/brand";
import { CitizenMobileHeaderActions } from "@/components/layout/citizen-mobile-header-actions";

/** Header fil local mobile — logo YU + Yunicity + cloche + menu compte (MOBILE-REFONDE-01). */
export function FeedMobileHeader() {
  return (
    <header className="web-mobile-feed-only sticky top-0 z-[var(--z-chrome)] border-b border-neutral-200/80 bg-white pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <YunicityLogo href="/feed" size="sm" showWordmark priority />
        <CitizenMobileHeaderActions />
      </div>
    </header>
  );
}
