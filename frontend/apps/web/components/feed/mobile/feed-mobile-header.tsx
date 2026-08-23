"use client";

import { YunicityLogo } from "@/components/brand";
import { CitizenMobileHeaderActions } from "@/components/layout/citizen-mobile-header-actions";

/** Header fil local mobile — logo Yunicity + Explorer + Menu + CTA Profil connecté (C3.1-R1). */
export function FeedMobileHeader() {
  return (
    <header className="web-mobile-feed-only sticky top-0 z-[var(--z-chrome)] border-b border-neutral-200/80 bg-white pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="min-w-0 flex-1">
          <span className="inline-flex min-h-11 min-w-0 max-w-full items-center" data-yunicity-mobile-header-control="logo">
            <YunicityLogo href="/feed" size="sm" showWordmark priority />
          </span>
        </div>
        <CitizenMobileHeaderActions />
      </div>
    </header>
  );
}
