"use client";

import type { AdminAnalyticsPeriod, AdminAnalyticsSummary } from "@yunicity/types";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/auth-provider";

const DEFAULT_CITY = "Reims";

export function useAdminAnalytics(initialPeriod: AdminAnalyticsPeriod = "30d") {
  const { adminAnalyticsApi } = useAuth();
  const [period, setPeriod] = useState<AdminAnalyticsPeriod>(initialPeriod);
  const [city] = useState(DEFAULT_CITY);
  const [summary, setSummary] = useState<AdminAnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminAnalyticsApi.getSummary({
        city,
        period,
        compare: true,
      });
      setSummary(data);
    } catch (err) {
      setSummary(null);
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les analytics territoriales.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [adminAnalyticsApi, city, period]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    summary,
    isLoading,
    error,
    period,
    city,
    setPeriod,
    reload,
  };
}
