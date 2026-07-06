"use client";

import {
  PlacesMobileCategoryPills,
  PlacesMobileHeader,
  PlacesMobileMapSection,
  PlacesMobileNearbyRail,
  PlacesMobileProposeFab,
  PlacesMobileSearchBar,
  PlacesMobileTopRatedList,
  PlacesMobileTrendingRail,
} from "@/components/places/mobile";
import { PlacesAppShell } from "@/components/places/places-app-shell";
import { PlacesFeaturedRail } from "@/components/places/places-featured-rail";
import { PlacesInternalSidebar } from "@/components/places/places-internal-sidebar";
import { PlacesPortalStats } from "@/components/places/places-portal-stats";
import { PlacesPortalToolbar } from "@/components/places/places-portal-toolbar";
import { PlacesPartnersRail } from "@/components/places/places-partners-rail";
import { PlacesRecentGrid } from "@/components/places/places-recent-grid";
import { usePlacesPortalContext } from "@/hooks/use-places-portal-context";
import type { PlacesMobileCategoryId } from "@yunicity/utils";
import {
  PLACES_MOBILE_LIST_EMPTY,
  PLACES_MOBILE_TRENDING_TITLE,
  PLACES_PORTAL_EMPTY,
  PLACES_PORTAL_ERROR,
  PLACES_PORTAL_LOAD_MORE,
  PLACES_PORTAL_LOADING,
  PLACES_PORTAL_RETRY,
  PLACES_PORTAL_SUBTITLE,
  PLACES_PORTAL_TITLE,
  buildPartnerPlaceCards,
  buildPlacesMobileNearbyCards,
  buildPlacesMobileTopRatedRows,
  buildPlacesMobileTrendingCards,
  filterPlacesByMobileCategory,
  filterPlacesBySearch,
  filterPlacesMobileCardsByQuery,
} from "@yunicity/utils";
import { ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export function PlacesScreen() {
  const searchParams = useSearchParams();
  const cityParam = searchParams.get("city")?.trim() ?? "";
  const filterParam = searchParams.get("filter")?.trim();
  const sortParam = searchParams.get("sort")?.trim();
  const ctx = usePlacesPortalContext(cityParam);
  const [mobileCategory, setMobileCategory] = useState<PlacesMobileCategoryId>("all");
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);

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
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 120_000 },
    );
  }, []);

  const scrollToSection = useCallback((sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const mobileFilteredPlaces = useMemo(() => {
    const byCategory = filterPlacesByMobileCategory(ctx.filteredPlaces, mobileCategory);
    return filterPlacesBySearch(byCategory, mobileSearchQuery);
  }, [ctx.filteredPlaces, mobileCategory, mobileSearchQuery]);

  const mobileNearby = useMemo(() => {
    const cards = buildPlacesMobileNearbyCards({
      places: mobileFilteredPlaces,
      city: ctx.city,
      userCoords,
    });
    return filterPlacesMobileCardsByQuery(cards, mobileSearchQuery);
  }, [ctx.city, mobileFilteredPlaces, mobileSearchQuery, userCoords]);

  const mobileTrending = useMemo(() => {
    const cards = buildPlacesMobileTrendingCards({
      places: mobileFilteredPlaces,
      city: ctx.city,
      newBadgeIds: ctx.newBadgeIds,
    });
    return filterPlacesMobileCardsByQuery(cards, mobileSearchQuery);
  }, [ctx.city, ctx.newBadgeIds, mobileFilteredPlaces, mobileSearchQuery]);

  const mobileTopRated = useMemo(() => {
    const rows = buildPlacesMobileTopRatedRows({
      places: mobileFilteredPlaces,
      city: ctx.city,
    });
    return filterPlacesMobileCardsByQuery(rows, mobileSearchQuery).map((row, index) => ({
      ...row,
      rank: index + 1,
    }));
  }, [ctx.city, mobileFilteredPlaces, mobileSearchQuery]);

  const desktopContent = (
    <div className="web-desktop-places-only mx-auto w-full max-w-[1400px] px-3 py-2 sm:px-4 sm:py-4">
      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[16rem_minmax(0,1fr)]">
        <PlacesInternalSidebar onScrollTo={scrollToSection} />

        <div className="min-w-0 space-y-8">
          <header id="places-overview" className="scroll-mt-24 space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              {PLACES_PORTAL_TITLE}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-neutral-600 sm:text-base">
              {PLACES_PORTAL_SUBTITLE}
            </p>
          </header>

          <PlacesPortalToolbar
            searchQuery={ctx.searchQuery}
            categoryFilter={ctx.categoryFilter}
            sort={ctx.sort}
            onSearchChange={ctx.setSearchQuery}
            onCategoryChange={ctx.setCategoryFilter}
            onSortChange={ctx.setSort}
          />

          {ctx.loading ? (
            <p className="text-sm text-neutral-500" role="status">
              {PLACES_PORTAL_LOADING}
            </p>
          ) : ctx.error ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center">
              <p className="text-sm text-red-800">{PLACES_PORTAL_ERROR}</p>
              <button
                type="button"
                onClick={() => void ctx.reload()}
                className="mt-3 text-sm font-semibold text-yunicity-primary hover:underline"
              >
                {PLACES_PORTAL_RETRY}
              </button>
            </div>
          ) : (
            <>
              <PlacesPortalStats stats={ctx.stats} />

              {ctx.showPartnersOnly ? (
                <PlacesPartnersRail
                  cards={buildPartnerPlaceCards(ctx.partners)}
                  city={ctx.city}
                  showViewAll={false}
                />
              ) : (
                <>
                  <PlacesPartnersRail cards={ctx.partnerCards} city={ctx.city} />
                  <PlacesFeaturedRail places={ctx.featured} city={ctx.city} />
                  <div id="places-recent" className="scroll-mt-24">
                    <PlacesRecentGrid
                      places={ctx.recentPlaces}
                      city={ctx.city}
                      newBadgeIds={ctx.newBadgeIds}
                    />
                  </div>
                  {ctx.recentPlaces.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-10 text-center text-sm text-neutral-600">
                      {PLACES_PORTAL_EMPTY}
                    </p>
                  ) : null}
                </>
              )}

              {ctx.hasMore ? (
                <button
                  type="button"
                  onClick={ctx.loadMore}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-neutral-200/90 bg-white py-3.5 text-sm font-semibold text-yunicity-primary shadow-sm transition hover:border-yunicity-primary/30 hover:bg-yunicity-primary-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
                >
                  {PLACES_PORTAL_LOAD_MORE}
                  <ChevronDown className="h-4 w-4" aria-hidden />
                </button>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );

  const mobileContent = (
    <div className="web-mobile-places-only min-w-0 space-y-5 bg-white px-4 pb-24 pt-1">
      <PlacesMobileHeader />
      <PlacesMobileSearchBar query={mobileSearchQuery} onQueryChange={setMobileSearchQuery} />
      <PlacesMobileCategoryPills
        activeCategory={mobileCategory}
        onSelectCategory={setMobileCategory}
      />

      {ctx.loading ? (
        <p className="py-12 text-center text-sm text-neutral-500" role="status">
          {PLACES_PORTAL_LOADING}
        </p>
      ) : null}

      {ctx.error ? (
        <div className="space-y-3 py-8 text-center">
          <p className="text-sm text-neutral-700">{PLACES_PORTAL_ERROR}</p>
          <button
            type="button"
            onClick={() => void ctx.reload()}
            className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white"
          >
            {PLACES_PORTAL_RETRY}
          </button>
        </div>
      ) : null}

      {!ctx.loading && !ctx.error ? (
        <>
          <PlacesMobileMapSection city={ctx.city} listPreview={mobileNearby} />
          {mobileNearby.length === 0 &&
          mobileTrending.length === 0 &&
          mobileTopRated.length === 0 ? (
            <p className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-600">
              {PLACES_MOBILE_LIST_EMPTY}
            </p>
          ) : (
            <>
              <PlacesMobileNearbyRail items={mobileNearby} />
              <PlacesMobileTrendingRail
                title={PLACES_MOBILE_TRENDING_TITLE(ctx.city)}
                items={mobileTrending}
              />
              <PlacesMobileTopRatedList items={mobileTopRated} />
            </>
          )}
          <PlacesMobileProposeFab />
        </>
      ) : null}
    </div>
  );

  return (
    <PlacesAppShell>
      {mobileContent}
      {desktopContent}
    </PlacesAppShell>
  );
}
