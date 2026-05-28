"use client";

import type {
  CulturalPlaceListItem,
  LocalEvent,
  Neighborhood,
  PartnerOffer,
  PassportMe,
  Tribe,
} from "@yunicity/types";
import { filterAgendaUpcomingEvents } from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

export type TribesPortalContextState = {
  city: string;
  loading: boolean;
  error: boolean;
  tribes: Tribe[];
  events: LocalEvent[];
  neighborhoods: Neighborhood[];
  culturalPlaces: CulturalPlaceListItem[];
  offers: PartnerOffer[];
  passport: PassportMe | null;
  reload: () => void;
};

const DEFAULT_CITY = "Reims";

export function useTribesPortalContext(initialCity?: string): TribesPortalContextState {
  const api = useYunicityApi();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [culturalPlaces, setCulturalPlaces] = useState<CulturalPlaceListItem[]>([]);
  const [offers, setOffers] = useState<PartnerOffer[]>([]);
  const [passport, setPassport] = useState<PassportMe | null>(null);

  const city = useMemo(
    () => initialCity?.trim() || user?.city?.trim() || DEFAULT_CITY,
    [initialCity, user?.city],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [tribesRes, eventsRes, hoodsRes, placesRes, offersRes, passportRes] = await Promise.allSettled([
        api.tribes.listTribes({ city, page_size: 24 }),
        api.events.listEvents({ city }),
        api.neighborhoods.listNeighborhoods({ city, page_size: 20 }),
        api.listCulturalPlaces({ city, limit: 20 }),
        api.listPassportOffers(),
        api.getPassportMe(),
      ]);

      setTribes(
        tribesRes.status === "fulfilled"
          ? tribesRes.value.items.filter((tribe) => !tribe.is_archived)
          : [],
      );
      setEvents(eventsRes.status === "fulfilled" ? filterAgendaUpcomingEvents(eventsRes.value.items) : []);
      setNeighborhoods(
        hoodsRes.status === "fulfilled" ? hoodsRes.value.items.filter((hood) => hood.is_active) : [],
      );
      setCulturalPlaces(placesRes.status === "fulfilled" ? placesRes.value.items : []);
      setOffers(offersRes.status === "fulfilled" ? offersRes.value.items.slice(0, 4) : []);
      setPassport(passportRes.status === "fulfilled" ? passportRes.value : null);
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
    tribes,
    events,
    neighborhoods,
    culturalPlaces,
    offers,
    passport,
    reload: load,
  };
}

