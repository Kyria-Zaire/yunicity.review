"use client";

import type { MapBbox, MapEventItem } from "@yunicity/types";
import { hasBboxChangedSignificantly } from "@yunicity/utils";
import { useCallback, useEffect, useRef, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

const MAP_EVENTS_LIMIT = 100;

export function useMapEvents(city: string, bbox: MapBbox | null) {
  const api = useYunicityApi();
  const [events, setEvents] = useState<MapEventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const lastFetchedRef = useRef<MapBbox | null>(null);
  const requestIdRef = useRef(0);
  const [retryTick, setRetryTick] = useState(0);

  const fetchEvents = useCallback(
    async (targetBbox: MapBbox, force = false) => {
      const trimmedCity = city.trim();
      if (!trimmedCity) return;
      if (!force && !hasBboxChangedSignificantly(lastFetchedRef.current, targetBbox)) {
        return;
      }

      const requestId = ++requestIdRef.current;
      setLoading(true);
      setError(null);

      try {
        const response = await api.listMapEvents({
          ...targetBbox,
          city: trimmedCity,
          limit: MAP_EVENTS_LIMIT,
        });
        if (requestId !== requestIdRef.current) return;
        lastFetchedRef.current = targetBbox;
        setEvents(response.events);
        setTruncated(response.truncated);
        setHasLoaded(true);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setError("fetch_failed");
        setEvents([]);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [api, city],
  );

  useEffect(() => {
    if (!bbox) return;
    void fetchEvents(bbox);
  }, [bbox, city, fetchEvents, retryTick]);

  const retry = useCallback(() => {
    lastFetchedRef.current = null;
    setRetryTick((value) => value + 1);
  }, []);

  return {
    events,
    loading,
    error,
    truncated,
    hasLoaded,
    retry,
  };
}
