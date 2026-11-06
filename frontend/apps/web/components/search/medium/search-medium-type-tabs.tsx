"use client";

import type { SearchTypeFilter } from "@yunicity/types";
import { FEED_PORTAL_FILTER, SEARCH_DESKTOP_TYPE_TABS } from "@yunicity/utils";
import { SlidersHorizontal } from "lucide-react";

type SearchMediumTypeTabsProps = {
  value: SearchTypeFilter;
  onChange: (value: SearchTypeFilter) => void;
  filterPanelOpen: boolean;
  filterActive: boolean;
  onOpenFilter: () => void;
};

export function SearchMediumTypeTabs({
  value,
  onChange,
  filterPanelOpen,
  filterActive,
  onOpenFilter,
}: SearchMediumTypeTabsProps) {
  return (
    <div
      className="flex items-center gap-2"
      data-search-medium-type-tabs=""
      role="tablist"
      aria-label="Filtrer par type de contenu"
    >
      <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SEARCH_DESKTOP_TYPE_TABS.map((tab) => {
          const active = tab.value === value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.value)}
              className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-yunicity-primary bg-[#EEF0FF] text-yunicity-primary"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        data-search-medium-filter=""
        data-search-medium-filter-active={filterActive ? "" : undefined}
        onClick={() => onOpenFilter()}
        aria-expanded={filterPanelOpen}
        aria-haspopup="dialog"
        aria-pressed={filterActive}
        className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 ${
          filterActive
            ? "border-yunicity-primary bg-[#EEF0FF] text-yunicity-primary"
            : filterPanelOpen
              ? "border-neutral-400 bg-neutral-50 text-neutral-800"
              : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
        }`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="whitespace-nowrap">{FEED_PORTAL_FILTER}</span>
      </button>
    </div>
  );
}
