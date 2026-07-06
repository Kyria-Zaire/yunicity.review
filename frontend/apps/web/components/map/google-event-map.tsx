"use client";

import type {
  MapCulturalPlaceItem,
  MapEventItem,
} from "@yunicity/types";
import type {
  MapNeighborhoodMarker,
  MapTerritorySelection,
  MapTribeMarker,
} from "@yunicity/utils";
import {
  MAP_GOOGLE_LOAD_ERROR,
  MAP_LOADING,
  MAP_RECENTER,
  resolveCityMapCenter,
} from "@yunicity/utils";
import { useCallback, useEffect, useRef } from "react";

import type { MapPartnerMarker } from "@/hooks/use-map-partners";
import type { MapBoundsLike } from "@/hooks/use-map-bbox";
import { useGoogleMaps } from "@/hooks/use-google-maps";

const EVENT_MARKER_COLOR = "#2A2FFF";
const CULTURAL_MARKER_COLOR = "#5C4D7D";
const NEIGHBORHOOD_MARKER_COLOR = "#0F766E";
const TRIBE_MARKER_COLOR = "#7C3AED";
const PARTNER_MARKER_COLOR = "#FF2D78";

const DIAMOND_PATH = "M 0,-9 L 9,0 L 0,9 L -9,0 Z";
const SQUARE_PATH = "M -8,-8 L 8,-8 L 8,8 L -8,8 Z";

type LatLon = { latitude: number; longitude: number };

export type GoogleEventMapProps = {
  city: string;
  apiKey: string;
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
  recenterSignal?: number;
  flyToTarget?: LatLon | null;
  fullHeight?: boolean;
  hideRecenterButton?: boolean;
};

function toBoundsLike(bounds: google.maps.LatLngBounds): MapBoundsLike {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  return {
    getNorth: () => ne.lat(),
    getSouth: () => sw.lat(),
    getEast: () => ne.lng(),
    getWest: () => sw.lng(),
  };
}

function circleIcon(color: string, scale: number): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale,
  };
}

function pathIcon(
  path: string,
  color: string,
  scale: number,
): google.maps.Symbol {
  return {
    path,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale,
    anchor: new google.maps.Point(0, 0),
  };
}

function isSelectionActive(
  selection: MapTerritorySelection | null,
  kind: MapTerritorySelection["kind"],
  id: string,
): boolean {
  if (!selection || selection.kind !== kind) return false;
  if (selection.kind === "event") return selection.id === id;
  return selection.slug === id;
}

export function GoogleEventMap({
  city,
  apiKey,
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
  recenterSignal = 0,
  flyToTarget = null,
  fullHeight = false,
  hideRecenterButton = false,
}: GoogleEventMapProps) {
  const status = useGoogleMaps(apiKey);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Les écouteurs niveau carte sont attachés une seule fois : on lit les
  // callbacks à jour via une ref pour éviter de recréer la carte.
  const handlersRef = useRef({ onBoundsChange, onClearSelection });
  useEffect(() => {
    handlersRef.current = { onBoundsChange, onClearSelection };
  }, [onBoundsChange, onClearSelection]);

  const clearMarkers = useCallback(() => {
    for (const marker of markersRef.current) {
      marker.setMap(null);
    }
    markersRef.current = [];
  }, []);

  // Initialisation de la carte (une fois Google prêt).
  useEffect(() => {
    if (status !== "ready" || mapRef.current || !containerRef.current) return;
    if (typeof google === "undefined" || typeof google.maps?.Map !== "function") {
      return;
    }

    const center = resolveCityMapCenter(city);
    const map = new google.maps.Map(containerRef.current, {
      center: { lat: center.latitude, lng: center.longitude },
      zoom: center.zoom,
      clickableIcons: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      rotateControl: false,
      zoomControl: true,
      gestureHandling: "greedy",
      disableDoubleClickZoom: false,
    });
    mapRef.current = map;

    map.addListener("idle", () => {
      const bounds = map.getBounds();
      if (bounds) handlersRef.current.onBoundsChange(toBoundsLike(bounds));
    });
    map.addListener("click", () => {
      handlersRef.current.onClearSelection();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const flyToPoint = useCallback(
    (latitude: number, longitude: number, zoom = 14) => {
      const map = mapRef.current;
      if (!map) return;
      map.panTo({ lat: latitude, lng: longitude });
      const current = map.getZoom() ?? zoom;
      if (current < zoom) map.setZoom(zoom);
    },
    [],
  );

  const handleRecenter = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const next = resolveCityMapCenter(city);
    map.panTo({ lat: next.latitude, lng: next.longitude });
    map.setZoom(next.zoom);
  }, [city]);

  // (Re)construction des marqueurs à chaque changement de données/sélection.
  useEffect(() => {
    const map = mapRef.current;
    if (status !== "ready" || !map) return;

    clearMarkers();
    const next: google.maps.Marker[] = [];

    for (const hood of neighborhoodMarkers) {
      const active = isSelectionActive(selection, "neighborhood", hood.slug);
      const marker = new google.maps.Marker({
        map,
        position: { lat: hood.latitude, lng: hood.longitude },
        title: hood.name,
        icon: pathIcon(SQUARE_PATH, NEIGHBORHOOD_MARKER_COLOR, active ? 1.3 : 1),
        zIndex: active ? 30 : 10,
      });
      marker.addListener("click", () => onSelectNeighborhood(hood.slug));
      next.push(marker);
    }

    for (const tribe of tribeMarkers) {
      const active = isSelectionActive(selection, "tribe", tribe.slug);
      const marker = new google.maps.Marker({
        map,
        position: { lat: tribe.latitude, lng: tribe.longitude },
        title: tribe.name,
        icon: circleIcon(TRIBE_MARKER_COLOR, active ? 9 : 7),
        zIndex: active ? 30 : 11,
      });
      marker.addListener("click", () => onSelectTribe(tribe.slug));
      next.push(marker);
    }

    for (const place of culturalPlaces) {
      const active =
        selectedCulturalSlug === place.slug ||
        isSelectionActive(selection, "place", place.slug);
      const marker = new google.maps.Marker({
        map,
        position: { lat: place.latitude, lng: place.longitude },
        title: place.name,
        icon: pathIcon(DIAMOND_PATH, CULTURAL_MARKER_COLOR, active ? 1.3 : 1),
        zIndex: active ? 40 : 12,
      });
      marker.addListener("click", () => onSelectPlace(place.slug));
      next.push(marker);
    }

    for (const partner of partnerMarkers) {
      const active = selectedPartnerSlug === partner.slug;
      const marker = new google.maps.Marker({
        map,
        position: { lat: partner.latitude, lng: partner.longitude },
        title: partner.name,
        icon: circleIcon(PARTNER_MARKER_COLOR, active ? 10 : 8),
        zIndex: active ? 40 : 13,
      });
      marker.addListener("click", () => onSelectPartner?.(partner.slug));
      next.push(marker);
    }

    for (const event of events) {
      const active =
        isSelectionActive(selection, "event", event.id) ||
        focusedEventId === event.id;
      const marker = new google.maps.Marker({
        map,
        position: { lat: event.latitude, lng: event.longitude },
        title: event.title,
        icon: circleIcon(EVENT_MARKER_COLOR, active ? 7 : 5),
        zIndex: active ? 50 : 14,
      });
      marker.addListener("click", () => onSelectEvent(event.id));
      next.push(marker);
    }

    markersRef.current = next;
  }, [
    status,
    clearMarkers,
    events,
    culturalPlaces,
    partnerMarkers,
    neighborhoodMarkers,
    tribeMarkers,
    selection,
    focusedEventId,
    selectedCulturalSlug,
    selectedPartnerSlug,
    onSelectEvent,
    onSelectPlace,
    onSelectPartner,
    onSelectNeighborhood,
    onSelectTribe,
  ]);

  // Nettoyage au démontage.
  useEffect(() => {
    return () => {
      clearMarkers();
      mapRef.current = null;
    };
  }, [clearMarkers]);

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
    if (event) flyToPoint(event.latitude, event.longitude, 13);
  }, [focusedEventId, events, flyToPoint]);

  useEffect(() => {
    if (!selectedCulturalSlug) return;
    const place = culturalPlaces.find((item) => item.slug === selectedCulturalSlug);
    if (place) flyToPoint(place.latitude, place.longitude, 14);
  }, [selectedCulturalSlug, culturalPlaces, flyToPoint]);

  return (
    <div
      className={`relative w-full overflow-hidden bg-neutral-50 ${
        fullHeight
          ? "h-full rounded-none border-0 shadow-none"
          : "h-[min(58vh,640px)] rounded-2xl border border-neutral-200/90 shadow-sm"
      }`}
    >
      <div ref={containerRef} className="h-full w-full" aria-label="Carte de Reims" />

      {status === "loading" || status === "idle" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <p className="rounded-full bg-white/95 px-4 py-2 text-sm text-neutral-600 shadow-sm" role="status">
            {MAP_LOADING}
          </p>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-amber-50/90 px-4">
          <p className="rounded-xl border border-amber-200 bg-white px-4 py-3 text-center text-sm text-amber-900 shadow-sm">
            {MAP_GOOGLE_LOAD_ERROR}
          </p>
        </div>
      ) : null}

      {status === "ready" && !hideRecenterButton ? (
        <button
          type="button"
          onClick={handleRecenter}
          className="absolute bottom-4 left-4 rounded-full border border-neutral-200/90 bg-white/95 px-3 py-2 text-xs font-semibold text-neutral-700 shadow-sm backdrop-blur-sm hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
        >
          {MAP_RECENTER(city)}
        </button>
      ) : null}
    </div>
  );
}
