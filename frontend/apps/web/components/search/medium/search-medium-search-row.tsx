"use client";

import {
  SEARCH_DESKTOP_CLEAR_ARIA,
  SEARCH_DESKTOP_SEARCH_LABEL,
  searchPlaceholderForCity,
} from "@yunicity/utils";
import { ChevronDown, MapPin, Search, X } from "lucide-react";

type SearchMediumSearchRowProps = {
  city: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  onOpenFilters: () => void;
  minQueryHint?: string | null;
};

export function SearchMediumSearchRow({
  city,
  query,
  onQueryChange,
  onSubmit,
  onOpenFilters,
  minQueryHint,
}: SearchMediumSearchRowProps) {
  return (
    <div className="space-y-2" data-search-medium-search-row="">
      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Recherche globale</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-yunicity-primary"
            aria-hidden
          />
          <input
            id="search-medium-q"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={searchPlaceholderForCity(city)}
            autoComplete="off"
            className="h-11 w-full rounded-xl border border-neutral-200/90 bg-white pl-10 pr-9 text-sm text-neutral-900 shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-yunicity-primary/40 focus:ring-2 focus:ring-yunicity-primary/15"
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
          aria-label={SEARCH_DESKTOP_SEARCH_LABEL}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yunicity-primary text-white transition hover:bg-yunicity-primary/90 active:scale-[0.98]"
        >
          <Search className="h-4 w-4" aria-hidden />
        </button>

        <button
          type="button"
          onClick={onOpenFilters}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-neutral-200/90 bg-white px-3 text-sm font-semibold text-neutral-800 shadow-sm transition hover:border-neutral-300"
        >
          <MapPin className="h-4 w-4 text-yunicity-primary" aria-hidden />
          <span className="max-w-[5.5rem] truncate">{city}</span>
          <ChevronDown className="h-4 w-4 text-neutral-400" aria-hidden />
        </button>
      </form>
      {minQueryHint ? <p className="text-xs text-neutral-500">{minQueryHint}</p> : null}
    </div>
  );
}
