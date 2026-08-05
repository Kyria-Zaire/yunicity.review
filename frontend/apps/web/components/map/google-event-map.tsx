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
const DIAMOND_EXTENT = 9;
const SQUARE_EXTENT = 8;

const MARKER_STROKE_COLOR = "#ffffff";
const MARKER_STROKE_WIDTH = 2;

type LatLon = { latitude: number; longitude: number };

export type GoogleEventMapProps = {
  city: string;
  apiKey: string;
  mapId: string;
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

// T3 — AdvancedMarkerElement n'accepte pas les google.maps.Symbol (SVG path). On reproduit à
// l'identique les formes historiques (cercle / losange / carré, mêmes couleurs, même trait blanc)
// via du contenu SVG DOM construit par createElementNS (aucun innerHTML, aucune donnée dynamique),
// pour ne rien perdre du langage visuel par catégorie.
const SVG_NS = "http://www.w3.org/2000/svg";

function svgRoot(half: number): SVGSVGElement {
  const size = half * 2;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", `${-half} ${-half} ${size} ${size}`);
  return svg;
}

function circleShape(color: string, radius: number): SVGSVGElement {
  const svg = svgRoot(radius + MARKER_STROKE_WIDTH);
  const circle = document.createElementNS(SVG_NS, "circle");
  circle.setAttribute("cx", "0");
  circle.setAttribute("cy", "0");
  circle.setAttribute("r", String(radius));
  circle.setAttribute("fill", color);
  circle.setAttribute("stroke", MARKER_STROKE_COLOR);
  circle.setAttribute("stroke-width", String(MARKER_STROKE_WIDTH));
  svg.appendChild(circle);
  return svg;
}

function pathShape(path: string, color: string, scale: number, extent: number): SVGSVGElement {
  const svg = svgRoot(extent * scale + MARKER_STROKE_WIDTH);
  const el = document.createElementNS(SVG_NS, "path");
  el.setAttribute("transform", `scale(${scale})`);
  el.setAttribute("d", path);
  el.setAttribute("fill", color);
  el.setAttribute("stroke", MARKER_STROKE_COLOR);
  // Le `scale` du Symbol legacy multipliait le path mais PAS le trait (2px fixes) : on contre-scale
  // le stroke-width pour rester à 2px après la mise à l'échelle du path.
  el.setAttribute("stroke-width", String(MARKER_STROKE_WIDTH / scale));
  svg.appendChild(el);
  return svg;
}

function markerContent(shape: SVGElement): HTMLDivElement {
  const el = document.createElement("div");
  el.style.lineHeight = "0";
  // AdvancedMarkerElement ancre le contenu par son bas-centre. Un décalage vertical de +50%
  // replace le CENTRE de la forme sur le point géographique (équivalent de l'ancrage 0,0 du Symbol).
  el.style.transform = "translateY(50%)";
  el.appendChild(shape);
  return el;
}

function createAdvancedMarker(
  map: google.maps.Map,
  position: google.maps.LatLngLiteral,
  title: string,
  content: HTMLElement,
  zIndex: number,
  onClick: () => void,
): google.maps.marker.AdvancedMarkerElement {
  const marker = new google.maps.marker.AdvancedMarkerElement({
    map,
    position,
    title,
    content,
    zIndex,
    gmpClickable: true,
  });
  marker.addListener("gmp-click", onClick);
  return marker;
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
  mapId,
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
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

  // Les écouteurs niveau carte sont attachés une seule fois : on lit les
  // callbacks à jour via une ref pour éviter de recréer la carte.
  const handlersRef = useRef({ onBoundsChange, onClearSelection });
  useEffect(() => {
    handlersRef.current = { onBoundsChange, onClearSelection };
  }, [onBoundsChange, onClearSelection]);

  const clearMarkers = useCallback(() => {
    for (const marker of markersRef.current) {
      marker.map = null;
    }
    markersRef.current = [];
  }, []);

  // Initialisation de la carte (une fois Google prêt).
  useEffect(() => {
    if (status !== "ready" || mapRef.current || !containerRef.current) return;
    if (typeof google === "undefined" || typeof google.maps?.Map !== "function") {
      return;
    }

    // T3 — le mapId (type Vector, Cloud Console) active le rendu vectoriel ET conditionne
    // AdvancedMarkerElement. Absent, on le signale explicitement en console (pas de repli raster
    // silencieux) ; Google émettra en plus sa propre erreur si le mapId est invalide.
    if (!mapId) {
      console.error(
        "[map] NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID manquant — rendu vectoriel et Advanced Markers indisponibles.",
      );
    }

    const center = resolveCityMapCenter(city);
    const map = new google.maps.Map(containerRef.current, {
      center: { lat: center.latitude, lng: center.longitude },
      zoom: center.zoom,
      mapId: mapId || undefined,
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
    const next: google.maps.marker.AdvancedMarkerElement[] = [];

    for (const hood of neighborhoodMarkers) {
      const active = isSelectionActive(selection, "neighborhood", hood.slug);
      const content = markerContent(
        pathShape(SQUARE_PATH, NEIGHBORHOOD_MARKER_COLOR, active ? 1.3 : 1, SQUARE_EXTENT),
      );
      next.push(
        createAdvancedMarker(
          map,
          { lat: hood.latitude, lng: hood.longitude },
          hood.name,
          content,
          active ? 30 : 10,
          () => onSelectNeighborhood(hood.slug),
        ),
      );
    }

    for (const tribe of tribeMarkers) {
      const active = isSelectionActive(selection, "tribe", tribe.slug);
      const content = markerContent(circleShape(TRIBE_MARKER_COLOR, active ? 9 : 7));
      next.push(
        createAdvancedMarker(
          map,
          { lat: tribe.latitude, lng: tribe.longitude },
          tribe.name,
          content,
          active ? 30 : 11,
          () => onSelectTribe(tribe.slug),
        ),
      );
    }

    for (const place of culturalPlaces) {
      const active =
        selectedCulturalSlug === place.slug ||
        isSelectionActive(selection, "place", place.slug);
      const content = markerContent(
        pathShape(DIAMOND_PATH, CULTURAL_MARKER_COLOR, active ? 1.3 : 1, DIAMOND_EXTENT),
      );
      next.push(
        createAdvancedMarker(
          map,
          { lat: place.latitude, lng: place.longitude },
          place.name,
          content,
          active ? 40 : 12,
          () => onSelectPlace(place.slug),
        ),
      );
    }

    for (const partner of partnerMarkers) {
      const active = selectedPartnerSlug === partner.slug;
      const content = markerContent(circleShape(PARTNER_MARKER_COLOR, active ? 10 : 8));
      next.push(
        createAdvancedMarker(
          map,
          { lat: partner.latitude, lng: partner.longitude },
          partner.name,
          content,
          active ? 40 : 13,
          () => onSelectPartner?.(partner.slug),
        ),
      );
    }

    for (const event of events) {
      const active =
        isSelectionActive(selection, "event", event.id) ||
        focusedEventId === event.id;
      const content = markerContent(circleShape(EVENT_MARKER_COLOR, active ? 7 : 5));
      next.push(
        createAdvancedMarker(
          map,
          { lat: event.latitude, lng: event.longitude },
          event.title,
          content,
          active ? 50 : 14,
          () => onSelectEvent(event.id),
        ),
      );
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
