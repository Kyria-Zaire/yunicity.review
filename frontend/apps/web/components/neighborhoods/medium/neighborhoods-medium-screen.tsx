"use client";

import { NeighborhoodsDesktopGrid } from "@/components/neighborhoods/desktop/neighborhoods-desktop-grid";
import { NeighborhoodsDesktopHero } from "@/components/neighborhoods/desktop/neighborhoods-desktop-hero";
import { NeighborhoodsDesktopMapBanner } from "@/components/neighborhoods/desktop/neighborhoods-desktop-map-banner";
import { NeighborhoodsMediumChromeHeader } from "@/components/neighborhoods/medium/neighborhoods-medium-chrome-header";
import { NeighborhoodsMediumHeader } from "@/components/neighborhoods/medium/neighborhoods-medium-header";
import {
  NeighborhoodsMediumBottom,
  NeighborhoodsMediumNowRail,
  NeighborhoodsMediumYourHood,
} from "@/components/neighborhoods/medium/neighborhoods-medium-sections";
import type { CulturalPlaceListItem, LocalEvent, Neighborhood } from "@yunicity/types";
import {
  NEIGHBORHOODS_DESKTOP_DEFAULT_FILTERS,
  NEIGHBORHOODS_DESKTOP_EMPTY_FILTERS,
  NEIGHBORHOODS_DESKTOP_ENVIE_ITEMS,
  NEIGHBORHOODS_DESKTOP_ENVIES,
  NEIGHBORHOODS_DESKTOP_RESET_FILTERS,
  NEIGHBORHOODS_EMPTY,
  NEIGHBORHOODS_ERROR,
  NEIGHBORHOODS_LOADING,
  NEIGHBORHOODS_RETRY,
  NEIGHBORHOODS_EXPLORE_ROUTE,
  buildNeighborhoodsDesktopGridCards,
  buildNeighborhoodsDesktopHeroCard,
  buildNeighborhoodsDesktopNowItems,
  buildNeighborhoodsDesktopRecentItems,
  filterNeighborhoodsForDesktop,
  neighborhoodsMediumActiveFilterCount,
  neighborhoodsMediumAmbiancesFromChip,
  neighborhoodsMediumSelectedChip,
  type NeighborhoodsDesktopEnvieId,
  type NeighborhoodsDesktopFilters,
  type NeighborhoodsMediumChipId,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const FOLLOW_STORAGE_KEY = "yunicity.neighborhoods.followed";

type NeighborhoodsMediumScreenProps = {
  city: string;
  loading: boolean;
  error: boolean;
  neighborhoods: Neighborhood[];
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  onReload: () => void;
};

function readFollowedSlugs(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FOLLOW_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

/** Shell Quartiers medium — 640 → 1023 px (MEDIUM-QUARTIERS-01). */
export function NeighborhoodsMediumScreen({
  city,
  loading,
  error,
  neighborhoods,
  events,
  culturalPlaces,
  onReload,
}: NeighborhoodsMediumScreenProps) {
  const [filters, setFilters] = useState<NeighborhoodsDesktopFilters>(
    NEIGHBORHOODS_DESKTOP_DEFAULT_FILTERS,
  );
  const [followedSlugs, setFollowedSlugs] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFollowedSlugs(readFollowedSlugs());
  }, []);

  const persistFollowed = useCallback((next: string[]) => {
    setFollowedSlugs(next);
    try {
      window.localStorage.setItem(FOLLOW_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota / private mode
    }
  }, []);

  const filtersWithFollow = useMemo(
    () => ({ ...filters, followedSlugs }),
    [filters, followedSlugs],
  );

  const filteredNeighborhoods = useMemo(
    () =>
      filterNeighborhoodsForDesktop(
        neighborhoods,
        events,
        culturalPlaces,
        filtersWithFollow,
      ),
    [culturalPlaces, events, filtersWithFollow, neighborhoods],
  );

  const hero = useMemo(
    () =>
      buildNeighborhoodsDesktopHeroCard({
        city,
        neighborhoods: filteredNeighborhoods,
        events,
        culturalPlaces,
      }),
    [city, culturalPlaces, events, filteredNeighborhoods],
  );

  const gridCards = useMemo(
    () =>
      buildNeighborhoodsDesktopGridCards({
        city,
        neighborhoods: filteredNeighborhoods,
        events,
        culturalPlaces,
        excludeSlug: hero?.slug,
        maxItems: 4,
      }),
    [city, culturalPlaces, events, filteredNeighborhoods, hero?.slug],
  );

  const nowItems = useMemo(
    () =>
      buildNeighborhoodsDesktopNowItems({
        city,
        neighborhoods,
        events,
        culturalPlaces,
        maxItems: 6,
      }),
    [city, culturalPlaces, events, neighborhoods],
  );

  const recentItems = useMemo(
    () =>
      buildNeighborhoodsDesktopRecentItems({
        city,
        culturalPlaces,
        maxItems: 3,
      }),
    [city, culturalPlaces],
  );

  const followedSet = useMemo(() => new Set(followedSlugs), [followedSlugs]);
  const mapHref = `/map?city=${encodeURIComponent(city)}`;
  const exploreHref = `${NEIGHBORHOODS_EXPLORE_ROUTE}?city=${encodeURIComponent(city)}`;
  const selectedChip = neighborhoodsMediumSelectedChip(filters.ambiances);
  const filterCount = neighborhoodsMediumActiveFilterCount({
    ambiances: filters.ambiances,
    query: filters.query,
  }) + filters.envies.length;

  const toggleFollow = useCallback(
    (slug: string) => {
      const normalized = slug.trim();
      if (!normalized) return;
      persistFollowed(
        followedSlugs.includes(normalized)
          ? followedSlugs.filter((item) => item !== normalized)
          : [...followedSlugs, normalized],
      );
    },
    [followedSlugs, persistFollowed],
  );

  const onSelectChip = useCallback((chipId: NeighborhoodsMediumChipId) => {
    setFilters((prev) => ({
      ...prev,
      ambiances: neighborhoodsMediumAmbiancesFromChip(chipId),
    }));
  }, []);

  const toggleEnvie = useCallback((id: NeighborhoodsDesktopEnvieId) => {
    setFilters((prev) => ({
      ...prev,
      envies: prev.envies.includes(id)
        ? prev.envies.filter((item) => item !== id)
        : [...prev.envies, id],
    }));
  }, []);

  return (
    <div className="neighborhoods-medium-shell" data-neighborhoods-medium="">
      <NeighborhoodsMediumChromeHeader
        city={city}
        filterPanelOpen={filtersOpen}
        filterActive={filterCount > 0}
        filterButtonRef={filterButtonRef}
        onOpenFilter={() => setFiltersOpen((open) => !open)}
        onFocusNeighborhoodsSearch={() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
      />

      <div
        className="neighborhoods-medium-root mx-auto w-full max-w-[1100px] space-y-5 px-3 pb-4 sm:px-4"
        data-neighborhoods-medium-scroll=""
      >
      <NeighborhoodsMediumHeader
        city={city}
        loading={loading}
        neighborhoodsCount={neighborhoods.filter((hood) => hood.is_active).length}
        query={filters.query}
        onQueryChange={(query) => setFilters((prev) => ({ ...prev, query }))}
        selectedChip={selectedChip}
        onSelectChip={onSelectChip}
        filterCount={filterCount}
        onOpenFilters={() => setFiltersOpen((open) => !open)}
        mapHref={mapHref}
        searchInputRef={searchInputRef}
      />

      {filtersOpen ? (
        <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-neutral-900">{NEIGHBORHOODS_DESKTOP_ENVIES}</p>
            <button
              type="button"
              onClick={() =>
                setFilters({
                  ...NEIGHBORHOODS_DESKTOP_DEFAULT_FILTERS,
                  followedSlugs,
                })
              }
              className="text-sm font-semibold text-yunicity-primary hover:underline"
            >
              {NEIGHBORHOODS_DESKTOP_RESET_FILTERS}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {NEIGHBORHOODS_DESKTOP_ENVIE_ITEMS.map((envie) => {
              const active = filters.envies.includes(envie.id);
              return (
                <button
                  key={envie.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleEnvie(envie.id)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                    active
                      ? "border-yunicity-primary bg-[#EEF0FF] text-yunicity-primary"
                      : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  {envie.label}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {loading ? (
        <p className="py-16 text-center text-sm text-neutral-500" role="status">
          {NEIGHBORHOODS_LOADING}
        </p>
      ) : null}

      {error ? (
        <div className="space-y-3 py-12 text-center">
          <p className="text-sm text-neutral-700">{NEIGHBORHOODS_ERROR}</p>
          <button
            type="button"
            onClick={onReload}
            className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white"
          >
            {NEIGHBORHOODS_RETRY}
          </button>
        </div>
      ) : null}

      {!loading && !error && neighborhoods.length === 0 ? (
        <p className="py-16 text-center text-sm text-neutral-500">{NEIGHBORHOODS_EMPTY}</p>
      ) : null}

      {!loading && !error && neighborhoods.length > 0 && filteredNeighborhoods.length === 0 ? (
        <p className="py-12 text-center text-sm text-neutral-500">
          {NEIGHBORHOODS_DESKTOP_EMPTY_FILTERS}
        </p>
      ) : null}

      {!loading && !error && hero ? (
        <NeighborhoodsDesktopHero
          card={hero}
          isFollowed={followedSet.has(hero.slug)}
          onToggleFollow={() => toggleFollow(hero.slug)}
        />
      ) : null}

      {!loading && !error && neighborhoods.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-[minmax(200px,240px)_minmax(0,1fr)] md:items-start">
          <NeighborhoodsMediumYourHood />
          <div id="neighborhoods-medium-grid">
            <NeighborhoodsDesktopGrid
              cards={gridCards}
              totalCount={filteredNeighborhoods.length}
              followedSlugs={followedSet}
              onToggleFollow={toggleFollow}
              seeAllHref={exploreHref}
            />
          </div>
        </div>
      ) : null}

      {!loading && !error ? <NeighborhoodsMediumNowRail items={nowItems} city={city} /> : null}

      {!loading && !error ? (
        <NeighborhoodsDesktopMapBanner
          mapHref={mapHref}
          neighborhoods={filteredNeighborhoods.length > 0 ? filteredNeighborhoods : neighborhoods}
        />
      ) : null}

      {!loading && !error ? (
        <NeighborhoodsMediumBottom recentItems={recentItems} city={city} />
      ) : null}
      </div>
    </div>
  );
}
