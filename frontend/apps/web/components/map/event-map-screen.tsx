"use client";

import {
  DEFAULT_MAP_CITY,
  MAP_EMPTY,
  MAP_EMPTY_HINT,
  MAP_ERROR,
  MAP_LOADING,
  MAP_RETRY,
  MAP_TOKEN_MISSING_WEB,
  MAP_TRUNCATED_HINT,
  resolveCityMapCenter,
} from "@yunicity/utils";
import { useEffect, useMemo, useState } from "react";

import { EventMap } from "@/components/map/event-map";
import { MapNearbyEvents } from "@/components/map/map-nearby-events";
import { MapOfferTeaser } from "@/components/map/map-offer-teaser";
import { MapPageSearchHeader } from "@/components/map/map-page-search-header";
import { MapRightRail } from "@/components/map/map-right-rail";
import { WebAppShell } from "@/components/layout";
import { useMapBbox } from "@/hooks/use-map-bbox";
import { useMapEvents } from "@/hooks/use-map-events";
import { useMapPageContext } from "@/hooks/use-map-page-context";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export function EventMapScreen() {
  const api = useYunicityApi();
  const { user } = useAuth();
  const mapContext = useMapPageContext();
  const [profileCity, setProfileCity] = useState(user?.city ?? DEFAULT_MAP_CITY);
  const [focusedEventId, setFocusedEventId] = useState<string | null>(null);
  const { bbox, updateFromBounds } = useMapBbox();
  const { events, loading, error, truncated, hasLoaded, retry } = useMapEvents(
    profileCity,
    bbox,
  );

  useEffect(() => {
    void api.getProfileMe().then((profile) => {
      if (profile.city) setProfileCity(profile.city);
    });
  }, [api]);

  useEffect(() => {
    if (mapContext.city) {
      setProfileCity(mapContext.city);
    }
  }, [mapContext.city]);

  const city = profileCity || mapContext.city;
  const showInitialLoading = !hasLoaded && loading;
  const showEmpty = hasLoaded && !loading && !error && events.length === 0;

  const transitPoint = useMemo(() => {
    if (focusedEventId) {
      const focused = events.find((event) => event.id === focusedEventId);
      if (focused) {
        return { lat: focused.latitude, lon: focused.longitude, city };
      }
    }
    if (bbox) {
      return {
        lat: (bbox.lat_min + bbox.lat_max) / 2,
        lon: (bbox.lon_min + bbox.lon_max) / 2,
        city,
      };
    }
    const center = resolveCityMapCenter(city);
    return { lat: center.latitude, lon: center.longitude, city };
  }, [focusedEventId, events, bbox, city]);

  return (
    <WebAppShell
      context={<MapRightRail context={mapContext} transitPoint={transitPoint} />}
      contentWidth="full"
    >
      <MapPageSearchHeader city={city} />

      <div className="space-y-5 pb-8">
        {!MAPBOX_TOKEN ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {MAP_TOKEN_MISSING_WEB}
          </p>
        ) : (
          <EventMap
            city={city}
            accessToken={MAPBOX_TOKEN}
            events={events}
            onBoundsChange={updateFromBounds}
            focusedEventId={focusedEventId}
          />
        )}

        {showInitialLoading ? (
          <p className="text-center text-sm text-neutral-500" role="status">
            {MAP_LOADING}
          </p>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-800">
            <p>{MAP_ERROR}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-2 font-semibold text-yunicity-primary hover:underline"
            >
              {MAP_RETRY}
            </button>
          </div>
        ) : null}

        {showEmpty && MAPBOX_TOKEN ? (
          <div className="rounded-xl border border-neutral-200/90 bg-white px-4 py-6 text-center shadow-sm">
            <p className="font-medium text-neutral-800">{MAP_EMPTY}</p>
            <p className="mt-1 text-sm text-neutral-500">{MAP_EMPTY_HINT}</p>
          </div>
        ) : null}

        {truncated && events.length > 0 ? (
          <p className="text-center text-xs text-neutral-500">{MAP_TRUNCATED_HINT}</p>
        ) : null}

        {loading && hasLoaded ? (
          <p className="text-center text-xs text-neutral-400" aria-live="polite">
            {MAP_LOADING}
          </p>
        ) : null}

        <MapNearbyEvents events={events} onSelectEvent={(id) => setFocusedEventId(id)} />

        <div className="lg:hidden">
          <MapOfferTeaser offer={mapContext.highlightOffer} />
        </div>
      </div>
    </WebAppShell>
  );
}
