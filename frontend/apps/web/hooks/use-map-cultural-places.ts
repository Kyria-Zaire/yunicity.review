"use client";

import type { MapCulturalPlaceItem } from "@yunicity/types";
import { useCallback, useEffect, useRef, useState } from "react";

import { MAP_CITY_WIDE_BBOX } from "@/hooks/use-map-bbox";
import { useYunicityApi } from "@/hooks/use-yunicity-api";

const MAP_CULTURAL_LIMIT = 50;

// T5 — chargement UNIQUE : tous les lieux de la ville (toutes catégories) en une requête au
// montage. Le filtrage culture/nature se fait côté client (filterPlacesByPortalFilters), donc
// plus de re-fetch réseau ni au pan ni au changement de filtre catégorie.
export function useMapCulturalPlaces(city: string) {
  const api = useYunicityApi();
  const [places, setPlaces] = useState<MapCulturalPlaceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  const fetchPlaces = useCallback(async () => {
    const trimmedCity = city.trim();
    if (!trimmedCity) return;

    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const response = await api.listMapCulturalPlaces({
        ...MAP_CITY_WIDE_BBOX,
        city: trimmedCity,
        limit: MAP_CULTURAL_LIMIT,
      });
      if (requestId !== requestIdRef.current) return;
      setPlaces(response.places);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setPlaces([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [api, city]);

  useEffect(() => {
    void fetchPlaces();
  }, [fetchPlaces]);

  return { places, loading };
}
