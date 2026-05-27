"use client";

import { searchPlaceholderForCity } from "@yunicity/utils";

type SearchTopBarProps = {
  city: string;
  query: string;
  onQueryChange: (value: string) => void;
  minQueryHint?: string | null;
};

export function SearchTopBar({ city, query, onQueryChange, minQueryHint }: SearchTopBarProps) {
  return (
    <div className="space-y-2">
      <label className="sr-only" htmlFor="search-explorer-q">
        Recherche locale
      </label>
      <div className="flex items-center gap-3 rounded-full border border-neutral-200/90 bg-white px-4 py-3 shadow-sm transition focus-within:border-yunicity-primary/40 focus-within:ring-2 focus-within:ring-yunicity-primary/15">
        <svg
          className="h-5 w-5 shrink-0 text-neutral-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3-3" strokeLinecap="round" />
        </svg>
        <input
          id="search-explorer-q"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchPlaceholderForCity(city)}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
        />
      </div>
      {minQueryHint ? <p className="px-1 text-xs text-neutral-500">{minQueryHint}</p> : null}
    </div>
  );
}
