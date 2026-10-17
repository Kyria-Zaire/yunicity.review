"use client";

import type { SearchTypeFilter } from "@yunicity/types";
import {
  SEARCH_DESKTOP_CLEAR_ARIA,
  SEARCH_DESKTOP_TYPE_TABS,
  SEARCH_MOBILE_BACK_ARIA,
  SEARCH_MOBILE_FILTERS_ARIA,
  SEARCH_MOBILE_FILTERS_LABEL,
  SEARCH_MOBILE_PLACEHOLDER,
  searchPlaceholderForCity,
} from "@yunicity/utils";
import { ArrowLeft, ChevronDown, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import type { FormEvent, Ref } from "react";

type SearchMobileHeroHeaderProps = {
  city: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  typeFilter: SearchTypeFilter;
  onTypeFilterChange: (tab: SearchTypeFilter) => void;
  filterActive: boolean;
  onOpenFilters: () => void;
  filterButtonRef?: Ref<HTMLButtonElement>;
  minQueryHint?: string | null;
};

export function SearchMobileHeroHeader({
  city,
  query,
  onQueryChange,
  onSubmit,
  typeFilter,
  onTypeFilterChange,
  filterActive,
  onOpenFilters,
  filterButtonRef,
  minQueryHint,
}: SearchMobileHeroHeaderProps) {
  return (
    <header
      className="search-mobile-hero-header sticky top-0 z-[var(--z-chrome)] border-b border-neutral-200/90 bg-white pt-[env(safe-area-inset-top)]"
      data-search-mobile-hero-header=""
    >
      <div className="space-y-3 px-4 pb-3 pt-3">
        <form
          className="flex items-center gap-2"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <Link
            href="/feed"
            aria-label={SEARCH_MOBILE_BACK_ARIA}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-700 transition hover:bg-neutral-100"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>

          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Recherche globale</span>
            <input
              id="search-mobile-q"
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={searchPlaceholderForCity(city) || SEARCH_MOBILE_PLACEHOLDER}
              autoComplete="off"
              className="h-11 w-full rounded-full border border-neutral-200/90 bg-white pl-4 pr-9 text-[15px] text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-yunicity-primary/40 focus:ring-2 focus:ring-yunicity-primary/15"
            />
            {query ? (
              <button
                type="button"
                onClick={() => onQueryChange("")}
                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                aria-label={SEARCH_DESKTOP_CLEAR_ARIA}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : null}
          </label>

          <button
            type="submit"
            aria-label="Rechercher"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yunicity-primary text-white transition hover:bg-yunicity-primary/90 active:scale-[0.98]"
          >
            <Search className="h-4 w-4" aria-hidden />
          </button>
        </form>

        {minQueryHint ? <p className="text-xs text-neutral-500">{minQueryHint}</p> : null}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenFilters}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-neutral-200/90 bg-white px-3 text-sm font-semibold text-neutral-800 shadow-sm transition hover:border-neutral-300"
          >
            <MapPin className="h-4 w-4 text-yunicity-primary" aria-hidden />
            {city}
            <ChevronDown className="h-4 w-4 text-neutral-400" aria-hidden />
          </button>

          <button
            type="button"
            ref={filterButtonRef}
            onClick={onOpenFilters}
            aria-label={SEARCH_MOBILE_FILTERS_ARIA}
            aria-pressed={filterActive}
            className={`ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-sm font-semibold transition ${
              filterActive
                ? "border-yunicity-primary bg-[#EEF0FF] text-yunicity-primary"
                : "border-neutral-200/90 bg-white text-neutral-800 shadow-sm hover:border-neutral-300"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            {SEARCH_MOBILE_FILTERS_LABEL}
          </button>
        </div>

        <nav
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Filtrer par type de contenu"
        >
          {SEARCH_DESKTOP_TYPE_TABS.map((tab) => {
            const active = tab.value === typeFilter;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onTypeFilterChange(tab.value)}
                className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-yunicity-primary bg-yunicity-primary text-white"
                    : "border-neutral-200 bg-white text-neutral-700"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
