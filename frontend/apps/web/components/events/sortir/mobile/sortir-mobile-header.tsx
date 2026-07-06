"use client";

import { YunicityLogo } from "@/components/brand";
import { useNotificationUnread } from "@/hooks/use-citizen-chrome";
import { WEB_CITIZEN_NOTIFICATIONS_NAV } from "@/lib/layout/web-layout-config";
import { SORTIR_PORTAL_PAGE_TITLE } from "@yunicity/utils";
import { Bell } from "lucide-react";
import Link from "next/link";

/** Header mobile Sortir — logo · titre · cloche (MOBILE-SORTIR-01). */
export function SortirMobileHeader() {
  const unread = useNotificationUnread();

  return (
    <header className="sticky top-0 z-[var(--z-chrome)] border-b border-neutral-200/80 bg-white pt-[env(safe-area-inset-top)]">
      <div className="relative flex items-center justify-between gap-3 px-4 py-3">
        <YunicityLogo href="/feed" size="sm" priority />
        <h1 className="pointer-events-none absolute left-1/2 max-w-[50%] -translate-x-1/2 truncate text-base font-bold text-neutral-900">
          {SORTIR_PORTAL_PAGE_TITLE}
        </h1>
        <Link
          href={WEB_CITIZEN_NOTIFICATIONS_NAV.href}
          aria-label={WEB_CITIZEN_NOTIFICATIONS_NAV.label}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-yunicity-primary transition-colors hover:bg-yunicity-primary-soft"
        >
          <Bell className="h-[22px] w-[22px]" strokeWidth={1.75} aria-hidden />
          {unread > 0 ? (
            <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#FF2D78] px-1 text-[10px] font-bold leading-none text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}
