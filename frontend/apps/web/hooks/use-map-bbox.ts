"use client";

import type { MapBbox } from "@yunicity/types";
import { boundsToMapBbox } from "@yunicity/utils";
import { useCallback, useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 300;

/**
 * Bbox « ville entière » — couvre tout, le backend filtre par `city`. Sert au chargement UNIQUE
 * des données carte (T5) : plus de re-fetch réseau à chaque pan pour un dataset de quelques
 * dizaines de points. TODO(debt): si le volume croît fortement (multi-ville, beaucoup de lieux),
 * le plafond serveur (limit) tronquera — revisiter alors un chargement borné par bbox à ce moment.
 */
export const MAP_CITY_WIDE_BBOX: MapBbox = {
  lat_min: -90,
  lat_max: 90,
  lon_min: -180,
  lon_max: 180,
};

export type MapBoundsLike = {
  getNorth: () => number;
  getSouth: () => number;
  getEast: () => number;
  getWest: () => number;
};

export function useMapBbox() {
  const [bbox, setBbox] = useState<MapBbox | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateFromBounds = useCallback((bounds: MapBoundsLike) => {
    const next = boundsToMapBbox(bounds);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setBbox(next);
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { bbox, updateFromBounds };
}
