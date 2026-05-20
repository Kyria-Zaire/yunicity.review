"use client";

import type { SearchTypeFilter } from "@yunicity/types";
import { SEARCH_TYPE_TABS } from "@yunicity/utils";

type SearchTypeTabsProps = {
  value: SearchTypeFilter;
  onChange: (value: SearchTypeFilter) => void;
};

export function SearchTypeTabs({ value, onChange }: SearchTypeTabsProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="tablist"
      aria-label="Filtrer par type de contenu"
    >
      {SEARCH_TYPE_TABS.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              active
                ? "bg-yunicity-primary text-white"
                : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
