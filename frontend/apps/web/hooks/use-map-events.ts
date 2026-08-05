"use client";

import type { MapEventItem } from "@yunicity/types";
import { resolveCityLoadBbox } from "@yunicity/utils";
import { useCallback, useEffect, useRef, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

const MAP_EVENTS_LIMIT = 100;

// T5 — chargement UNIQUE : tous les events de la ville en une requête au montage (bbox ville borné
// sous le garde-fou serveur, le backend filtre par city), puis filtrage côté client. Plus de
// re-fetch au pan.
export function useMapEvents(city: string) {
  const api = useYunicityApi();
  const [events, setEvents] = useState<MapEventItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const requestIdRef = useRef(0);
  const [retryTick, setRetryTick] = useState(0);

  const fetchEvents = useCallback(async () => {
    const trimmedCity = city.trim();
    if (!trimmedCity) return;

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const response = await api.listMapEvents({
        ...resolveCityLoadBbox(trimmedCity),
        city: trimmedCity,
        limit: MAP_EVENTS_LIMIT,
      });
      if (requestId !== requestIdRef.current) return;
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
  }, [api, city]);

  useEffect(() => {
    void fetchEvents();
  }, [fetchEvents, retryTick]);

  const retry = useCallback(() => {
    setRetryTick((value) => value + 1);
  }, []);

  return { events, loading, error, truncated, hasLoaded, retry };
}
