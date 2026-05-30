"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import type {
  CulturalPlaceListItem,
  MapCulturalPlaceItem,
  MapEventItem,
  MapRouteGeometry,
  MapRouteSummary,
} from "@yunicity/types";
import type {
  MapNeighborhoodMarker,
  MapTerritorySelection,
  MapTribeMarker,
} from "@yunicity/utils";
import type { MapRouteProfile } from "@yunicity/utils";
import { MAP_RECENTER, resolveCityMapCenter } from "@yunicity/utils";
import type { MapPartnerMarker } from "@/hooks/use-map-partners";
import { Store, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Map, {
  Layer,
  Marker,
  NavigationControl,
  Source,
  type MapEvent,
  type MapRef,
} from "react-map-gl/mapbox";

import {
  MapCulturalRoutePanel,
  type CulturalRoutePanelPhase,
} from "@/components/map/map-cultural-route-panel";
import type { MapBoundsLike } from "@/hooks/use-map-bbox";

const MAP_STYLE = "mapbox://styles/mapbox/light-v11";
const EVENT_MARKER_COLOR = "#2A2FFF";
const CULTURAL_MARKER_COLOR = "#5C4D7D";
const NEIGHBORHOOD_MARKER_COLOR = "#0F766E";
const TRIBE_MARKER_COLOR = "#7C3AED";
const PARTNER_MARKER_COLOR = "#FF2D78";

type EventMapProps = {
  city: string;
  accessToken: string;
  events: MapEventItem[];
  culturalPlaces: MapCulturalPlaceItem[];
  partnerMarkers?: MapPartnerMarker[];
  neighborhoodMarkers: MapNeighborhoodMarker[];
  tribeMarkers: MapTribeMarker[];
  selection: MapTerritorySelection | null;
  onBoundsChange: (bounds: MapBoundsLike) => void;
  onSelectEvent: (id: string) => void;
  onSelectPlace: (slug: string) => void;
  onSelectPartner?: (slug: string) => void;
  onSelectNeighborhood: (slug: string) => void;
  onSelectTribe: (slug: string) => void;
  onClearSelection: () => void;
  focusedEventId?: string | null;
  selectedCulturalSlug?: string | null;
  selectedPartnerSlug?: string | null;
  routeGeometry?: MapRouteGeometry | null;
  routeTargetName?: string | null;
  routeSummary?: MapRouteSummary | null;
  routeLoading?: boolean;
  routeError?: boolean;
  onClearRoute?: () => void;
  routeTarget?: CulturalPlaceListItem | null;
  routePanelPhase?: CulturalRoutePanelPhase | null;
  routeProfile?: MapRouteProfile;
  geolocationDenied?: boolean;
  addressInput?: string;
  addressError?: boolean;
  onPickMyPosition?: () => void;
  onPickAddressMode?: () => void;
  onPickMapCenter?: () => void;
  onAddressInputChange?: (value: string) => void;
  onSubmitAddress?: () => void;
  onBackFromAddress?: () => void;
  onChangeProfile?: (profile: MapRouteProfile) => void;
  recenterSignal?: number;
  flyToTarget?: { latitude: number; longitude: number } | null;
  fullHeight?: boolean;
};

function isSelectionActive(
  selection: MapTerritorySelection | null,
  kind: MapTerritorySelection["kind"],
  id: string,
): boolean {
  if (!selection || selection.kind !== kind) return false;
  if (selection.kind === "event") return selection.id === id;
  if (selection.kind === "place") return selection.slug === id;
  if (selection.kind === "neighborhood") return selection.slug === id;
  return selection.slug === id;
}

export function EventMap({
  city,
  accessToken,
  events,
  culturalPlaces,
  partnerMarkers = [],
  neighborhoodMarkers,
  tribeMarkers,
  selection,
  onBoundsChange,
  onSelectEvent,
  onSelectPlace,
  onSelectPartner,
  onSelectNeighborhood,
  onSelectTribe,
  onClearSelection,
  focusedEventId = null,
  selectedCulturalSlug = null,
  selectedPartnerSlug = null,
  routeGeometry = null,
  routeTargetName = null,
  routeSummary = null,
  routeLoading = false,
  routeError = false,
  onClearRoute,
  routeTarget = null,
  routePanelPhase = null,
  routeProfile = "walking",
  geolocationDenied = false,
  addressInput = "",
  addressError = false,
  onPickMyPosition,
  onPickAddressMode,
  onPickMapCenter,
  onAddressInputChange,
  onSubmitAddress,
  onBackFromAddress,
  onChangeProfile,
  recenterSignal = 0,
  flyToTarget = null,
  fullHeight = false,
}: EventMapProps) {
  const mapRef = useRef<MapRef>(null);
  const center = resolveCityMapCenter(city);
  const [viewState, setViewState] = useState({
    latitude: center.latitude,
    longitude: center.longitude,
    zoom: center.zoom,
  });

  const emitBounds = useCallback(
    (map: MapEvent["target"]) => {
      const bounds = map.getBounds();
      if (!bounds) return;
      onBoundsChange(bounds);
    },
    [onBoundsChange],
  );

  const handleMoveEnd = useCallback(
    (event: MapEvent) => {
      emitBounds(event.target);
    },
    [emitBounds],
  );

  const handleLoad = useCallback(
    (event: MapEvent) => {
      emitBounds(event.target);
    },
    [emitBounds],
  );

  const flyToPoint = useCallback(
    (latitude: number, longitude: number, zoom = 14) => {
      mapRef.current?.flyTo({
        center: [longitude, latitude],
        zoom: Math.max(viewState.zoom, zoom),
        duration: 600,
      });
    },
    [viewState.zoom],
  );

  const handleRecenter = useCallback(() => {
    const next = resolveCityMapCenter(city);
    mapRef.current?.flyTo({
      center: [next.longitude, next.latitude],
      zoom: next.zoom,
      duration: 800,
    });
  }, [city]);

  useEffect(() => {
    if (recenterSignal <= 0) return;
    handleRecenter();
  }, [recenterSignal, handleRecenter]);

  useEffect(() => {
    if (!flyToTarget) return;
    flyToPoint(flyToTarget.latitude, flyToTarget.longitude, 13);
  }, [flyToTarget, flyToPoint]);

  useEffect(() => {
    if (!focusedEventId) return;
    const event = events.find((item) => item.id === focusedEventId);
    if (!event) return;
    flyToPoint(event.latitude, event.longitude, 13);
  }, [focusedEventId, events, flyToPoint]);

  useEffect(() => {
    if (!selectedCulturalSlug) return;
    const place = culturalPlaces.find((item) => item.slug === selectedCulturalSlug);
    if (!place) return;
    flyToPoint(place.latitude, place.longitude, 14);
  }, [selectedCulturalSlug, culturalPlaces, flyToPoint]);

  useEffect(() => {
    if (!selection) return;
    if (selection.kind === "event") {
      const event = events.find((item) => item.id === selection.id);
      if (event) flyToPoint(event.latitude, event.longitude, 13);
      return;
    }
    if (selection.kind === "place") {
      const place = culturalPlaces.find((item) => item.slug === selection.slug);
      if (place) flyToPoint(place.latitude, place.longitude, 14);
      return;
    }
    if (selection.kind === "neighborhood") {
      const hood = neighborhoodMarkers.find((item) => item.slug === selection.slug);
      if (hood) flyToPoint(hood.latitude, hood.longitude, 13);
      return;
    }
    if (selection.kind === "tribe") {
      const tribe = tribeMarkers.find((item) => item.slug === selection.slug);
      if (tribe) flyToPoint(tribe.latitude, tribe.longitude, 13);
    }
  }, [selection, events, culturalPlaces, neighborhoodMarkers, tribeMarkers, flyToPoint]);

  const routeFeature = routeGeometry
    ? {
        type: "Feature" as const,
        properties: {},
        geometry: routeGeometry,
      }
    : null;

  return (
    <div
      className={`relative w-full overflow-hidden bg-neutral-50 ${
        fullHeight
          ? "h-full rounded-none border-0 shadow-none"
          : "h-[min(58vh,640px)] rounded-2xl border border-neutral-200/90 shadow-sm"
      }`}
    >
      <MapCulturalRoutePanel
        target={routeTarget}
        phase={routePanelPhase}
        routeLoading={routeLoading}
        routeError={routeError}
        routeSummary={routeSummary}
        routeProfile={routeProfile}
        geolocationDenied={geolocationDenied}
        addressInput={addressInput}
        addressError={addressError}
        onClose={() => onClearRoute?.()}
        onPickMyPosition={() => onPickMyPosition?.()}
        onPickAddressMode={() => onPickAddressMode?.()}
        onPickMapCenter={() => onPickMapCenter?.()}
        onAddressInputChange={(value) => onAddressInputChange?.(value)}
        onSubmitAddress={() => onSubmitAddress?.()}
        onBackFromAddress={() => onBackFromAddress?.()}
        onChangeProfile={(profile) => onChangeProfile?.(profile)}
      />

      <Map
        ref={mapRef}
        mapboxAccessToken={accessToken}
        mapStyle={MAP_STYLE}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onMoveEnd={handleMoveEnd}
        onLoad={handleLoad}
        onClick={() => {
          onClearSelection();
        }}
        doubleClickZoom
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {routeFeature ? (
          <Source id="cultural-route" type="geojson" data={routeFeature}>
            <Layer
              id="cultural-route-line"
              type="line"
              paint={{
                "line-color": EVENT_MARKER_COLOR,
                "line-width": 4,
                "line-opacity": 0.85,
              }}
            />
          </Source>
        ) : null}

        {neighborhoodMarkers.map((hood) => (
          <Marker key={hood.id} latitude={hood.latitude} longitude={hood.longitude} anchor="center">
            <button
              type="button"
              aria-label={hood.name}
              onClick={(clickEvent) => {
                clickEvent.stopPropagation();
                onSelectNeighborhood(hood.slug);
              }}
              className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 border-white text-[8px] font-bold text-white shadow-md transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
                isSelectionActive(selection, "neighborhood", hood.slug) ? "scale-110" : ""
              }`}
              style={{ backgroundColor: NEIGHBORHOOD_MARKER_COLOR }}
            >
              Q
            </button>
          </Marker>
        ))}

        {tribeMarkers.map((tribe) => (
          <Marker key={tribe.id} latitude={tribe.latitude} longitude={tribe.longitude} anchor="center">
            <button
              type="button"
              aria-label={tribe.name}
              onClick={(clickEvent) => {
                clickEvent.stopPropagation();
                onSelectTribe(tribe.slug);
              }}
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-md transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
                isSelectionActive(selection, "tribe", tribe.slug) ? "scale-110" : ""
              } ${tribe.isApproximate ? "opacity-90 ring-1 ring-dashed ring-white/80" : ""}`}
              style={{ backgroundColor: TRIBE_MARKER_COLOR }}
            >
              <Users className="h-3.5 w-3.5 text-white" aria-hidden />
            </button>
          </Marker>
        ))}

        {culturalPlaces.map((place) => (
          <Marker
            key={place.id}
            latitude={place.latitude}
            longitude={place.longitude}
            anchor="center"
          >
            <button
              type="button"
              aria-label={place.name}
              onClick={(clickEvent) => {
                clickEvent.stopPropagation();
                onSelectPlace(place.slug);
              }}
              className={`flex h-5 w-5 items-center justify-center rounded-sm border-2 border-white text-[9px] font-bold text-white shadow-md transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
                selectedCulturalSlug === place.slug ||
                isSelectionActive(selection, "place", place.slug)
                  ? "scale-110"
                  : ""
              }`}
              style={{ backgroundColor: CULTURAL_MARKER_COLOR }}
            >
              ◆
            </button>
          </Marker>
        ))}

        {partnerMarkers.map((partner) => (
          <Marker
            key={partner.id}
            latitude={partner.latitude}
            longitude={partner.longitude}
            anchor="center"
          >
            <button
              type="button"
              aria-label={partner.name}
              onClick={(clickEvent) => {
                clickEvent.stopPropagation();
                onSelectPartner?.(partner.slug);
              }}
              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-white shadow-md transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
                selectedPartnerSlug === partner.slug ? "scale-110" : ""
              }`}
              style={{ backgroundColor: PARTNER_MARKER_COLOR }}
            >
              <Store className="h-3 w-3 text-white" aria-hidden />
            </button>
          </Marker>
        ))}

        {events.map((event) => (
          <Marker
            key={event.id}
            latitude={event.latitude}
            longitude={event.longitude}
            anchor="center"
          >
            <button
              type="button"
              aria-label={event.title}
              onClick={(clickEvent) => {
                clickEvent.stopPropagation();
                onSelectEvent(event.id);
              }}
              className={`block rounded-full border-2 border-white shadow-md transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
                isSelectionActive(selection, "event", event.id) ||
                focusedEventId === event.id
                  ? "h-4 w-4"
                  : "h-3 w-3"
              }`}
              style={{ backgroundColor: EVENT_MARKER_COLOR }}
            />
          </Marker>
        ))}
      </Map>

      {routeLoading && routeTargetName && routePanelPhase === "active" ? (
        <p className="pointer-events-none absolute bottom-16 left-4 rounded-full bg-white/90 px-3 py-1 text-xs text-neutral-600 shadow-sm">
          Itinéraire vers {routeTargetName}…
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleRecenter}
        className="absolute bottom-4 left-4 rounded-full border border-neutral-200/90 bg-white/95 px-3 py-2 text-xs font-semibold text-neutral-700 shadow-sm backdrop-blur-sm hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
      >
        {MAP_RECENTER(city)}
      </button>
    </div>
  );
}
