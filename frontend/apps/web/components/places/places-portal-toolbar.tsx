"use client";

import type { CulturalPlaceSort } from "@yunicity/types";
import type { PlacesCategoryFilterId } from "@yunicity/utils";
import {
  isPlacesMoreCategoryActive,
  PLACES_MORE_CATEGORY_FILTERS,
  PLACES_PORTAL_FILTER_MORE,
  PLACES_PORTAL_SEARCH_PLACEHOLDER,
  PLACES_PORTAL_SORT_FEATURED,
  PLACES_PORTAL_SORT_LABEL,
  PLACES_PORTAL_SORT_NAME,
  PLACES_PORTAL_SORT_RECENT,
  PLACES_VISIBLE_CATEGORY_FILTERS,
} from "@yunicity/utils";
import { ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type PlacesPortalToolbarProps = {
  searchQuery: string;
  categoryFilter: PlacesCategoryFilterId;
  sort: CulturalPlaceSort;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: PlacesCategoryFilterId) => void;
  onSortChange: (value: CulturalPlaceSort) => void;
};

const SORT_OPTIONS: { value: CulturalPlaceSort; label: string }[] = [
  { value: "featured", label: PLACES_PORTAL_SORT_FEATURED },
  { value: "recent", label: PLACES_PORTAL_SORT_RECENT },
  { value: "name", label: PLACES_PORTAL_SORT_NAME },
];

export function PlacesPortalToolbar({
  searchQuery,
  categoryFilter,
  sort,
  onSearchChange,
  onCategoryChange,
  onSortChange,
}: PlacesPortalToolbarProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreActive = isPlacesMoreCategoryActive(categoryFilter);

  useEffect(() => {
    if (!moreOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!moreRef.current?.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [moreOpen]);

  return (
    <div id="places-categories" className="scroll-mt-24 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{PLACES_PORTAL_SEARCH_PLACEHOLDER}</span>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={PLACES_PORTAL_SEARCH_PLACEHOLDER}
            className="w-full rounded-full border border-neutral-200 bg-white py-3 pl-11 pr-4 text-sm text-neutral-900 shadow-sm outline-none transition focus:border-yunicity-primary/40 focus:ring-2 focus:ring-yunicity-primary/20"
          />
        </label>
        <label className="flex shrink-0 items-center gap-2 text-sm text-neutral-600">
          <span className="whitespace-nowrap font-medium">{PLACES_PORTAL_SORT_LABEL}</span>
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as CulturalPlaceSort)}
            className="rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm focus:border-yunicity-primary/40 focus:outline-none focus:ring-2 focus:ring-yunicity-primary/20"
            aria-label={PLACES_PORTAL_SORT_LABEL}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PLACES_VISIBLE_CATEGORY_FILTERS.map((filter) => {
          const active = categoryFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onCategoryChange(filter.id)}
              aria-pressed={active}
              className={chipClass(active)}
            >
              {filter.label}
            </button>
          );
        })}

        <div className="relative" ref={moreRef}>
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            aria-haspopup="listbox"
            className={chipClass(moreActive)}
          >
            {PLACES_PORTAL_FILTER_MORE}
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          </button>
          {moreOpen ? (
            <ul
              role="listbox"
              className="absolute left-0 top-full z-20 mt-2 min-w-[12rem] rounded-2xl border border-neutral-200 bg-white py-2 shadow-lg"
            >
              {PLACES_MORE_CATEGORY_FILTERS.map((filter) => (
                <li key={filter.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={categoryFilter === filter.id}
                    onClick={() => {
                      onCategoryChange(filter.id);
                      setMoreOpen(false);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm font-medium text-neutral-800 hover:bg-neutral-50"
                  >
                    {filter.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function chipClass(active: boolean): string {
  return `inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
    active
      ? "bg-yunicity-primary text-white shadow-sm"
      : "border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
  }`;
}
