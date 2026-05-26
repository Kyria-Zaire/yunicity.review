"use client";

import type { CulturalPlaceListItem, Neighborhood, PartnerOffer } from "@yunicity/types";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

const DEFAULT_CITY = "Reims";

export type MapPageContextState = {
  city: string;
  loading: boolean;
  neighborhoods: Neighborhood[];
  culturalPlaces: CulturalPlaceListItem[];
  highlightOffer: PartnerOffer | null;
};

export function useMapPageContext(): MapPageContextState {
  const api = useYunicityApi();
  const { user } = useAuth();
  const [city, setCity] = useState(user?.city ?? DEFAULT_CITY);
  const [loading, setLoading] = useState(true);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [culturalPlaces, setCulturalPlaces] = useState<CulturalPlaceListItem[]>([]);
  const [highlightOffer, setHighlightOffer] = useState<PartnerOffer | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await api.getProfileMe();
      const resolvedCity = profile.city?.trim() || user?.city?.trim() || DEFAULT_CITY;
      setCity(resolvedCity);

      const [hoodsRes, cultureRes, offersRes] = await Promise.allSettled([
        api.neighborhoods.listNeighborhoods({ city: resolvedCity, page_size: 8 }),
        api.listCulturalPlaces({ city: resolvedCity, featured: true, limit: 4 }),
        api.listPassportOffers(),
      ]);

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

      if (offersRes.status === "fulfilled" && offersRes.value.items.length > 0) {
        setHighlightOffer(offersRes.value.items[0] ?? null);
      } else {
        setHighlightOffer(null);
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
    culturalPlaces,
    highlightOffer,
  };
}
