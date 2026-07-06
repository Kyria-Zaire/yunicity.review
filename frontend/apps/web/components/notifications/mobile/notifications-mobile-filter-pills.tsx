"use client";

import type { NotificationsMobileTabId } from "@yunicity/utils";
import {
  NOTIFICATIONS_MOBILE_TAB_ALL,
  NOTIFICATIONS_MOBILE_TAB_COMMUNITY,
  NOTIFICATIONS_MOBILE_TAB_EVENTS,
  NOTIFICATIONS_MOBILE_TAB_OFFERS,
  NOTIFICATIONS_MOBILE_TAB_PLACES,
  NOTIFICATIONS_MOBILE_TAB_SYSTEM,
} from "@yunicity/utils";
import { Bell, Calendar, MapPin, Settings, Tag, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const TAB_OPTIONS: {
  id: NotificationsMobileTabId;
  label: string;
  icon: LucideIcon;
}[] = [
  { id: "all", label: NOTIFICATIONS_MOBILE_TAB_ALL, icon: Bell },
  { id: "community", label: NOTIFICATIONS_MOBILE_TAB_COMMUNITY, icon: Users },
  { id: "events", label: NOTIFICATIONS_MOBILE_TAB_EVENTS, icon: Calendar },
  { id: "places", label: NOTIFICATIONS_MOBILE_TAB_PLACES, icon: MapPin },
  { id: "offers", label: NOTIFICATIONS_MOBILE_TAB_OFFERS, icon: Tag },
  { id: "system", label: NOTIFICATIONS_MOBILE_TAB_SYSTEM, icon: Settings },
];

type NotificationsMobileFilterPillsProps = {
  activeTab: NotificationsMobileTabId;
  badges: Record<NotificationsMobileTabId, number>;
  onSelectTab: (tab: NotificationsMobileTabId) => void;
};

/** Pills filtres mobile Notifications (MOBILE-NOTIFICATIONS-01). */
export function NotificationsMobileFilterPills({
  activeTab,
  badges,
  onSelectTab,
}: NotificationsMobileFilterPillsProps) {
  return (
    <div
      className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Catégories de notifications"
    >
      <div className="flex min-w-max gap-2">
        {TAB_OPTIONS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const badge = badges[tab.id] ?? 0;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelectTab(tab.id)}
              className={`inline-flex shrink-0 flex-col items-center gap-1 rounded-2xl px-3 py-2 transition ${
                isActive
                  ? "bg-yunicity-primary-soft text-yunicity-primary"
                  : "bg-white text-neutral-600 ring-1 ring-neutral-200/90"
              }`}
            >
              <span className="relative inline-flex">
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                {badge > 0 ? (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-yunicity-primary px-1 text-[9px] font-bold text-white">
                    {badge > 9 ? "9+" : badge}
                  </span>
                ) : null}
              </span>
              <span className="text-[10px] font-semibold">{tab.label}</span>
              {isActive ? (
                <span className="h-0.5 w-6 rounded-full bg-yunicity-primary" aria-hidden />
              ) : (
                <span className="h-0.5 w-6" aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
