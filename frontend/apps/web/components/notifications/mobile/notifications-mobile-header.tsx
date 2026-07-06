"use client";

import { YunicityLogo } from "@/components/brand";
import {
  NOTIFICATIONS_MOBILE_FILTERS_ARIA,
  NOTIFICATIONS_MOBILE_FILTERS_SOON,
  NOTIFICATIONS_MOBILE_MARK_ALL_READ,
  NOTIFICATIONS_MOBILE_MENU_ARIA,
  NOTIFICATIONS_MOBILE_TITLE,
} from "@yunicity/utils";
import { MoreVertical, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

type NotificationsMobileHeaderProps = {
  onMarkAllRead?: () => void;
  canMarkAllRead?: boolean;
};

/** Header mobile Notifications (MOBILE-NOTIFICATIONS-01). */
export function NotificationsMobileHeader({
  onMarkAllRead,
  canMarkAllRead = false,
}: NotificationsMobileHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[var(--z-chrome)] border-b border-neutral-200/80 bg-white pt-[env(safe-area-inset-top)]">
      <div className="relative flex items-center justify-between gap-2 px-3 py-2.5">
        <YunicityLogo href="/feed" size="sm" priority />

        <h1 className="pointer-events-none absolute left-1/2 max-w-[50%] -translate-x-1/2 truncate text-base font-bold text-neutral-900">
          {NOTIFICATIONS_MOBILE_TITLE}
        </h1>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            disabled
            title={NOTIFICATIONS_MOBILE_FILTERS_SOON}
            aria-label={NOTIFICATIONS_MOBILE_FILTERS_ARIA}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 opacity-45"
          >
            <SlidersHorizontal className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </button>

          <div className="relative">
            <button
              type="button"
              aria-label={NOTIFICATIONS_MOBILE_MENU_ARIA}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 transition hover:bg-neutral-100"
            >
              <MoreVertical className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </button>
            {menuOpen && canMarkAllRead && onMarkAllRead ? (
              <div className="absolute right-0 top-full z-10 mt-1 min-w-[12rem] rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                  onClick={() => {
                    onMarkAllRead();
                    setMenuOpen(false);
                  }}
                >
                  {NOTIFICATIONS_MOBILE_MARK_ALL_READ}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
