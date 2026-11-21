"use client";

import {
  NOTIFICATIONS_DESKTOP_RAIL_SUMMARY_UNREAD,
  NOTIFICATIONS_MEDIUM_SUMMARY_DISPLAYED,
  NOTIFICATIONS_MOBILE_MARK_ALL_READ,
} from "@yunicity/utils";
import { Mail } from "lucide-react";

type NotificationsMobileSummaryBannerProps = {
  unreadCount: number;
  displayedCount: number;
  onMarkAllRead: () => void;
};

export function NotificationsMobileSummaryBanner({
  unreadCount,
  displayedCount,
  onMarkAllRead,
}: NotificationsMobileSummaryBannerProps) {
  return (
    <section
      className="flex items-center gap-3 rounded-2xl border border-yunicity-primary/15 bg-[#F7F8FF] px-3 py-3"
      data-notifications-mobile-summary=""
    >
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yunicity-primary text-white">
        <Mail className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-yunicity-primary">
          {NOTIFICATIONS_DESKTOP_RAIL_SUMMARY_UNREAD(unreadCount)}
        </p>
        <p className="mt-0.5 text-xs text-neutral-600">
          {NOTIFICATIONS_MEDIUM_SUMMARY_DISPLAYED(displayedCount)}
        </p>
      </div>
      {unreadCount > 0 ? (
        <button
          type="button"
          onClick={onMarkAllRead}
          className="shrink-0 rounded-full border border-yunicity-primary px-3 py-2 text-xs font-semibold text-yunicity-primary transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
        >
          {NOTIFICATIONS_MOBILE_MARK_ALL_READ}
        </button>
      ) : null}
    </section>
  );
}
