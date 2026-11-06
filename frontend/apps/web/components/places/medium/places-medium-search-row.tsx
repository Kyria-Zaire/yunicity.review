"use client";

import { PLACES_DESKTOP_SEARCH_PLACEHOLDER } from "@yunicity/utils";
import { Search } from "lucide-react";
import type { RefObject } from "react";

type PlacesMediumSearchRowProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchInputRef?: RefObject<HTMLInputElement>;
};

export function PlacesMediumSearchRow({
  searchQuery,
  onSearchChange,
  searchInputRef,
}: PlacesMediumSearchRowProps) {
  return (
    <div data-places-medium-search-row="">
      <label className="relative block min-w-0">
        <span className="sr-only">{PLACES_DESKTOP_SEARCH_PLACEHOLDER}</span>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-yunicity-primary"
          aria-hidden
        />
        <input
          ref={searchInputRef}
          id="places-medium-search"
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={PLACES_DESKTOP_SEARCH_PLACEHOLDER}
          className="h-12 w-full rounded-2xl border border-neutral-200/90 bg-white pl-11 pr-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-yunicity-primary/40 focus:outline-none focus:ring-2 focus:ring-yunicity-primary/15"
        />
      </label>
    </div>
  );
}
