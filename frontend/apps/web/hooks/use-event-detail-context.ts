"use client";

import type {
  CulturalPlaceListItem,
  LocalEvent,
  Neighborhood,
  PartnerOffer,
  Tribe,
} from "@yunicity/types";
import {
  filterAgendaUpcomingEvents,
  pickNearbyCulturalPlaces,
  pickRelatedEvents,
  resolveEventNeighborhoodContext,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

export type EventDetailContextState = {
  loading: boolean;
  error: boolean;
  event: LocalEvent | null;
  city: string;
  relatedEvents: LocalEvent[];
  nearbyPlaces: CulturalPlaceListItem[];
  neighborhoods: Neighborhood[];
  neighborhoodContext: ReturnType<typeof resolveEventNeighborhoodContext>;
  tribes: Tribe[];
  passportOffers: PartnerOffer[];
  savedEvents: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  patchEvent: (patch: Partial<LocalEvent>) => void;
  syncPlanningAfterInterest: (interested: boolean, eventSnapshot: LocalEvent) => Promise<void>;
  reload: () => void;
};

export function useEventDetailContext(eventId: string): EventDetailContextState {
  const api = useYunicityApi();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [event, setEvent] = useState<LocalEvent | null>(null);
  const [cityEvents, setCityEvents] = useState<LocalEvent[]>([]);
  const [savedEvents, setSavedEvents] = useState<LocalEvent[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [culturalPlaces, setCulturalPlaces] = useState<CulturalPlaceListItem[]>([]);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [passportOffers, setPassportOffers] = useState<PartnerOffer[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const detail = await api.events.getEvent(eventId);
      setEvent(detail);
      const activeCity = detail.city.trim() || user?.city?.trim() || "Reims";

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
        api.listCulturalPlaces({ city: activeCity, featured: true, limit: 16 }),
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
        setCityEvents(filterAgendaUpcomingEvents(value.items));
      } else {
        setCityEvents([]);
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
        setPassportOffers(value.items.slice(0, 4));
      } else {
        setPassportOffers([]);
      }

      if (savedRes?.status === "fulfilled") {
        const value = savedRes.value as Awaited<ReturnType<typeof api.events.listSavedEvents>>;
        setSavedEvents(filterAgendaUpcomingEvents(value.items));
      } else {
        setSavedEvents([]);
      }
    } catch {
      setEvent(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [api, eventId, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const city = event?.city?.trim() || user?.city?.trim() || "Reims";

  const relatedEvents = useMemo(
    () => (event ? pickRelatedEvents(event, cityEvents) : []),
    [cityEvents, event],
  );

  const nearbyPlaces = useMemo(
    () => (event ? pickNearbyCulturalPlaces(event, culturalPlaces) : []),
    [culturalPlaces, event],
  );

  const neighborhoodContext = useMemo(
    () => (event ? resolveEventNeighborhoodContext(event, neighborhoods) : null),
    [event, neighborhoods],
  );

  const patchEvent = useCallback((patch: Partial<LocalEvent>) => {
    setEvent((prev) => (prev ? { ...prev, ...patch } : null));
  }, []);

  const syncPlanningAfterInterest = useCallback(
    async (interested: boolean, eventSnapshot: LocalEvent) => {
      if (!user) {
        return;
      }

      setSavedEvents((prev) => {
        if (!interested) {
          return prev.filter((item) => item.id !== eventSnapshot.id);
        }
        const saved = { ...eventSnapshot, interested_by_me: true };
        if (prev.some((item) => item.id === eventSnapshot.id)) {
          return prev.map((item) => (item.id === eventSnapshot.id ? saved : item));
        }
        return filterAgendaUpcomingEvents([saved, ...prev]);
      });

      try {
        const value = await api.events.listSavedEvents();
        setSavedEvents(filterAgendaUpcomingEvents(value.items));
      } catch {
        /* conserve la mise à jour optimiste */
      }
    },
    [api.events, user],
  );

  return {
    loading,
    error,
    event,
    city,
    relatedEvents,
    nearbyPlaces,
    neighborhoods,
    neighborhoodContext,
    tribes,
    passportOffers,
    savedEvents,
    culturalPlaces,
    patchEvent,
    syncPlanningAfterInterest,
    reload: load,
  };
}
