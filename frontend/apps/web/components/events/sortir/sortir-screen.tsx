"use client";

import { SortirResponsiveShell } from "@/components/events/sortir/sortir-responsive-shell";
import { SortirMediumShell } from "@/components/events/sortir/medium";
import { SortirActiveNeighborhoodsGrid } from "@/components/events/sortir/sortir-active-neighborhoods-grid";
import { SortirAppShell } from "@/components/events/sortir/sortir-app-shell";
import { SortirForYouPanel } from "@/components/events/sortir/sortir-for-you-panel";
import { SortirLivePlacesRail } from "@/components/events/sortir/sortir-live-places-rail";
import {
  SortirMobileHeader,
  SortirMobileShell,
} from "@/components/events/sortir/mobile";
import { SortirTribesTonightPanel } from "@/components/events/sortir/sortir-tribes-tonight-panel";
import { SearchExplorerOfferHighlight } from "@/components/search/search-explorer-offer-highlight";
import { useEventsAgendaContext } from "@/hooks/use-events-agenda-context";
import { useAuth } from "@/lib/auth/auth-provider";
import { GeoProvider, useGeo } from "@/providers/geo-provider";
import type { SortirCategoryId, SortirDesktopCategoryId, SortirDesktopWhenId } from "@yunicity/utils";
import {
  SORTIR_ERROR,
  SORTIR_LOADING,
  SORTIR_RETRY,
  buildSortirActiveNeighborhoodCards,
  buildSortirDesktopAgendaRows,
  buildSortirDesktopSoonCard,
  buildSortirDesktopWeekendSpotlight,
  buildSortirFeaturedToday,
  buildSortirForYouCard,
  buildSortirLiveEventCards,
  buildSortirLivePlaceCards,
  buildSortirTribeTonightItems,
  filterSortirEventsByWhen,
  filterSortirEventsByDesktopToggles,
  filterSortirLiveEventCardsByQuery,
  mapSortirDesktopCategoryToPortal,
  resolveCityMapCenter,
  resolveSortirDesktopEditorialMoment,
  sortirNeighborhoodsHref,
} from "@yunicity/utils";
import { useMemo, useState } from "react";

function SortirScreenInner() {
  const { user } = useAuth();
  const geo = useGeo();
  const agenda = useEventsAgendaContext(user?.city ?? "Reims");
  const [desktopWhen, setDesktopWhen] = useState<SortirDesktopWhenId>("today");
  const [desktopCategory, setDesktopCategory] = useState<SortirDesktopCategoryId>("");
  const [desktopSearchQuery, setDesktopSearchQuery] = useState("");
  const [desktopMood, setDesktopMood] = useState("tonight");
  const [desktopToggles, setDesktopToggles] = useState({
    free: false,
    nearby: false,
    accessible: false,
    indoor: false,
  });

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

  const desktopPortalCategory = useMemo(() => {
    if (desktopMood === "tonight") return "tonight" as SortirCategoryId;
    return mapSortirDesktopCategoryToPortal(desktopCategory);
  }, [desktopCategory, desktopMood]);

  const desktopGeoOrigin = useMemo(() => {
    if (geo.currentPosition) {
      return {
        latitude: geo.currentPosition.latitude,
        longitude: geo.currentPosition.longitude,
      };
    }
    const center = resolveCityMapCenter(agenda.city);
    return { latitude: center.latitude, longitude: center.longitude };
  }, [agenda.city, geo.currentPosition]);

  const desktopFilteredEvents = useMemo(() => {
    const byWhen = filterSortirEventsByWhen(agenda.events, desktopWhen);
    return filterSortirEventsByDesktopToggles(byWhen, desktopToggles, desktopGeoOrigin);
  }, [agenda.events, desktopGeoOrigin, desktopToggles, desktopWhen]);

  const desktopFeatured = useMemo(
    () =>
      buildSortirFeaturedToday({
        city: agenda.city,
        events: desktopFilteredEvents,
        culturalPlaces: agenda.culturalPlaces,
        maxItems: 5,
      }),
    [agenda.city, agenda.culturalPlaces, desktopFilteredEvents],
  );

  const desktopTonightItems = useMemo(() => {
    const featuredId =
      desktopFeatured.kind === "events" ? desktopFeatured.items[0]?.id : undefined;
    const cards = buildSortirLiveEventCards({
      city: agenda.city,
      events: desktopFilteredEvents,
      culturalPlaces: agenda.culturalPlaces,
      categoryId: desktopPortalCategory,
      maxItems: 12,
    });
    return filterSortirLiveEventCardsByQuery(cards, desktopSearchQuery)
      .filter((card) => card.id !== featuredId)
      .slice(0, 3);
  }, [
    agenda.city,
    agenda.culturalPlaces,
    desktopFeatured,
    desktopFilteredEvents,
    desktopPortalCategory,
    desktopSearchQuery,
  ]);

  const desktopAgendaRows = useMemo(
    () => buildSortirDesktopAgendaRows(agenda.savedEvents, agenda.city, 2),
    [agenda.city, agenda.savedEvents],
  );

  const desktopSoonCard = useMemo(
    () =>
      buildSortirDesktopSoonCard({
        city: agenda.city,
        events: agenda.events,
        culturalPlaces: agenda.culturalPlaces,
      }),
    [agenda.city, agenda.culturalPlaces, agenda.events],
  );

  const desktopWeekendCard = useMemo(
    () =>
      buildSortirDesktopWeekendSpotlight({
        city: agenda.city,
        events: agenda.events,
        culturalPlaces: agenda.culturalPlaces,
      }),
    [agenda.city, agenda.culturalPlaces, agenda.events],
  );

  const editorialMoment = useMemo(() => resolveSortirDesktopEditorialMoment(), []);

  const mediumShellContent = (
    <>
      {agenda.error ? (
        <div className="mx-auto w-full max-w-[960px] space-y-3 px-3 py-2 sm:px-4">
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
        <SortirMediumShell
          city={agenda.city}
          editorialMoment={editorialMoment}
          searchQuery={desktopSearchQuery}
          onSearchChange={setDesktopSearchQuery}
          activeMood={desktopMood}
          onMoodChange={setDesktopMood}
          activeWhen={desktopWhen}
          activeCategory={desktopCategory}
          toggles={desktopToggles}
          onWhenChange={setDesktopWhen}
          onCategoryChange={setDesktopCategory}
          onToggleChange={(key, value) =>
            setDesktopToggles((current) => ({ ...current, [key]: value }))
          }
          featured={desktopFeatured}
          tonightItems={desktopTonightItems}
          agendaRows={desktopAgendaRows}
          savedCount={agenda.savedEvents.length}
          soonCard={desktopSoonCard}
        />
      )}
    </>
  );

  const desktopShellSecondary = (
    <>
      {agenda.passportOffers[0] ? (
        <SearchExplorerOfferHighlight offer={agenda.passportOffers[0]} />
      ) : null}
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
  );

  const desktopShellContent = (
    <div className="mx-auto w-full max-w-[1400px] px-3 py-2 pb-12 sm:px-4 lg:px-6">
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
        <SortirResponsiveShell
          city={agenda.city}
          editorialMoment={editorialMoment}
          searchQuery={desktopSearchQuery}
          onSearchChange={setDesktopSearchQuery}
          activeMood={desktopMood}
          onMoodChange={setDesktopMood}
          activeWhen={desktopWhen}
          activeCategory={desktopCategory}
          toggles={desktopToggles}
          onWhenChange={setDesktopWhen}
          onCategoryChange={setDesktopCategory}
          onToggleChange={(key, value) =>
            setDesktopToggles((current) => ({ ...current, [key]: value }))
          }
          featured={desktopFeatured}
          tonightItems={desktopTonightItems}
          agendaRows={desktopAgendaRows}
          savedCount={agenda.savedEvents.length}
          soonCard={desktopSoonCard}
          weekendCard={desktopWeekendCard}
          secondaryContent={desktopShellSecondary}
        />
      )}
    </div>
  );

  if (agenda.loading) {
    return (
      <SortirAppShell>
        <p className="web-mobile-sortir-only px-4 py-12 text-center text-sm text-neutral-500" role="status">
          {SORTIR_LOADING}
        </p>
        <p className="sortir-tablet-desktop-only px-4 py-12 text-center text-sm text-neutral-500" role="status">
          {SORTIR_LOADING}
        </p>
        <p className="sortir-desktop-shell-only px-4 py-12 text-center text-sm text-neutral-500" role="status">
          {SORTIR_LOADING}
        </p>
      </SortirAppShell>
    );
  }

  return (
    <SortirAppShell>
      <div className="web-mobile-sortir-only min-w-0 bg-white" data-sortir-mobile-root="">
        <SortirMobileHeader />
        {agenda.error ? (
          <div className="space-y-3 px-4 py-6">
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
          <SortirMobileShell
            city={agenda.city}
            editorialMoment={editorialMoment}
            searchQuery={desktopSearchQuery}
            onSearchChange={setDesktopSearchQuery}
            activeMood={desktopMood}
            onMoodChange={setDesktopMood}
            activeWhen={desktopWhen}
            activeCategory={desktopCategory}
            toggles={desktopToggles}
            onWhenChange={setDesktopWhen}
            onCategoryChange={setDesktopCategory}
            onToggleChange={(key, value) =>
              setDesktopToggles((current) => ({ ...current, [key]: value }))
            }
            featured={desktopFeatured}
            tonightItems={desktopTonightItems}
            savedCount={agenda.savedEvents.length}
            soonCard={desktopSoonCard}
          />
        )}
      </div>

      <div className="sortir-tablet-desktop-only" data-sortir-tablet-desktop="">
        {mediumShellContent}
      </div>
      <div className="sortir-desktop-shell-only" data-sortir-desktop-shell="">
        {desktopShellContent}
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
