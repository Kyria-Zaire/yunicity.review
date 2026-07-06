"use client";

import {
  SEARCH_MOBILE_FILTERS_ARIA,
  SEARCH_MOBILE_FILTERS_SOON,
  SEARCH_MOBILE_PLACEHOLDER,
  SEARCH_MIN_QUERY_HINT,
} from "@yunicity/utils";
import { Search, SlidersHorizontal } from "lucide-react";

type SearchMobileSearchBarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  filterActive?: boolean;
  onToggleFilter?: () => void;
  minQueryHint?: boolean;
};

/** Barre de recherche mobile (MOBILE-SEARCH-01). */
export function SearchMobileSearchBar({
  query,
  onQueryChange,
  filterActive = false,
  onToggleFilter,
  minQueryHint = false,
}: SearchMobileSearchBarProps) {
  return (
    <div className="space-y-2">
      <label className="sr-only" htmlFor="search-mobile-q">
        {SEARCH_MOBILE_PLACEHOLDER}
      </label>
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-full border border-neutral-200/90 bg-white px-4 py-3 shadow-sm focus-within:border-yunicity-primary/40 focus-within:ring-2 focus-within:ring-yunicity-primary/15">
          <Search className="h-5 w-5 shrink-0 text-neutral-400" strokeWidth={1.75} aria-hidden />
          <input
            id="search-mobile-q"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={SEARCH_MOBILE_PLACEHOLDER}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400"
          />
        </div>
        <button
          type="button"
          onClick={onToggleFilter}
          title={SEARCH_MOBILE_FILTERS_SOON}
          aria-label={SEARCH_MOBILE_FILTERS_ARIA}
          aria-pressed={filterActive}
          className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition ${
            filterActive
              ? "border-yunicity-primary bg-yunicity-primary text-white"
              : "border-neutral-200/90 bg-white text-yunicity-primary"
          }`}
        >
          <SlidersHorizontal className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </button>
      </div>
      {minQueryHint ? (
        <p className="px-1 text-xs text-neutral-500">{SEARCH_MIN_QUERY_HINT}</p>
      ) : null}
    </div>
  );
}
