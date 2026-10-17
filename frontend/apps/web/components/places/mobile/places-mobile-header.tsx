"use client";

import { YunicityLogo } from "@/components/brand";
import { CitizenMobileHeaderActions } from "@/components/layout/citizen-mobile-header-actions";

/**
 * Navbar mobile Lieux — logo Yunicity + Explorer + Menu + Profil (MOBILE-LIEUX-01).
 */
export function PlacesMobileHeader() {
  return (
    <header
      className="sticky top-0 z-[var(--z-chrome)] border-b border-neutral-200/80 bg-white pt-[env(safe-area-inset-top)]"
      data-places-mobile-header=""
    >
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="min-w-0 flex-1">
          <span
            className="inline-flex min-h-11 min-w-0 max-w-full items-center"
            data-yunicity-mobile-header-control="logo"
          >
            <YunicityLogo
              href="/feed"
              size="xs"
              showWordmark
              priority
              wordmarkClassName="text-base sm:text-xl"
            />
          </span>
        </div>
        <CitizenMobileHeaderActions />
      </div>
    </header>
  );
}
