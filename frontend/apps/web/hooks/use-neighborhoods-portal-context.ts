"use client";

import type {
  CulturalPlaceListItem,
  LocalEvent,
  Neighborhood,
  PartnerOfferPublic,
  Tribe,
} from "@yunicity/types";
import { filterAgendaUpcomingEvents } from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

export type NeighborhoodsPortalContextState = {
  city: string;
  loading: boolean;
  error: boolean;
  neighborhoods: Neighborhood[];
  events: LocalEvent[];
  culturalPlaces: CulturalPlaceListItem[];
  tribes: Tribe[];
  passportOffers: PartnerOfferPublic[];
  reload: () => void;
};

const DEFAULT_CITY = "Reims";

export function useNeighborhoodsPortalContext(initialCity?: string): NeighborhoodsPortalContextState {
  const api = useYunicityApi();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [culturalPlaces, setCulturalPlaces] = useState<CulturalPlaceListItem[]>([]);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [passportOffers, setPassportOffers] = useState<PartnerOfferPublic[]>([]);

  const city = useMemo(
    () => initialCity?.trim() || user?.city?.trim() || DEFAULT_CITY,
    [initialCity, user?.city],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const results = await Promise.allSettled([
        api.neighborhoods.listNeighborhoods({ city, page_size: 24 }),
        api.events.listEvents({ city }),
        api.listCulturalPlaces({ city, limit: 48 }),
        api.tribes.listTribes({ city, page_size: 8 }),
        api.fetchPublicPartnerOffers({ city, limit: 8 }),
      ]);

      const [hoodsRes, eventsRes, placesRes, tribesRes, offersRes] = results;

      if (hoodsRes.status === "fulfilled") {
        setNeighborhoods(hoodsRes.value.items.filter((hood) => hood.is_active));
      } else {
        setNeighborhoods([]);
      }

      if (eventsRes.status === "fulfilled") {
        setEvents(filterAgendaUpcomingEvents(eventsRes.value.items));
      } else {
        setEvents([]);
      }

      if (placesRes.status === "fulfilled") {
        setCulturalPlaces(placesRes.value.items);
      } else {
        setCulturalPlaces([]);
      }

      if (tribesRes.status === "fulfilled") {
        setTribes(tribesRes.value.items.filter((tribe) => !tribe.is_archived));
      } else {
        setTribes([]);
      }

      if (offersRes.status === "fulfilled") {
        setPassportOffers(offersRes.value.items.slice(0, 4));
      } else {
        setPassportOffers([]);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [api, city]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    city,
    loading,
    error,
    neighborhoods,
    events,
    culturalPlaces,
    tribes,
    passportOffers,
    reload: load,
  };
}

