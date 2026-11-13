"use client";

import {
  SEARCH_DESKTOP_CLEAR_ARIA,
  SEARCH_DESKTOP_SEARCH_LABEL,
  searchPlaceholderForCity,
} from "@yunicity/utils";
import { Search, X } from "lucide-react";

type SearchDesktopSearchBarProps = {
  city: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  minQueryHint?: string | null;
};

/** Barre recherche hero desktop — maquette SEARCH-DESKTOP-01. */
export function SearchDesktopSearchBar({
  city,
  query,
  onQueryChange,
  onSubmit,
  minQueryHint,
}: SearchDesktopSearchBarProps) {
  return (
    <div className="space-y-2">
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label className="sr-only" htmlFor="search-desktop-q">
          Recherche globale
        </label>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-neutral-200/90 bg-white px-4 py-3 shadow-sm transition focus-within:border-yunicity-primary/40 focus-within:ring-2 focus-within:ring-yunicity-primary/15">
          <Search className="h-5 w-5 shrink-0 text-yunicity-primary" aria-hidden />
          <input
            id="search-desktop-q"
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={searchPlaceholderForCity(city)}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
          />
          {query ? (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
              aria-label={SEARCH_DESKTOP_CLEAR_ARIA}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
        <button
          type="submit"
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-2xl bg-yunicity-primary px-5 text-sm font-semibold text-white transition hover:bg-yunicity-primary/90 active:scale-[0.98]"
        >
          {SEARCH_DESKTOP_SEARCH_LABEL}
        </button>
      </form>
      {minQueryHint ? <p className="px-1 text-xs text-neutral-500">{minQueryHint}</p> : null}
    </div>
  );
}
