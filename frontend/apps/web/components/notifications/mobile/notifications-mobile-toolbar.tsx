"use client";

import {
  NOTIFICATIONS_DESKTOP_TYPE_OPTIONS,
  NOTIFICATIONS_MOBILE_FILTERS_ARIA,
  NOTIFICATIONS_MOBILE_FILTERS_TITLE,
  NOTIFICATIONS_MOBILE_TAB_ALL,
  NOTIFICATIONS_MOBILE_TAB_UNREAD,
  type NotificationsDesktopPrimaryTab,
  type NotificationsDesktopTypeFilter,
} from "@yunicity/utils";
import { Sheet } from "@yunicity/ui/primitives";
import { SlidersHorizontal } from "lucide-react";
import { useRef, useState } from "react";

import { NAVIGATION_MODAL_Z_INDEX } from "@/lib/layout/navigation-overlay-layers";

type NotificationsMobileToolbarProps = {
  primaryTab: NotificationsDesktopPrimaryTab;
  typeFilter: NotificationsDesktopTypeFilter;
  unreadCount: number;
  onPrimaryTabChange: (tab: NotificationsDesktopPrimaryTab) => void;
  onTypeFilterChange: (filter: NotificationsDesktopTypeFilter) => void;
};

export function NotificationsMobileToolbar({
  primaryTab,
  typeFilter,
  unreadCount,
  onPrimaryTabChange,
  onTypeFilterChange,
}: NotificationsMobileToolbarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const filterActive = typeFilter !== "all";

  return (
    <div
      className="flex items-center justify-between gap-2 border-b border-neutral-200/90"
      data-notifications-mobile-toolbar=""
    >
      <div className="flex gap-5" role="tablist" aria-label="Filtrer les notifications">
        {(
          [
            { id: "all" as const, label: NOTIFICATIONS_MOBILE_TAB_ALL },
            { id: "unread" as const, label: NOTIFICATIONS_MOBILE_TAB_UNREAD },
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
              className={`-mb-px inline-flex items-center gap-1.5 border-b-2 pb-2.5 text-sm font-semibold transition ${
                active
                  ? "border-yunicity-primary text-yunicity-primary"
                  : "border-transparent text-neutral-500"
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

      <button
        type="button"
        ref={filterButtonRef}
        aria-label={NOTIFICATIONS_MOBILE_FILTERS_ARIA}
        aria-expanded={filterOpen}
        aria-pressed={filterActive}
        onClick={() => setFilterOpen(true)}
        className={`mb-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
          filterActive
            ? "border-yunicity-primary bg-[#EEF0FF] text-yunicity-primary"
            : "border-neutral-200 bg-white text-neutral-700"
        }`}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
      </button>

      <Sheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        side="right"
        title={NOTIFICATIONS_MOBILE_FILTERS_TITLE}
        closeLabel="Fermer"
        returnFocusRef={filterButtonRef}
        zIndex={NAVIGATION_MODAL_Z_INDEX}
        className="max-w-md"
      >
        <nav className="space-y-1 px-1 pb-6" aria-label={NOTIFICATIONS_MOBILE_FILTERS_TITLE}>
          {NOTIFICATIONS_DESKTOP_TYPE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={typeFilter === option.id}
              onClick={() => {
                onTypeFilterChange(option.id);
                setFilterOpen(false);
              }}
              className={`flex w-full items-center rounded-xl px-3 py-3 text-left text-sm font-medium transition ${
                typeFilter === option.id
                  ? "bg-[#EEF0FF] text-yunicity-primary"
                  : "text-neutral-800 hover:bg-neutral-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </nav>
      </Sheet>
    </div>
  );
}
