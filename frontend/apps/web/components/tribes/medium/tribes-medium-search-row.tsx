"use client";

import {
  TRIBES_DESKTOP_CREATE_CTA,
  TRIBES_DESKTOP_SEARCH_PLACEHOLDER,
  TRIBES_PORTAL_CREATE_HREF,
} from "@yunicity/utils";
import { Search } from "lucide-react";
import Link from "next/link";
import type { RefObject } from "react";

type TribesMediumSearchRowProps = {
  city: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchInputRef?: RefObject<HTMLInputElement>;
};

export function TribesMediumSearchRow({
  city,
  searchQuery,
  onSearchChange,
  searchInputRef,
}: TribesMediumSearchRowProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center" data-tribes-medium-search-row="">
      <label className="relative block min-w-0 flex-1">
        <span className="sr-only">{TRIBES_DESKTOP_SEARCH_PLACEHOLDER}</span>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-yunicity-primary"
          aria-hidden
        />
        <input
          ref={searchInputRef}
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={TRIBES_DESKTOP_SEARCH_PLACEHOLDER}
          className="h-12 w-full rounded-2xl border border-neutral-200/90 bg-white pl-11 pr-4 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-yunicity-primary/40 focus:outline-none focus:ring-2 focus:ring-yunicity-primary/15"
        />
      </label>
      <Link
        href={`${TRIBES_PORTAL_CREATE_HREF}?city=${encodeURIComponent(city)}`}
        className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-yunicity-primary px-5 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
      >
        + {TRIBES_DESKTOP_CREATE_CTA}
      </Link>
    </div>
  );
}
