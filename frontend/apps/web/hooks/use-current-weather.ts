import type { WeatherCurrent } from "@yunicity/types";

import { useEffect, useRef, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

export function useCurrentWeather(params: {
  city: string;
  lat?: number | null;
  lon?: number | null;
}) {
  const api = useYunicityApi();
  const [weather, setWeather] = useState<WeatherCurrent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const city = params.city.trim();
    if (!city) return;

    const useLatLon = params.lat !== undefined && params.lon !== undefined && params.lat !== null && params.lon !== null;

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(false);
    setWeather(null);

    void api
      .getCurrentWeather({
        city: useLatLon ? undefined : city,
        lat: useLatLon ? (params.lat as number) : undefined,
        lon: useLatLon ? (params.lon as number) : undefined,
      })
      .then((res) => {
        if (requestId !== requestIdRef.current) return;
        setWeather(res);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setError(true);
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
      });
  }, [api, params.city, params.lat, params.lon]);

  return { weather, loading, error };
}

