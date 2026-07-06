"use client";

import { CitizenAccountMenu } from "@/components/layout/citizen-account-menu";
import { useNotificationUnread } from "@/hooks/use-citizen-chrome";
import { WEB_CITIZEN_NOTIFICATIONS_NAV } from "@/lib/layout/web-layout-config";
import { Bell } from "lucide-react";
import Link from "next/link";

/**
 * Actions header mobile — cloche notifications puis menu compte (avatar).
 * Utilisé dans les barres hero mobile (fil, carte, etc.).
 */
export function CitizenMobileHeaderActions() {
  const unread = useNotificationUnread();

  return (
    <div className="flex shrink-0 items-center gap-0.5">
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
      <CitizenAccountMenu variant="mobile-header" />
    </div>
  );
}
