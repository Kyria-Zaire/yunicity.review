"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type { AdminCockpitSummaryResponse } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

const DEFAULT_CITY = "Reims";

export function useAdminCockpitSummary(city: string = DEFAULT_CITY) {
  const { adminCockpitApi } = useAuth();
  const [data, setData] = useState<AdminCockpitSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const summary = await adminCockpitApi.getSummary({ city });
      setData(summary);
    } catch (err) {
      setData(null);
      setError(
        isAuthError(err)
          ? err.message
          : "Impossible de charger le cockpit. Réessaie dans un instant.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [adminCockpitApi, city]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, isLoading, error, reload: load };
}
