"use client";

import type {
  CulturalPlaceListItem,
  LocalEvent,
  Neighborhood,
  PartnerOffer,
  Tribe,
} from "@yunicity/types";
import { isEventWithinDays } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

export type SearchExplorerContextState = {
  city: string;
  loading: boolean;
  weekEvents: LocalEvent[];
  upcomingEvents: LocalEvent[];
  neighborhoods: Neighborhood[];
  culturalPlaces: CulturalPlaceListItem[];
  tribes: Tribe[];
  highlightOffer: PartnerOffer | null;
  passportOffers: PartnerOffer[];
};

const DEFAULT_CITY = "Reims";

export function useSearchExplorerContext(city: string): SearchExplorerContextState {
  const api = useYunicityApi();
  const [loading, setLoading] = useState(true);
  const [weekEvents, setWeekEvents] = useState<LocalEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<LocalEvent[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [culturalPlaces, setCulturalPlaces] = useState<CulturalPlaceListItem[]>([]);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [highlightOffer, setHighlightOffer] = useState<PartnerOffer | null>(null);
  const [passportOffers, setPassportOffers] = useState<PartnerOffer[]>([]);

  const load = useCallback(async () => {
    const activeCity = city.trim() || DEFAULT_CITY;
    setLoading(true);
    try {
      const [eventsRes, hoodsRes, cultureRes, tribesRes, offersRes] = await Promise.allSettled([
        api.events.listEvents({ city: activeCity }),
        api.neighborhoods.listNeighborhoods({ city: activeCity, page_size: 8 }),
        api.listCulturalPlaces({ city: activeCity, featured: true, limit: 8 }),
        api.tribes.listTribes({ city: activeCity, page_size: 3 }),
        api.listPassportOffers(),
      ]);

      if (eventsRes.status === "fulfilled") {
        const all = eventsRes.value.items.filter((e) => !e.is_cancelled);
        setWeekEvents(all.filter((e) => isEventWithinDays(e.starts_at, 7)).slice(0, 5));
        setUpcomingEvents(all.slice(0, 12));
      } else {
        setWeekEvents([]);
        setUpcomingEvents([]);
      }

      if (hoodsRes.status === "fulfilled") {
        setNeighborhoods(hoodsRes.value.items.slice(0, 6));
      } else {
        setNeighborhoods([]);
      }

      if (cultureRes.status === "fulfilled") {
        setCulturalPlaces(cultureRes.value.items);
      } else {
        setCulturalPlaces([]);
      }

      if (tribesRes.status === "fulfilled") {
        setTribes(tribesRes.value.items.slice(0, 3));
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
    } finally {
      setLoading(false);
    }
  }, [api, city]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    city: city.trim() || DEFAULT_CITY,
    loading,
    weekEvents,
    upcomingEvents,
    neighborhoods,
    culturalPlaces,
    tribes,
    highlightOffer,
    passportOffers,
  };
}
