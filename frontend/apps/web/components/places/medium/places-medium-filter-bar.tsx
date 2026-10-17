"use client";

import {
  PLACES_DESKTOP_ACCESSIBILITY_PMR,
  PLACES_DESKTOP_NAV_SAVED,
} from "@yunicity/utils";
import { Bookmark, ChevronDown, MapPin } from "lucide-react";

type PlacesMediumFilterBarProps = {
  city: string;
  accessiblePmr: boolean;
  onAccessibleChange: (value: boolean) => void;
};

export function PlacesMediumFilterBar({
  city,
  accessiblePmr,
  onAccessibleChange,
}: PlacesMediumFilterBarProps) {
  return (
    <div
      className="places-medium-filter-bar flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2"
      data-places-medium-filter-bar=""
    >
      <div className="relative min-w-0 flex-1 sm:min-w-[10rem] sm:max-w-[14rem]">
        <MapPin
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-yunicity-primary"
          aria-hidden
        />
        <select
          value={city}
          disabled
          aria-label="Ville"
          className="h-11 w-full appearance-none rounded-xl border border-neutral-200 bg-white pl-9 pr-9 text-sm font-medium text-neutral-800"
        >
          <option value={city}>{city}</option>
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
          aria-hidden
        />
      </div>

      <label className="inline-flex min-h-11 flex-1 cursor-pointer items-center gap-2.5 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-900 sm:flex-none">
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
        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-900 sm:flex-none disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Bookmark className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
        {PLACES_DESKTOP_NAV_SAVED}
      </button>
    </div>
  );
}
