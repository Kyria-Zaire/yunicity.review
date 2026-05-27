"use client";

import type { WeatherCurrent } from "@yunicity/types";
import {
  permissionStateFromGeolocationError,
  resolveCityForUi,
  type GeoPermissionState,
} from "@yunicity/utils";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

type GeoPosition = { latitude: number; longitude: number };

type GeoContextValue = {
  currentPosition: GeoPosition | null;
  currentCity: string;
  permissionState: GeoPermissionState;
  isRequesting: boolean;
  requestLocation: () => void;
};

const STORAGE_KEY = "yunicity_geo_v1";

const GeoContext = createContext<GeoContextValue | null>(null);

function safeParseJson(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

export function GeoProvider({
  defaultCity,
  children,
}: {
  defaultCity: string;
  children: ReactNode;
}) {
  const api = useYunicityApi();
  const [currentPosition, setCurrentPosition] = useState<GeoPosition | null>(null);
  const [permissionState, setPermissionState] = useState<GeoPermissionState>("unknown");
  const [isRequesting, setIsRequesting] = useState(false);
  const [currentCityFromGeo, setCurrentCityFromGeo] = useState<string | null>(null);

  const [fallbackCity, setFallbackCity] = useState(defaultCity.trim() || "Reims");

  useEffect(() => {
    setFallbackCity(defaultCity.trim() || "Reims");
  }, [defaultCity]);

  const currentCity = useMemo(
    () =>
      resolveCityForUi({
        permissionState,
        currentCityFromGeo,
        fallbackCity,
      }),
    [permissionState, currentCityFromGeo, fallbackCity],
  );

  useEffect(() => {
    const raw = safeParseJson(
      typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null,
    );
    if (!raw || typeof raw !== "object") return;
    const maybe = raw as Partial<{
      permissionState: GeoPermissionState;
      city: string;
    }>;
    if (maybe.permissionState && (maybe.permissionState === "granted" || maybe.permissionState === "denied")) {
      setPermissionState(maybe.permissionState);
    }
    if (maybe.city && typeof maybe.city === "string") {
      setCurrentCityFromGeo(maybe.city);
    }
  }, []);

  useEffect(() => {
    // If we have no valid geo permission, keep UI aligned with the active city selection.
    if (permissionState !== "granted") {
      setCurrentCityFromGeo(null);
    }
  }, [permissionState]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setPermissionState("error");
      return;
    }
    if (isRequesting) return;

    setIsRequesting(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextPos: GeoPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCurrentPosition(nextPos);
        setPermissionState("granted");

        // Determine the real city from coordinates (server call, cached, no tracking).
        void api
          .getCurrentWeather({ lat: nextPos.latitude, lon: nextPos.longitude })
          .then((w: WeatherCurrent) => {
            if (w.city) {
              setCurrentCityFromGeo(w.city);
              window.localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ permissionState: "granted", city: w.city }),
              );
            }
          })
          .catch(() => {
            window.localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({ permissionState: "granted", city: fallbackCity }),
            );
          })
          .finally(() => {
            setIsRequesting(false);
          });
      },
      (err) => {
        setIsRequesting(false);
        const nextState = permissionStateFromGeolocationError(err);
        setPermissionState(nextState);
        if (nextState !== "granted") {
          window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ permissionState: nextState, city: fallbackCity }),
          );
        }
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 },
    );
  }, [api, fallbackCity, isRequesting]);

  const value = useMemo<GeoContextValue>(
    () => ({
      currentPosition,
      currentCity,
      permissionState,
      isRequesting,
      requestLocation,
    }),
    [currentPosition, currentCity, permissionState, isRequesting, requestLocation],
  );

  return <GeoContext.Provider value={value}>{children}</GeoContext.Provider>;
}

export function useGeo() {
  const ctx = useContext(GeoContext);
  if (!ctx) {
    throw new Error("useGeo must be used within GeoProvider");
  }
  return ctx;
}

