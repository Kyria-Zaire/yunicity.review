"use client";

import { YunicityLogo } from "@/components/brand";
import { NOTIFICATIONS_MOBILE_SETTINGS_ARIA, NOTIFICATIONS_MOBILE_TITLE } from "@yunicity/utils";
import { Settings } from "lucide-react";
import Link from "next/link";

/** Header mobile Notifications — logo · titre · paramètres (maquette R2). */
export function NotificationsMobileHeader() {
  return (
    <header
      className="sticky top-0 z-[var(--z-chrome)] border-b border-neutral-200/80 bg-white pt-[env(safe-area-inset-top)]"
      data-notifications-mobile-header=""
    >
      <div className="relative flex items-center justify-between gap-2 px-3 py-2.5">
        <YunicityLogo href="/feed" size="sm" priority />

        <h1 className="pointer-events-none absolute left-1/2 max-w-[50%] -translate-x-1/2 truncate text-base font-bold text-neutral-900">
          {NOTIFICATIONS_MOBILE_TITLE}
        </h1>

        <Link
          href="/settings"
          aria-label={NOTIFICATIONS_MOBILE_SETTINGS_ARIA}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-700 transition hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
        >
          <Settings className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </Link>
      </div>
    </header>
  );
}
