"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import type { MapEventItem } from "@yunicity/types";
import {
  MAP_RECENTER,
  MAP_VIEW_EVENT,
  mapEventPopupDate,
  mapEventPopupLocation,
  resolveCityMapCenter,
} from "@yunicity/utils";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import Map, { Marker, Popup, type MapEvent, type MapRef } from "react-map-gl/mapbox";

import type { MapBoundsLike } from "@/hooks/use-map-bbox";

const MAP_STYLE = "mapbox://styles/mapbox/light-v11";
const MARKER_COLOR = "#2A2FFF";

type EventMapProps = {
  city: string;
  accessToken: string;
  events: MapEventItem[];
  onBoundsChange: (bounds: MapBoundsLike) => void;
};

export function EventMap({ city, accessToken, events, onBoundsChange }: EventMapProps) {
  const mapRef = useRef<MapRef>(null);
  const center = resolveCityMapCenter(city);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const selected = events.find((item) => item.id === selectedId) ?? null;

  return (
    <div className="relative h-[min(70vh,560px)] w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
      <Map
        ref={mapRef}
        mapboxAccessToken={accessToken}
        mapStyle={MAP_STYLE}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onMoveEnd={handleMoveEnd}
        onLoad={handleLoad}
        doubleClickZoom={false}
        style={{ width: "100%", height: "100%" }}
      >
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
                setSelectedId(event.id);
              }}
              className="block h-3 w-3 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
              style={{ backgroundColor: MARKER_COLOR }}
            />
          </Marker>
        ))}

        {selected ? (
          <Popup
            latitude={selected.latitude}
            longitude={selected.longitude}
            anchor="top"
            onClose={() => setSelectedId(null)}
            closeOnClick={false}
            offset={12}
          >
            <div className="max-w-[220px] space-y-2 text-sm text-neutral-800">
              <p className="font-semibold leading-snug">{selected.title}</p>
              <p className="text-xs text-neutral-600">{mapEventPopupDate(selected)}</p>
              <p className="text-xs text-neutral-600">{mapEventPopupLocation(selected)}</p>
              {selected.description ? (
                <p className="line-clamp-3 text-xs text-neutral-500">{selected.description}</p>
              ) : null}
              <Link
                href={`/events/${selected.id}`}
                className="inline-flex text-xs font-semibold text-yunicity-primary hover:underline"
              >
                {MAP_VIEW_EVENT}
              </Link>
            </div>
          </Popup>
        ) : null}
      </Map>

      <button
        type="button"
        onClick={handleRecenter}
        className="absolute bottom-4 left-4 rounded-full border border-neutral-200 bg-white/95 px-3 py-2 text-xs font-semibold text-neutral-700 shadow-sm hover:bg-white"
      >
        {MAP_RECENTER(city)}
      </button>
    </div>
  );
}
