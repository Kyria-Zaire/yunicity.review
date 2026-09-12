"use client";

import { PlacesDesktopHeroHeader } from "@/components/places/desktop/places-desktop-hero-header";
import { PlacesDesktopFeaturedSpotlight } from "@/components/places/desktop/places-desktop-featured-spotlight";
import { PlacesDesktopLeftRail } from "@/components/places/desktop/places-desktop-left-rail";
import { PlacesDesktopProposeBanner } from "@/components/places/desktop/places-desktop-propose-banner";
import { PlacesDesktopQuartiersRow } from "@/components/places/desktop/places-desktop-quartiers-row";
import { PlacesDesktopRightRail } from "@/components/places/desktop/places-desktop-right-rail";
import { PlacesDesktopSelectionGrid } from "@/components/places/desktop/places-desktop-selection-grid";
import type { CulturalPlaceListItem } from "@yunicity/types";
import type { PlacesCategoryFilterId, PlacesDesktopNavId } from "@yunicity/utils";
import {
  PLACES_PORTAL_ERROR,
  PLACES_PORTAL_LOADING,
  PLACES_PORTAL_RETRY,
  buildPlacesDesktopAroundPreview,
  buildPlacesDesktopDiscoverRows,
  buildPlacesDesktopQuartierTiles,
  buildPlacesDesktopSelectionCards,
  buildPlacesDesktopSpotlight,
  filterPlacesByDesktopNav,
} from "@yunicity/utils";
import { useMemo } from "react";

type PlacesDesktopScreenProps = {
  city: string;
  featured: CulturalPlaceListItem[];
  places: CulturalPlaceListItem[];
  loading: boolean;
  error: string | null;
  searchQuery: string;
  categoryFilter: PlacesCategoryFilterId;
  activeNav: PlacesDesktopNavId;
  accessiblePmr: boolean;
  geolocationEnabled: boolean;
  userCoords: { lat: number; lon: number } | null;
  onSearchChange: (query: string) => void;
  onCategoryChange: (categoryId: PlacesCategoryFilterId) => void;
  onNavChange: (navId: PlacesDesktopNavId) => void;
  onAccessibleChange: (value: boolean) => void;
  onResetFilters: () => void;
  onEnableGeolocation: () => void;
  onReload: () => void;
};

/**
 * Squelette desktop Lieux — 3 colonnes (DESKTOP-LIEUX-01).
 * Affichage ≥1024px piloté par `globals.css`.
 */
export function PlacesDesktopScreen({
  city,
  featured,
  places,
  loading,
  error,
  searchQuery,
  categoryFilter,
  activeNav,
  accessiblePmr,
  geolocationEnabled,
  userCoords,
  onSearchChange,
  onCategoryChange,
  onNavChange,
  onAccessibleChange,
  onResetFilters,
  onEnableGeolocation,
  onReload,
}: PlacesDesktopScreenProps) {
  const navFilteredPlaces = useMemo(
    () => filterPlacesByDesktopNav(places, activeNav, userCoords),
    [activeNav, places, userCoords],
  );

  const spotlight = useMemo(() => buildPlacesDesktopSpotlight(featured, city), [city, featured]);

  const selectionCards = useMemo(
    () =>
      buildPlacesDesktopSelectionCards({
        places: navFilteredPlaces,
        city,
        excludeId: spotlight?.id,
        limit: 3,
      }),
    [city, navFilteredPlaces, spotlight?.id],
  );

  const discoverRows = useMemo(
    () => buildPlacesDesktopDiscoverRows({ places: navFilteredPlaces, city, limit: 4 }),
    [city, navFilteredPlaces],
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
    <div className="places-shell places-desktop-layout">
      <PlacesDesktopLeftRail
        city={city}
        activeNav={activeNav}
        activeCategory={categoryFilter}
        accessiblePmr={accessiblePmr}
        onNavChange={onNavChange}
        onCategoryChange={onCategoryChange}
        onAccessibleChange={onAccessibleChange}
        onResetFilters={onResetFilters}
      />

      <div className="places-main-column min-w-0 space-y-6">
        <PlacesDesktopHeroHeader
          city={city}
          searchQuery={searchQuery}
          activeCategory={categoryFilter}
          onSearchChange={onSearchChange}
          onCategoryChange={onCategoryChange}
        />

        {loading ? (
          <p className="text-sm text-neutral-500" role="status">
            {PLACES_PORTAL_LOADING}
          </p>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center">
            <p className="text-sm text-red-800">{PLACES_PORTAL_ERROR}</p>
            <button
              type="button"
              onClick={() => void onReload()}
              className="mt-3 text-sm font-semibold text-yunicity-primary hover:underline"
            >
              {PLACES_PORTAL_RETRY}
            </button>
          </div>
        ) : (
          <>
            <PlacesDesktopFeaturedSpotlight spotlight={spotlight} />
            <PlacesDesktopSelectionGrid items={selectionCards} city={city} />
            <PlacesDesktopQuartiersRow city={city} tiles={quartierTiles} />
            <PlacesDesktopProposeBanner />
          </>
        )}
      </div>

      <PlacesDesktopRightRail
        city={city}
        geolocationEnabled={geolocationEnabled}
        aroundPreview={aroundPreview}
        onEnableGeolocation={onEnableGeolocation}
        discoverRows={discoverRows}
      />
    </div>
  );
}
