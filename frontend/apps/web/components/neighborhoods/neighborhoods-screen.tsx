"use client";

import {
  NeighborhoodsMobileCategoryPills,
  NeighborhoodsMobileDiscoverCarousel,
  NeighborhoodsMobileHeader,
  NeighborhoodsMobileMyNeighborhoodsRail,
  NeighborhoodsMobileRecommendedRail,
  NeighborhoodsMobileSearchBar,
} from "@/components/neighborhoods/mobile";
import { NeighborhoodsAppShell } from "@/components/neighborhoods/neighborhoods-app-shell";
import { NeighborhoodsFeaturedRail } from "@/components/neighborhoods/neighborhoods-featured-rail";
import { NeighborhoodsHeroBanner } from "@/components/neighborhoods/neighborhoods-hero-banner";
import { NeighborhoodsListSection } from "@/components/neighborhoods/neighborhoods-list-section";
import { NeighborhoodsStatsBar } from "@/components/neighborhoods/neighborhoods-stats-bar";
import { SearchExplorerOfferHighlight } from "@/components/search/search-explorer-offer-highlight";
import { useNeighborhoodsPortalContext } from "@/hooks/use-neighborhoods-portal-context";
import type { NeighborhoodsMobileCategoryId } from "@yunicity/utils";
import {
  NEIGHBORHOODS_EMPTY,
  NEIGHBORHOODS_ERROR,
  NEIGHBORHOODS_LOADING,
  NEIGHBORHOODS_RETRY,
  buildNeighborhoodCards,
  buildNeighborhoodFeaturedCards,
  buildNeighborhoodListCards,
  buildNeighborhoodsMobileDiscoverSlides,
  buildNeighborhoodsMobileMyCards,
  buildNeighborhoodsMobileRecommendedPlaces,
  buildNeighborhoodsPortalStats,
  filterNeighborhoodPortalCardsByMobileCategory,
  filterNeighborhoodsMobileByQuery,
  resolveNeighborhoodsPortalHeroImage,
} from "@yunicity/utils";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

export function NeighborhoodsScreen() {
  const searchParams = useSearchParams();
  const cityParam = searchParams.get("city")?.trim() ?? "";
  const context = useNeighborhoodsPortalContext(cityParam);
  const [mobileCategory, setMobileCategory] = useState<NeighborhoodsMobileCategoryId>("all");
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");

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

  const portalCards = useMemo(
    () =>
      buildNeighborhoodCards({
        city: context.city,
        neighborhoods: context.neighborhoods,
        events: context.events,
        culturalPlaces: context.culturalPlaces,
        tribes: context.tribes,
        offers: context.passportOffers,
      }),
    [
      context.city,
      context.culturalPlaces,
      context.events,
      context.neighborhoods,
      context.passportOffers,
      context.tribes,
    ],
  );

  const filteredPortalCards = useMemo(
    () =>
      filterNeighborhoodPortalCardsByMobileCategory(
        portalCards,
        mobileCategory,
        context.neighborhoods,
      ),
    [mobileCategory, context.neighborhoods, portalCards],
  );

  const mobileMyCards = useMemo(() => {
    const cards = buildNeighborhoodsMobileMyCards({
      city: context.city,
      neighborhoods: context.neighborhoods,
      events: context.events,
      culturalPlaces: context.culturalPlaces,
    });
    const allowedSlugs = new Set(filteredPortalCards.map((card) => card.slug));
    const filtered =
      mobileCategory === "all"
        ? cards
        : cards.filter((card) => allowedSlugs.has(card.slug));
    return filterNeighborhoodsMobileByQuery(filtered, mobileSearchQuery);
  }, [
    context.city,
    context.culturalPlaces,
    context.events,
    context.neighborhoods,
    filteredPortalCards,
    mobileCategory,
    mobileSearchQuery,
  ]);

  const mobileDiscoverSlides = useMemo(() => {
    const slides = buildNeighborhoodsMobileDiscoverSlides({
      city: context.city,
      neighborhoods: context.neighborhoods,
      events: context.events,
      culturalPlaces: context.culturalPlaces,
      tribes: context.tribes,
      offers: context.passportOffers,
    }).filter((slide) => filteredPortalCards.some((card) => card.slug === slide.slug));
    return filterNeighborhoodsMobileByQuery(slides, mobileSearchQuery);
  }, [
    context.city,
    context.culturalPlaces,
    context.events,
    context.neighborhoods,
    context.passportOffers,
    context.tribes,
    filteredPortalCards,
    mobileSearchQuery,
  ]);

  const mobileRecommendedPlaces = useMemo(() => {
    const neighborhoodSlugs = filteredPortalCards.map((card) => card.slug);
    const places = buildNeighborhoodsMobileRecommendedPlaces({
      city: context.city,
      culturalPlaces: context.culturalPlaces,
      neighborhoodSlugs: mobileCategory === "all" ? undefined : neighborhoodSlugs,
    });
    return filterNeighborhoodsMobileByQuery(
      places.map((place) => ({ ...place, description: place.categoryLabel })),
      mobileSearchQuery,
    );
  }, [context.city, context.culturalPlaces, filteredPortalCards, mobileCategory, mobileSearchQuery]);

  const scrollToAll = useCallback(() => {
    document.getElementById("neighborhoods-all")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const desktopContent = (
    <div className="web-desktop-neighborhoods-only mx-auto w-full max-w-[1400px] px-3 pb-12 sm:px-4 lg:px-6">
      <NeighborhoodsHeroBanner city={context.city} heroImageUrl={heroImageUrl} />
      <NeighborhoodsStatsBar stats={stats} />

      {context.passportOffers[0] ? (
        <div className="mt-8">
          <SearchExplorerOfferHighlight offer={context.passportOffers[0]} />
        </div>
      ) : null}

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
  );

  const mobileContent = (
    <div className="web-mobile-neighborhoods-only min-w-0 space-y-5 bg-white px-4 pb-4 pt-1">
      <NeighborhoodsMobileHeader />
      <NeighborhoodsMobileSearchBar query={mobileSearchQuery} onQueryChange={setMobileSearchQuery} />
      <NeighborhoodsMobileCategoryPills
        activeCategory={mobileCategory}
        onSelectCategory={setMobileCategory}
      />

      {context.loading ? (
        <p className="py-12 text-center text-sm text-neutral-500" role="status">
          {NEIGHBORHOODS_LOADING}
        </p>
      ) : null}

      {context.error ? (
        <div className="space-y-3 py-8 text-center">
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
        <p className="py-12 text-center text-sm text-neutral-500">{NEIGHBORHOODS_EMPTY}</p>
      ) : null}

      {!context.loading && !context.error && context.neighborhoods.length > 0 ? (
        <>
          <NeighborhoodsMobileMyNeighborhoodsRail items={mobileMyCards} />
          <NeighborhoodsMobileDiscoverCarousel slides={mobileDiscoverSlides} />
          <NeighborhoodsMobileRecommendedRail items={mobileRecommendedPlaces} />
        </>
      ) : null}
    </div>
  );

  return (
    <NeighborhoodsAppShell>
      {mobileContent}
      {desktopContent}
    </NeighborhoodsAppShell>
  );
}
