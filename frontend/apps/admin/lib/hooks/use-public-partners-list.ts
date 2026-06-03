"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type { PartnerPublic } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

const DEFAULT_CITY = "Reims";
const PUBLIC_LIST_LIMIT = 100;

export function usePublicPartnersList(city: string = DEFAULT_CITY) {
  const { partnersApi } = useAuth();
  const [items, setItems] = useState<PartnerPublic[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await partnersApi.listPartners({
        city,
        limit: PUBLIC_LIST_LIMIT,
        offset: 0,
      });
      setItems(response.items);
      setTotal(response.total);
    } catch (err) {
      setItems([]);
      setTotal(0);
      setError(
        isAuthError(err)
          ? err.message
          : "Impossible de charger les partenaires publics pour le moment.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [partnersApi, city]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, total, isLoading, error, reload: load, city };
}
