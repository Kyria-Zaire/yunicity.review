"use client";

import type { PartnerPublic } from "@yunicity/types";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

export function usePassportDesktopExtras(enabled: boolean, city: string) {
  const api = useYunicityApi();
  const [partners, setPartners] = useState<PartnerPublic[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!enabled) {
      setPartners([]);
      return;
    }

    const normalizedCity = city.trim() || "Reims";
    setIsLoading(true);
    try {
      const featured = await api.listPartners({ city: normalizedCity, featured: true, limit: 10 });
      setPartners(featured.items);
    } catch {
      try {
        const fallback = await api.listPartners({ city: normalizedCity, limit: 10 });
        setPartners(fallback.items);
      } catch {
        setPartners([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [api, city, enabled]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { partners, isLoading, reload };
}
