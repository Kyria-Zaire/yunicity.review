"use client";

import type {
  CulturalPlaceListItem,
  CulturalPlaceStatsResponse,
  LocalEvent,
  Neighborhood,
  PartnerOffer,
  PartnerPublic,
  Tribe,
} from "@yunicity/types";
import {
  buildExplorerCategoryCards,
  buildExplorerSuggestions,
  buildExplorerTrendLines,
  filterUpcomingEvents,
  isEventWithinDays,
  resolveExplorerHeroImageUrl,
  type ExplorerCategoryCard,
  type ExplorerCategoryId,
  type ExplorerSuggestionCard,
  type ExplorerTrendLine,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

export type SearchExplorerContextState = {
  city: string;
  loading: boolean;
  error: boolean;
  reload: () => void;
  weekEvents: LocalEvent[];
  upcomingEvents: LocalEvent[];
  neighborhoods: Neighborhood[];
  culturalPlaces: CulturalPlaceListItem[];
  catalog: CulturalPlaceListItem[];
  stats: CulturalPlaceStatsResponse | null;
  tribes: Tribe[];
  highlightOffer: PartnerOffer | null;
  passportOffers: PartnerOffer[];
  partners: PartnerPublic[];
  heroImageUrl: string | null;
  categoryCards: ExplorerCategoryCard[];
  trendLines: ExplorerTrendLine[];
  suggestionsForCategory: (categoryId: ExplorerCategoryId) => ExplorerSuggestionCard[];
};

const DEFAULT_CITY = "Reims";
const CATALOG_LIMIT = 100;

export function useSearchExplorerContext(city: string): SearchExplorerContextState {
  const api = useYunicityApi();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [weekEvents, setWeekEvents] = useState<LocalEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<LocalEvent[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [culturalPlaces, setCulturalPlaces] = useState<CulturalPlaceListItem[]>([]);
  const [catalog, setCatalog] = useState<CulturalPlaceListItem[]>([]);
  const [stats, setStats] = useState<CulturalPlaceStatsResponse | null>(null);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [highlightOffer, setHighlightOffer] = useState<PartnerOffer | null>(null);
  const [passportOffers, setPassportOffers] = useState<PartnerOffer[]>([]);
  const [partners, setPartners] = useState<PartnerPublic[]>([]);

  const load = useCallback(async () => {
    const activeCity = city.trim() || DEFAULT_CITY;
    setLoading(true);
    setError(false);
    try {
      const [
        eventsRes,
        hoodsRes,
        cultureFeaturedRes,
        cultureCatalogRes,
        statsRes,
        tribesRes,
        offersRes,
        partnersRes,
      ] = await Promise.allSettled([
        api.events.listEvents({ city: activeCity }),
        api.neighborhoods.listNeighborhoods({ city: activeCity, page_size: 12 }),
        api.listCulturalPlaces({ city: activeCity, featured: true, limit: 12 }),
        api.listCulturalPlaces({ city: activeCity, limit: CATALOG_LIMIT, sort: "featured" }),
        api.getCulturalPlacesStats(activeCity),
        api.tribes.listTribes({ city: activeCity, page_size: 8 }),
        api.listPassportOffers(),
        api.listPartners({ city: activeCity, limit: 12 }),
      ]);

      let events: LocalEvent[] = [];
      if (eventsRes.status === "fulfilled") {
        events = eventsRes.value.items.filter((e) => !e.is_cancelled);
        setWeekEvents(events.filter((e) => isEventWithinDays(e.starts_at, 7)).slice(0, 5));
        setUpcomingEvents(filterUpcomingEvents(events).slice(0, 24));
      } else {
        setWeekEvents([]);
        setUpcomingEvents([]);
      }

      if (hoodsRes.status === "fulfilled") {
        setNeighborhoods(hoodsRes.value.items.slice(0, 8));
      } else {
        setNeighborhoods([]);
      }

      const catalogItems =
        cultureCatalogRes.status === "fulfilled" ? cultureCatalogRes.value.items : [];
      setCatalog(catalogItems);

      if (cultureFeaturedRes.status === "fulfilled" && cultureFeaturedRes.value.items.length > 0) {
        setCulturalPlaces(cultureFeaturedRes.value.items);
      } else {
        setCulturalPlaces(catalogItems.slice(0, 12));
      }

      if (statsRes.status === "fulfilled") {
        setStats(statsRes.value);
      } else {
        setStats(null);
      }

      if (tribesRes.status === "fulfilled") {
        setTribes(tribesRes.value.items.filter((t) => !t.is_archived).slice(0, 6));
      } else {
        setTribes([]);
      }

      if (offersRes.status === "fulfilled" && offersRes.value.items.length > 0) {
        setPassportOffers(offersRes.value.items.slice(0, 8));
        setHighlightOffer(offersRes.value.items[0] ?? null);
      } else {
        setPassportOffers([]);
        setHighlightOffer(null);
      }

      setPartners(partnersRes.status === "fulfilled" ? partnersRes.value.items : []);
    } catch {
      setError(true);
      setPartners([]);
    } finally {
      setLoading(false);
    }
  }, [api, city]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeCity = city.trim() || DEFAULT_CITY;

  const heroImageUrl = useMemo(
    () => resolveExplorerHeroImageUrl(upcomingEvents, culturalPlaces),
    [upcomingEvents, culturalPlaces],
  );

  const categoryCards = useMemo(
    () => buildExplorerCategoryCards(catalog, upcomingEvents.length, activeCity),
    [catalog, upcomingEvents.length, activeCity],
  );

  const trendLines = useMemo(
    () =>
      buildExplorerTrendLines({
        city: activeCity,
        events: upcomingEvents,
        culturalPlaces,
        neighborhoods,
        tribes,
      }),
    [activeCity, upcomingEvents, culturalPlaces, neighborhoods, tribes],
  );

  const suggestionsForCategory = useCallback(
    (categoryId: ExplorerCategoryId) =>
      buildExplorerSuggestions({
        city: activeCity,
        catalog,
        events: upcomingEvents,
        categoryId,
        limit: 8,
      }),
    [activeCity, catalog, upcomingEvents],
  );

  return {
    city: activeCity,
    loading,
    error,
    reload: load,
    weekEvents,
    upcomingEvents,
    neighborhoods,
    culturalPlaces,
    catalog,
    stats,
    tribes,
    highlightOffer,
    passportOffers,
    partners,
    heroImageUrl,
    categoryCards,
    trendLines,
    suggestionsForCategory,
  };
}
