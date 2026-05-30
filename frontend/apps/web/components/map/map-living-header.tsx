"use client";

import {
  MAP_LIVING_RECENTER,
  MAP_LIVING_SEARCH_PLACEHOLDER,
  MAP_LIVING_SUBTITLE,
  MAP_LIVING_TITLE,
  MAP_LIVING_USE_POSITION,
  MAP_LIVING_USE_POSITION_HINT,
  buildSearchUrl,
} from "@yunicity/utils";
import Link from "next/link";

type MapLivingHeaderProps = {
  city: string;
  onRecenter: () => void;
  onUsePosition: () => void;
  positionHintVisible?: boolean;
};

export function MapLivingHeader({
  city,
  onRecenter,
  onUsePosition,
  positionHintVisible = false,
}: MapLivingHeaderProps) {
  const searchHref = buildSearchUrl({ city });

  return (
    <header className="mb-4 sm:mb-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-[1.65rem]">
            {MAP_LIVING_TITLE}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-neutral-600">{MAP_LIVING_SUBTITLE}</p>
        </div>
        <p className="shrink-0 rounded-full border border-neutral-200/90 bg-white px-3 py-1 text-xs font-semibold text-neutral-600">
          {city}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Link
          href={searchHref}
          className="flex min-h-11 flex-1 items-center gap-3 rounded-full border border-neutral-200/90 bg-white px-4 py-2.5 text-sm text-neutral-500 shadow-sm transition hover:border-yunicity-primary/30 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary/40"
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
          <span>{MAP_LIVING_SEARCH_PLACEHOLDER}</span>
        </Link>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRecenter}
            className="rounded-full border border-neutral-200/90 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 shadow-sm transition hover:border-yunicity-primary/30 hover:text-yunicity-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
          >
            {MAP_LIVING_RECENTER}
          </button>
          <button
            type="button"
            onClick={onUsePosition}
            className="rounded-full border border-neutral-200/90 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 shadow-sm transition hover:border-yunicity-primary/30 hover:text-yunicity-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
          >
            {MAP_LIVING_USE_POSITION}
          </button>
        </div>
      </div>

      {positionHintVisible ? (
        <p className="mt-2 text-xs text-neutral-500">{MAP_LIVING_USE_POSITION_HINT}</p>
      ) : null}
    </header>
  );
}
