"use client";

import { SortirFeaturedToday } from "@/components/events/sortir/sortir-featured-today";
import { SortirActiveNeighborhoodsGrid } from "@/components/events/sortir/sortir-active-neighborhoods-grid";
import { SortirAppShell } from "@/components/events/sortir/sortir-app-shell";
import { SortirCategoryChips } from "@/components/events/sortir/sortir-category-chips";
import { SortirForYouPanel } from "@/components/events/sortir/sortir-for-you-panel";
import { SortirHeroBanner } from "@/components/events/sortir/sortir-hero-banner";
import { SortirLiveEventsRail } from "@/components/events/sortir/sortir-live-events-rail";
import { SortirLivePlacesRail } from "@/components/events/sortir/sortir-live-places-rail";
import {
  SortirMobileCategoryPills,
  SortirMobileFeaturedCarousel,
  SortirMobileHeader,
  SortirMobilePopularPlacesRail,
  SortirMobileSearchBar,
  SortirMobileUpcomingList,
} from "@/components/events/sortir/mobile";
import { SortirTribesTonightPanel } from "@/components/events/sortir/sortir-tribes-tonight-panel";
import { SearchExplorerOfferHighlight } from "@/components/search/search-explorer-offer-highlight";
import { useEventsAgendaContext } from "@/hooks/use-events-agenda-context";
import { useAuth } from "@/lib/auth/auth-provider";
import { GeoProvider } from "@/providers/geo-provider";
import type { SortirCategoryId, SortirMobileCategoryId } from "@yunicity/utils";
import {
  SORTIR_ERROR,
  SORTIR_LOADING,
  SORTIR_RETRY,
  buildSortirActiveNeighborhoodCards,
  buildSortirFeaturedToday,
  buildSortirForYouCard,
  buildSortirHeroStats,
  buildSortirLiveEventCards,
  buildSortirLivePlaceCards,
  buildSortirMobilePopularPlaceCards,
  buildSortirMobileUpcomingRows,
  buildSortirTribeTonightItems,
  filterSortirLiveEventCardsByQuery,
  isNewLocalUserContext,
  mapSortirMobileCategoryToPortal,
  resolveSortirPortalHeroImage,
  sortirNeighborhoodsHref,
} from "@yunicity/utils";
import { useMemo, useState } from "react";

function SortirScreenInner() {
  const { user } = useAuth();
  const agenda = useEventsAgendaContext(user?.city ?? "Reims");
  const [category, setCategory] = useState<SortirCategoryId>("");
  const [mobileCategory, setMobileCategory] = useState<SortirMobileCategoryId>("all");
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const mobilePortalCategory = mapSortirMobileCategoryToPortal(mobileCategory);

  const heroStats = useMemo(
    () =>
      buildSortirHeroStats({
        neighborhoods: agenda.neighborhoods,
        culturalPlaces: agenda.culturalPlaces,
        tribes: agenda.tribes,
        events: agenda.events,
      }),
    [agenda.culturalPlaces, agenda.events, agenda.neighborhoods, agenda.tribes],
  );

  const featuredToday = useMemo(
    () =>
      buildSortirFeaturedToday({
        city: agenda.city,
        events: agenda.events,
        culturalPlaces: agenda.culturalPlaces,
        maxItems: 5,
      }),
    [agenda.city, agenda.culturalPlaces, agenda.events],
  );

  const featuredCarouselItems = useMemo(() => {
    if (featuredToday.kind !== "events") return [];
    return filterSortirLiveEventCardsByQuery(featuredToday.items, mobileSearchQuery);
  }, [featuredToday, mobileSearchQuery]);

  const isNewUser = useMemo(
    () =>
      isNewLocalUserContext({
        savedEventCount: agenda.savedEvents.length,
        joinedTribeCount: agenda.tribes.filter(
          (tribe) => !tribe.is_archived && tribe.viewer_is_member,
        ).length,
        interestCount: agenda.interests.length,
        passportStampsCount: agenda.passportStampsCount,
      }),
    [agenda.interests.length, agenda.passportStampsCount, agenda.savedEvents.length, agenda.tribes],
  );

  const heroImageUrl = useMemo(
    () =>
      resolveSortirPortalHeroImage({
        events: agenda.events,
        culturalPlaces: agenda.culturalPlaces,
      }),
    [agenda.culturalPlaces, agenda.events],
  );

  const liveEvents = useMemo(
    () =>
      buildSortirLiveEventCards({
        city: agenda.city,
        events: agenda.events,
        culturalPlaces: agenda.culturalPlaces,
        categoryId: category,
      }),
    [agenda.city, agenda.culturalPlaces, agenda.events, category],
  );

  const mobileUpcoming = useMemo(() => {
    const rows = buildSortirMobileUpcomingRows({
      city: agenda.city,
      events: agenda.events,
      culturalPlaces: agenda.culturalPlaces,
      categoryId: mobilePortalCategory,
      maxItems: 12,
    });
    return filterSortirLiveEventCardsByQuery(rows, mobileSearchQuery) as typeof rows;
  }, [
    agenda.city,
    agenda.culturalPlaces,
    agenda.events,
    mobilePortalCategory,
    mobileSearchQuery,
  ]);

  const mobilePopularPlaces = useMemo(
    () =>
      buildSortirMobilePopularPlaceCards({
        city: agenda.city,
        events: agenda.events,
        culturalPlaces: agenda.culturalPlaces,
        maxItems: 8,
      }),
    [agenda.city, agenda.culturalPlaces, agenda.events],
  );

  const livePlaces = useMemo(
    () =>
      buildSortirLivePlaceCards({
        city: agenda.city,
        events: agenda.events,
        culturalPlaces: agenda.culturalPlaces,
      }),
    [agenda.city, agenda.culturalPlaces, agenda.events],
  );

  const activeNeighborhoods = useMemo(
    () =>
      buildSortirActiveNeighborhoodCards({
        city: agenda.city,
        neighborhoods: agenda.neighborhoods,
        events: agenda.events,
        culturalPlaces: agenda.culturalPlaces,
      }),
    [agenda.city, agenda.culturalPlaces, agenda.events, agenda.neighborhoods],
  );

  const forYou = useMemo(
    () =>
      buildSortirForYouCard({
        city: agenda.city,
        events: agenda.events,
        culturalPlaces: agenda.culturalPlaces,
        interests: agenda.interests,
      }),
    [agenda.city, agenda.culturalPlaces, agenda.events, agenda.interests],
  );

  const tribeTonight = useMemo(
    () =>
      buildSortirTribeTonightItems({
        city: agenda.city,
        events: agenda.events,
        tribes: agenda.tribes,
      }),
    [agenda.city, agenda.events, agenda.tribes],
  );

  const desktopContent = (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 px-3 py-2 pb-12 sm:px-4 lg:px-6">
      <SortirHeroBanner
        city={agenda.city}
        heroImageUrl={heroImageUrl}
        stats={heroStats}
        isNewUser={isNewUser}
      />

      <SortirFeaturedToday featured={featuredToday} />

      <SortirCategoryChips activeCategory={category} onSelect={setCategory} />

      {agenda.passportOffers[0] ? (
        <SearchExplorerOfferHighlight offer={agenda.passportOffers[0]} />
      ) : null}

      {agenda.error ? (
        <div className="space-y-3">
          <p className="text-sm text-red-600">{SORTIR_ERROR}</p>
          <button
            type="button"
            onClick={() => agenda.reload()}
            className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white"
          >
            {SORTIR_RETRY}
          </button>
        </div>
      ) : null}

      {!agenda.error ? (
        <>
          <SortirLiveEventsRail
            items={liveEvents}
            categoryFilterActive={category !== ""}
            onClearCategory={() => setCategory("")}
          />
          <SortirLivePlacesRail items={livePlaces} />
          <SortirActiveNeighborhoodsGrid
            items={activeNeighborhoods}
            seeAllHref={sortirNeighborhoodsHref(agenda.city)}
          />

          <div className="grid gap-6 xl:grid-cols-2">
            <SortirForYouPanel card={forYou} />
            <SortirTribesTonightPanel items={tribeTonight} />
          </div>
        </>
      ) : null}
    </div>
  );

  if (agenda.loading) {
    return (
      <SortirAppShell>
        <p className="web-mobile-sortir-only px-4 py-12 text-center text-sm text-neutral-500" role="status">
          {SORTIR_LOADING}
        </p>
        <p className="web-desktop-sortir-only px-4 py-12 text-center text-sm text-neutral-500" role="status">
          {SORTIR_LOADING}
        </p>
      </SortirAppShell>
    );
  }

  return (
    <SortirAppShell>
      <div className="web-mobile-sortir-only min-w-0 space-y-5 bg-white px-4 pb-4 pt-1">
        <SortirMobileHeader />
        <SortirMobileSearchBar
          filterOpen={filterOpen}
          onToggleFilter={() => setFilterOpen((open) => !open)}
          query={mobileSearchQuery}
          onQueryChange={setMobileSearchQuery}
        />
        {filterOpen ? (
          <p className="rounded-xl bg-neutral-50 px-3 py-2.5 text-xs text-neutral-500 ring-1 ring-neutral-200/90">
            Utilisez les catégories ci-dessous pour affiner votre agenda local.
          </p>
        ) : null}
        <SortirMobileCategoryPills
          activeCategory={mobileCategory}
          onSelectCategory={setMobileCategory}
        />

        {agenda.error ? (
          <div className="space-y-3">
            <p className="text-sm text-red-600">{SORTIR_ERROR}</p>
            <button
              type="button"
              onClick={() => agenda.reload()}
              className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white"
            >
              {SORTIR_RETRY}
            </button>
          </div>
        ) : (
          <>
            <SortirMobileFeaturedCarousel items={featuredCarouselItems} />
            <SortirMobileUpcomingList items={mobileUpcoming} />
            <SortirMobilePopularPlacesRail items={mobilePopularPlaces} />
          </>
        )}
      </div>

      <div className="web-desktop-sortir-only">{desktopContent}</div>
    </SortirAppShell>
  );
}

export function SortirScreen() {
  const { user } = useAuth();
  const defaultCity = user?.city?.trim() || "Reims";

  return (
    <GeoProvider defaultCity={defaultCity}>
      <SortirScreenInner />
    </GeoProvider>
  );
}
