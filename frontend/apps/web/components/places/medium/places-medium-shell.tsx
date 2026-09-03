"use client";

import { PlacesCategoryChips } from "@/components/places/shared/places-category-chips";
import { PlacesDesktopFeaturedSpotlight } from "@/components/places/desktop/places-desktop-featured-spotlight";
import { PlacesDesktopQuartiersRow } from "@/components/places/desktop/places-desktop-quartiers-row";
import { PlacesDesktopSelectionGrid } from "@/components/places/desktop/places-desktop-selection-grid";
import { PlacesMediumAroundRow } from "@/components/places/medium/places-medium-around-row";
import { PlacesMediumDiscoverGrid } from "@/components/places/medium/places-medium-discover-grid";
import { PlacesMediumEditorial } from "@/components/places/medium/places-medium-editorial";
import { PlacesMediumHeader } from "@/components/places/medium/places-medium-header";
import { PlacesMediumFilterBar } from "@/components/places/medium/places-medium-filter-bar";
import { PlacesMediumFilterSheet } from "@/components/places/medium/places-medium-filter-sheet";
import { PlacesMediumProposeBanner } from "@/components/places/medium/places-medium-propose-banner";
import { PlacesMediumSearchRow } from "@/components/places/medium/places-medium-search-row";
import { PlacesMediumTrustBanner } from "@/components/places/medium/places-medium-trust-banner";
import { PlacesMediumViewBar } from "@/components/places/medium/places-medium-view-bar";
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
import { useMemo, useRef, useState, useCallback } from "react";

type PlacesMediumShellProps = {
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

function countActiveMediumFilters(
  categoryFilter: PlacesCategoryFilterId,
  accessiblePmr: boolean,
): number {
  let count = 0;
  if (categoryFilter !== "all") count += 1;
  if (accessiblePmr) count += 1;
  return count;
}

/**
 * Shell Lieux medium — 640 → 1023 px (MEDIUM-LIEUX-01).
 */
export function PlacesMediumShell({
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
}: PlacesMediumShellProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const activeFilterCount = countActiveMediumFilters(categoryFilter, accessiblePmr);

  const focusPlacesSearch = useCallback(() => {
    searchInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => searchInputRef.current?.focus(), 180);
  }, []);

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
    <div className="places-medium-shell-only w-full min-w-0" data-places-medium-root="">
      <PlacesMediumHeader
        city={city}
        filterPanelOpen={filterOpen}
        filterActive={activeFilterCount > 0}
        onOpenFilter={() => setFilterOpen(true)}
        onFocusPlacesSearch={focusPlacesSearch}
        filterButtonRef={filterButtonRef}
      />

      <div
        className="places-medium-shell mx-auto w-full max-w-[960px] px-3 py-2 pb-12 sm:px-4 sm:py-4"
        data-places-medium-shell=""
      >
        <div className="places-medium-scroll space-y-5 sm:space-y-6">
        <div className="places-medium-intro space-y-4">
          <PlacesMediumEditorial city={city} />

          <PlacesMediumSearchRow
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            searchInputRef={searchInputRef}
          />

          <PlacesMediumViewBar city={city} />
        </div>

        <div className="places-medium-filters space-y-3">
          <PlacesCategoryChips
            activeCategory={categoryFilter}
            onCategoryChange={onCategoryChange}
            layout="scroll"
          />

          <PlacesMediumFilterBar
            city={city}
            accessiblePmr={accessiblePmr}
            onAccessibleChange={onAccessibleChange}
          />
        </div>

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
          <div className="places-medium-content space-y-5 sm:space-y-6">
            <PlacesDesktopFeaturedSpotlight spotlight={spotlight} />
            <PlacesMediumAroundRow
              geolocationEnabled={geolocationEnabled}
              aroundPreview={aroundPreview}
              onEnableGeolocation={onEnableGeolocation}
            />
            <PlacesMediumTrustBanner city={city} />
            <div id="places-medium-selection">
              <PlacesDesktopSelectionGrid items={selectionCards} city={city} />
            </div>
            <PlacesMediumDiscoverGrid city={city} items={discoverRows} />
            <PlacesDesktopQuartiersRow city={city} tiles={quartierTiles} />
            <PlacesMediumProposeBanner />
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
