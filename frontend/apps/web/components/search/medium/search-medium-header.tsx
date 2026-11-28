"use client";

import { FEED_PORTAL_FILTER, searchPlaceholderForCity } from "@yunicity/utils";
import { MapPin, Search, SlidersHorizontal } from "lucide-react";
import type { FormEvent, Ref } from "react";

type SearchMediumHeaderProps = {
  city: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  filterPanelOpen: boolean;
  filterActive: boolean;
  onOpenFilter: () => void;
  filterButtonRef?: Ref<HTMLButtonElement>;
};

/** Header hero medium Recherche — 640 → 1023 px (aligné Lieux / Discussions). */
export function SearchMediumHeader({
  city,
  query,
  onQueryChange,
  onSubmit,
  filterPanelOpen,
  filterActive,
  onOpenFilter,
  filterButtonRef,
}: SearchMediumHeaderProps) {
  return (
    <div className="search-medium-header" data-search-medium-header="">
      <span
        data-search-medium-header-identity=""
        className="shrink-0 text-lg font-extrabold tracking-tight text-yunicity-primary"
      >
        Yunicity
      </span>

      <span
        data-search-medium-header-city=""
        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-neutral-700"
      >
        <MapPin className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
        <span className="whitespace-nowrap">
          <span className="sr-only">Ville courante : </span>
          {city}
        </span>
      </span>

      <form
        className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 transition-colors focus-within:border-yunicity-primary/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-yunicity-primary/15"
        data-search-medium-header-search=""
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <Search className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
        <label className="sr-only" htmlFor="search-medium-header-q">
          Recherche globale
        </label>
        <input
          id="search-medium-header-q"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchPlaceholderForCity(city)}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-500"
        />
      </form>

      <button
        type="button"
        ref={filterButtonRef}
        data-search-medium-header-filter=""
        data-search-medium-filter-active={filterActive ? "" : undefined}
        onClick={() => onOpenFilter()}
        aria-expanded={filterPanelOpen}
        aria-haspopup="dialog"
        aria-pressed={filterActive}
        className={`inline-flex min-h-11 min-w-11 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2 ${
          filterActive
            ? "border-yunicity-primary bg-[#EEF0FF] text-yunicity-primary ring-1 ring-yunicity-primary/40"
            : filterPanelOpen
              ? "border-neutral-400 bg-neutral-50 text-neutral-800"
              : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
        }`}
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden />
        <span className="whitespace-nowrap">{FEED_PORTAL_FILTER}</span>
        {filterActive ? <span className="sr-only"> — filtre actif</span> : null}
      </button>
    </div>
  );
}
