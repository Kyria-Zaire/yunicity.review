"use client";

import type { DiscussionInsightsResponse, Tribe } from "@yunicity/types";
import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

const DEFAULT_CITY = "Reims";

export function useDiscussionsPortalContext() {
  const api = useYunicityApi();
  const { user } = useAuth();
  const [city, setCity] = useState(user?.city ?? DEFAULT_CITY);
  const [loading, setLoading] = useState(true);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [insights, setInsights] = useState<DiscussionInsightsResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await api.getProfileMe();
      const resolvedCity = profile.city?.trim() || user?.city?.trim() || DEFAULT_CITY;
      setCity(resolvedCity);

      const [tribesRes, insightsRes] = await Promise.allSettled([
        api.tribes.listTribes({ city: resolvedCity, page_size: 12 }),
        api.getDiscussionInsights(),
      ]);

      if (tribesRes.status === "fulfilled") {
        setTribes(tribesRes.value.items.filter((t) => !t.is_archived));
      } else {
        setTribes([]);
      }

      if (insightsRes.status === "fulfilled") {
        setInsights(insightsRes.value);
      } else {
        setInsights({ trending_topics: [], active_discussions: [] });
      }
    } catch {
      setTribes([]);
      setInsights({ trending_topics: [], active_discussions: [] });
    } finally {
      setLoading(false);
    }
  }, [api, user?.city]);

  useEffect(() => {
    void load();
  }, [load]);

  return { city, loading, tribes, insights, reload: load };
}
