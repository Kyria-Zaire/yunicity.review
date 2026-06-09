"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import type { AdminPartnersWorkspaceSummary } from "@yunicity/types";
import { isAuthError } from "@yunicity/utils";
import { useCallback, useEffect, useState } from "react";

const DEFAULT_CITY = "Reims";

export function useAdminPartnersWorkspaceSummary(city: string = DEFAULT_CITY) {
  const { adminPartnersApi } = useAuth();
  const [data, setData] = useState<AdminPartnersWorkspaceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const summary = await adminPartnersApi.getWorkspaceSummary({ city });
      setData(summary);
    } catch (err) {
      setError(
        isAuthError(err)
          ? err.message
          : "Impossible de charger le signal réseau. Réessayez dans un instant.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [adminPartnersApi, city]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, isLoading, error, reload: load };
}
