"use client";

import {
  NEIGHBORHOODS_MOBILE_FILTERS_ARIA,
  NEIGHBORHOODS_MOBILE_FILTERS_SOON,
  NEIGHBORHOODS_MOBILE_SEARCH_PLACEHOLDER,
} from "@yunicity/utils";
import { Search, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";

type NeighborhoodsMobileSearchBarProps = {
  query: string;
  onQueryChange: (value: string) => void;
};

/** Recherche + filtre mobile Quartiers (MOBILE-QUARTIERS-01). */
export function NeighborhoodsMobileSearchBar({
  query,
  onQueryChange,
}: NeighborhoodsMobileSearchBarProps) {
  const router = useRouter();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      router.push("/search?group=neighborhoods");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(trimmed)}&group=neighborhoods`);
  }

  return (
    <div className="flex items-center gap-2">
      <form onSubmit={handleSubmit} className="min-w-0 flex-1">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={NEIGHBORHOODS_MOBILE_SEARCH_PLACEHOLDER}
            className="h-11 w-full rounded-2xl border border-neutral-200/90 bg-white py-2 pl-10 pr-3 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-yunicity-primary/40 focus:outline-none focus:ring-2 focus:ring-yunicity-primary/15"
          />
        </label>
      </form>
      <button
        type="button"
        disabled
        title={NEIGHBORHOODS_MOBILE_FILTERS_SOON}
        aria-label={NEIGHBORHOODS_MOBILE_FILTERS_ARIA}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-200/90 bg-white text-neutral-400 opacity-60"
      >
        <SlidersHorizontal className="h-[18px] w-[18px]" aria-hidden />
      </button>
    </div>
  );
}
