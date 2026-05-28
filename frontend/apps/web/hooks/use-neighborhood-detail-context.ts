"use client";

import type {
  CulturalPlaceListItem,
  LocalEvent,
  Neighborhood,
  NeighborhoodContextResponse,
  PartnerOffer,
  Tribe,
} from "@yunicity/types";
import {
  buildNeighborhoodMomentAtmosphereLine,
  filterAgendaUpcomingEvents,
  filterNeighborhoodCulturalPlaces,
  filterNeighborhoodTribes,
  filterNeighborhoodUpcomingEvents,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

export type NeighborhoodDetailContextState = {
  loading: boolean;
  error: boolean;
  city: string;
  context: NeighborhoodContextResponse | null;
  hood: Neighborhood | null;
  upcomingEvents: LocalEvent[];
  hoodCulturalPlaces: CulturalPlaceListItem[];
  cityCulturalPlaces: CulturalPlaceListItem[];
  nearbyPlaces: CulturalPlaceListItem[];
  tribes: Tribe[];
  passportOffers: PartnerOffer[];
  atmosphereLine: string;
  weatherCalm: boolean;
  setWeatherCalm: (calm: boolean) => void;
  reload: () => void;
};

export function useNeighborhoodDetailContext(
  slug: string,
  city: string,
): NeighborhoodDetailContextState {
  const api = useYunicityApi();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [context, setContext] = useState<NeighborhoodContextResponse | null>(null);
  const [cityEvents, setCityEvents] = useState<LocalEvent[]>([]);
  const [culturalPlaces, setCulturalPlaces] = useState<CulturalPlaceListItem[]>([]);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [passportOffers, setPassportOffers] = useState<PartnerOffer[]>([]);
  const [weatherCalm, setWeatherCalm] = useState(true);

  const activeCity = city.trim() || "Reims";

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const ctx = await api.neighborhoods.getNeighborhoodContext(slug, activeCity);
      setContext(ctx);
      const resolvedCity = ctx.neighborhood.city.trim() || activeCity;

      const [eventsRes, cultureRes, tribesRes, offersRes] = await Promise.allSettled([
        api.events.listEvents({ city: resolvedCity }),
        api.listCulturalPlaces({ city: resolvedCity, limit: 24 }),
        api.tribes.listTribes({ city: resolvedCity, page_size: 8 }),
        api.listPassportOffers(),
      ]);

      if (eventsRes.status === "fulfilled") {
        setCityEvents(filterAgendaUpcomingEvents(eventsRes.value.items));
      } else {
        setCityEvents([]);
      }

      if (cultureRes.status === "fulfilled") {
        setCulturalPlaces(cultureRes.value.items);
      } else {
        setCulturalPlaces([]);
      }

      if (tribesRes.status === "fulfilled") {
        setTribes(tribesRes.value.items);
      } else {
        setTribes([]);
      }

      if (offersRes.status === "fulfilled") {
        setPassportOffers(offersRes.value.items.slice(0, 4));
      } else {
        setPassportOffers([]);
      }
    } catch {
      setContext(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [activeCity, api, slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const hood = context?.neighborhood ?? null;

  const upcomingEvents = useMemo(
    () => (hood ? filterNeighborhoodUpcomingEvents(hood, cityEvents) : []),
    [cityEvents, hood],
  );

  const hoodPlaces = useMemo(
    () => (hood ? filterNeighborhoodCulturalPlaces(hood, culturalPlaces) : []),
    [culturalPlaces, hood],
  );

  const nearbyPlaces = useMemo(() => {
    if (!hood) return [];
    const inHoodSlugs = new Set(hoodPlaces.map((p) => p.id));
    return culturalPlaces.filter((place) => !inHoodSlugs.has(place.id)).slice(0, 4);
  }, [culturalPlaces, hood, hoodPlaces]);

  const visibleTribes = useMemo(() => filterNeighborhoodTribes(tribes), [tribes]);

  const atmosphereLine = useMemo(() => {
    if (!hood) return "";
    return buildNeighborhoodMomentAtmosphereLine(hood, cityEvents, culturalPlaces, {
      weatherCalm,
    });
  }, [cityEvents, culturalPlaces, hood, weatherCalm]);

  return {
    loading,
    error,
    city: hood?.city.trim() || activeCity,
    context,
    hood,
    upcomingEvents,
    hoodCulturalPlaces: hoodPlaces,
    cityCulturalPlaces: culturalPlaces,
    nearbyPlaces,
    tribes: visibleTribes,
    passportOffers,
    atmosphereLine,
    weatherCalm,
    setWeatherCalm,
    reload: load,
  };
}
