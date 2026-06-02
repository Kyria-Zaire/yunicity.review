"use client";

import { SortirFeaturedToday } from "@/components/events/sortir/sortir-featured-today";
import { SortirActiveNeighborhoodsGrid } from "@/components/events/sortir/sortir-active-neighborhoods-grid";
import { SortirAppShell } from "@/components/events/sortir/sortir-app-shell";
import { SortirCategoryChips } from "@/components/events/sortir/sortir-category-chips";
import { SortirForYouPanel } from "@/components/events/sortir/sortir-for-you-panel";
import { SortirHeroBanner } from "@/components/events/sortir/sortir-hero-banner";
import { SortirLiveEventsRail } from "@/components/events/sortir/sortir-live-events-rail";
import { SortirLivePlacesRail } from "@/components/events/sortir/sortir-live-places-rail";
import { SortirTribesTonightPanel } from "@/components/events/sortir/sortir-tribes-tonight-panel";
import { useEventsAgendaContext } from "@/hooks/use-events-agenda-context";
import { useAuth } from "@/lib/auth/auth-provider";
import { GeoProvider } from "@/providers/geo-provider";
import type { SortirCategoryId } from "@yunicity/utils";
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
  buildSortirTribeTonightItems,
  isNewLocalUserContext,
  resolveSortirPortalHeroImage,
  sortirNeighborhoodsHref,
} from "@yunicity/utils";
import { useMemo, useState } from "react";

function SortirScreenInner() {
  const { user } = useAuth();
  const agenda = useEventsAgendaContext(user?.city ?? "Reims");
  const [category, setCategory] = useState<SortirCategoryId>("");

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
      }),
    [agenda.city, agenda.culturalPlaces, agenda.events],
  );

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

  if (agenda.loading) {
    return (
      <SortirAppShell>
        <p className="px-4 py-12 text-center text-sm text-neutral-500" role="status">
          {SORTIR_LOADING}
        </p>
      </SortirAppShell>
    );
  }

  return (
    <SortirAppShell>
      <div className="mx-auto w-full max-w-[1400px] space-y-6 px-3 py-2 pb-12 sm:px-4 lg:px-6">
        <SortirHeroBanner
          city={agenda.city}
          heroImageUrl={heroImageUrl}
          stats={heroStats}
          isNewUser={isNewUser}
        />

        <SortirFeaturedToday featured={featuredToday} />

        <SortirCategoryChips activeCategory={category} onSelect={setCategory} />

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
            <SortirLiveEventsRail items={liveEvents} />
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
