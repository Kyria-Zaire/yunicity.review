"use client";

import type { CreatorPublicContent } from "@yunicity/types";
import { CREATOR_HUB_LIST_LIMIT_DEFAULT } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

const DEFAULT_CITY = "Reims";

export function useCreatorHub(cityParam: string) {
  const api = useYunicityApi();
  const { user } = useAuth();
  const [city, setCity] = useState(cityParam.trim() || user?.city?.trim() || DEFAULT_CITY);
  const [items, setItems] = useState<CreatorPublicContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resolvedCity = cityParam.trim() || user?.city?.trim() || DEFAULT_CITY;
      const response = await api.listCreatorHubContent({
        city: resolvedCity,
        limit: CREATOR_HUB_LIST_LIMIT_DEFAULT,
        offset: 0,
      });
      setCity(resolvedCity);
      setItems(response.items);
    } catch {
      setItems([]);
      setError("load_failed");
    } finally {
      setLoading(false);
    }
  }, [api, cityParam, user?.city]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    city,
    items,
    loading,
    error,
    reload: load,
  };
}
