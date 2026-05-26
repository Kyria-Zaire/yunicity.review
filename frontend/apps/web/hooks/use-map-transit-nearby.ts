"use client";

import type { TransitNearbyResponse } from "@yunicity/types";
import { useEffect, useRef, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

export type MapTransitQueryPoint = {
  lat: number;
  lon: number;
  city: string;
};

const TRANSIT_RADIUS_METERS = 600;
const TRANSIT_STOPS_LIMIT = 5;

function coordsKey(point: MapTransitQueryPoint): string {
  return `${point.city}:${point.lat.toFixed(3)}:${point.lon.toFixed(3)}`;
}

export function useMapTransitNearby(point: MapTransitQueryPoint | null) {
  const api = useYunicityApi();
  const [data, setData] = useState<TransitNearbyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const lastKeyRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!point) return;
    const key = coordsKey(point);
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(false);

    void api
      .getTransitNearby({
        lat: point.lat,
        lon: point.lon,
        city: point.city,
        radius_meters: TRANSIT_RADIUS_METERS,
        limit: TRANSIT_STOPS_LIMIT,
      })
      .then((response) => {
        if (requestId !== requestIdRef.current) return;
        lastKeyRef.current = key;
        setData(response);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setError(true);
        setData(null);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      });
  }, [api, point]);

  return { data, loading, error };
}
