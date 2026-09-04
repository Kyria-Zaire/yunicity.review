"use client";

import {
  TRIBES_MEDIUM_FILTERS_TITLE,
  TRIBES_MOBILE_SEARCH_SHORT_PLACEHOLDER,
} from "@yunicity/utils";
import { Search, SlidersHorizontal } from "lucide-react";
import type { Ref } from "react";

type TribesMobileSearchFiltersProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilterCount: number;
  filterPanelOpen: boolean;
  onOpenFilters: () => void;
  filterButtonRef?: Ref<HTMLButtonElement>;
};

export function TribesMobileSearchFilters({
  searchQuery,
  onSearchChange,
  activeFilterCount,
  filterPanelOpen,
  onOpenFilters,
  filterButtonRef,
}: TribesMobileSearchFiltersProps) {
  return (
    <div className="flex items-center gap-2" data-tribes-mobile-search-filters="">
      <label className="relative block min-w-0 flex-1">
        <span className="sr-only">{TRIBES_MOBILE_SEARCH_SHORT_PLACEHOLDER}</span>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-yunicity-primary"
          aria-hidden
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={TRIBES_MOBILE_SEARCH_SHORT_PLACEHOLDER}
          className="h-11 w-full rounded-2xl border border-neutral-200/90 bg-white py-2 pl-10 pr-3 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-yunicity-primary/40 focus:outline-none focus:ring-2 focus:ring-yunicity-primary/15"
        />
      </label>
      <button
        type="button"
        ref={filterButtonRef}
        onClick={onOpenFilters}
        aria-expanded={filterPanelOpen}
        aria-haspopup="dialog"
        aria-pressed={activeFilterCount > 0}
        className={`relative inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition ${
          activeFilterCount > 0 || filterPanelOpen
            ? "border-yunicity-primary bg-[#EEF0FF] text-yunicity-primary"
            : "border-neutral-200/90 bg-white text-neutral-700"
        }`}
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden />
        {TRIBES_MEDIUM_FILTERS_TITLE}
        {activeFilterCount > 0 ? (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-yunicity-primary px-1.5 text-[10px] font-bold text-white">
            {activeFilterCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}
