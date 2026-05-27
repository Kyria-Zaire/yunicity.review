"use client";

import { MAP_SEARCH_PLACEHOLDER, buildSearchUrl } from "@yunicity/utils";
import Link from "next/link";

export function MapPageSearchHeader({ city }: { city: string }) {
  const href = buildSearchUrl({ city });

  return (
    <div className="mb-4 sm:mb-5">
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.65rem]">Carte</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Explorez {city} — moments et lieux, sans suivi en direct.
      </p>
      <Link
        href={href}
        className="mt-4 flex items-center gap-3 rounded-full border border-neutral-200/90 bg-white px-4 py-2.5 text-sm text-neutral-500 shadow-sm transition hover:border-yunicity-primary/30 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary/40"
      >
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
        <span>{MAP_SEARCH_PLACEHOLDER(city)}</span>
      </Link>
    </div>
  );
}
