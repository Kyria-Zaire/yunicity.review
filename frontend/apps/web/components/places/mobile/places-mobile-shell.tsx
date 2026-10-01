"use client";

import { PlacesMediumFilterSheet } from "@/components/places/medium/places-medium-filter-sheet";
import { PlacesMobileAroundCard } from "@/components/places/mobile/places-mobile-around-card";
import { PlacesMobileDiscoverList } from "@/components/places/mobile/places-mobile-discover-list";
import { PlacesMobileEditorialControls } from "@/components/places/mobile/places-mobile-editorial-controls";
import { PlacesMobileFeaturedSpotlight } from "@/components/places/mobile/places-mobile-featured-spotlight";
import { PlacesMobileProposeBanner } from "@/components/places/mobile/places-mobile-propose-banner";
import { PlacesMobileQuartiersRail } from "@/components/places/mobile/places-mobile-quartiers-rail";
import { PlacesMobileSelectionList } from "@/components/places/mobile/places-mobile-selection-list";
import { PlacesMobileTrustBanner } from "@/components/places/mobile/places-mobile-trust-banner";
import { PlacesMobileYourPlaces } from "@/components/places/mobile/places-mobile-your-places";
import type { CulturalPlaceListItem } from "@yunicity/types";
import type { PlacesCategoryFilterId } from "@yunicity/utils";
import {
  PLACES_PORTAL_ERROR,
  PLACES_PORTAL_LOADING,
  PLACES_PORTAL_RETRY,
  buildPlacesDesktopAroundPreview,
  buildPlacesDesktopDiscoverRows,
  buildPlacesDesktopQuartierTiles,
  buildPlacesDesktopSelectionCards,
  buildPlacesDesktopSpotlight,
} from "@yunicity/utils";
import { useMemo, useRef, useState } from "react";

type PlacesMobileShellProps = {
  city: string;
  featured: CulturalPlaceListItem[];
  places: CulturalPlaceListItem[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  categoryFilter: PlacesCategoryFilterId;
  accessiblePmr: boolean;
  geolocationEnabled: boolean;
  userCoords: { lat: number; lon: number } | null;
  onSearchChange: (query: string) => void;
  onCategoryChange: (categoryId: PlacesCategoryFilterId) => void;
  onAccessibleChange: (value: boolean) => void;
  onResetFilters: () => void;
  onEnableGeolocation: () => void;
  onReload: () => void;
};

function countActiveMobileFilters(
  categoryFilter: PlacesCategoryFilterId,
  accessiblePmr: boolean,
): number {
  let count = 0;
  if (categoryFilter !== "all") count += 1;
  if (accessiblePmr) count += 1;
  return count;
}

/**
 * Contenu mobile Lieux — maquette MOBILE-LIEUX-01.
 * Le header chrome (`PlacesMobileHeader`) et la bottom nav restent hors de ce shell.
 */
export function PlacesMobileShell({
  city,
  featured,
  places,
  loading,
  error,
  searchQuery,
  categoryFilter,
  accessiblePmr,
  geolocationEnabled,
  userCoords,
  onSearchChange,
  onCategoryChange,
  onAccessibleChange,
  onResetFilters,
  onEnableGeolocation,
  onReload,
}: PlacesMobileShellProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const activeFilterCount = countActiveMobileFilters(categoryFilter, accessiblePmr);

  const spotlight = useMemo(() => buildPlacesDesktopSpotlight(featured, city), [city, featured]);

  const selectionCards = useMemo(
    () =>
      buildPlacesDesktopSelectionCards({
        places,
        city,
        excludeId: spotlight?.id,
        limit: 3,
      }),
    [city, places, spotlight?.id],
  );

  const discoverRows = useMemo(
    () => buildPlacesDesktopDiscoverRows({ places, city, limit: 4 }),
    [city, places],
  );

  const aroundPreview = useMemo(
    () =>
      buildPlacesDesktopAroundPreview({
        city,
        places,
        userCoords,
        geolocationEnabled,
      }),
    [city, geolocationEnabled, places, userCoords],
  );

  const quartierTiles = useMemo(() => buildPlacesDesktopQuartierTiles(city), [city]);

  return (
    <div className="places-mobile-content space-y-5 px-4 pb-4 pt-1" data-places-mobile-shell="">
      <PlacesMobileEditorialControls
        city={city}
        searchQuery={searchQuery}
        activeCategory={categoryFilter}
        accessiblePmr={accessiblePmr}
        activeFilterCount={activeFilterCount}
        filterOpen={filterOpen}
        onSearchChange={onSearchChange}
        onCategoryChange={onCategoryChange}
        onAccessibleChange={onAccessibleChange}
        onOpenFilters={() => setFilterOpen(true)}
        filterButtonRef={filterButtonRef}
      />

      <PlacesMediumFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        activeCategory={categoryFilter}
        accessiblePmr={accessiblePmr}
        onCategoryChange={onCategoryChange}
        onAccessibleChange={onAccessibleChange}
        onResetFilters={onResetFilters}
        returnFocusRef={filterButtonRef}
      />

      {loading ? (
        <p className="py-8 text-center text-sm text-neutral-500" role="status">
          {PLACES_PORTAL_LOADING}
        </p>
      ) : error ? (
        <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center">
          <p className="text-sm text-red-800">{PLACES_PORTAL_ERROR}</p>
          <button
            type="button"
            onClick={() => void onReload()}
            className="text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {PLACES_PORTAL_RETRY}
          </button>
        </div>
      ) : (
        <>
          <PlacesMobileFeaturedSpotlight spotlight={spotlight} />
          <PlacesMobileAroundCard
            geolocationEnabled={geolocationEnabled}
            preview={aroundPreview}
            onEnableGeolocation={onEnableGeolocation}
          />
          <PlacesMobileYourPlaces />
          <PlacesMobileTrustBanner city={city} />
          <PlacesMobileSelectionList items={selectionCards} city={city} />
          <PlacesMobileDiscoverList city={city} items={discoverRows} />
          <PlacesMobileQuartiersRail city={city} tiles={quartierTiles} />
          <PlacesMobileProposeBanner />
        </>
      )}
    </div>
  );
}
