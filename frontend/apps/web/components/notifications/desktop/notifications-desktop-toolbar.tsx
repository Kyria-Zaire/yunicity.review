"use client";

import {
  NOTIFICATIONS_DESKTOP_SORT_OLDEST,
  NOTIFICATIONS_DESKTOP_SORT_RECENT,
  NOTIFICATIONS_DESKTOP_TAB_ALL,
  NOTIFICATIONS_DESKTOP_TAB_UNREAD,
  NOTIFICATIONS_DESKTOP_TYPE_OPTIONS,
  type NotificationsDesktopPrimaryTab,
  type NotificationsDesktopSort,
  type NotificationsDesktopTypeFilter,
} from "@yunicity/utils";
import { ArrowDownUp, ChevronDown } from "lucide-react";

type NotificationsDesktopToolbarProps = {
  primaryTab: NotificationsDesktopPrimaryTab;
  typeFilter: NotificationsDesktopTypeFilter;
  sort: NotificationsDesktopSort;
  unreadCount: number;
  onPrimaryTabChange: (tab: NotificationsDesktopPrimaryTab) => void;
  onTypeFilterChange: (filter: NotificationsDesktopTypeFilter) => void;
  onSortChange: (sort: NotificationsDesktopSort) => void;
};

export function NotificationsDesktopToolbar({
  primaryTab,
  typeFilter,
  sort,
  unreadCount,
  onPrimaryTabChange,
  onTypeFilterChange,
  onSortChange,
}: NotificationsDesktopToolbarProps) {
  return (
    <div
      className="mb-5 flex flex-col gap-3 border-b border-neutral-200/90 sm:flex-row sm:items-center sm:justify-between"
      data-notifications-desktop-toolbar=""
    >
      <div className="flex gap-6" role="tablist" aria-label="Filtrer les notifications">
        {(
          [
            { id: "all" as const, label: NOTIFICATIONS_DESKTOP_TAB_ALL },
            { id: "unread" as const, label: NOTIFICATIONS_DESKTOP_TAB_UNREAD },
          ] as const
        ).map((tab) => {
          const active = primaryTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onPrimaryTabChange(tab.id)}
              className={`-mb-px inline-flex items-center gap-2 border-b-2 pb-3 text-sm font-semibold transition ${
                active
                  ? "border-yunicity-primary text-yunicity-primary"
                  : "border-transparent text-neutral-500 hover:text-neutral-800"
              }`}
            >
              {tab.label}
              {tab.id === "unread" && unreadCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-yunicity-primary px-1.5 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 pb-3 sm:pb-0">
        <label className="relative min-w-[10.5rem]">
          <span className="sr-only">Type de notification</span>
          <select
            value={typeFilter}
            onChange={(event) =>
              onTypeFilterChange(event.target.value as NotificationsDesktopTypeFilter)
            }
            className="w-full appearance-none rounded-full border border-neutral-200 bg-white py-2 pl-3 pr-9 text-sm font-medium text-neutral-800 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
          >
            {NOTIFICATIONS_DESKTOP_TYPE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
            aria-hidden
          />
        </label>

        <label className="relative min-w-[11rem]">
          <span className="sr-only">Tri</span>
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as NotificationsDesktopSort)}
            className="w-full appearance-none rounded-full border border-neutral-200 bg-white py-2 pl-9 pr-9 text-sm font-medium text-neutral-800 focus:border-yunicity-primary focus:outline-none focus:ring-1 focus:ring-yunicity-primary"
          >
            <option value="recent">{NOTIFICATIONS_DESKTOP_SORT_RECENT}</option>
            <option value="oldest">{NOTIFICATIONS_DESKTOP_SORT_OLDEST}</option>
          </select>
          <ArrowDownUp
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
            aria-hidden
          />
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
            aria-hidden
          />
        </label>
      </div>
    </div>
  );
}
