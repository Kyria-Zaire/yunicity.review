"use client";

import type { AdminAnalyticsPeriod } from "@yunicity/types";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { mapAdminError } from "@/lib/admin-query";
import { useAuth } from "@/lib/auth/auth-provider";

const DEFAULT_CITY = "Reims";

export function useAdminAnalytics(initialPeriod: AdminAnalyticsPeriod = "30d") {
  const { adminAnalyticsApi } = useAuth();
  const [period, setPeriod] = useState<AdminAnalyticsPeriod>(initialPeriod);
  const city = DEFAULT_CITY;

  const query = useQuery({
    queryKey: ["admin", "analytics", "summary", { city, period, compare: true }],
    queryFn: () => adminAnalyticsApi.getSummary({ city, period, compare: true }),
  });

  const { refetch } = query;
  const reload = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    summary: query.data ?? null,
    isLoading: query.isPending,
    error: mapAdminError(
      query.error,
      "Impossible de charger les analytics territoriales.",
    ),
    period,
    city,
    setPeriod,
    reload,
  };
}
