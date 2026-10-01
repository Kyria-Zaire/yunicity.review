"use client";

import { SearchDesktopSearchBar } from "@/components/search/desktop/search-desktop-search-bar";
import {
  SEARCH_DESKTOP_CITY_BADGE,
  SEARCH_DESKTOP_SUBTITLE,
  SEARCH_DESKTOP_TITLE,
} from "@yunicity/utils";
import { MapPin } from "lucide-react";

type SearchDesktopHeaderProps = {
  city: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  minQueryHint?: string | null;
};

export function SearchDesktopHeader({
  city,
  query,
  onQueryChange,
  onSubmit,
  minQueryHint,
}: SearchDesktopHeaderProps) {
  return (
    <header
      className="search-desktop-hero-header space-y-5 border-b border-neutral-200/70 pb-6"
      data-search-desktop-hero-header=""
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-[2rem] font-bold tracking-tight text-neutral-950">
            {SEARCH_DESKTOP_TITLE(city)}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
            {SEARCH_DESKTOP_SUBTITLE}
          </p>
        </div>
        <p className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200/90 bg-white px-3 py-1.5 text-sm font-semibold text-neutral-800 shadow-sm">
          <MapPin className="h-4 w-4 text-yunicity-primary" aria-hidden />
          {SEARCH_DESKTOP_CITY_BADGE(city)}
        </p>
      </div>

      <SearchDesktopSearchBar
        city={city}
        query={query}
        onQueryChange={onQueryChange}
        onSubmit={onSubmit}
        minQueryHint={minQueryHint}
      />
    </header>
  );
}
