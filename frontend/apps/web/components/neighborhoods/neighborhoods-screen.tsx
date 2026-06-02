"use client";

import { NeighborhoodsAppShell } from "@/components/neighborhoods/neighborhoods-app-shell";
import { NeighborhoodsFeaturedRail } from "@/components/neighborhoods/neighborhoods-featured-rail";
import { NeighborhoodsHeroBanner } from "@/components/neighborhoods/neighborhoods-hero-banner";
import { NeighborhoodsListSection } from "@/components/neighborhoods/neighborhoods-list-section";
import { NeighborhoodsStatsBar } from "@/components/neighborhoods/neighborhoods-stats-bar";
import { useNeighborhoodsPortalContext } from "@/hooks/use-neighborhoods-portal-context";
import {
  NEIGHBORHOODS_EMPTY,
  NEIGHBORHOODS_ERROR,
  NEIGHBORHOODS_LOADING,
  NEIGHBORHOODS_RETRY,
  buildNeighborhoodFeaturedCards,
  buildNeighborhoodListCards,
  buildNeighborhoodsPortalStats,
  resolveNeighborhoodsPortalHeroImage,
} from "@yunicity/utils";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export function NeighborhoodsScreen() {
  const searchParams = useSearchParams();
  const cityParam = searchParams.get("city")?.trim() ?? "";
  const context = useNeighborhoodsPortalContext(cityParam);

  const stats = useMemo(
    () =>
      buildNeighborhoodsPortalStats({
        neighborhoods: context.neighborhoods,
        events: context.events,
        culturalPlaces: context.culturalPlaces,
      }),
    [context.culturalPlaces, context.events, context.neighborhoods],
  );

  const heroImageUrl = useMemo(
    () => resolveNeighborhoodsPortalHeroImage(context.neighborhoods, context.culturalPlaces),
    [context.culturalPlaces, context.neighborhoods],
  );

  const featuredCards = useMemo(
    () =>
      buildNeighborhoodFeaturedCards({
        city: context.city,
        neighborhoods: context.neighborhoods,
        events: context.events,
        culturalPlaces: context.culturalPlaces,
      }),
    [context.city, context.culturalPlaces, context.events, context.neighborhoods],
  );

  const listCards = useMemo(
    () =>
      buildNeighborhoodListCards({
        city: context.city,
        neighborhoods: context.neighborhoods,
        events: context.events,
        excludeSlugs: featuredCards.map((card) => card.slug),
      }),
    [context.city, context.events, context.neighborhoods, featuredCards],
  );

  const scrollToAll = useCallback(() => {
    document.getElementById("neighborhoods-all")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <NeighborhoodsAppShell>
      <div className="mx-auto w-full max-w-[1400px] px-3 pb-12 sm:px-4 lg:px-6">
        <NeighborhoodsHeroBanner city={context.city} heroImageUrl={heroImageUrl} />
        <NeighborhoodsStatsBar stats={stats} />

        {context.loading ? (
          <p className="mt-8 text-center text-sm text-neutral-500" role="status">
            {NEIGHBORHOODS_LOADING}
          </p>
        ) : null}

        {context.error ? (
          <div className="mt-8 space-y-3 text-center">
            <p className="text-sm text-neutral-700">{NEIGHBORHOODS_ERROR}</p>
            <button
              type="button"
              onClick={() => void context.reload()}
              className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white"
            >
              {NEIGHBORHOODS_RETRY}
            </button>
          </div>
        ) : null}

        {!context.loading && !context.error && context.neighborhoods.length === 0 ? (
          <p className="mt-8 text-center text-sm text-neutral-500">{NEIGHBORHOODS_EMPTY}</p>
        ) : null}

        {!context.loading && !context.error && context.neighborhoods.length > 0 ? (
          <div className="mt-10 space-y-10">
            <NeighborhoodsFeaturedRail cards={featuredCards} onSeeAll={scrollToAll} />
            <NeighborhoodsListSection cards={listCards} />
          </div>
        ) : null}
      </div>
    </NeighborhoodsAppShell>
  );
}
