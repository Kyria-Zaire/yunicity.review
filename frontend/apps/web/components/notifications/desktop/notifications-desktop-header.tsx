"use client";

import {
  NOTIFICATIONS_DESKTOP_MARK_ALL_READ,
  NOTIFICATIONS_DESKTOP_SETTINGS,
  NOTIFICATIONS_DESKTOP_SUBTITLE,
  NOTIFICATIONS_DESKTOP_TITLE,
} from "@yunicity/utils";
import { Check, Settings } from "lucide-react";
import Link from "next/link";

type NotificationsDesktopHeaderProps = {
  unreadCount: number;
  onMarkAllRead: () => void;
};

export function NotificationsDesktopHeader({
  unreadCount,
  onMarkAllRead,
}: NotificationsDesktopHeaderProps) {
  return (
    <header
      className="mb-6 flex flex-wrap items-start justify-between gap-4"
      data-notifications-desktop-header=""
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 lg:text-[1.75rem]">
          {NOTIFICATIONS_DESKTOP_TITLE}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
          {NOTIFICATIONS_DESKTOP_SUBTITLE}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
        >
          <Settings className="h-4 w-4 shrink-0" aria-hidden />
          {NOTIFICATIONS_DESKTOP_SETTINGS}
        </Link>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-yunicity-primary shadow-sm transition hover:border-yunicity-primary/30 hover:bg-[#EEF0FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
          >
            <Check className="h-4 w-4 shrink-0" aria-hidden />
            {NOTIFICATIONS_DESKTOP_MARK_ALL_READ}
          </button>
        ) : null}
      </div>
    </header>
  );
}
