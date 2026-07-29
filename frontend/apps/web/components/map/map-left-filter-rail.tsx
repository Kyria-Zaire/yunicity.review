"use client";

import { MapPartnersRail } from "@/components/map/map-partners-rail";
import type { PartnerPublic } from "@yunicity/types";
import type { MapPortalAmbianceId, MapPortalCategoryId, MapPortalFilters } from "@yunicity/utils";
import {
  NEIGHBORHOOD_AMBIANCE_LABELS,
  DEFAULT_MAP_PORTAL_FILTERS,
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
  MAP_PORTAL_GEO_BODY,
  MAP_PORTAL_GEO_CTA,
  MAP_PORTAL_GEO_TITLE,
  MAP_PORTAL_MORE_FILTERS,
  MAP_PORTAL_OPEN_NOW,
  MAP_PORTAL_VISITED,
} from "@yunicity/utils";
import {
  Calendar,
  CheckCircle2,
  Heart,
  MapPin,
  MapPinHouse,
  Navigation,
  Sparkles,
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

// Les 5 valeurs reelles de l'enum backend (NeighborhoodAmbiance). Libelles derives de
// NEIGHBORHOOD_AMBIANCE_LABELS (source unique) et capitalises pour les chips.
const AMBIANCE_IDS: readonly MapPortalAmbianceId[] = [
  "calm",
  "lively",
  "cultural",
  "student",
  "green",
];
const AMBIANCES: { id: MapPortalAmbianceId; label: string }[] = AMBIANCE_IDS.map((id) => {
  const label = NEIGHBORHOOD_AMBIANCE_LABELS[id] ?? id;
  return { id, label: label.charAt(0).toUpperCase() + label.slice(1) };
});

type MapLeftFilterRailProps = {
  city: string;
  filters: MapPortalFilters;
  favoritesCount: number;
  visitedCount: number;
  partners?: PartnerPublic[];
  selectedPartnerSlug?: string | null;
  onSelectPartner?: (slug: string) => void;
  onChangeFilters: (filters: MapPortalFilters) => void;
  onActivateGeolocation: () => void;
};

export function MapLeftFilterRail({
  city,
  filters,
  favoritesCount,
  visitedCount,
  partners = [],
  selectedPartnerSlug = null,
  onSelectPartner,
  onChangeFilters,
  onActivateGeolocation,
}: MapLeftFilterRailProps) {
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
    <aside className="hidden w-56 shrink-0 xl:block">
      <div className="sticky top-24 space-y-4">
        <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Ville
            </span>
            <select
              value={city}
              disabled
              className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm font-medium text-neutral-800"
            >
              <option value={city}>{city}</option>
            </select>
          </label>

          <nav className="mt-4">
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
                className="flex items-center justify-between rounded-xl px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <span className="inline-flex items-center gap-2">
                  <Heart className="h-4 w-4 text-yunicity-primary" aria-hidden />
                  {MAP_PORTAL_FAVORITES}
                </span>
                <span className="font-semibold text-neutral-900">{favoritesCount}</span>
              </Link>
            </li>
            <li>
              <Link
                href="/passport"
                className="flex items-center justify-between rounded-xl px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-yunicity-primary" aria-hidden />
                  {MAP_PORTAL_VISITED}
                </span>
                <span className="font-semibold text-neutral-900">{visitedCount}</span>
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

          <label className="mt-4 flex items-center justify-between gap-3">
            <span className="text-sm text-neutral-700">{MAP_PORTAL_OPEN_NOW}</span>
            <input
              type="checkbox"
              checked={filters.openNow}
              onChange={(event) =>
                onChangeFilters({ ...filters, openNow: event.target.checked })
              }
              className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-neutral-200 transition checked:bg-yunicity-primary"
            />
          </label>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-neutral-700">
              <span>{MAP_PORTAL_DISTANCE}</span>
              <span className="font-semibold text-neutral-900">
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
              className="mt-2 w-full accent-yunicity-primary"
            />
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {MAP_PORTAL_AMBIANCE_TITLE}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {AMBIANCES.map((item) => {
                const active = filters.ambiances.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleAmbiance(item.id)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      active
                        ? "bg-yunicity-primary text-white"
                        : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Link
            href="/search"
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-yunicity-primary hover:underline"
          >
            {MAP_PORTAL_MORE_FILTERS}
          </Link>
        </section>

        {onSelectPartner ? (
          <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
            <MapPartnersRail
              partners={partners}
              selectedSlug={selectedPartnerSlug}
              onSelect={onSelectPartner}
            />
          </section>
        ) : null}

        <section className="rounded-2xl bg-gradient-to-br from-yunicity-primary via-[#5B5CE6] to-[#7C3AED] p-5 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" aria-hidden />
            <h2 className="text-base font-bold">{MAP_PORTAL_GEO_TITLE}</h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-white/90">{MAP_PORTAL_GEO_BODY}</p>
          <button
            type="button"
            onClick={onActivateGeolocation}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-yunicity-primary transition hover:bg-neutral-100"
          >
            <Navigation className="h-4 w-4" aria-hidden />
            {MAP_PORTAL_GEO_CTA}
          </button>
        </section>
      </div>
    </aside>
  );
}
