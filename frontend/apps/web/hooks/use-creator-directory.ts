"use client";

import type { CreatorPublicDirectoryItem } from "@yunicity/types";
import { CREATOR_DIRECTORY_LIST_LIMIT_DEFAULT } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

const DEFAULT_CITY = "Reims";

export function useCreatorDirectory(cityParam: string, searchParam: string) {
  const api = useYunicityApi();
  const { user } = useAuth();
  const [city, setCity] = useState(cityParam.trim() || user?.city?.trim() || DEFAULT_CITY);
  const [query, setQuery] = useState(searchParam.trim());
  const [items, setItems] = useState<CreatorPublicDirectoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resolvedCity = cityParam.trim() || user?.city?.trim() || DEFAULT_CITY;
      const resolvedQuery = searchParam.trim();
      const response = await api.listCreators({
        city: resolvedCity,
        q: resolvedQuery || undefined,
        limit: CREATOR_DIRECTORY_LIST_LIMIT_DEFAULT,
        offset: 0,
      });
      setCity(response.city);
      setQuery(resolvedQuery);
      setItems(response.items);
      setTotal(response.total);
    } catch {
      setItems([]);
      setTotal(0);
      setError("load_failed");
    } finally {
      setLoading(false);
    }
  }, [api, cityParam, searchParam, user?.city]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    city,
    query,
    items,
    total,
    loading,
    error,
    reload: load,
  };
}
