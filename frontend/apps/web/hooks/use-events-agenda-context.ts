"use client";

import type {
  CulturalPlaceListItem,
  LocalEvent,
  Neighborhood,
  PartnerOffer,
  Tribe,
} from "@yunicity/types";
import { filterAgendaUpcomingEvents } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

export type EventsAgendaContextState = {
  city: string;
  loading: boolean;
  error: boolean;
  events: LocalEvent[];
  savedEvents: LocalEvent[];
  tribes: Tribe[];
  neighborhoods: Neighborhood[];
  culturalPlaces: CulturalPlaceListItem[];
  passportOffers: PartnerOffer[];
  reload: () => void;
};

const DEFAULT_CITY = "Reims";

export function useEventsAgendaContext(city: string): EventsAgendaContextState {
  const api = useYunicityApi();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [savedEvents, setSavedEvents] = useState<LocalEvent[]>([]);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [culturalPlaces, setCulturalPlaces] = useState<CulturalPlaceListItem[]>([]);
  const [passportOffers, setPassportOffers] = useState<PartnerOffer[]>([]);

  const load = useCallback(async () => {
    const activeCity = city.trim() || user?.city?.trim() || DEFAULT_CITY;
    setLoading(true);
    setError(false);

    try {
      const requests: [
        Promise<unknown>,
        Promise<unknown>,
        Promise<unknown>,
        Promise<unknown>,
        Promise<unknown>,
        Promise<unknown>?,
      ] = [
        api.events.listEvents({ city: activeCity }),
        api.neighborhoods.listNeighborhoods({ city: activeCity, page_size: 12 }),
        api.listCulturalPlaces({ city: activeCity, featured: true, limit: 12 }),
        api.tribes.listTribes({ city: activeCity, page_size: 6 }),
        api.listPassportOffers(),
      ];

      if (user) {
        requests.push(api.events.listSavedEvents());
      }

      const results = await Promise.allSettled(requests);
      const [eventsRes, hoodsRes, cultureRes, tribesRes, offersRes, savedRes] = results;

      if (eventsRes.status === "fulfilled") {
        const value = eventsRes.value as Awaited<ReturnType<typeof api.events.listEvents>>;
        setEvents(filterAgendaUpcomingEvents(value.items));
      } else {
        setEvents([]);
        setError(true);
      }

      if (hoodsRes.status === "fulfilled") {
        const value = hoodsRes.value as Awaited<
          ReturnType<typeof api.neighborhoods.listNeighborhoods>
        >;
        setNeighborhoods(value.items);
      } else {
        setNeighborhoods([]);
      }

      if (cultureRes.status === "fulfilled") {
        const value = cultureRes.value as Awaited<ReturnType<typeof api.listCulturalPlaces>>;
        setCulturalPlaces(value.items);
      } else {
        setCulturalPlaces([]);
      }

      if (tribesRes.status === "fulfilled") {
        const value = tribesRes.value as Awaited<ReturnType<typeof api.tribes.listTribes>>;
        setTribes(value.items.filter((tribe) => !tribe.is_archived));
      } else {
        setTribes([]);
      }

      if (offersRes.status === "fulfilled") {
        const value = offersRes.value as Awaited<ReturnType<typeof api.listPassportOffers>>;
        setPassportOffers(value.items);
      } else {
        setPassportOffers([]);
      }

      if (savedRes?.status === "fulfilled") {
        const value = savedRes.value as Awaited<ReturnType<typeof api.events.listSavedEvents>>;
        setSavedEvents(filterAgendaUpcomingEvents(value.items));
      } else {
        setSavedEvents([]);
      }
    } finally {
      setLoading(false);
    }
  }, [api, city, user]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    city: city.trim() || user?.city?.trim() || DEFAULT_CITY,
    loading,
    error,
    events,
    savedEvents,
    tribes,
    neighborhoods,
    culturalPlaces,
    passportOffers,
    reload: load,
  };
}
