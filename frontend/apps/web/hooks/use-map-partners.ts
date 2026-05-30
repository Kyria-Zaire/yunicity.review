"use client";

import type { PartnerPublic } from "@yunicity/types";
import { hasPartnerCoordinates } from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

export type MapPartnerMarker = {
  id: string;
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  category: string | null;
};

export function useMapPartners(city: string) {
  const api = useYunicityApi();
  const [partners, setPartners] = useState<PartnerPublic[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const activeCity = city.trim() || "Reims";
    setLoading(true);
    try {
      const response = await api.listPartners({ city: activeCity, limit: 50 });
      setPartners(response.items);
    } catch {
      setPartners([]);
    } finally {
      setLoading(false);
    }
  }, [api, city]);

  useEffect(() => {
    void load();
  }, [load]);

  const markers: MapPartnerMarker[] = useMemo(
    () =>
      partners
        .filter(hasPartnerCoordinates)
        .map((partner) => ({
          id: partner.id,
          slug: partner.slug,
          name: partner.name,
          latitude: partner.latitude as number,
          longitude: partner.longitude as number,
          category: partner.category,
        })),
    [partners],
  );

  return { partners, markers, loading, reload: load };
}
