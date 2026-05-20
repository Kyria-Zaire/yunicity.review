"use client";

import type { Tribe } from "@yunicity/types";
import { TRIBES_ERROR, isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

export function useTribesList(city: string) {
  const api = useYunicityApi();
  const [items, setItems] = useState<Tribe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.tribes.listTribes({ city, page_size: 20 });
      setItems(data.items);
    } catch (err) {
      if (!isAuthError(err)) {
        setError(TRIBES_ERROR);
      }
    } finally {
      setLoading(false);
    }
  }, [api.tribes, city]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, loading, error, reload: load };
}
