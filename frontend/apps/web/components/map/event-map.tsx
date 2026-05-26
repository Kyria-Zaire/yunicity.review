"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import type {
  CulturalPlaceListItem,
  MapCulturalPlaceItem,
  MapEventItem,
  MapRouteGeometry,
  MapRouteSummary,
} from "@yunicity/types";
import {
  MAP_RECENTER,
  MAP_VIEW_EVENT,
  mapEventPopupDate,
  mapEventPopupLocation,
  resolveCityMapCenter,
} from "@yunicity/utils";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Map, {
  Layer,
  Marker,
  NavigationControl,
  Popup,
  Source,
  type MapEvent,
  type MapRef,
} from "react-map-gl/mapbox";

import { MapRoutePanel } from "@/components/map/map-route-panel";
import type { MapBoundsLike } from "@/hooks/use-map-bbox";

const MAP_STYLE = "mapbox://styles/mapbox/light-v11";
const EVENT_MARKER_COLOR = "#2A2FFF";
const CULTURAL_MARKER_COLOR = "#5C4D7D";

type EventMapProps = {
  city: string;
  accessToken: string;
  events: MapEventItem[];
  culturalPlaces: MapCulturalPlaceItem[];
  onBoundsChange: (bounds: MapBoundsLike) => void;
  focusedEventId?: string | null;
  selectedCulturalSlug?: string | null;
  routeGeometry?: MapRouteGeometry | null;
  routeTargetName?: string | null;
  routeSummary?: MapRouteSummary | null;
  routeLoading?: boolean;
  routeError?: boolean;
  onSelectCulturalPlace?: (slug: string) => void;
  onClearRoute?: () => void;
  routeTargetPlace?: CulturalPlaceListItem | null;
};

export function EventMap({
  city,
  accessToken,
  events,
  culturalPlaces,
  onBoundsChange,
  focusedEventId = null,
  selectedCulturalSlug = null,
  routeGeometry = null,
  routeTargetName = null,
  routeSummary = null,
  routeLoading = false,
  routeError = false,
  onSelectCulturalPlace,
  onClearRoute,
  routeTargetPlace = null,
}: EventMapProps) {
  const mapRef = useRef<MapRef>(null);
  const center = resolveCityMapCenter(city);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
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

  const handleRecenter = useCallback(() => {
    const next = resolveCityMapCenter(city);
    mapRef.current?.flyTo({
      center: [next.longitude, next.latitude],
      zoom: next.zoom,
      duration: 800,
    });
  }, [city]);

  useEffect(() => {
    if (!focusedEventId) return;
    const event = events.find((item) => item.id === focusedEventId);
    if (!event) return;
    setSelectedEventId(event.id);
    mapRef.current?.flyTo({
      center: [event.longitude, event.latitude],
      zoom: Math.max(viewState.zoom, 13),
      duration: 600,
    });
  }, [focusedEventId, events, viewState.zoom]);

  useEffect(() => {
    if (!selectedCulturalSlug) return;
    const place = culturalPlaces.find((item) => item.slug === selectedCulturalSlug);
    if (!place) return;
    mapRef.current?.flyTo({
      center: [place.longitude, place.latitude],
      zoom: Math.max(viewState.zoom, 14),
      duration: 600,
    });
  }, [selectedCulturalSlug, culturalPlaces, viewState.zoom]);

  const selectedEvent = events.find((item) => item.id === selectedEventId) ?? null;

  const routeFeature = routeGeometry
    ? {
        type: "Feature" as const,
        properties: {},
        geometry: routeGeometry,
      }
    : null;

  return (
    <div className="relative h-[min(58vh,640px)] w-full overflow-hidden rounded-2xl border border-neutral-200/90 bg-neutral-50 shadow-sm">
      <MapRoutePanel
        target={routeTargetPlace}
        summary={routeSummary}
        error={routeError}
        onClose={() => onClearRoute?.()}
      />

      <Map
        ref={mapRef}
        mapboxAccessToken={accessToken}
        mapStyle={MAP_STYLE}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onMoveEnd={handleMoveEnd}
        onLoad={handleLoad}
        onClick={() => setSelectedEventId(null)}
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
                onSelectCulturalPlace?.(place.slug);
              }}
              className={`flex h-5 w-5 items-center justify-center rounded-sm border-2 border-white text-[9px] font-bold text-white shadow-md transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
                selectedCulturalSlug === place.slug ? "scale-110" : ""
              }`}
              style={{ backgroundColor: CULTURAL_MARKER_COLOR }}
            >
              ◆
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
                setSelectedEventId(event.id);
              }}
              className={`block rounded-full border-2 border-white shadow-md transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary ${
                selectedEventId === event.id ? "h-4 w-4" : "h-3 w-3"
              }`}
              style={{ backgroundColor: EVENT_MARKER_COLOR }}
            />
          </Marker>
        ))}

        {selectedEvent ? (
          <Popup
            latitude={selectedEvent.latitude}
            longitude={selectedEvent.longitude}
            anchor="top"
            onClose={() => setSelectedEventId(null)}
            closeOnClick={false}
            offset={14}
            className="map-event-popup"
          >
            <div className="max-w-[240px] space-y-2 p-0.5 text-sm text-neutral-800">
              <p className="font-semibold leading-snug text-neutral-900">{selectedEvent.title}</p>
              <p className="text-xs text-neutral-600">{mapEventPopupDate(selectedEvent)}</p>
              <p className="text-xs text-neutral-500">{mapEventPopupLocation(selectedEvent)}</p>
              {selectedEvent.description ? (
                <p className="line-clamp-3 text-xs leading-relaxed text-neutral-600">
                  {selectedEvent.description}
                </p>
              ) : null}
              <Link
                href={`/events/${selectedEvent.id}`}
                className="inline-flex rounded-full bg-yunicity-primary px-3 py-1 text-xs font-semibold text-white hover:bg-yunicity-primary-hover"
              >
                {MAP_VIEW_EVENT}
              </Link>
            </div>
          </Popup>
        ) : null}
      </Map>

      {routeLoading && routeTargetName ? (
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
