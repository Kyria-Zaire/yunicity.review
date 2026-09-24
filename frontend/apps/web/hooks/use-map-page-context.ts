"use client";

import type {
  CulturalPlaceListItem,
  LocalEvent,
  Neighborhood,
  PartnerOfferPublic,
  Tribe,
} from "@yunicity/types";
import { keepOfficialSectors } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

const DEFAULT_CITY = "Reims";

export type MapPageContextState = {
  city: string;
  loading: boolean;
  neighborhoods: Neighborhood[];
  tribes: Tribe[];
  culturalPlaces: CulturalPlaceListItem[];
  upcomingEvents: LocalEvent[];
  passportOffers: PartnerOfferPublic[];
  highlightOffer: PartnerOfferPublic | null;
};

export function useMapPageContext(): MapPageContextState {
  const api = useYunicityApi();
  const { user } = useAuth();
  const [city, setCity] = useState(user?.city ?? DEFAULT_CITY);
  const [loading, setLoading] = useState(true);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [culturalPlaces, setCulturalPlaces] = useState<CulturalPlaceListItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<LocalEvent[]>([]);
  const [passportOffers, setPassportOffers] = useState<PartnerOfferPublic[]>([]);
  const [highlightOffer, setHighlightOffer] = useState<PartnerOfferPublic | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let resolvedCity = user?.city?.trim() || DEFAULT_CITY;
    try {
      try {
        const profile = await api.getProfileMe();
        resolvedCity = profile.city?.trim() || resolvedCity;
      } catch {
        // Profil indisponible (visiteur) — on garde la ville par défaut.
      }
      setCity(resolvedCity);

      const [hoodsRes, tribesRes, cultureRes, offersRes, eventsRes] = await Promise.allSettled([
        api.neighborhoods.listNeighborhoods({ city: resolvedCity, page_size: 24 }),
        api.tribes.listTribes({ city: resolvedCity, page_size: 20 }),
        api.listCulturalPlaces({ city: resolvedCity, featured: true, limit: 4 }),
        api.fetchPublicPartnerOffers({ city: resolvedCity, limit: 8 }),
        api.events.listEvents({ city: resolvedCity }),
      ]);

      if (hoodsRes.status === "fulfilled") {
        // Ni plus ni moins que les 12 secteurs officiels : un environnement dont la base n'a
        // pas rejoue le seed catalog renvoie encore les 3 quartiers fusionnes comme actifs.
        setNeighborhoods(keepOfficialSectors(hoodsRes.value.items));
      } else {
        setNeighborhoods([]);
      }

      if (tribesRes.status === "fulfilled") {
        setTribes(tribesRes.value.items.filter((tribe) => !tribe.is_archived));
      } else {
        setTribes([]);
      }

      if (cultureRes.status === "fulfilled") {
        let items = cultureRes.value.items;
        if (items.length === 0) {
          try {
            const fallback = await api.listCulturalPlaces({ city: resolvedCity, limit: 4 });
            items = fallback.items;
          } catch {
            items = [];
          }
        }
        setCulturalPlaces(items);
      } else {
        setCulturalPlaces([]);
      }

      if (offersRes.status === "fulfilled" && offersRes.value.items.length > 0) {
        const offers = offersRes.value.items.slice(0, 8);
        setPassportOffers(offers);
        setHighlightOffer(offers[0] ?? null);
      } else {
        setPassportOffers([]);
        setHighlightOffer(null);
      }

      if (eventsRes.status === "fulfilled") {
        const upcoming = eventsRes.value.items
          .filter((event) => !event.is_cancelled)
          .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))
          .slice(0, 8);
        setUpcomingEvents(upcoming);
      } else {
        setUpcomingEvents([]);
      }
    } finally {
      setLoading(false);
    }
  }, [api, user?.city]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    city,
    loading,
    neighborhoods,
    tribes,
    culturalPlaces,
    upcomingEvents,
    passportOffers,
    highlightOffer,
  };
}
