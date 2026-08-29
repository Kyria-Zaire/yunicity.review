"use client";

import { NotificationBellLink } from "@/components/layout/notification-bell-link";

import { YunicityLogo } from "@/components/brand";
import { useNotificationUnread } from "@/hooks/use-citizen-chrome";

/** Header chrome mobile Recherche (MOBILE-SEARCH-01). */
export function SearchMobileHeader() {
  const unread = useNotificationUnread();

  return (
    <header className="sticky top-0 z-[var(--z-chrome)] border-b border-neutral-200/80 bg-white pt-[env(safe-area-inset-top)]">
      <div className="relative flex items-center justify-between gap-3 px-4 py-3">
        <YunicityLogo href="/feed" size="sm" priority />
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-base font-bold text-neutral-900 opacity-0">
          .
        </span>
        <NotificationBellLink unreadCount={unread} />
      </div>
    </header>
  );
}
