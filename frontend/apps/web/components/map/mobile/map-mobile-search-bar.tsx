"use client";

import type { MapPortalFilters } from "@yunicity/utils";
import {
  MAP_MOBILE_FILTERS_ARIA,
  MAP_MOBILE_SEARCH_PLACEHOLDER,
  MAP_PORTAL_DISTANCE,
  MAP_PORTAL_DISTANCE_KM,
  MAP_PORTAL_FILTERS_RESET,
  MAP_PORTAL_OPEN_NOW,
} from "@yunicity/utils";
import { Search, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type MapMobileSearchBarProps = {
  filters: MapPortalFilters;
  onChangeFilters: (filters: MapPortalFilters) => void;
};

/** Recherche + filtres mobile sur la carte (MOBILE-MAP-01). */
export function MapMobileSearchBar({ filters, onChangeFilters }: MapMobileSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 space-y-2 p-3">
      <div className="pointer-events-auto flex items-center gap-2">
        <form onSubmit={handleSearchSubmit} className="min-w-0 flex-1">
          <label className="relative block">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={MAP_MOBILE_SEARCH_PLACEHOLDER}
              className="w-full rounded-2xl border border-neutral-200/80 bg-white py-3 pl-10 pr-4 text-sm text-neutral-900 shadow-lg outline-none placeholder:text-neutral-400 focus:border-yunicity-primary focus:ring-2 focus:ring-yunicity-primary/25"
            />
          </label>
        </form>
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          aria-label={MAP_MOBILE_FILTERS_ARIA}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-neutral-200/80 bg-white text-yunicity-primary shadow-lg transition hover:bg-yunicity-primary-soft"
        >
          <SlidersHorizontal className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </button>
      </div>

      {filtersOpen ? (
        <div className="pointer-events-auto rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-lg">
          <label className="flex items-center gap-2 text-sm text-neutral-800">
            <input
              type="checkbox"
              checked={filters.openNow}
              onChange={(event) =>
                onChangeFilters({ ...filters, openNow: event.target.checked })
              }
              className="h-4 w-4 rounded border-neutral-300 text-yunicity-primary focus:ring-yunicity-primary"
            />
            {MAP_PORTAL_OPEN_NOW}
          </label>
          <label className="mt-3 block text-xs font-semibold text-neutral-600">
            {MAP_PORTAL_DISTANCE}
            <select
              value={filters.maxDistanceKm}
              onChange={(event) =>
                onChangeFilters({
                  ...filters,
                  maxDistanceKm: Number(event.target.value),
                })
              }
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-800"
            >
              {[1, 2, 5, 10].map((km) => (
                <option key={km} value={km}>
                  {MAP_PORTAL_DISTANCE_KM(km)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => onChangeFilters({ ...filters, openNow: false, maxDistanceKm: 5, ambiances: [] })}
            className="mt-3 text-xs font-semibold text-yunicity-primary"
          >
            {MAP_PORTAL_FILTERS_RESET}
          </button>
        </div>
      ) : null}
    </div>
  );
}
