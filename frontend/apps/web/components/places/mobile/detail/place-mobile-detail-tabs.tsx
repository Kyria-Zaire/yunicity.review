"use client";

import type { PlaceDetailDesktopTabId } from "@yunicity/utils";
import {
  PLACE_DETAIL_MOBILE_TAB_EVENTS,
  PLACE_DETAIL_MOBILE_TAB_OVERVIEW,
  PLACE_DETAIL_MOBILE_TAB_PRACTICAL,
  PLACE_DETAIL_MOBILE_TAB_PUBLICATIONS,
} from "@yunicity/utils";

const TABS: Array<{ id: PlaceDetailDesktopTabId; label: string }> = [
  { id: "overview", label: PLACE_DETAIL_MOBILE_TAB_OVERVIEW },
  { id: "practical", label: PLACE_DETAIL_MOBILE_TAB_PRACTICAL },
  { id: "events", label: PLACE_DETAIL_MOBILE_TAB_EVENTS },
  { id: "publications", label: PLACE_DETAIL_MOBILE_TAB_PUBLICATIONS },
];

type PlaceMobileDetailTabsProps = {
  activeTab: PlaceDetailDesktopTabId;
  onTabChange: (tab: PlaceDetailDesktopTabId) => void;
};

export function PlaceMobileDetailTabs({ activeTab, onTabChange }: PlaceMobileDetailTabsProps) {
  return (
    <nav
      aria-label="Sections du lieu"
      className="border-b border-neutral-200"
      data-place-mobile-detail-tabs=""
    >
      <ul className="-mb-px flex gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => onTabChange(tab.id)}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-semibold sm:px-4 sm:text-sm ${
                  active
                    ? "border-yunicity-primary text-yunicity-primary"
                    : "border-transparent text-neutral-500"
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
