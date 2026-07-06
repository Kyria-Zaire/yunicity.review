"use client";

import { TRIBES_MOBILE_FILTERS_ARIA, TRIBES_MOBILE_SEARCH_PLACEHOLDER } from "@yunicity/utils";
import { Search, SlidersHorizontal } from "lucide-react";

type TribesMobileSearchBarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  filterActive: boolean;
  onToggleFilter: () => void;
};

/** Recherche + filtre mobile Tribus (MOBILE-TRIBES-01). */
export function TribesMobileSearchBar({
  query,
  onQueryChange,
  filterActive,
  onToggleFilter,
}: TribesMobileSearchBarProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="relative block min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={TRIBES_MOBILE_SEARCH_PLACEHOLDER}
          className="h-11 w-full rounded-2xl border border-neutral-200/90 bg-white py-2 pl-10 pr-3 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-yunicity-primary/40 focus:outline-none focus:ring-2 focus:ring-yunicity-primary/15"
        />
      </label>
      <button
        type="button"
        onClick={onToggleFilter}
        aria-pressed={filterActive}
        aria-label={TRIBES_MOBILE_FILTERS_ARIA}
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
          filterActive
            ? "border-yunicity-primary bg-[#EEF0FF] text-yunicity-primary"
            : "border-neutral-200/90 bg-white text-neutral-600 hover:border-neutral-300"
        }`}
      >
        <SlidersHorizontal className="h-[18px] w-[18px]" aria-hidden />
      </button>
    </div>
  );
}
