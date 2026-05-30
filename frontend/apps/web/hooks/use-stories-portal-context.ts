"use client";

import { useCallback, useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";
import type {
  ProfileMe,
  StoryInsightsResponse,
  StoryRingItem,
  Tribe,
} from "@yunicity/types";

const DEFAULT_CITY = "Reims";

export function useStoriesPortalContext() {
  const api = useYunicityApi();
  const { user } = useAuth();
  const [city, setCity] = useState(user?.city ?? DEFAULT_CITY);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileMe | null>(null);
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [rings, setRings] = useState<StoryRingItem[]>([]);
  const [insights, setInsights] = useState<StoryInsightsResponse | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await api.getProfileMe();
      setProfile(me);
      const resolvedCity = me.city?.trim() || user?.city?.trim() || DEFAULT_CITY;
      setCity(resolvedCity);

      const [tribesRes, ringsRes, insightsRes] = await Promise.allSettled([
        api.tribes.listTribes({ city: resolvedCity, page_size: 12 }),
        api.listStoryRings(),
        api.getStoryInsights(),
      ]);

      if (tribesRes.status === "fulfilled") {
        setTribes(tribesRes.value.items.filter((t) => !t.is_archived));
      } else {
        setTribes([]);
      }

      if (ringsRes.status === "fulfilled") {
        setRings(ringsRes.value.items);
      } else {
        setRings([]);
      }

      if (insightsRes.status === "fulfilled") {
        setInsights(insightsRes.value);
      } else {
        setInsights({ live_stories: [], top_contributors: [], featured: null });
      }
    } catch {
      setTribes([]);
      setRings([]);
      setInsights({ live_stories: [], top_contributors: [], featured: null });
    } finally {
      setLoading(false);
    }
  }, [api, user?.city]);

  useEffect(() => {
    void load();
  }, [load]);

  return { city, loading, profile, tribes, rings, insights, reload: load };
}
