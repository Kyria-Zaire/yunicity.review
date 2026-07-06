"use client";

import { useEffect, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

export function useMapPortalStats() {
  const api = useYunicityApi();
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [visitedCount, setVisitedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const [savedRes, profileRes] = await Promise.allSettled([
          api.events.listSavedEvents(),
          api.getProfileMe(),
        ]);
        if (cancelled) return;

        if (savedRes.status === "fulfilled") {
          setFavoritesCount(savedRes.value.items.length);
        }

        const profile = profileRes.status === "fulfilled" ? profileRes.value : null;
        const passport = profile ? await api.getPassportMeIfActive(profile) : null;
        if (!cancelled && passport) {
          setVisitedCount(passport.stats.stamps_count);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  return { favoritesCount, visitedCount, loading };
}
