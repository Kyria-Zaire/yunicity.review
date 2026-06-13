"use client";

import type { NeighborhoodContributionMeItem } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

export function useProfileMemories() {
  const api = useYunicityApi();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [items, setItems] = useState<NeighborhoodContributionMeItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await api.neighborhoods.listMyContributions();
      setItems(response.items);
    } catch (err) {
      setItems([]);
      if (!isAuthError(err) || err.status !== 401) {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  }, [api.neighborhoods]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    loading,
    error,
    items,
    reload: load,
  };
}
