"use client";

import {
  DEFAULT_MAP_CITY,
  MAP_EMPTY,
  MAP_EMPTY_HINT,
  MAP_ERROR,
  MAP_LOADING,
  MAP_PAGE_SUBTITLE,
  MAP_PAGE_TITLE,
  MAP_RETRY,
  MAP_TOKEN_MISSING,
  MAP_TRUNCATED_HINT,
} from "@yunicity/utils";
import { useEffect, useState } from "react";

import { EventMap } from "@/components/map/event-map";
import { WebAppShell } from "@/components/layout";
import { useMapBbox } from "@/hooks/use-map-bbox";
import { useMapEvents } from "@/hooks/use-map-events";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export function EventMapScreen() {
  const api = useYunicityApi();
  const { user } = useAuth();
  const [profileCity, setProfileCity] = useState(user?.city ?? DEFAULT_MAP_CITY);
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

  const showInitialLoading = !hasLoaded && loading;
  const showEmpty = hasLoaded && !loading && !error && events.length === 0;

  return (
    <WebAppShell
      header={{
        title: MAP_PAGE_TITLE,
        subtitle: MAP_PAGE_SUBTITLE,
      }}
      contentWidth="full"
    >
      <div className="space-y-4">
        {!MAPBOX_TOKEN ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {MAP_TOKEN_MISSING}
          </p>
        ) : (
          <EventMap
            city={profileCity}
            accessToken={MAPBOX_TOKEN}
            events={events}
            onBoundsChange={updateFromBounds}
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

        {showEmpty ? (
          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-6 text-center">
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
      </div>
    </WebAppShell>
  );
}
