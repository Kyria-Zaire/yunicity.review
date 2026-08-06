"use client";

import type { CulturalPlaceDetail } from "@yunicity/types";
import type { MapTerritorySelection } from "@yunicity/utils";
import { useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

export type SelectedCulturalPlaceDetail = {
  placeDetail: CulturalPlaceDetail | null;
  loading: boolean;
  error: boolean;
};

/**
 * Fetch UNIQUE du détail du lieu sélectionné (T6.2). Appelé une seule fois dans `EventMapScreen` ;
 * le résultat est passé à toutes les instances de `MapPlaceDetailPanel` (aside desktop, fiche
 * sous-carte, drawer medium) qui deviennent présentational. Fini le fetch dupliqué par instance
 * montée (le CSS `display:none` ne démonte pas → l'ancien `useEffect` interne fetchait N fois).
 */
export function useSelectedCulturalPlaceDetail(
  selection: MapTerritorySelection | null,
  city: string,
): SelectedCulturalPlaceDetail {
  const api = useYunicityApi();
  const [placeDetail, setPlaceDetail] = useState<CulturalPlaceDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!selection || selection.kind !== "place") {
      setPlaceDetail(null);
      setError(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    void api
      .getCulturalPlace(selection.slug, city)
      .then((detail) => {
        if (!cancelled) setPlaceDetail(detail);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, city, selection]);

  return { placeDetail, loading, error };
}
