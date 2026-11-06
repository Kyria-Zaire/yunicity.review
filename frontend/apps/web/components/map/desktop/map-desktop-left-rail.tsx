"use client";

import type { MapPortalAmbianceId, MapPortalCategoryId, MapPortalFilters } from "@yunicity/utils";
import {
  DEFAULT_MAP_PORTAL_FILTERS,
  MAP_DESKTOP_EXPLORER_TITLE,
  MAP_PORTAL_AMBIANCE_TITLE,
  MAP_PORTAL_CATEGORY_ALL,
  MAP_PORTAL_CATEGORY_EVENTS,
  MAP_PORTAL_CATEGORY_NEIGHBORHOODS,
  MAP_PORTAL_CATEGORY_PASSPORT,
  MAP_PORTAL_CATEGORY_PLACES,
  MAP_PORTAL_DISTANCE,
  MAP_PORTAL_DISTANCE_KM,
  MAP_PORTAL_FAVORITES,
  MAP_PORTAL_FILTERS_RESET,
  MAP_PORTAL_FILTERS_TITLE,
  MAP_PORTAL_MORE_FILTERS,
  MAP_PORTAL_OPEN_NOW,
  MAP_PORTAL_VISITED,
  NEIGHBORHOOD_AMBIANCE_LABELS,
} from "@yunicity/utils";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Heart,
  MapPin,
  MapPinHouse,
  Settings2,
  Star,
  TicketPercent,
} from "lucide-react";
import Link from "next/link";

const CATEGORIES: {
  id: MapPortalCategoryId;
  label: string;
  icon: typeof MapPin;
}[] = [
  { id: "all", label: MAP_PORTAL_CATEGORY_ALL, icon: Star },
  { id: "neighborhoods", label: MAP_PORTAL_CATEGORY_NEIGHBORHOODS, icon: MapPinHouse },
  { id: "places", label: MAP_PORTAL_CATEGORY_PLACES, icon: MapPin },
  { id: "events", label: MAP_PORTAL_CATEGORY_EVENTS, icon: Calendar },
  { id: "partners", label: MAP_PORTAL_CATEGORY_PASSPORT, icon: TicketPercent },
];

const AMBIANCE_IDS: readonly MapPortalAmbianceId[] = [
  "calm",
  "lively",
  "cultural",
  "student",
  "green",
];

export type MapDesktopLeftRailProps = {
  city: string;
  filters: MapPortalFilters;
  favoritesCount: number;
  visitedCount: number;
  onChangeFilters: (filters: MapPortalFilters) => void;
};

export function MapDesktopLeftRail({
  city,
  filters,
  favoritesCount,
  visitedCount,
  onChangeFilters,
}: MapDesktopLeftRailProps) {
  function resetFilters() {
    onChangeFilters({ ...DEFAULT_MAP_PORTAL_FILTERS });
  }

  function toggleAmbiance(id: MapPortalAmbianceId) {
    const next = filters.ambiances.includes(id)
      ? filters.ambiances.filter((item) => item !== id)
      : [...filters.ambiances, id];
    onChangeFilters({ ...filters, ambiances: next });
  }

  return (
    <div className="space-y-4" data-map-desktop-left-rail="">
      <h1 className="px-1 text-xl font-bold tracking-tight text-neutral-950">
        {MAP_DESKTOP_EXPLORER_TITLE}
      </h1>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <label className="block">
          <span className="sr-only">Ville</span>
          <div className="relative">
            <MapPin
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-yunicity-primary"
              aria-hidden
            />
            <select
              value={city}
              disabled
              aria-label="Ville sélectionnée"
              className="w-full appearance-none rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-10 text-sm font-semibold text-neutral-800"
            >
              <option value={city}>{city}</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
          </div>
        </label>

        <nav className="mt-4" aria-label="Catégories carte">
          <ul className="space-y-0.5">
            {CATEGORIES.map((item) => {
              const Icon = item.icon;
              const active = filters.category === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onChangeFilters({ ...filters, category: item.id })}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                      active
                        ? "bg-[#EEF0FF] text-yunicity-primary"
                        : "text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <ul className="space-y-2">
          <li>
            <Link
              href="/events"
              className="flex items-center justify-between rounded-xl px-2 py-1.5 text-sm text-neutral-700 transition hover:bg-neutral-50"
            >
              <span className="inline-flex items-center gap-2">
                <Heart className="h-4 w-4 text-yunicity-primary" aria-hidden />
                {MAP_PORTAL_FAVORITES}
              </span>
              <span className="font-semibold tabular-nums text-neutral-900">{favoritesCount}</span>
            </Link>
          </li>
          <li>
            <Link
              href="/passport"
              className="flex items-center justify-between rounded-xl px-2 py-1.5 text-sm text-neutral-700 transition hover:bg-neutral-50"
            >
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-yunicity-primary" aria-hidden />
                {MAP_PORTAL_VISITED}
              </span>
              <span className="font-semibold tabular-nums text-neutral-900">{visitedCount}</span>
            </Link>
          </li>
        </ul>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-neutral-900">{MAP_PORTAL_FILTERS_TITLE}</h2>
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-semibold text-yunicity-primary hover:underline"
          >
            {MAP_PORTAL_FILTERS_RESET}
          </button>
        </div>

        <label className="mt-4 flex cursor-pointer items-center justify-between gap-3">
          <span className="text-sm text-neutral-700">{MAP_PORTAL_OPEN_NOW}</span>
          <button
            type="button"
            role="switch"
            aria-checked={filters.openNow}
            onClick={() => onChangeFilters({ ...filters, openNow: !filters.openNow })}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              filters.openNow ? "bg-yunicity-primary" : "bg-neutral-200"
            }`}
          >
            <span
              className={`absolute top-0.5 block h-5 w-5 rounded-full bg-white shadow transition ${
                filters.openNow ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </label>

        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-neutral-700">
            <span>{MAP_PORTAL_DISTANCE}</span>
            <span className="font-semibold tabular-nums text-neutral-900">
              {MAP_PORTAL_DISTANCE_KM(filters.maxDistanceKm)}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={filters.maxDistanceKm}
            onChange={(event) =>
              onChangeFilters({ ...filters, maxDistanceKm: Number(event.target.value) })
            }
            aria-label={MAP_PORTAL_DISTANCE}
            className="mt-2 w-full accent-yunicity-primary"
          />
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            {MAP_PORTAL_AMBIANCE_TITLE}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {AMBIANCE_IDS.map((id) => {
              const label = NEIGHBORHOOD_AMBIANCE_LABELS[id] ?? id;
              const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);
              const active = filters.ambiances.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleAmbiance(id)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    active
                      ? "bg-neutral-200 text-neutral-900"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {displayLabel}
                </button>
              );
            })}
          </div>
        </div>

        <Link
          href="/search"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 transition hover:border-yunicity-primary/30 hover:text-yunicity-primary"
        >
          <Settings2 className="h-4 w-4" aria-hidden />
          {MAP_PORTAL_MORE_FILTERS}
        </Link>
      </section>
    </div>
  );
}
