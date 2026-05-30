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
    void Promise.allSettled([api.events.listSavedEvents(), api.getPassportMe()])
      .then(([savedRes, passportRes]) => {
        if (cancelled) return;
        if (savedRes.status === "fulfilled") {
          setFavoritesCount(savedRes.value.items.length);
        }
        if (passportRes.status === "fulfilled") {
          setVisitedCount(passportRes.value.stats.stamps_count);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  return { favoritesCount, visitedCount, loading };
}
