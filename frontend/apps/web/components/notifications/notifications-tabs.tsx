"use client";

import type { NotificationInboxTab } from "@yunicity/types";
import { notificationTabLabel } from "@yunicity/utils";

const MOBILE_TABS: NotificationInboxTab[] = [
  "all",
  "unread",
  "mentions",
  "social",
  "events",
  "passport",
  "system",
];

type NotificationsTabsProps = {
  active: NotificationInboxTab;
  unreadCount: number;
  sectionUnread: {
    mentions: number;
    social: number;
    events: number;
    passport: number;
    system: number;
  };
  onChange: (tab: NotificationInboxTab) => void;
};

function badgeForTab(
  tab: NotificationInboxTab,
  unreadCount: number,
  sectionUnread: NotificationsTabsProps["sectionUnread"],
): number {
  if (tab === "unread") return unreadCount;
  if (tab === "mentions") return sectionUnread.mentions;
  if (tab === "social") return sectionUnread.social;
  if (tab === "events") return sectionUnread.events;
  if (tab === "passport") return sectionUnread.passport;
  if (tab === "system") return sectionUnread.system;
  return 0;
}

/** Filtres horizontaux — mobile / tablette (sidebar masquée). */
export function NotificationsTabs({
  active,
  unreadCount,
  sectionUnread,
  onChange,
}: NotificationsTabsProps) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1 lg:hidden">
      <div className="flex min-w-max gap-4 border-b border-neutral-200" role="tablist">
        {MOBILE_TABS.map((tab) => {
          const isActive = tab === active;
          const badge = badgeForTab(tab, unreadCount, sectionUnread);
          const label =
            badge > 0
              ? `${notificationTabLabel(tab)} (${badge > 9 ? "9+" : badge})`
              : notificationTabLabel(tab);
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab)}
              className={`relative shrink-0 pb-3 text-sm font-medium transition ${
                isActive ? "text-yunicity-primary" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {label}
              {isActive ? (
                <span
                  className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-yunicity-primary"
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
