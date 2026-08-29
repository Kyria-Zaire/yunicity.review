"use client";

import { NotificationBellIcon, notificationAriaLabel } from "@/components/layout/notification-bell-icon";
import { WEB_CITIZEN_NOTIFICATIONS_NAV } from "@/lib/layout/web-layout-config";
import Link from "next/link";

/** Lien notifications mobile — cloche maquette + pastille. */
export function NotificationBellLink({ unreadCount }: { unreadCount: number }) {
  return (
    <Link
      href={WEB_CITIZEN_NOTIFICATIONS_NAV.href}
      aria-label={notificationAriaLabel(WEB_CITIZEN_NOTIFICATIONS_NAV.label, unreadCount)}
      className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-900 transition hover:bg-neutral-100"
    >
      <NotificationBellIcon
        unreadCount={unreadCount}
        iconClassName="h-[22px] w-[22px] text-neutral-900"
      />
    </Link>
  );
}
