"use client";

import {
  DISCUSSIONS_DESKTOP_SEARCH_PLACEHOLDER,
  FEED_PORTAL_FILTER,
} from "@yunicity/utils";
import { MapPin, Search, SlidersHorizontal } from "lucide-react";
import type { MouseEvent, Ref } from "react";

type DiscussionsMediumHeaderProps = {
  city: string;
  filterPanelOpen: boolean;
  filterActive: boolean;
  onOpenFilter: (trigger: HTMLButtonElement) => void;
  onFocusSearch?: () => void;
  filterButtonRef?: Ref<HTMLButtonElement>;
};

/** Header medium Discussions — 640 → 1023 px (aligné Feed / Lieux / Sortir). */
export function DiscussionsMediumHeader({
  city,
  filterPanelOpen,
  filterActive,
  onOpenFilter,
  onFocusSearch,
  filterButtonRef,
}: DiscussionsMediumHeaderProps) {
  return (
    <div className="discussions-medium-header" data-discussions-medium-header="">
      <span
        data-discussions-medium-header-identity=""
        className="shrink-0 text-lg font-extrabold tracking-tight text-yunicity-primary"
      >
        Yunicity
      </span>

      <span
        data-discussions-medium-header-city=""
        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-neutral-700"
      >
        <MapPin className="h-4 w-4 shrink-0 text-neutral-500" aria-hidden />
        <span className="whitespace-nowrap">
          <span className="sr-only">Ville courante : </span>
          {city}
        </span>
      </span>

      <button
        type="button"
        data-discussions-medium-header-search=""
        onClick={() => onFocusSearch?.()}
        className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 text-left text-sm text-neutral-600 transition-colors hover:border-neutral-300 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary focus-visible:ring-offset-2"
      >
        <Search className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{DISCUSSIONS_DESKTOP_SEARCH_PLACEHOLDER}</span>
        <span className="sr-only"> à {city}</span>
      </button>

      <button
        type="button"
        ref={filterButtonRef}
        data-discussions-medium-header-filter=""
        data-discussions-medium-filter-active={filterActive ? "" : undefined}
        onClick={(event: MouseEvent<HTMLButtonElement>) => onOpenFilter(event.currentTarget)}
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
