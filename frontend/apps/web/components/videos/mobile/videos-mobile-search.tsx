"use client";

import { VIDEOS_MOBILE_SEARCH_PLACEHOLDER } from "@yunicity/utils";
import { Search, SlidersHorizontal } from "lucide-react";

type VideosMobileSearchProps = {
  value: string;
  onChange: (value: string) => void;
  filterOpen: boolean;
  onToggleFilter: () => void;
};

/** Recherche locale + filtre mobile (MOBILE-VIDEOS-01). */
export function VideosMobileSearch({
  value,
  onChange,
  filterOpen,
  onToggleFilter,
}: VideosMobileSearchProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">{VIDEOS_MOBILE_SEARCH_PLACEHOLDER}</span>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-neutral-400"
          aria-hidden
        />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={VIDEOS_MOBILE_SEARCH_PLACEHOLDER}
          className="h-11 w-full rounded-2xl border border-neutral-200/90 bg-white py-2 pl-10 pr-3 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-yunicity-primary/40 focus:outline-none focus:ring-2 focus:ring-yunicity-primary/15"
        />
      </label>
      <button
        type="button"
        onClick={onToggleFilter}
        aria-expanded={filterOpen}
        aria-label="Filtres vidéo"
        className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
          filterOpen
            ? "border-yunicity-primary bg-[#EEF0FF] text-yunicity-primary"
            : "border-neutral-200/90 bg-white text-neutral-600 hover:border-neutral-300"
        }`}
      >
        <SlidersHorizontal className="h-[18px] w-[18px]" aria-hidden />
      </button>
    </div>
  );
}
