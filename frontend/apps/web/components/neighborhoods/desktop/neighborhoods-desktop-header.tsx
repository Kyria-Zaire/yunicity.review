"use client";

import {
  NEIGHBORHOODS_DESKTOP_BREADCRUMB_HOME,
  NEIGHBORHOODS_DESKTOP_BREADCRUMB_PAGE,
  NEIGHBORHOODS_DESKTOP_MODE_EXPLORE,
  NEIGHBORHOODS_DESKTOP_MODE_MAP,
  NEIGHBORHOODS_DESKTOP_SEARCH_PLACEHOLDER,
  NEIGHBORHOODS_DESKTOP_SUBTITLE,
  NEIGHBORHOODS_DESKTOP_TITLE,
} from "@yunicity/utils";
import { Map, MapPin, Search } from "lucide-react";
import Link from "next/link";

import { NeighborhoodsPortalKicker } from "@/components/neighborhoods/shared/neighborhoods-portal-kicker";

type NeighborhoodsDesktopHeaderProps = {
  city: string;
  neighborhoodsCount: number;
  loading?: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  mapHref: string;
};

export function NeighborhoodsDesktopHeader({
  city,
  neighborhoodsCount,
  loading = false,
  query,
  onQueryChange,
  mapHref,
}: NeighborhoodsDesktopHeaderProps) {
  return (
    <header className="mb-5 space-y-4" data-neighborhoods-desktop-header="">
      <nav aria-label="Fil d'Ariane" className="text-sm text-neutral-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/feed" className="hover:text-neutral-800 hover:underline">
              {NEIGHBORHOODS_DESKTOP_BREADCRUMB_HOME}
            </Link>
          </li>
          <li aria-hidden className="text-neutral-400">
            /
          </li>
          <li className="font-medium text-neutral-700">{NEIGHBORHOODS_DESKTOP_BREADCRUMB_PAGE}</li>
        </ol>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <NeighborhoodsPortalKicker city={city} count={neighborhoodsCount} loading={loading} />
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-950">
            {NEIGHBORHOODS_DESKTOP_TITLE(city)}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-neutral-500">
            {NEIGHBORHOODS_DESKTOP_SUBTITLE}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-800">
            <MapPin className="h-4 w-4 text-yunicity-primary" aria-hidden />
            {city}
          </span>
          <div className="inline-flex rounded-xl border border-neutral-200 bg-white p-1">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-yunicity-primary px-3 py-1.5 text-sm font-semibold text-white">
              <Search className="h-3.5 w-3.5" aria-hidden />
              {NEIGHBORHOODS_DESKTOP_MODE_EXPLORE}
            </span>
            <Link
              href={mapHref}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
            >
              <Map className="h-3.5 w-3.5" aria-hidden />
              {NEIGHBORHOODS_DESKTOP_MODE_MAP}
            </Link>
          </div>
        </div>
      </div>

      <label className="relative block">
        <span className="sr-only">{NEIGHBORHOODS_DESKTOP_SEARCH_PLACEHOLDER}</span>
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
          aria-hidden
        />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={NEIGHBORHOODS_DESKTOP_SEARCH_PLACEHOLDER}
          className="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-yunicity-primary focus:ring-1 focus:ring-yunicity-primary"
        />
      </label>
    </header>
  );
}
