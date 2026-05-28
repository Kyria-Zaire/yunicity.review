"use client";

import { PlacesAppShell } from "@/components/places/places-app-shell";
import { PlacesFeaturedRail } from "@/components/places/places-featured-rail";
import { PlacesInternalSidebar } from "@/components/places/places-internal-sidebar";
import { PlacesPortalStats } from "@/components/places/places-portal-stats";
import { PlacesPortalToolbar } from "@/components/places/places-portal-toolbar";
import { PlacesRecentGrid } from "@/components/places/places-recent-grid";
import { usePlacesPortalContext } from "@/hooks/use-places-portal-context";
import {
  PLACES_PORTAL_EMPTY,
  PLACES_PORTAL_ERROR,
  PLACES_PORTAL_LOAD_MORE,
  PLACES_PORTAL_LOADING,
  PLACES_PORTAL_RETRY,
  PLACES_PORTAL_SUBTITLE,
  PLACES_PORTAL_TITLE,
} from "@yunicity/utils";
import { ChevronDown } from "lucide-react";
import { useCallback } from "react";
import { useSearchParams } from "next/navigation";

export function PlacesScreen() {
  const searchParams = useSearchParams();
  const cityParam = searchParams.get("city")?.trim() ?? "";
  const ctx = usePlacesPortalContext(cityParam);

  const scrollToSection = useCallback((sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <PlacesAppShell>
      <div className="mx-auto w-full max-w-[1400px] px-0 py-2 sm:py-4">
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
    </PlacesAppShell>
  );
}
