"use client";

import type { PlaceDetailDesktopTabId } from "@yunicity/utils";
import {
  PLACE_DETAIL_DESKTOP_TAB_EVENTS,
  PLACE_DETAIL_DESKTOP_TAB_OVERVIEW,
  PLACE_DETAIL_DESKTOP_TAB_PRACTICAL,
  PLACE_DETAIL_DESKTOP_TAB_PUBLICATIONS,
} from "@yunicity/utils";

const TABS: Array<{ id: PlaceDetailDesktopTabId; label: string }> = [
  { id: "overview", label: PLACE_DETAIL_DESKTOP_TAB_OVERVIEW },
  { id: "practical", label: PLACE_DETAIL_DESKTOP_TAB_PRACTICAL },
  { id: "events", label: PLACE_DETAIL_DESKTOP_TAB_EVENTS },
  { id: "publications", label: PLACE_DETAIL_DESKTOP_TAB_PUBLICATIONS },
];

type PlaceDesktopDetailTabsProps = {
  activeTab: PlaceDetailDesktopTabId;
  onTabChange: (tabId: PlaceDetailDesktopTabId) => void;
};

export function PlaceDesktopDetailTabs({ activeTab, onTabChange }: PlaceDesktopDetailTabsProps) {
  return (
    <nav
      aria-label="Sections du lieu"
      className="border-b border-neutral-200"
      data-place-desktop-detail-tabs=""
    >
      <ul className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => onTabChange(tab.id)}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "border-yunicity-primary text-yunicity-primary"
                    : "border-transparent text-neutral-600 hover:border-neutral-300 hover:text-neutral-900"
                }`}
              >
                {tab.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
