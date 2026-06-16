"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import { mapAdminError } from "@/lib/admin-query";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

const DEFAULT_CITY = "Reims";

export function useAdminCockpitSummary(city: string = DEFAULT_CITY) {
  const { adminCockpitApi } = useAuth();

  const query = useQuery({
    queryKey: ["admin", "cockpit", "summary", city],
    queryFn: () => adminCockpitApi.getSummary({ city }),
  });

  const { refetch } = query;
  const reload = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    data: query.data ?? null,
    isLoading: query.isPending,
    error: mapAdminError(
      query.error,
      "Impossible de charger le cockpit. Réessaie dans un instant.",
    ),
    reload,
  };
}
