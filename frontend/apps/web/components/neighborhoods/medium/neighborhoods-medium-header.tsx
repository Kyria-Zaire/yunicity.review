"use client";

import type { NeighborhoodsMediumChipId } from "@yunicity/utils";
import {
  NEIGHBORHOODS_DESKTOP_BREADCRUMB_HOME,
  NEIGHBORHOODS_DESKTOP_BREADCRUMB_PAGE,
  NEIGHBORHOODS_DESKTOP_KICKER,
  NEIGHBORHOODS_DESKTOP_MODE_EXPLORE,
  NEIGHBORHOODS_DESKTOP_MODE_MAP,
  NEIGHBORHOODS_DESKTOP_SEARCH_PLACEHOLDER,
  NEIGHBORHOODS_DESKTOP_SUBTITLE,
  NEIGHBORHOODS_DESKTOP_TITLE,
  NEIGHBORHOODS_MEDIUM_AMBIANCE_CHIPS,
  NEIGHBORHOODS_MEDIUM_FILTERS,
} from "@yunicity/utils";
import { Filter, Home, Map, MapPin, Search } from "lucide-react";
import Link from "next/link";
import type { Ref } from "react";

const CHIP_IDLE: Record<string, string> = {
  primary: "border-neutral-200 bg-white text-neutral-700",
  peach: "border-orange-200 bg-orange-50 text-orange-800",
  purple: "border-violet-200 bg-violet-50 text-violet-800",
  yellow: "border-amber-200 bg-amber-50 text-amber-900",
  blue: "border-sky-200 bg-sky-50 text-sky-800",
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

type NeighborhoodsMediumHeaderProps = {
  city: string;
  neighborhoodsCount: number;
  query: string;
  onQueryChange: (value: string) => void;
  selectedChip: NeighborhoodsMediumChipId;
  onSelectChip: (id: NeighborhoodsMediumChipId) => void;
  filterCount: number;
  onOpenFilters: () => void;
  mapHref: string;
  searchInputRef?: Ref<HTMLInputElement>;
};

export function NeighborhoodsMediumHeader({
  city,
  neighborhoodsCount,
  query,
  onQueryChange,
  selectedChip,
  onSelectChip,
  filterCount,
  onOpenFilters,
  mapHref,
  searchInputRef,
}: NeighborhoodsMediumHeaderProps) {
  return (
    <header className="space-y-4" data-neighborhoods-medium-header="">
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

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-yunicity-primary">
            {NEIGHBORHOODS_DESKTOP_KICKER(city, neighborhoodsCount)}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-950 sm:text-[1.75rem]">
            {NEIGHBORHOODS_DESKTOP_TITLE(city)}
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-neutral-500">
            {NEIGHBORHOODS_DESKTOP_SUBTITLE}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-800">
          <MapPin className="h-4 w-4 text-yunicity-primary" aria-hidden />
          {city}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{NEIGHBORHOODS_DESKTOP_SEARCH_PLACEHOLDER}</span>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden
          />
          <input
            ref={searchInputRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={NEIGHBORHOODS_DESKTOP_SEARCH_PLACEHOLDER}
            className="w-full rounded-2xl border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-yunicity-primary focus:ring-1 focus:ring-yunicity-primary"
          />
        </label>

        <button
          type="button"
          onClick={onOpenFilters}
          className="relative inline-flex min-h-11 items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
        >
          <Filter className="h-4 w-4" aria-hidden />
          {NEIGHBORHOODS_MEDIUM_FILTERS}
          {filterCount > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-yunicity-primary px-1 text-[10px] font-bold text-white">
              {filterCount}
            </span>
          ) : null}
        </button>

        <span className="inline-flex min-h-11 items-center rounded-xl bg-yunicity-primary px-3.5 text-sm font-semibold text-white">
          <Search className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          {NEIGHBORHOODS_DESKTOP_MODE_EXPLORE}
        </span>

        <Link
          href={mapHref}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-50"
        >
          <Map className="h-4 w-4" aria-hidden />
          {NEIGHBORHOODS_DESKTOP_MODE_MAP}
        </Link>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-0.5" role="tablist" aria-label="Ambiances">
        <div className="flex w-max gap-2">
          {NEIGHBORHOODS_MEDIUM_AMBIANCE_CHIPS.map((chip) => {
            const active = selectedChip === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectChip(chip.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                  active
                    ? "border-yunicity-primary bg-yunicity-primary text-white"
                    : CHIP_IDLE[chip.tone]
                }`}
              >
                {chip.id === "all" ? <Home className="h-3.5 w-3.5" aria-hidden /> : null}
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
