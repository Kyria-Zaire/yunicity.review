"use client";

import type { VideosPortalTabId } from "@yunicity/utils";
import {
  VIDEOS_MOBILE_TAB_FOR_YOU,
  VIDEOS_TAB_NEW,
  VIDEOS_TAB_SUBSCRIPTIONS,
  VIDEOS_TAB_TRENDING,
} from "@yunicity/utils";

const MOBILE_TABS: { id: VideosPortalTabId; label: string }[] = [
  { id: "all", label: VIDEOS_MOBILE_TAB_FOR_YOU },
  { id: "trending", label: VIDEOS_TAB_TRENDING },
  { id: "new", label: VIDEOS_TAB_NEW },
  { id: "subscriptions", label: VIDEOS_TAB_SUBSCRIPTIONS },
];

type VideosMobileViewPillsProps = {
  activeTab: VideosPortalTabId;
  onTabChange: (tab: VideosPortalTabId) => void;
};

/** Pills catégories mobile — Pour vous · Tendances · Nouveautés · Abonnements. */
export function VideosMobileViewPills({ activeTab, onTabChange }: VideosMobileViewPillsProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Catégories vidéo"
    >
      {MOBILE_TABS.map((item) => {
        const active = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onTabChange(item.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-yunicity-primary text-white shadow-sm"
                : "border border-neutral-200/90 bg-white text-neutral-800"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
