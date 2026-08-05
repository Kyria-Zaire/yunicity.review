"use client";

import { MarkerClusterer, type Renderer } from "@googlemaps/markerclusterer";
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
  mapMarkerKey,
  resolveActiveMapMarkerKeys,
  resolveCityMapCenter,
  type MapMarkerKind,
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
const CLUSTER_COLOR = "#2A2FFF";

const DIAMOND_PATH = "M 0,-9 L 9,0 L 0,9 L -9,0 Z";
const SQUARE_PATH = "M -8,-8 L 8,-8 L 8,8 L -8,8 Z";
const DIAMOND_EXTENT = 9;
const SQUARE_EXTENT = 8;

const MARKER_STROKE_COLOR = "#ffffff";
const MARKER_STROKE_WIDTH = 2;

// T4 — seules les couches DENSES sont clusterisées (lieux culturels, events). Les quartiers,
// tribus et partenaires restent individuels (peu nombreux, sémantiquement distincts — on préserve
// la structure des 12 quartiers, pas de cluster hétérogène).
const CLUSTERED_KINDS: ReadonlySet<MapMarkerKind> = new Set(["place", "event"]);

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

// Rendu (contenu + zIndex) par type de marqueur, en fonction de l'état actif (sélectionné/focus).
// Couleurs / tailles / zIndex STRICTEMENT identiques à l'existant (T3).
type MarkerVisual = {
  content: (active: boolean) => HTMLDivElement;
  zIndex: (active: boolean) => number;
};

const MARKER_VISUALS: Record<MapMarkerKind, MarkerVisual> = {
  neighborhood: {
    content: (a) =>
      markerContent(pathShape(SQUARE_PATH, NEIGHBORHOOD_MARKER_COLOR, a ? 1.3 : 1, SQUARE_EXTENT)),
    zIndex: (a) => (a ? 30 : 10),
  },
  tribe: {
    content: (a) => markerContent(circleShape(TRIBE_MARKER_COLOR, a ? 9 : 7)),
    zIndex: (a) => (a ? 30 : 11),
  },
  place: {
    content: (a) =>
      markerContent(pathShape(DIAMOND_PATH, CULTURAL_MARKER_COLOR, a ? 1.3 : 1, DIAMOND_EXTENT)),
    zIndex: (a) => (a ? 40 : 12),
  },
  partner: {
    content: (a) => markerContent(circleShape(PARTNER_MARKER_COLOR, a ? 10 : 8)),
    zIndex: (a) => (a ? 40 : 13),
  },
  event: {
    content: (a) => markerContent(circleShape(EVENT_MARKER_COLOR, a ? 7 : 5)),
    zIndex: (a) => (a ? 50 : 14),
  },
};

// Un marqueur géré par le registre : on peut mettre à jour son état actif sans le recréer.
type ManagedMarker = {
  kind: MapMarkerKind;
  marker: google.maps.marker.AdvancedMarkerElement;
  clustered: boolean;
  setActive: (active: boolean) => void;
};

function createManagedMarker(input: {
  map: google.maps.Map;
  kind: MapMarkerKind;
  position: google.maps.LatLngLiteral;
  title: string;
  onClick: () => void;
}): ManagedMarker {
  const visual = MARKER_VISUALS[input.kind];
  const clustered = CLUSTERED_KINDS.has(input.kind);
  const marker = new google.maps.marker.AdvancedMarkerElement({
    // Les marqueurs clusterisés sont posés sur la carte par le MarkerClusterer, pas directement.
    map: clustered ? undefined : input.map,
    position: input.position,
    title: input.title,
    content: visual.content(false),
    zIndex: visual.zIndex(false),
    gmpClickable: true,
  });
  marker.addListener("gmp-click", input.onClick);
  return {
    kind: input.kind,
    marker,
    clustered,
    setActive: (active) => {
      marker.content = visual.content(active);
      marker.zIndex = visual.zIndex(active);
    },
  };
}

// Icône de cluster aux couleurs marque (cercle bleu + compteur). textContent uniquement.
function clusterContent(count: number): HTMLDivElement {
  const size = count < 10 ? 34 : count < 100 ? 40 : 46;
  const el = document.createElement("div");
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.borderRadius = "9999px";
  el.style.background = CLUSTER_COLOR;
  el.style.color = "#ffffff";
  el.style.border = `2px solid ${MARKER_STROKE_COLOR}`;
  el.style.fontWeight = "600";
  el.style.fontSize = "13px";
  el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";
  el.textContent = String(count);
  return el;
}

function buildClusterRenderer(): Renderer {
  return {
    render: (cluster) =>
      new google.maps.marker.AdvancedMarkerElement({
        position: cluster.position,
        content: clusterContent(cluster.count),
        // Au-dessus des marqueurs individuels (zIndex max 50 en état actif).
        zIndex: 100 + cluster.count,
      }),
  };
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
  // Registre id→marqueur : la donnée et la sélection le mutent SANS tout reconstruire (T4).
  const registryRef = useRef<Map<string, ManagedMarker>>(new Map());
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const activeKeysRef = useRef<Set<string>>(new Set());

  // Les callbacks (bounds, sélection, clic marqueur) sont lus via une ref à jour : ni la carte ni
  // les marqueurs ne se reconstruisent quand l'identité d'un callback change.
  const handlersRef = useRef({
    onBoundsChange,
    onClearSelection,
    onSelectEvent,
    onSelectPlace,
    onSelectPartner,
    onSelectNeighborhood,
    onSelectTribe,
  });
  useEffect(() => {
    handlersRef.current = {
      onBoundsChange,
      onClearSelection,
      onSelectEvent,
      onSelectPlace,
      onSelectPartner,
      onSelectNeighborhood,
      onSelectTribe,
    };
  }, [
    onBoundsChange,
    onClearSelection,
    onSelectEvent,
    onSelectPlace,
    onSelectPartner,
    onSelectNeighborhood,
    onSelectTribe,
  ]);

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

  // Réconciliation des marqueurs sur changement de DONNÉES uniquement (pas de sélection ici).
  // On diff le registre (ajoute/retire), on confie lieux+events à un MarkerClusterer persistant,
  // et on repose l'état actif courant. Le pan/zoom ne déclenche plus aucune reconstruction.
  useEffect(() => {
    const map = mapRef.current;
    if (status !== "ready" || !map) return;
    if (typeof google.maps.marker?.AdvancedMarkerElement !== "function") return;

    type Spec = {
      kind: MapMarkerKind;
      position: google.maps.LatLngLiteral;
      title: string;
      onClick: () => void;
    };
    const desired = new Map<string, Spec>();

    for (const hood of neighborhoodMarkers) {
      desired.set(mapMarkerKey("neighborhood", hood.slug), {
        kind: "neighborhood",
        position: { lat: hood.latitude, lng: hood.longitude },
        title: hood.name,
        onClick: () => handlersRef.current.onSelectNeighborhood(hood.slug),
      });
    }
    for (const tribe of tribeMarkers) {
      desired.set(mapMarkerKey("tribe", tribe.slug), {
        kind: "tribe",
        position: { lat: tribe.latitude, lng: tribe.longitude },
        title: tribe.name,
        onClick: () => handlersRef.current.onSelectTribe(tribe.slug),
      });
    }
    for (const place of culturalPlaces) {
      desired.set(mapMarkerKey("place", place.slug), {
        kind: "place",
        position: { lat: place.latitude, lng: place.longitude },
        title: place.name,
        onClick: () => handlersRef.current.onSelectPlace(place.slug),
      });
    }
    for (const partner of partnerMarkers) {
      desired.set(mapMarkerKey("partner", partner.slug), {
        kind: "partner",
        position: { lat: partner.latitude, lng: partner.longitude },
        title: partner.name,
        onClick: () => handlersRef.current.onSelectPartner?.(partner.slug),
      });
    }
    for (const event of events) {
      desired.set(mapMarkerKey("event", event.id), {
        kind: "event",
        position: { lat: event.latitude, lng: event.longitude },
        title: event.title,
        onClick: () => handlersRef.current.onSelectEvent(event.id),
      });
    }

    const registry = registryRef.current;

    // Retire les marqueurs disparus.
    for (const [key, managed] of registry) {
      if (!desired.has(key)) {
        managed.marker.map = null;
        registry.delete(key);
      }
    }
    // Ajoute les nouveaux (état inactif ; l'état actif est reposé plus bas).
    for (const [key, spec] of desired) {
      if (!registry.has(key)) {
        registry.set(key, createManagedMarker({ map, ...spec }));
      }
    }

    // (Re)confie l'ensemble lieux+events au clusterer persistant.
    const clustered = [...registry.values()]
      .filter((managed) => managed.clustered)
      .map((managed) => managed.marker);
    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({
        map,
        markers: clustered,
        renderer: buildClusterRenderer(),
      });
    } else {
      clustererRef.current.clearMarkers(true);
      clustererRef.current.addMarkers(clustered);
    }

    // Repose l'état actif courant (nouveaux marqueurs créés inactifs, existants inchangés).
    for (const [key, managed] of registry) {
      managed.setActive(activeKeysRef.current.has(key));
    }
  }, [status, events, culturalPlaces, partnerMarkers, neighborhoodMarkers, tribeMarkers]);

  // Sélection : met à jour UNIQUEMENT les marqueurs dont l'état actif change. Fini le rebuild-tout.
  useEffect(() => {
    const registry = registryRef.current;
    const nextActive = resolveActiveMapMarkerKeys({
      selection,
      focusedEventId,
      selectedCulturalSlug,
      selectedPartnerSlug,
    });
    const prevActive = activeKeysRef.current;
    for (const key of prevActive) {
      if (!nextActive.has(key)) registry.get(key)?.setActive(false);
    }
    for (const key of nextActive) {
      if (!prevActive.has(key)) registry.get(key)?.setActive(true);
    }
    activeKeysRef.current = nextActive;
  }, [selection, focusedEventId, selectedCulturalSlug, selectedPartnerSlug]);

  // Nettoyage au démontage.
  useEffect(() => {
    // Le Map du registre est le MÊME objet pour toute la vie du composant (jamais réassigné, juste
    // muté) → capture sûre ici pour le cleanup, sans risque de valeur périmée.
    const registry = registryRef.current;
    return () => {
      clustererRef.current?.clearMarkers(true);
      clustererRef.current?.setMap(null);
      clustererRef.current = null;
      for (const managed of registry.values()) {
        managed.marker.map = null;
      }
      registry.clear();
      activeKeysRef.current = new Set();
      mapRef.current = null;
    };
  }, []);

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
