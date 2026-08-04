"use client";

import { mapCulturalPlaceItemToListItem } from "@/lib/map-cultural-places";
import type { CulturalPlaceListItem } from "@yunicity/types";
import type { MapTerritorySelection } from "@yunicity/utils";
import {
  DEFAULT_MAP_CITY,
  MAP_EMPTY,
  MAP_EMPTY_HINT,
  MAP_ERROR,
  MAP_LOADING,
  MAP_RETRY,
  MAP_TOKEN_MISSING_GOOGLE_WEB,
  MAP_TRUNCATED_HINT,
  buildMapSelectedPanelPayload,
  buildNeighborhoodMapMarkers,
  buildTribeMapMarkers,
  buildMapAroundYouItems,
  DEFAULT_MAP_PORTAL_FILTERS,
  filterEventsByPortalFilters,
  filterEventsForMapLayer,
  filterNeighborhoodMarkersForLayer,
  filterNeighborhoodsByAmbiance,
  filterPlacesByPortalFilters,
  filterPlacesForMapLayer,
  filterTribeMarkersForLayer,
  haversineMeters,
  mapLayerToUrlSlug,
  mapMobileCategoryToPortal,
  normalizeMapPortalCategory,
  parseMapLayer,
  MAP_PARTNER_GEO_NOTICE,
  hasPartnerCoordinates,
  parseMapParams,
  resolveCityMapCenter,
  resolveMapMobilePartnerTypes,
  resolveMapPortalLayer,
  resolveMapPortalLayerVisibility,
  type MapAroundYouItem,
  type MapMobileCategoryId,
  type MapPortalFilters,
} from "@yunicity/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { GoogleEventMap } from "@/components/map/google-event-map";
import { MapAroundYouCarousel } from "@/components/map/map-around-you-carousel";
import { MapAppShell } from "@/components/map/map-app-shell";
import { MapLeftFilterRail } from "@/components/map/map-left-filter-rail";
import {
  MapMobileAroundSheet,
  MapMobileCategoryPills,
  MapMobileHeader,
  MapMobileMapControls,
  MapMobileNeighborhoodBadge,
  MapMobileSearchBar,
} from "@/components/map/mobile";
import { MapPartnerDetailPanel } from "@/components/map/map-partner-detail-panel";
import { MapPlaceDetailPanel } from "@/components/map/map-place-detail-panel";
import { MapRightRail } from "@/components/map/map-right-rail";
import { MapSearchChips } from "@/components/map/map-search-chips";
import { MapSelectedPanel } from "@/components/map/map-selected-panel";
import { useMapPortalStats } from "@/hooks/use-map-portal-stats";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import { useMapBbox } from "@/hooks/use-map-bbox";
import { useMapCulturalPlaces } from "@/hooks/use-map-cultural-places";
import { useMapPartners } from "@/hooks/use-map-partners";
import { useMapEvents } from "@/hooks/use-map-events";
import { useMapPageContext } from "@/hooks/use-map-page-context";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

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
  const [mapNotice, setMapNotice] = useState<string | null>(null);
  const [portalFilters, setPortalFilters] = useState<MapPortalFilters>(DEFAULT_MAP_PORTAL_FILTERS);
  const [mobileCategory, setMobileCategory] = useState<MapMobileCategoryId>("all");
  const [userOrigin, setUserOrigin] = useState<LatLon | null>(null);

  const portalStats = useMapPortalStats();

  const { bbox, updateFromBounds } = useMapBbox();
  // Une seule instance Google Maps montée à la fois (mobile OU desktop). `display:none` ne
  // démonte pas React : sans ce garde, les DEUX cartes s'instancient (double coût de tout rebuild).
  const isDesktop = useIsDesktop();
  // T5 — données carte chargées UNE fois par ville, filtrées côté client ensuite (culture/nature,
  // distance, calques). Le pan ne déclenche plus de re-fetch réseau. `bbox` ne sert plus qu'au
  // recentrage/centre local (resolveMapCenterOrigin), pas au fetch.
  const { events, loading, error, truncated, hasLoaded, retry } = useMapEvents(profileCity);
  const { places: mapCulturalPlaces } = useMapCulturalPlaces(profileCity);

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
  const mobilePartnerTypes = resolveMapMobilePartnerTypes(mobileCategory);
  const visiblePartnerMarkers = useMemo(() => {
    if (!showPartnerLayer) return [];
    if (!mobilePartnerTypes?.length) return partnerMarkers;
    const allowed = new Set(mobilePartnerTypes);
    return partnerMarkers.filter((marker) => {
      const partner = mapPartners.find((item) => item.slug === marker.slug);
      return partner ? allowed.has(partner.partnership_type) : false;
    });
  }, [showPartnerLayer, mobilePartnerTypes, partnerMarkers, mapPartners]);

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
  }, []);

  const handleSelectNeighborhood = useCallback((slug: string) => {
    setSelection({ kind: "neighborhood", slug });
  }, []);

  const handleSelectTribe = useCallback((slug: string) => {
    setSelection({ kind: "tribe", slug });
  }, []);

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

  const handleMobileCategorySelect = useCallback(
    (category: MapMobileCategoryId) => {
      setMobileCategory(category);
      const portalCategory = mapMobileCategoryToPortal(category);
      setPortalFilters((prev) => ({ ...prev, category: portalCategory }));
      const layer = resolveMapPortalLayer(portalCategory);
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

  const nearestNeighborhoodLabel = useMemo(() => {
    const origin = userOrigin ?? resolveMapCenterOrigin(bbox, city);
    let closest: string | null = null;
    let minDistance = Infinity;
    for (const hood of mapContext.neighborhoods) {
      if (hood.latitude == null || hood.longitude == null) continue;
      const distance = haversineMeters(
        origin.latitude,
        origin.longitude,
        hood.latitude,
        hood.longitude,
      );
      if (distance < minDistance) {
        minDistance = distance;
        closest = hood.display_name;
      }
    }
    return closest;
  }, [bbox, city, mapContext.neighborhoods, userOrigin]);

  const handleMobileNavigate = useCallback(() => {
    if (selection?.kind === "place") {
      const place = culturalBySlug.get(selection.slug);
      if (place?.latitude != null && place?.longitude != null) {
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`,
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }
    }
    if (selection?.kind === "event") {
      const event = visibleEvents.find((item) => item.id === selection.id);
      if (event) {
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`,
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }
    }
    if (selectedPartnerSlug) {
      const partner = mapPartners.find((item) => item.slug === selectedPartnerSlug);
      if (partner?.latitude != null && partner?.longitude != null) {
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${partner.latitude},${partner.longitude}`,
          "_blank",
          "noopener,noreferrer",
        );
        return;
      }
    }
    handleUsePositionOnMap();
  }, [
    culturalBySlug,
    handleUsePositionOnMap,
    mapPartners,
    selectedPartnerSlug,
    selection,
    visibleEvents,
  ]);

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
    [mapPartners, updateQuery],
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
      <div className="web-desktop-map-only">
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
      </div>

      <div className="web-mobile-map-only w-full min-w-0">
        <MapMobileHeader />
        <div className="relative h-[calc(100dvh-8.5rem)] min-h-[420px] overflow-hidden bg-white">
          {mapNotice ? (
            <p className="absolute inset-x-3 top-28 z-20 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {mapNotice}
            </p>
          ) : null}

          {!GOOGLE_MAPS_API_KEY ? (
            <p className="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {MAP_TOKEN_MISSING_GOOGLE_WEB}
            </p>
          ) : (
            <>
              {isDesktop === false ? (
                <GoogleEventMap
                  city={city}
                  apiKey={GOOGLE_MAPS_API_KEY}
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
                  recenterSignal={recenterSignal}
                  flyToTarget={flyToTarget}
                  fullHeight
                  hideRecenterButton
                />
              ) : null}
              <MapMobileSearchBar filters={portalFilters} onChangeFilters={setPortalFilters} />
              <MapMobileCategoryPills
                activeCategory={mobileCategory}
                onSelectCategory={handleMobileCategorySelect}
              />
              <MapMobileNeighborhoodBadge label={nearestNeighborhoodLabel} />
              <MapMobileMapControls
                onLocate={handleUsePositionOnMap}
                onNavigate={handleMobileNavigate}
              />
              <MapMobileAroundSheet
                items={aroundYouItems}
                onSelectItem={handleAroundYouSelect}
              />
              {selectedPanel && !showDetailRail ? (
                <MapSelectedPanel
                  payload={selectedPanel}
                  onClose={() => setSelection(null)}
                />
              ) : null}
            </>
          )}
        </div>

        {showDetailRail ? <div className="px-4 py-4">{detailRail}</div> : null}
      </div>

      <div className="web-desktop-map-only min-w-0 flex-1 space-y-4">
        {mapNotice ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {mapNotice}
          </p>
        ) : null}

        {!GOOGLE_MAPS_API_KEY ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {MAP_TOKEN_MISSING_GOOGLE_WEB}
          </p>
        ) : (
          <div className="relative min-h-[520px] h-[calc(100dvh-9rem)] overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
            <MapSearchChips
              activeCategory={portalFilters.category}
              onSelectCategory={handlePortalCategoryChange}
            />
            {isDesktop === true ? (
              <GoogleEventMap
                city={city}
                apiKey={GOOGLE_MAPS_API_KEY}
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
                recenterSignal={recenterSignal}
                flyToTarget={flyToTarget}
                fullHeight
              />
            ) : null}
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

        {showEmpty && GOOGLE_MAPS_API_KEY ? (
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
