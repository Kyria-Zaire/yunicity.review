"use client";

import { NotificationBellLink } from "@/components/layout/notification-bell-link";
import { YunicityLogo } from "@/components/brand";
import { useNotificationUnread } from "@/hooks/use-citizen-chrome";
import { PROFILE_MOBILE_PAGE_TITLE } from "@yunicity/utils";

/** Header mobile Profil (MOBILE-PROFILE-01). */
export function ProfileMobileHeader() {
  const unread = useNotificationUnread();

  return (
    <header className="sticky top-0 z-[var(--z-chrome)] border-b border-neutral-200/80 bg-white pt-[env(safe-area-inset-top)]">
      <div className="relative flex items-center justify-between gap-2 px-3 py-2.5">
        <YunicityLogo href="/feed" size="sm" priority />

        <h1 className="pointer-events-none absolute left-1/2 max-w-[40%] -translate-x-1/2 truncate text-base font-bold text-neutral-900">
          {PROFILE_MOBILE_PAGE_TITLE}
        </h1>

        <NotificationBellLink unreadCount={unread} />
      </div>
    </header>
  );
}
