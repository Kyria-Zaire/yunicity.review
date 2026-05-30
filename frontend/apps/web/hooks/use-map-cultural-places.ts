"use client";

import type { MapCulturalPlaceItem } from "@yunicity/types";
import { hasBboxChangedSignificantly } from "@yunicity/utils";
import { useCallback, useEffect, useRef, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import type { MapBbox } from "@yunicity/types";

const MAP_CULTURAL_LIMIT = 50;

export function useMapCulturalPlaces(
  city: string,
  bbox: MapBbox | null,
  categories: string[] | null = null,
) {
  const api = useYunicityApi();
  const [places, setPlaces] = useState<MapCulturalPlaceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const lastFetchedRef = useRef<MapBbox | null>(null);
  const lastCategoriesRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  const categoriesKey = categories?.slice().sort().join(",") ?? "";

  const fetchPlaces = useCallback(
    async (targetBbox: MapBbox) => {
      const trimmedCity = city.trim();
      if (!trimmedCity) return;
      if (
        !hasBboxChangedSignificantly(lastFetchedRef.current, targetBbox) &&
        lastCategoriesRef.current === categoriesKey
      ) {
        return;
      }

      const requestId = ++requestIdRef.current;
      setLoading(true);
      try {
        const response = await api.listMapCulturalPlaces({
          ...targetBbox,
          city: trimmedCity,
          limit: MAP_CULTURAL_LIMIT,
          category: categories ?? undefined,
        });
        if (requestId !== requestIdRef.current) return;
        lastFetchedRef.current = targetBbox;
        lastCategoriesRef.current = categoriesKey;
        setPlaces(response.places);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setPlaces([]);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [api, categories, categoriesKey, city],
  );

  useEffect(() => {
    if (!bbox) return;
    void fetchPlaces(bbox);
  }, [bbox, city, categoriesKey, fetchPlaces]);

  return { places, loading };
}
