"use client";

import { mapCulturalPlaceItemToListItem } from "@/lib/map-cultural-places";
import type { CulturalPlaceListItem, MapRouteGeometry, MapRouteSummary } from "@yunicity/types";
import type { MapRouteProfile, MapTerritorySelection } from "@yunicity/utils";
import {
  DEFAULT_MAP_CITY,
  MAP_EMPTY,
  MAP_EMPTY_HINT,
  MAP_ERROR,
  MAP_LOADING,
  MAP_RETRY,
  MAP_TOKEN_MISSING_WEB,
  MAP_TRUNCATED_HINT,
  buildMapSelectedPanelPayload,
  buildNeighborhoodMapMarkers,
  buildTribeMapMarkers,
  buildMapAroundYouItems,
  DEFAULT_MAP_PORTAL_FILTERS,
  fetchMapboxRoute,
  filterEventsByPortalFilters,
  filterEventsForMapLayer,
  filterNeighborhoodMarkersForLayer,
  filterNeighborhoodsByAmbiance,
  filterPlacesByPortalFilters,
  filterPlacesForMapLayer,
  filterTribeMarkersForLayer,
  geocodeMapboxAddress,
  mapLayerToUrlSlug,
  normalizeMapPortalCategory,
  parseMapLayer,
  MAP_PARTNER_GEO_NOTICE,
  hasPartnerCoordinates,
  parseMapParams,
  resolveCityMapCenter,
  resolveMapPortalLayer,
  resolveMapPortalLayerVisibility,
  resolveMapPortalPlaceCategories,
  type MapAroundYouItem,
  type MapPortalFilters,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { CulturalRoutePanelPhase } from "@/components/map/map-cultural-route-panel";
import { EventMap } from "@/components/map/event-map";
import { MapAroundYouCarousel } from "@/components/map/map-around-you-carousel";
import { MapAppShell } from "@/components/map/map-app-shell";
import { MapLeftFilterRail } from "@/components/map/map-left-filter-rail";
import { MapPartnerDetailPanel } from "@/components/map/map-partner-detail-panel";
import { MapPlaceDetailPanel } from "@/components/map/map-place-detail-panel";
import { MapRightRail } from "@/components/map/map-right-rail";
import { MapSearchChips } from "@/components/map/map-search-chips";
import { MapSelectedPanel } from "@/components/map/map-selected-panel";
import { useMapPortalStats } from "@/hooks/use-map-portal-stats";
import { useMapBbox } from "@/hooks/use-map-bbox";
import { useMapCulturalPlaces } from "@/hooks/use-map-cultural-places";
import { useMapPartners } from "@/hooks/use-map-partners";
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
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const mapContext = useMapPageContext();
  const [profileCity, setProfileCity] = useState(user?.city ?? DEFAULT_MAP_CITY);
  const [focusedEventId, setFocusedEventId] = useState<string | null>(null);
  const [selectedCulturalSlug, setSelectedCulturalSlug] = useState<string | null>(null);
  const [selectedPartnerSlug, setSelectedPartnerSlug] = useState<string | null>(null);
  const [selection, setSelection] = useState<MapTerritorySelection | null>(null);
  const [recenterSignal, setRecenterSignal] = useState(0);
  const [flyToTarget, setFlyToTarget] = useState<LatLon | null>(null);
  const [positionHintVisible, setPositionHintVisible] = useState(false);

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
  const [mapNotice, setMapNotice] = useState<string | null>(null);
  const [portalFilters, setPortalFilters] = useState<MapPortalFilters>(DEFAULT_MAP_PORTAL_FILTERS);
  const [userOrigin, setUserOrigin] = useState<LatLon | null>(null);

  const routeRequestIdRef = useRef(0);
  const portalStats = useMapPortalStats();

  const placeCategories = useMemo(
    () => resolveMapPortalPlaceCategories(portalFilters.category),
    [portalFilters.category],
  );

  const { bbox, updateFromBounds } = useMapBbox();
  const { events, loading, error, truncated, hasLoaded, retry } = useMapEvents(
    profileCity,
    bbox,
  );
  const { places: mapCulturalPlaces } = useMapCulturalPlaces(
    profileCity,
    bbox,
    placeCategories,
  );

  const city = profileCity || mapContext.city || DEFAULT_MAP_CITY;
  const { partners: mapPartners, markers: partnerMarkers } = useMapPartners(city);

  useEffect(() => {
    void api
      .getProfileMe()
      .then((profile) => {
        if (profile.city) setProfileCity(profile.city);
      })
      .catch(() => {
        /* session expirée : ville par défaut conservée */
      });
  }, [api]);

  useEffect(() => {
    if (mapContext.city) {
      setProfileCity(mapContext.city);
    }
  }, [mapContext.city]);

  const mapParams = useMemo(
    () => parseMapParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  const layerVisibility = useMemo(
    () => resolveMapPortalLayerVisibility(portalFilters.category),
    [portalFilters.category],
  );

  const filteredNeighborhoods = useMemo(
    () => filterNeighborhoodsByAmbiance(mapContext.neighborhoods, portalFilters.ambiances),
    [mapContext.neighborhoods, portalFilters.ambiances],
  );

  const neighborhoodMarkers = useMemo(
    () =>
      filterNeighborhoodMarkersForLayer(
        buildNeighborhoodMapMarkers(filteredNeighborhoods),
        layerVisibility,
      ),
    [filteredNeighborhoods, layerVisibility],
  );

  const showInitialLoading = !hasLoaded && loading;

  const showPartnerLayer =
    portalFilters.category === "all" || portalFilters.category === "partners";
  const visiblePartnerMarkers = showPartnerLayer ? partnerMarkers : [];

  const tribeMarkers = useMemo(
    () =>
      filterTribeMarkersForLayer(
        buildTribeMapMarkers({
          city,
          tribes: mapContext.tribes,
          neighborhoods: mapContext.neighborhoods,
        }),
        layerVisibility,
      ),
    [city, mapContext.tribes, mapContext.neighborhoods, layerVisibility],
  );

  const visibleEvents = useMemo(() => {
    const layerFiltered = filterEventsForMapLayer(events, layerVisibility);
    return filterEventsByPortalFilters(layerFiltered, portalFilters, userOrigin);
  }, [events, layerVisibility, portalFilters, userOrigin]);

  const visiblePlaces = useMemo(() => {
    const layerFiltered = filterPlacesForMapLayer(mapCulturalPlaces, layerVisibility);
    return filterPlacesByPortalFilters(layerFiltered, portalFilters, userOrigin);
  }, [mapCulturalPlaces, layerVisibility, portalFilters, userOrigin]);

  useEffect(() => {
    if (mapParams.city) {
      setProfileCity(mapParams.city);
    }
  }, [mapParams.city]);

  const aroundYouItems = useMemo(
    () =>
      buildMapAroundYouItems({
        city,
        events: visibleEvents,
        places: visiblePlaces,
        origin: userOrigin,
        limit: 8,
      }),
    [city, visibleEvents, visiblePlaces, userOrigin],
  );

  useEffect(() => {
    if (!mapParams.layer) return;
    const layer = parseMapLayer(mapParams.layer);
    const category =
      layer === "moments"
        ? "events"
        : layer === "lieux"
          ? "places"
          : layer === "quartiers"
            ? "neighborhoods"
            : "all";
    const normalized = normalizeMapPortalCategory(category);
    setPortalFilters((prev) =>
      prev.category === normalized ? prev : { ...prev, category: normalized },
    );
  }, [mapParams.layer]);

  const transitPoint = useMemo(() => {
    const center = resolveMapCenterOrigin(bbox, city);
    return { lat: center.latitude, lon: center.longitude, city };
  }, [bbox, city]);

  const showEmpty =
    hasLoaded &&
    !loading &&
    !error &&
    visibleEvents.length === 0 &&
    visiblePlaces.length === 0 &&
    neighborhoodMarkers.length === 0 &&
    tribeMarkers.length === 0 &&
    (portalFilters.category !== "partners" || visiblePartnerMarkers.length === 0);

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

  const selectedPanel = useMemo(() => {
    if (!selection) return null;
    return buildMapSelectedPanelPayload({
      selection,
      city,
      events,
      placesBySlug: culturalBySlug,
      neighborhoods: mapContext.neighborhoods,
      tribeMarkers,
    });
  }, [selection, city, events, culturalBySlug, mapContext.neighborhoods, tribeMarkers]);

  const updateQuery = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

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

  const resolveRoutePlaceFromEvent = useCallback(
    (event: {
      id: string;
      title: string;
      city: string;
      location_name: string | null;
      latitude: number;
      longitude: number;
    }): CulturalPlaceListItem => ({
      id: `event-${event.id}`,
      slug: `event-${event.id}`,
      name: event.title,
      short_description: event.location_name ?? "Moment local",
      city: event.city,
      address: event.location_name ?? "Adresse non précisée",
      category: "event",
      latitude: event.latitude,
      longitude: event.longitude,
      image_url: null,
      hero_image_url: null,
      thumbnail_image_url: null,
      gallery_images: [],
      editorial_excerpt: null,
      photo_credit: null,
      image_source: null,
      image_alt: null,
      source_name: "Yunicity",
      image_credit: null,
      neighborhood: null,
    }),
    [],
  );

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
      setSelectedCulturalSlug(place.slug.startsWith("event-") ? null : place.slug);
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
    if (!place.slug.startsWith("event-") && !place.slug.startsWith("neighborhood-") && !place.slug.startsWith("tribe-")) {
      setSelectedCulturalSlug(place.slug);
    }
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

  // MAP-V2.A: entrées UI itinéraire retirées ; pipeline Mapbox conservé.
  void handleStartRoute;
  void resolveRoutePlaceFromEvent;

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

  const handleMapSelectCulturalSlug = useCallback(
    (slug: string) => {
      const place = culturalBySlug.get(slug);
      if (place) {
        setSelectedCulturalSlug(slug);
        setSelection({ kind: "place", slug });
      }
    },
    [culturalBySlug],
  );

  const handleSelectEvent = useCallback((id: string) => {
    setFocusedEventId(id);
    setSelection({ kind: "event", id });
    clearRoute();
  }, [clearRoute]);

  const handleSelectNeighborhood = useCallback(
    (slug: string) => {
      setSelection({ kind: "neighborhood", slug });
      clearRoute();
    },
    [clearRoute],
  );

  const handleSelectTribe = useCallback(
    (slug: string) => {
      setSelection({ kind: "tribe", slug });
      clearRoute();
    },
    [clearRoute],
  );

  const handleUsePositionOnMap = useCallback(() => {
    setPositionHintVisible(true);
    if (!navigator.geolocation) {
      setMapNotice("La géolocalisation n’est pas disponible sur cet appareil.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const origin = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserOrigin(origin);
        setFlyToTarget(origin);
        setMapNotice(null);
      },
      () => {
        setMapNotice("Impossible d’accéder à votre position. Vous pouvez recentrer sur Reims.");
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 60_000 },
    );
  }, []);

  const handlePortalCategoryChange = useCallback(
    (category: MapPortalFilters["category"]) => {
      const normalized = normalizeMapPortalCategory(category);
      setPortalFilters((prev) => ({ ...prev, category: normalized }));
      const layer = resolveMapPortalLayer(normalized);
      updateQuery((params) => {
        if (layer === "all") {
          params.delete("layer");
        } else {
          params.set("layer", mapLayerToUrlSlug(layer));
        }
      });
    },
    [updateQuery],
  );

  const handleAroundYouSelect = useCallback(
    (item: MapAroundYouItem) => {
      if (item.kind === "event") {
        handleSelectEvent(item.id);
        return;
      }
      handleMapSelectCulturalSlug(item.slug);
    },
    [handleMapSelectCulturalSlug, handleSelectEvent],
  );

  useEffect(() => {
    let cancelled = false;
    const syncFromUrl = async () => {
      setMapNotice(null);

      if (!mapParams.place && !mapParams.event && !mapParams.neighborhood && !mapParams.tribe && !mapParams.partner) {
        setFocusedEventId(null);
        setSelectedCulturalSlug(null);
        setSelectedPartnerSlug(null);
        setSelection(null);
        clearRoute();
        return;
      }

      if (mapParams.neighborhood) {
        const hood = mapContext.neighborhoods.find((item) => item.slug === mapParams.neighborhood);
        if (hood) {
          setSelection({ kind: "neighborhood", slug: hood.slug });
        } else if (!cancelled) {
          setMapNotice("Le quartier demandé est indisponible actuellement.");
        }
        return;
      }

      if (mapParams.tribe) {
        const marker = tribeMarkers.find((item) => item.slug === mapParams.tribe);
        if (marker) {
          setSelection({ kind: "tribe", slug: marker.slug });
        } else if (!cancelled) {
          setMapNotice("La tribu demandée n’apparaît pas sur la carte pour le moment.");
        }
        return;
      }

      if (mapParams.partner) {
        try {
          const partner = await api.getPartner(mapParams.partner, city);
          if (cancelled) return;
          setSelectedPartnerSlug(partner.slug);
          if (hasPartnerCoordinates(partner)) {
            setFlyToTarget({ latitude: partner.latitude!, longitude: partner.longitude! });
          } else {
            setMapNotice(MAP_PARTNER_GEO_NOTICE);
          }
        } catch {
          if (!cancelled) setMapNotice("Ce partenaire est introuvable ou non public.");
        }
        return;
      }

      if (mapParams.place) {
        const fromContext = culturalBySlug.get(mapParams.place);
        if (fromContext) {
          setSelectedCulturalSlug(fromContext.slug);
          setSelection({ kind: "place", slug: fromContext.slug });
          return;
        }
        try {
          const detail = await api.getCulturalPlace(mapParams.place, city);
          if (cancelled) return;
          const fallbackPlace: CulturalPlaceListItem = {
            id: detail.id,
            slug: detail.slug,
            name: detail.name,
            short_description: detail.short_description,
            city: detail.city,
            address: detail.address,
            category: detail.category,
            latitude: detail.latitude,
            longitude: detail.longitude,
            image_url: detail.image_url,
            hero_image_url: detail.hero_image_url,
            thumbnail_image_url: detail.thumbnail_image_url,
            gallery_images: detail.gallery_images,
            editorial_excerpt: detail.editorial_excerpt,
            photo_credit: detail.photo_credit,
            image_source: detail.image_source,
            image_alt: detail.image_alt,
            source_name: detail.source_name,
            image_credit: detail.image_credit,
            neighborhood: detail.neighborhood,
          };
          setSelectedCulturalSlug(fallbackPlace.slug);
          setSelection({ kind: "place", slug: fallbackPlace.slug });
        } catch {
          if (!cancelled) {
            setMapNotice("Le lieu demandé est indisponible actuellement.");
          }
        }
        return;
      }

      if (mapParams.event) {
        const existing = events.find((event) => event.id === mapParams.event);
        if (existing) {
          setFocusedEventId(existing.id);
          setSelection({ kind: "event", id: existing.id });
          return;
        }
        try {
          const event = await api.events.getEvent(mapParams.event);
          if (cancelled) return;
          if (event.latitude != null && event.longitude != null) {
            setFocusedEventId(event.id);
            setSelection({ kind: "event", id: event.id });
          } else {
            setMapNotice("Le moment demandé ne peut pas être positionné sur la carte.");
          }
        } catch {
          if (!cancelled) {
            setMapNotice("Le moment demandé est indisponible actuellement.");
          }
        }
      }
    };
    void syncFromUrl();
    return () => {
      cancelled = true;
    };
  }, [
    api,
    city,
    clearRoute,
    culturalBySlug,
    events,
    mapContext.neighborhoods,
    mapParams.event,
    mapParams.neighborhood,
    mapParams.place,
    mapParams.partner,
    mapParams.tribe,
    tribeMarkers,
  ]);

  const selectedPartner = useMemo(
    () =>
      selectedPartnerSlug
        ? mapPartners.find((item) => item.slug === selectedPartnerSlug) ?? null
        : null,
    [mapPartners, selectedPartnerSlug],
  );

  const handleSelectPartner = useCallback(
    (slug: string) => {
      const partner = mapPartners.find((item) => item.slug === slug);
      setSelectedPartnerSlug(slug);
      setSelection(null);
      setSelectedCulturalSlug(null);
      clearRoute();
      updateQuery((params) => {
        params.set("partner", slug);
        params.delete("place");
        params.delete("event");
      });
      if (partner && hasPartnerCoordinates(partner)) {
        setFlyToTarget({
          latitude: partner.latitude as number,
          longitude: partner.longitude as number,
        });
        setMapNotice(null);
      } else {
        setMapNotice(MAP_PARTNER_GEO_NOTICE);
      }
    },
    [mapPartners, clearRoute, updateQuery],
  );

  const showDetailRail =
    selection?.kind === "place" || selection?.kind === "event" || selectedPartner != null;

  const detailRail = selectedPartner ? (
    <MapPartnerDetailPanel
      partner={selectedPartner}
      onClose={() => {
        setSelectedPartnerSlug(null);
        updateQuery((params) => {
          params.delete("partner");
        });
      }}
    />
  ) : showDetailRail ? (
    <MapPlaceDetailPanel
      city={city}
      selection={selection}
      events={visibleEvents}
      origin={userOrigin}
      onClose={() => setSelection(null)}
    />
  ) : null;

  const rightRail =
    detailRail ??
    (
      <MapRightRail
        context={mapContext}
        culturalPlaces={mapContext.culturalPlaces}
        transitPoint={transitPoint}
        selectedCulturalSlug={selectedCulturalSlug}
        expandedCulturalSlug={null}
        onSelectCulturalPlace={(place) => handleMapSelectCulturalSlug(place.slug)}
        onToggleCulturalDetails={() => {}}
      />
    );

  return (
    <MapAppShell rightRail={rightRail}>
      <MapLeftFilterRail
        city={city}
        filters={portalFilters}
        favoritesCount={portalStats.favoritesCount}
        visitedCount={portalStats.visitedCount}
        partners={mapPartners}
        selectedPartnerSlug={selectedPartnerSlug}
        onSelectPartner={handleSelectPartner}
        onChangeFilters={setPortalFilters}
        onActivateGeolocation={handleUsePositionOnMap}
      />

      <div className="min-w-0 flex-1 space-y-4">
        {mapNotice ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {mapNotice}
          </p>
        ) : null}

        {!MAPBOX_TOKEN ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {MAP_TOKEN_MISSING_WEB}
          </p>
        ) : (
          <div className="relative min-h-[520px] h-[calc(100dvh-9rem)] overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
            <MapSearchChips
              activeCategory={portalFilters.category}
              onSelectCategory={handlePortalCategoryChange}
            />
            <EventMap
              city={city}
              accessToken={MAPBOX_TOKEN}
              events={visibleEvents}
              culturalPlaces={visiblePlaces}
              partnerMarkers={visiblePartnerMarkers}
              neighborhoodMarkers={neighborhoodMarkers}
              tribeMarkers={tribeMarkers}
              selection={selection}
              onBoundsChange={updateFromBounds}
              onSelectEvent={handleSelectEvent}
              onSelectPlace={handleMapSelectCulturalSlug}
              onSelectPartner={handleSelectPartner}
              onSelectNeighborhood={handleSelectNeighborhood}
              onSelectTribe={handleSelectTribe}
              onClearSelection={() => setSelection(null)}
              focusedEventId={focusedEventId}
              selectedCulturalSlug={selectedCulturalSlug}
              selectedPartnerSlug={selectedPartnerSlug}
              routeGeometry={routeGeometry}
              routeTargetName={routeTarget?.name ?? null}
              routeLoading={routeLoading}
              routeError={routeError}
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
              recenterSignal={recenterSignal}
              flyToTarget={flyToTarget}
              fullHeight
            />
            <MapAroundYouCarousel items={aroundYouItems} onSelectItem={handleAroundYouSelect} />
            {selectedPanel && !showDetailRail ? (
              <MapSelectedPanel
                payload={selectedPanel}
                onClose={() => setSelection(null)}
              />
            ) : null}
          </div>
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

        {showDetailRail ? <div className="2xl:hidden">{detailRail}</div> : null}
      </div>
    </MapAppShell>
  );
}
