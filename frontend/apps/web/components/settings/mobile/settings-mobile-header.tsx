"use client";

import { YunicityLogo } from "@/components/brand";
import { SETTINGS_PORTAL_TITLE } from "@yunicity/utils";

/** Header hub mobile Paramètres (MOBILE-SETTINGS-01). */
export function SettingsMobileHeader() {
  return (
    <header className="sticky top-0 z-[var(--z-chrome)] border-b border-neutral-200/80 bg-white pt-[env(safe-area-inset-top)]">
      <div className="relative flex items-center justify-between gap-2 px-3 py-2.5">
        <YunicityLogo href="/feed" size="sm" priority />

        <h1 className="pointer-events-none absolute left-1/2 max-w-[50%] -translate-x-1/2 truncate text-base font-bold text-neutral-900">
          {SETTINGS_PORTAL_TITLE}
        </h1>

        <span className="inline-flex h-10 w-10 shrink-0" aria-hidden />
      </div>
    </header>
  );
}
