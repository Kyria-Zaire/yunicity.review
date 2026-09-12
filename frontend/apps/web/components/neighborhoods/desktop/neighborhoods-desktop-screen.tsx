"use client";

import { NeighborhoodsDesktopGrid } from "@/components/neighborhoods/desktop/neighborhoods-desktop-grid";
import { NeighborhoodsDesktopHeader } from "@/components/neighborhoods/desktop/neighborhoods-desktop-header";
import { NeighborhoodsDesktopHero } from "@/components/neighborhoods/desktop/neighborhoods-desktop-hero";
import { NeighborhoodsDesktopLeftRail } from "@/components/neighborhoods/desktop/neighborhoods-desktop-left-rail";
import { NeighborhoodsDesktopMapBanner } from "@/components/neighborhoods/desktop/neighborhoods-desktop-map-banner";
import { NeighborhoodsDesktopRightRail } from "@/components/neighborhoods/desktop/neighborhoods-desktop-right-rail";
import type { CulturalPlaceListItem, LocalEvent, Neighborhood } from "@yunicity/types";
import {
  NEIGHBORHOODS_DESKTOP_DEFAULT_FILTERS,
  NEIGHBORHOODS_DESKTOP_EMPTY_FILTERS,
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
  neighborhoodsDesktopFiltersAreActive,
  type NeighborhoodsDesktopAmbianceId,
  type NeighborhoodsDesktopDiscoverId,
  type NeighborhoodsDesktopEnvieId,
  type NeighborhoodsDesktopFilters,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

const FOLLOW_STORAGE_KEY = "yunicity.neighborhoods.followed";

type NeighborhoodsDesktopScreenProps = {
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

/** Shell Quartiers desktop — ≥1024 px (DESKTOP-QUARTIERS-01). */
export function NeighborhoodsDesktopScreen({
  city,
  loading,
  error,
  neighborhoods,
  events,
  culturalPlaces,
  onReload,
}: NeighborhoodsDesktopScreenProps) {
  const [filters, setFilters] = useState<NeighborhoodsDesktopFilters>(
    NEIGHBORHOODS_DESKTOP_DEFAULT_FILTERS,
  );
  const [followedSlugs, setFollowedSlugs] = useState<string[]>([]);

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
        maxItems: 3,
      }),
    [city, culturalPlaces, events, neighborhoods],
  );

  const recentItems = useMemo(
    () =>
      buildNeighborhoodsDesktopRecentItems({
        city,
        culturalPlaces,
        maxItems: 2,
      }),
    [city, culturalPlaces],
  );

  const filtersActive = neighborhoodsDesktopFiltersAreActive(filters);
  const followedSet = useMemo(() => new Set(followedSlugs), [followedSlugs]);
  const mapHref = `/map?city=${encodeURIComponent(city)}`;
  const exploreHref = `${NEIGHBORHOODS_EXPLORE_ROUTE}?city=${encodeURIComponent(city)}`;

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

  return (
    <div
      className="neighborhoods-desktop-root mx-auto w-full px-4 py-4 lg:px-6 lg:py-6"
      data-neighborhoods-desktop=""
    >
      <NeighborhoodsDesktopHeader
        city={city}
        loading={loading}
        neighborhoodsCount={neighborhoods.filter((hood) => hood.is_active).length}
        query={filters.query}
        onQueryChange={(query) => setFilters((prev) => ({ ...prev, query }))}
        mapHref={mapHref}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(200px,15rem)_minmax(0,1fr)_minmax(260px,18rem)] lg:items-start">
        <NeighborhoodsDesktopLeftRail
          filters={filtersWithFollow}
          filtersActive={filtersActive}
          onDiscoverChange={(discover: NeighborhoodsDesktopDiscoverId) =>
            setFilters((prev) => ({ ...prev, discover }))
          }
          onToggleAmbiance={(id: NeighborhoodsDesktopAmbianceId) =>
            setFilters((prev) => ({
              ...prev,
              ambiances: prev.ambiances.includes(id)
                ? prev.ambiances.filter((item) => item !== id)
                : [...prev.ambiances, id],
            }))
          }
          onToggleEnvie={(id: NeighborhoodsDesktopEnvieId) =>
            setFilters((prev) => ({
              ...prev,
              envies: prev.envies.includes(id)
                ? prev.envies.filter((item) => item !== id)
                : [...prev.envies, id],
            }))
          }
          onReset={() =>
            setFilters({
              ...NEIGHBORHOODS_DESKTOP_DEFAULT_FILTERS,
              followedSlugs,
            })
          }
        />

        <div className="min-w-0 space-y-5">
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
            <p className="py-16 text-center text-sm text-neutral-500">
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

          {!loading && !error ? (
            <NeighborhoodsDesktopGrid
              cards={gridCards}
              totalCount={filteredNeighborhoods.length}
              followedSlugs={followedSet}
              onToggleFollow={toggleFollow}
              seeAllHref={exploreHref}
            />
          ) : null}

          {!loading && !error ? (
            <NeighborhoodsDesktopMapBanner
              mapHref={mapHref}
              neighborhoods={filteredNeighborhoods.length > 0 ? filteredNeighborhoods : neighborhoods}
            />
          ) : null}
        </div>

        <NeighborhoodsDesktopRightRail
          city={city}
          nowItems={nowItems}
          recentItems={recentItems}
        />
      </div>
    </div>
  );
}
