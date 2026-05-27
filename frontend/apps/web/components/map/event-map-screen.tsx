"use client";

import { mergeMapRailCulturalPlaces, mapCulturalPlaceItemToListItem } from "@/lib/map-cultural-places";
import type { CulturalPlaceListItem, MapRouteGeometry, MapRouteSummary } from "@yunicity/types";
import type { MapRouteProfile } from "@yunicity/utils";
import {
  DEFAULT_MAP_CITY,
  MAP_EMPTY,
  MAP_EMPTY_HINT,
  MAP_ERROR,
  MAP_LOADING,
  MAP_RETRY,
  MAP_TOKEN_MISSING_WEB,
  MAP_TRUNCATED_HINT,
  fetchMapboxRoute,
  geocodeMapboxAddress,
  resolveCityMapCenter,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { CulturalRoutePanelPhase } from "@/components/map/map-cultural-route-panel";
import { EventMap } from "@/components/map/event-map";
import { MapNearbyEvents } from "@/components/map/map-nearby-events";
import { MapOfferTeaser } from "@/components/map/map-offer-teaser";
import { MapPageSearchHeader } from "@/components/map/map-page-search-header";
import { MapRightRail } from "@/components/map/map-right-rail";
import { WebAppShell } from "@/components/layout";
import { useMapBbox } from "@/hooks/use-map-bbox";
import { useMapCulturalPlaces } from "@/hooks/use-map-cultural-places";
import { useMapEvents } from "@/hooks/use-map-events";
import { useMapPageContext } from "@/hooks/use-map-page-context";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type LatLon = { latitude: number; longitude: number };

function mapItemToListItem(place: Parameters<typeof mapCulturalPlaceItemToListItem>[0]): CulturalPlaceListItem {
  return mapCulturalPlaceItemToListItem(place);
}

function resolveMapCenterOrigin(
  bbox: ReturnType<typeof useMapBbox>["bbox"],
  city: string,
): LatLon {
  if (bbox) {
    return {
      latitude: (bbox.lat_min + bbox.lat_max) / 2,
      longitude: (bbox.lon_min + bbox.lon_max) / 2,
    };
  }
  const center = resolveCityMapCenter(city);
  return { latitude: center.latitude, longitude: center.longitude };
}

export function EventMapScreen() {
  const api = useYunicityApi();
  const { user } = useAuth();
  const mapContext = useMapPageContext();
  const [profileCity, setProfileCity] = useState(user?.city ?? DEFAULT_MAP_CITY);
  const [focusedEventId, setFocusedEventId] = useState<string | null>(null);
  const [selectedCulturalSlug, setSelectedCulturalSlug] = useState<string | null>(null);
  const [expandedCulturalSlug, setExpandedCulturalSlug] = useState<string | null>(null);

  const [routeTarget, setRouteTarget] = useState<CulturalPlaceListItem | null>(null);
  const [routePanelPhase, setRoutePanelPhase] = useState<CulturalRoutePanelPhase | null>(null);
  const [routeOrigin, setRouteOrigin] = useState<LatLon | null>(null);
  const [routeProfile, setRouteProfile] = useState<MapRouteProfile>("walking");
  const [routeGeometry, setRouteGeometry] = useState<MapRouteGeometry | null>(null);
  const [routeSummary, setRouteSummary] = useState<MapRouteSummary | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(false);
  const [geolocationDenied, setGeolocationDenied] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [addressError, setAddressError] = useState(false);

  const routeRequestIdRef = useRef(0);

  const { bbox, updateFromBounds } = useMapBbox();
  const { events, loading, error, truncated, hasLoaded, retry } = useMapEvents(
    profileCity,
    bbox,
  );
  const { places: mapCulturalPlaces } = useMapCulturalPlaces(profileCity, bbox);

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

  const culturalBySlug = useMemo(() => {
    const map = new Map<string, CulturalPlaceListItem>();
    for (const place of mapContext.culturalPlaces) {
      map.set(place.slug, place);
    }
    for (const place of mapCulturalPlaces) {
      if (!map.has(place.slug)) {
        map.set(place.slug, mapItemToListItem(place));
      }
    }
    return map;
  }, [mapContext.culturalPlaces, mapCulturalPlaces]);

  const clearRoute = useCallback(() => {
    setRouteTarget(null);
    setRoutePanelPhase(null);
    setRouteOrigin(null);
    setRouteGeometry(null);
    setRouteSummary(null);
    setRouteLoading(false);
    setRouteError(false);
    setGeolocationDenied(false);
    setAddressInput("");
    setAddressError(false);
    setRouteProfile("walking");
  }, []);

  const computeRoute = useCallback(
    async (
      place: CulturalPlaceListItem,
      origin: LatLon,
      profile: MapRouteProfile,
    ) => {
      if (!MAPBOX_TOKEN) {
        setRouteError(true);
        setRoutePanelPhase("active");
        return;
      }

      const requestId = ++routeRequestIdRef.current;
      setRouteTarget(place);
      setSelectedCulturalSlug(place.slug);
      setRouteOrigin(origin);
      setRoutePanelPhase("active");
      setRouteLoading(true);
      setRouteError(false);
      setRouteGeometry(null);
      setRouteSummary(null);

      const result = await fetchMapboxRoute({
        accessToken: MAPBOX_TOKEN,
        profile,
        origin,
        destination: { latitude: place.latitude, longitude: place.longitude },
      });

      if (requestId !== routeRequestIdRef.current) {
        return;
      }

      setRouteLoading(false);
      if (!result.ok) {
        setRouteError(true);
        return;
      }
      setRouteGeometry(result.geometry);
      setRouteSummary(result.summary);
    },
    [],
  );

  const handleStartRoute = useCallback((place: CulturalPlaceListItem) => {
    routeRequestIdRef.current += 1;
    setRouteTarget(place);
    setSelectedCulturalSlug(place.slug);
    setRoutePanelPhase("pick-origin");
    setRouteGeometry(null);
    setRouteSummary(null);
    setRouteLoading(false);
    setRouteError(false);
    setGeolocationDenied(false);
    setAddressInput("");
    setAddressError(false);
    setRouteOrigin(null);
    setRouteProfile("walking");
  }, []);

  const handlePickMapCenter = useCallback(() => {
    if (!routeTarget) return;
    setGeolocationDenied(false);
    void computeRoute(routeTarget, resolveMapCenterOrigin(bbox, city), routeProfile);
  }, [routeTarget, bbox, city, routeProfile, computeRoute]);

  const handlePickMyPosition = useCallback(() => {
    if (!routeTarget) return;
    setGeolocationDenied(false);

    if (!navigator.geolocation) {
      setGeolocationDenied(true);
      return;
    }

    setRouteLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void computeRoute(
          routeTarget,
          {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          routeProfile,
        );
      },
      () => {
        setRouteLoading(false);
        setGeolocationDenied(true);
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 },
    );
  }, [routeTarget, routeProfile, computeRoute]);

  const handlePickAddressMode = useCallback(() => {
    setAddressError(false);
    setRoutePanelPhase("enter-address");
  }, []);

  const handleSubmitAddress = useCallback(() => {
    if (!routeTarget || !MAPBOX_TOKEN) {
      setAddressError(true);
      return;
    }

    const proximity = resolveMapCenterOrigin(bbox, city);
    setRouteLoading(true);
    setAddressError(false);

    void geocodeMapboxAddress({
      accessToken: MAPBOX_TOKEN,
      query: addressInput,
      proximity,
    }).then((result) => {
      if (!result.ok) {
        setRouteLoading(false);
        setAddressError(true);
        return;
      }
      void computeRoute(
        routeTarget,
        { latitude: result.latitude, longitude: result.longitude },
        routeProfile,
      );
    });
  }, [routeTarget, addressInput, bbox, city, routeProfile, computeRoute]);

  const handleChangeProfile = useCallback(
    (profile: MapRouteProfile) => {
      setRouteProfile(profile);
      if (!routeTarget || !routeOrigin) return;
      void computeRoute(routeTarget, routeOrigin, profile);
    },
    [routeTarget, routeOrigin, computeRoute],
  );

  const handleSelectCulturalPlace = useCallback(
    (place: CulturalPlaceListItem) => {
      setSelectedCulturalSlug(place.slug);
      clearRoute();
    },
    [clearRoute],
  );

  const handleToggleCulturalDetails = useCallback((place: CulturalPlaceListItem) => {
    setExpandedCulturalSlug((current) => (current === place.slug ? null : place.slug));
    setSelectedCulturalSlug(place.slug);
  }, []);

  const handleMapSelectCulturalSlug = useCallback(
    (slug: string) => {
      const place = culturalBySlug.get(slug);
      if (place) {
        setSelectedCulturalSlug(slug);
      }
    },
    [culturalBySlug],
  );

  const railCulturalPlaces = useMemo(
    () => mergeMapRailCulturalPlaces(mapContext.culturalPlaces, mapCulturalPlaces, 4),
    [mapContext.culturalPlaces, mapCulturalPlaces],
  );

  const transitPoint = useMemo(() => {
    if (focusedEventId) {
      const focused = events.find((event) => event.id === focusedEventId);
      if (focused) {
        return { lat: focused.latitude, lon: focused.longitude, city };
      }
    }
    if (routeTarget) {
      return { lat: routeTarget.latitude, lon: routeTarget.longitude, city };
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
  }, [focusedEventId, events, bbox, city, routeTarget]);

  return (
    <WebAppShell
      context={
        <MapRightRail
          context={mapContext}
          culturalPlaces={railCulturalPlaces}
          transitPoint={transitPoint}
          selectedCulturalSlug={selectedCulturalSlug}
          expandedCulturalSlug={expandedCulturalSlug}
          onSelectCulturalPlace={handleSelectCulturalPlace}
          onStartRoute={handleStartRoute}
          onToggleCulturalDetails={handleToggleCulturalDetails}
        />
      }
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
            culturalPlaces={mapCulturalPlaces}
            onBoundsChange={updateFromBounds}
            focusedEventId={focusedEventId}
            selectedCulturalSlug={selectedCulturalSlug}
            routeGeometry={routeGeometry}
            routeTargetName={routeTarget?.name ?? null}
            routeLoading={routeLoading}
            routeError={routeError}
            onSelectCulturalPlace={handleMapSelectCulturalSlug}
            onClearRoute={clearRoute}
            routeTarget={routeTarget}
            routePanelPhase={routePanelPhase}
            routeSummary={routeSummary}
            routeProfile={routeProfile}
            geolocationDenied={geolocationDenied}
            addressInput={addressInput}
            addressError={addressError}
            onPickMyPosition={handlePickMyPosition}
            onPickAddressMode={handlePickAddressMode}
            onPickMapCenter={handlePickMapCenter}
            onAddressInputChange={setAddressInput}
            onSubmitAddress={handleSubmitAddress}
            onBackFromAddress={() => {
              setAddressError(false);
              setRoutePanelPhase("pick-origin");
            }}
            onChangeProfile={handleChangeProfile}
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
