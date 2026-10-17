"use client";

import type { CulturalPlaceDetail, CulturalPlaceListItem, LocalEvent } from "@yunicity/types";
import type { PlaceDetailDesktopEventCard, PlaceDetailDesktopNearbyCard } from "@yunicity/utils";
import {
  buildPlaceDetailDesktopEventCards,
  buildPlaceDetailDesktopNearbyCards,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useYunicityApi } from "@/hooks/use-yunicity-api";

export type PlaceDetailContextState = {
  loading: boolean;
  error: boolean;
  events: PlaceDetailDesktopEventCard[];
  nearby: PlaceDetailDesktopNearbyCard[];
  reload: () => void;
};

export function usePlaceDetailContext(place: CulturalPlaceDetail): PlaceDetailContextState {
  const api = useYunicityApi();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cityEvents, setCityEvents] = useState<LocalEvent[]>([]);
  const [culturalPlaces, setCulturalPlaces] = useState<CulturalPlaceListItem[]>([]);

  const load = useCallback(async () => {
    const city = place.city.trim() || "Reims";
    setLoading(true);
    setError(false);

    try {
      const [eventsRes, placesRes] = await Promise.all([
        api.events.listEvents({ city }),
        api.listCulturalPlaces({ city, limit: 48 }),
      ]);
      setCityEvents(eventsRes.items);
      setCulturalPlaces(placesRes.items);
    } catch {
      setError(true);
      setCityEvents([]);
      setCulturalPlaces([]);
    } finally {
      setLoading(false);
    }
  }, [api, place.city]);

  useEffect(() => {
    void load();
  }, [load]);

  const events = useMemo(
    () =>
      buildPlaceDetailDesktopEventCards({
        place,
        events: cityEvents,
        culturalPlaces,
      }),
    [cityEvents, culturalPlaces, place],
  );

  const nearby = useMemo(
    () =>
      buildPlaceDetailDesktopNearbyCards({
        place,
        places: culturalPlaces,
      }),
    [culturalPlaces, place],
  );

  return { loading, error, events, nearby, reload: load };
}
