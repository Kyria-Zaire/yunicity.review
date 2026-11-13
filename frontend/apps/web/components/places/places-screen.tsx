"use client";

import { PlacesDesktopScreen } from "@/components/places/desktop";
import { PlacesMediumShell } from "@/components/places/medium";
import { PlacesMobileHeader, PlacesMobileShell } from "@/components/places/mobile";
import { PlacesAppShell } from "@/components/places/places-app-shell";
import { usePlacesPortalContext } from "@/hooks/use-places-portal-context";
import type { PlacesCategoryFilterId, PlacesDesktopNavId } from "@yunicity/utils";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function requestUserCoords(
  onSuccess: (coords: { lat: number; lon: number }) => void,
): void {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      onSuccess({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      });
    },
    () => undefined,
    { enableHighAccuracy: false, timeout: 10_000, maximumAge: 120_000 },
  );
}

export function PlacesScreen() {
  const searchParams = useSearchParams();
  const cityParam = searchParams.get("city")?.trim() ?? "";
  const filterParam = searchParams.get("filter")?.trim();
  const sortParam = searchParams.get("sort")?.trim();
  const ctx = usePlacesPortalContext(cityParam);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [geolocationEnabled, setGeolocationEnabled] = useState(false);
  const [desktopNav, setDesktopNav] = useState<PlacesDesktopNavId>("all");
  const [accessiblePmr, setAccessiblePmr] = useState(false);

  useEffect(() => {
    if (filterParam === "partners") {
      ctx.setCategoryFilter("partners");
    }
  }, [filterParam, ctx.setCategoryFilter]);

  useEffect(() => {
    if (sortParam === "featured" || sortParam === "recent" || sortParam === "name") {
      ctx.setSort(sortParam);
    }
  }, [sortParam, ctx.setSort]);

  useEffect(() => {
    requestUserCoords((coords) => {
      setUserCoords(coords);
      setGeolocationEnabled(true);
    });
  }, []);

  const handleCategoryChange = useCallback(
    (categoryId: PlacesCategoryFilterId) => {
      ctx.setCategoryFilter(categoryId);
      if (desktopNav === "saved" || desktopNav === "visited") {
        setDesktopNav("all");
      }
    },
    [ctx, desktopNav],
  );

  const handleDesktopNavChange = useCallback((navId: PlacesDesktopNavId) => {
    setDesktopNav(navId);
    if (navId === "nearby") {
      requestUserCoords((coords) => {
        setUserCoords(coords);
        setGeolocationEnabled(true);
      });
    }
  }, []);

  const handleEnableGeolocation = useCallback(() => {
    requestUserCoords((coords) => {
      setUserCoords(coords);
      setGeolocationEnabled(true);
      setDesktopNav("nearby");
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    ctx.setSearchQuery("");
    ctx.setCategoryFilter("all");
    setDesktopNav("all");
    setAccessiblePmr(false);
  }, [ctx]);

  const sharedShellProps = {
    city: ctx.city,
    featured: ctx.featured,
    places: ctx.filteredPlaces,
    loading: ctx.loading,
    error: ctx.error,
    searchQuery: ctx.searchQuery,
    categoryFilter: ctx.categoryFilter,
    accessiblePmr,
    geolocationEnabled,
    userCoords,
    onSearchChange: ctx.setSearchQuery,
    onCategoryChange: handleCategoryChange,
    onAccessibleChange: setAccessiblePmr,
    onResetFilters: handleResetFilters,
    onEnableGeolocation: handleEnableGeolocation,
    onReload: ctx.reload,
  };

  const mobileContent = (
    <div className="web-mobile-places-only min-w-0 bg-white" data-places-mobile-root="">
      <PlacesMobileHeader />
      <PlacesMobileShell {...sharedShellProps} />
    </div>
  );

  const mediumContent = <PlacesMediumShell {...sharedShellProps} />;

  const desktopContent = (
    <div className="places-desktop-shell-only mx-auto w-full max-w-[1400px] px-3 py-2 sm:px-4 sm:py-4">
      <PlacesDesktopScreen
        {...sharedShellProps}
        activeNav={desktopNav}
        onNavChange={handleDesktopNavChange}
      />
    </div>
  );

  return (
    <PlacesAppShell>
      {mobileContent}
      {mediumContent}
      {desktopContent}
    </PlacesAppShell>
  );
}
