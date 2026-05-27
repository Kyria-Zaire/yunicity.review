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
      className="flex gap-1 overflow-x-auto border-b border-neutral-200/90 pb-px"
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
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-yunicity-primary text-yunicity-primary"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
