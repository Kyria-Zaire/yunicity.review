"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { NeighborhoodsDesktopMapBanner } from "@/components/neighborhoods/desktop/neighborhoods-desktop-map-banner";
import {
  NeighborhoodsMobileExploreRail,
  NeighborhoodsMobileFeatured,
  NeighborhoodsMobilePageHeader,
  NeighborhoodsMobileYourHood,
} from "@/components/neighborhoods/mobile/neighborhoods-mobile-hub-sections";
import type { CulturalPlaceListItem, LocalEvent, Neighborhood } from "@yunicity/types";
import type {
  NeighborhoodsDesktopActivityItem,
  NeighborhoodsDesktopRecentItem,
} from "@yunicity/utils";
import {
  NEIGHBORHOODS_DESKTOP_CONTRIBUTE_TITLE,
  NEIGHBORHOODS_DESKTOP_DEFAULT_FILTERS,
  NEIGHBORHOODS_DESKTOP_EMPTY_FILTERS,
  NEIGHBORHOODS_DESKTOP_ENVIE_ITEMS,
  NEIGHBORHOODS_DESKTOP_ENVIES,
  NEIGHBORHOODS_DESKTOP_NOW_TITLE,
  NEIGHBORHOODS_DESKTOP_RECENT_TITLE,
  NEIGHBORHOODS_DESKTOP_RESET_FILTERS,
  NEIGHBORHOODS_DESKTOP_SEE_ALL_ACTIVITIES,
  NEIGHBORHOODS_EMPTY,
  NEIGHBORHOODS_ERROR,
  NEIGHBORHOODS_LOADING,
  NEIGHBORHOODS_MOBILE_CONTRIBUTE_CTA,
  NEIGHBORHOODS_MOBILE_CONTRIBUTE_TITLE,
  NEIGHBORHOODS_MOBILE_MAP_BODY,
  NEIGHBORHOODS_MEDIUM_NOW_EMPTY,
  NEIGHBORHOODS_RETRY,
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
import { ChevronRight, Lightbulb } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

const FOLLOW_STORAGE_KEY = "yunicity.neighborhoods.followed";

type NeighborhoodsMobileScreenProps = {
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

function NeighborhoodsMobileNowList({
  items,
  city,
}: {
  items: NeighborhoodsDesktopActivityItem[];
  city: string;
}) {
  return (
    <section className="space-y-3" data-neighborhoods-mobile-now="">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-lg font-bold text-neutral-900">{NEIGHBORHOODS_DESKTOP_NOW_TITLE}</h2>
        <Link
          href={`/sortir?city=${encodeURIComponent(city)}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary"
        >
          {NEIGHBORHOODS_DESKTOP_SEE_ALL_ACTIVITIES}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-5 text-sm text-neutral-500">
          {NEIGHBORHOODS_MEDIUM_NOW_EMPTY}
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white">
          {items.map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="flex items-center gap-3 px-3 py-3">
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                  <div className="absolute inset-0">
                    <CulturalImage
                      src={item.imageUrl}
                      alt=""
                      placeName={item.title}
                      className="h-full w-full"
                      imageClassName="object-cover"
                      sizes="48px"
                      showFallbackCaption={false}
                      overlay={false}
                    />
                  </div>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-neutral-900 line-clamp-2">
                    {item.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-neutral-500">{item.subtitle}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function NeighborhoodsMobileBottom({
  recentItems,
  city,
}: {
  recentItems: NeighborhoodsDesktopRecentItem[];
  city: string;
}) {
  return (
    <div className="space-y-4" data-neighborhoods-mobile-bottom="">
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{NEIGHBORHOODS_DESKTOP_RECENT_TITLE}</h2>
        <ul className="mt-3 space-y-2">
          {recentItems.map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="flex items-center gap-3 rounded-xl py-1.5">
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  <div className="absolute inset-0">
                    <CulturalImage
                      src={item.imageUrl}
                      alt=""
                      placeName={item.body}
                      className="h-full w-full"
                      imageClassName="object-cover"
                      sizes="44px"
                      showFallbackCaption={false}
                      overlay={false}
                    />
                  </div>
                </span>
                <span className="min-w-0 flex-1 text-sm leading-snug text-neutral-700 line-clamp-2">
                  {item.body}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex items-center gap-3 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <Lightbulb className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-neutral-900">{NEIGHBORHOODS_MOBILE_CONTRIBUTE_TITLE}</p>
          <p className="text-xs leading-snug text-neutral-500">{NEIGHBORHOODS_DESKTOP_CONTRIBUTE_TITLE}</p>
        </div>
        <Link
          href={`/neighborhoods?city=${encodeURIComponent(city)}#contribute`}
          className="inline-flex shrink-0 items-center justify-center rounded-xl border border-yunicity-primary/35 px-3.5 py-2.5 text-sm font-semibold text-yunicity-primary"
        >
          {NEIGHBORHOODS_MOBILE_CONTRIBUTE_CTA}
        </Link>
      </section>
    </div>
  );
}

/** Shell Quartiers mobile hub — &lt;640 px (MOBILE-QUARTIERS-01 refonte). */
export function NeighborhoodsMobileScreen({
  city,
  loading,
  error,
  neighborhoods,
  events,
  culturalPlaces,
  onReload,
}: NeighborhoodsMobileScreenProps) {
  const [filters, setFilters] = useState<NeighborhoodsDesktopFilters>(
    NEIGHBORHOODS_DESKTOP_DEFAULT_FILTERS,
  );
  const [followedSlugs, setFollowedSlugs] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setFollowedSlugs(readFollowedSlugs());
  }, []);

  const persistFollowed = useCallback((next: string[]) => {
    setFollowedSlugs(next);
    try {
      window.localStorage.setItem(FOLLOW_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
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
        maxItems: 6,
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

  const followedSet = useMemo(() => new Set(followedSlugs), [followedSlugs]);
  const mapHref = `/map?city=${encodeURIComponent(city)}`;
  const selectedChip = neighborhoodsMediumSelectedChip(filters.ambiances);
  const filterCount =
    neighborhoodsMediumActiveFilterCount({
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
    <div
      className="neighborhoods-mobile-hub min-w-0 space-y-5 bg-[#F4F5F7] px-4 pb-6 pt-3"
      data-neighborhoods-mobile-hub=""
    >
      <NeighborhoodsMobilePageHeader
        city={city}
        neighborhoodsCount={neighborhoods.filter((hood) => hood.is_active).length}
        query={filters.query}
        onQueryChange={(query) => setFilters((prev) => ({ ...prev, query }))}
        selectedChip={selectedChip}
        onSelectChip={onSelectChip}
        filterCount={filterCount}
        onOpenFilters={() => setFiltersOpen((open) => !open)}
        mapHref={mapHref}
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
              className="text-sm font-semibold text-yunicity-primary"
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
                  className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                    active
                      ? "border-yunicity-primary bg-[#EEF0FF] text-yunicity-primary"
                      : "border-neutral-200 bg-white text-neutral-700"
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
        <p className="py-12 text-center text-sm text-neutral-500" role="status">
          {NEIGHBORHOODS_LOADING}
        </p>
      ) : null}

      {error ? (
        <div className="space-y-3 py-8 text-center">
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
        <p className="py-12 text-center text-sm text-neutral-500">{NEIGHBORHOODS_EMPTY}</p>
      ) : null}

      {!loading && !error && neighborhoods.length > 0 && filteredNeighborhoods.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-500">
          {NEIGHBORHOODS_DESKTOP_EMPTY_FILTERS}
        </p>
      ) : null}

      {!loading && !error && hero ? (
        <NeighborhoodsMobileFeatured
          card={hero}
          isFollowed={followedSet.has(hero.slug)}
          onToggleFollow={() => toggleFollow(hero.slug)}
        />
      ) : null}

      {!loading && !error && neighborhoods.length > 0 ? <NeighborhoodsMobileYourHood /> : null}

      {!loading && !error ? (
        <NeighborhoodsMobileExploreRail
          cards={gridCards}
          totalCount={filteredNeighborhoods.length}
          followedSlugs={followedSet}
          onToggleFollow={toggleFollow}
        />
      ) : null}

      {!loading && !error ? <NeighborhoodsMobileNowList items={nowItems} city={city} /> : null}

      {!loading && !error ? (
        <NeighborhoodsDesktopMapBanner
          mapHref={mapHref}
          neighborhoods={filteredNeighborhoods.length > 0 ? filteredNeighborhoods : neighborhoods}
          body={NEIGHBORHOODS_MOBILE_MAP_BODY}
        />
      ) : null}

      {!loading && !error ? (
        <NeighborhoodsMobileBottom recentItems={recentItems} city={city} />
      ) : null}
    </div>
  );
}
