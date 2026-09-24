"use client";

import { PlacesCategoryChips } from "@/components/places/shared/places-category-chips";
import { PlacesMediumViewBar } from "@/components/places/medium/places-medium-view-bar";
import type { PlacesCategoryFilterId } from "@yunicity/utils";
import {
  PLACES_DESKTOP_ACCESSIBILITY_PMR,
  PLACES_DESKTOP_BREADCRUMB,
  PLACES_DESKTOP_EDITORIAL_TITLE,
  PLACES_DESKTOP_NAV_SAVED,
  PLACES_MEDIUM_FILTERS_TITLE,
  PLACES_MOBILE_EDITORIAL_BODY,
  PLACES_MOBILE_SEARCH_PLACEHOLDER,
} from "@yunicity/utils";
import { Bookmark, Search, SlidersHorizontal } from "lucide-react";
import type { RefObject } from "react";

type PlacesMobileEditorialControlsProps = {
  city: string;
  searchQuery: string;
  activeCategory: PlacesCategoryFilterId;
  accessiblePmr: boolean;
  activeFilterCount: number;
  filterOpen: boolean;
  onSearchChange: (query: string) => void;
  onCategoryChange: (categoryId: PlacesCategoryFilterId) => void;
  onAccessibleChange: (value: boolean) => void;
  onOpenFilters: () => void;
  filterButtonRef?: RefObject<HTMLButtonElement>;
};

export function PlacesMobileEditorialControls({
  city,
  searchQuery,
  activeCategory,
  accessiblePmr,
  activeFilterCount,
  filterOpen,
  onSearchChange,
  onCategoryChange,
  onAccessibleChange,
  onOpenFilters,
  filterButtonRef,
}: PlacesMobileEditorialControlsProps) {
  return (
    <section className="space-y-4" aria-label="Découvrir les lieux" data-places-mobile-editorial="">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-yunicity-primary">
          {PLACES_DESKTOP_BREADCRUMB(city)}
        </p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-neutral-900">
          {PLACES_DESKTOP_EDITORIAL_TITLE}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{PLACES_MOBILE_EDITORIAL_BODY}</p>
      </div>

      <div className="flex items-center gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{PLACES_MOBILE_SEARCH_PLACEHOLDER}</span>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-yunicity-primary"
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={PLACES_MOBILE_SEARCH_PLACEHOLDER}
            className="h-11 w-full rounded-2xl border border-neutral-200/90 bg-white py-2 pl-10 pr-3 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-yunicity-primary/40 focus:outline-none focus:ring-2 focus:ring-yunicity-primary/15"
          />
        </label>
        <button
          type="button"
          ref={filterButtonRef}
          onClick={onOpenFilters}
          aria-expanded={filterOpen}
          aria-haspopup="dialog"
          aria-label={
            activeFilterCount > 0
              ? `${PLACES_MEDIUM_FILTERS_TITLE} — ${activeFilterCount} actif${activeFilterCount > 1 ? "s" : ""}`
              : PLACES_MEDIUM_FILTERS_TITLE
          }
          className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${
            filterOpen || activeFilterCount > 0
              ? "border-yunicity-primary bg-[#EEF0FF] text-yunicity-primary"
              : "border-neutral-200/90 bg-white text-neutral-600"
          }`}
        >
          <SlidersHorizontal className="h-[18px] w-[18px]" aria-hidden />
          {activeFilterCount > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-yunicity-primary px-1 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>

      <PlacesMediumViewBar city={city} />

      <PlacesCategoryChips
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
        layout="scroll"
      />

      <div className="grid grid-cols-2 gap-2">
        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-neutral-200/90 bg-white px-3 text-xs font-semibold text-neutral-900">
          <input
            type="checkbox"
            checked={accessiblePmr}
            onChange={(event) => onAccessibleChange(event.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-yunicity-primary focus:ring-yunicity-primary/30"
          />
          {PLACES_DESKTOP_ACCESSIBILITY_PMR}
        </label>
        <button
          type="button"
          disabled
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200/90 bg-white px-3 text-xs font-semibold text-neutral-900 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Bookmark className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
          {PLACES_DESKTOP_NAV_SAVED}
        </button>
      </div>
    </section>
  );
}
