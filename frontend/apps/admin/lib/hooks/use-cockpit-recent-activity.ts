"use client";

import { useQuery } from "@tanstack/react-query";

import { mapAdminError } from "@/lib/admin-query";
import { useAuth } from "@/lib/auth/auth-provider";

const COCKPIT_ACTIVITY_PREVIEW_LIMIT = 5;

export function useCockpitRecentActivity() {
  const { adminActivityApi } = useAuth();

  const query = useQuery({
    queryKey: ["admin", "activity", "feed", { limit: COCKPIT_ACTIVITY_PREVIEW_LIMIT }],
    queryFn: () =>
      adminActivityApi.getActivityFeed({ limit: COCKPIT_ACTIVITY_PREVIEW_LIMIT }),
  });

  return {
    items: query.data?.items ?? [],
    isLoading: query.isPending,
    error: mapAdminError(query.error, "Impossible de charger l'activité récente."),
  };
}
