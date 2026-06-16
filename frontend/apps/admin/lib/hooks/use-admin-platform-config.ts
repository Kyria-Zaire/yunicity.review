"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { mapAdminError } from "@/lib/admin-query";
import { useAuth } from "@/lib/auth/auth-provider";

export function useAdminPlatformConfig() {
  const { adminPlatformConfigApi } = useAuth();

  const query = useQuery({
    queryKey: ["admin", "platform-config"],
    queryFn: () => adminPlatformConfigApi.getSnapshot(),
  });

  const { refetch } = query;
  const reload = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    snapshot: query.data ?? null,
    isLoading: query.isPending,
    error: mapAdminError(
      query.error,
      "Impossible de charger la configuration plateforme.",
    ),
    reload,
  };
}
