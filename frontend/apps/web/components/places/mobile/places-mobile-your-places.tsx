"use client";

import {
  PLACES_DESKTOP_NAV_SAVED,
  PLACES_DESKTOP_NAV_VISITED,
  PLACES_DESKTOP_YOUR_PLACES_TITLE,
} from "@yunicity/utils";
import { Bookmark, CheckCircle2, ChevronRight } from "lucide-react";

export function PlacesMobileYourPlaces() {
  return (
    <section
      className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
      aria-labelledby="places-mobile-your-places-title"
      data-places-mobile-your-places=""
    >
      <h2
        id="places-mobile-your-places-title"
        className="border-b border-neutral-100 px-4 py-3 text-sm font-bold text-neutral-900"
      >
        {PLACES_DESKTOP_YOUR_PLACES_TITLE}
      </h2>
      <ul className="divide-y divide-neutral-100">
        <li>
          <button
            type="button"
            disabled
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Bookmark className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
            <span className="flex-1 text-sm font-medium text-neutral-900">{PLACES_DESKTOP_NAV_SAVED}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
          </button>
        </li>
        <li>
          <button
            type="button"
            disabled
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left disabled:cursor-not-allowed disabled:opacity-70"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-yunicity-primary" aria-hidden />
            <span className="flex-1 text-sm font-medium text-neutral-900">{PLACES_DESKTOP_NAV_VISITED}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
          </button>
        </li>
      </ul>
    </section>
  );
}
