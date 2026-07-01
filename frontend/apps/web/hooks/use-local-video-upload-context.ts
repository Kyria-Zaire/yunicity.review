"use client";

import type { Neighborhood } from "@yunicity/types";
import { useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

const DEFAULT_CITY = "Reims";

export function useLocalVideoUploadContext() {
  const api = useYunicityApi();
  const { user } = useAuth();
  const city = user?.city?.trim() || DEFAULT_CITY;
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingNeighborhoods(true);
      try {
        const data = await api.neighborhoods.listNeighborhoods({ city, page_size: 48 });
        if (!cancelled) {
          setNeighborhoods(data.items.filter((item) => item.is_active));
        }
      } catch {
        if (!cancelled) setNeighborhoods([]);
      } finally {
        if (!cancelled) setLoadingNeighborhoods(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [api, city]);

  return {
    api,
    city,
    neighborhoods,
    loadingNeighborhoods,
  };
}
