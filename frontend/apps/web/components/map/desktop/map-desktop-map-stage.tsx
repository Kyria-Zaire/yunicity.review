"use client";

import { GoogleEventMap } from "@/components/map/google-event-map";
import { MapDesktopAroundBanner } from "@/components/map/desktop/map-desktop-around-banner";
import { MapDesktopMapControls } from "@/components/map/desktop/map-desktop-map-controls";
import { MapDesktopSearchHeader } from "@/components/map/desktop/map-desktop-search-header";
import { MapDesktopSelectionPopup } from "@/components/map/desktop/map-desktop-selection-popup";
import type { MapAroundYouItem, MapPortalFilters, MapTerritorySelection } from "@yunicity/utils";
import {
  MAP_DESKTOP_SEARCH_IN_ZONE,
  MAP_EMPTY,
  MAP_EMPTY_HINT,
  MAP_ERROR,
  MAP_LOADING,
  MAP_RETRY,
  MAP_TOKEN_MISSING_GOOGLE_WEB,
  MAP_TRUNCATED_HINT,
} from "@yunicity/utils";
import { Crosshair } from "lucide-react";
import type { ReactNode } from "react";

export type MapDesktopMapStageProps = {
  city: string;
  apiKey: string;
  mapId: string;
  mapReady: boolean;
  events: Parameters<typeof GoogleEventMap>[0]["events"];
  culturalPlaces: Parameters<typeof GoogleEventMap>[0]["culturalPlaces"];
  partnerMarkers: Parameters<typeof GoogleEventMap>[0]["partnerMarkers"];
  neighborhoodMarkers: Parameters<typeof GoogleEventMap>[0]["neighborhoodMarkers"];
  tribeMarkers: Parameters<typeof GoogleEventMap>[0]["tribeMarkers"];
  selection: MapTerritorySelection | null;
  onBoundsChange: Parameters<typeof GoogleEventMap>[0]["onBoundsChange"];
  onSelectEvent: (id: string) => void;
  onSelectPlace: (slug: string) => void;
  onSelectPartner: (slug: string) => void;
  onSelectNeighborhood: (slug: string) => void;
  onSelectTribe: (slug: string) => void;
  onClearSelection: () => void;
  focusedEventId: string | null;
  selectedCulturalSlug: string | null;
  selectedPartnerSlug: string | null;
  recenterSignal: number;
  flyToTarget: { latitude: number; longitude: number } | null;
  zoomAdjustSignal: { delta: number; tick: number } | null;
  portalFilters: MapPortalFilters;
  onPortalCategoryChange: (category: MapPortalFilters["category"]) => void;
  aroundYouItems: MapAroundYouItem[];
  onAroundYouSelect: (item: MapAroundYouItem) => void;
  selectedPanel: Parameters<typeof MapDesktopSelectionPopup>[0]["payload"] | null;
  showDetailRail: boolean;
  mapNotice: string | null;
  showInitialLoading: boolean;
  showEmpty: boolean;
  error: string | null;
  onRetry: () => void;
  loading: boolean;
  hasLoaded: boolean;
  truncated: boolean;
  eventsCount: number;
  onLocate: () => void;
  onSearchInZone: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

export function MapDesktopMapStage({
  city,
  apiKey,
  mapId,
  mapReady,
  events,
  culturalPlaces,
  partnerMarkers,
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
  focusedEventId,
  selectedCulturalSlug,
  selectedPartnerSlug,
  recenterSignal,
  flyToTarget,
  zoomAdjustSignal,
  portalFilters,
  onPortalCategoryChange,
  aroundYouItems,
  onAroundYouSelect,
  selectedPanel,
  showDetailRail,
  mapNotice,
  showInitialLoading,
  showEmpty,
  error,
  onRetry,
  loading,
  hasLoaded,
  truncated,
  eventsCount,
  onLocate,
  onSearchInZone,
  onZoomIn,
  onZoomOut,
}: MapDesktopMapStageProps) {
  let statusBlock: ReactNode = null;

  if (!apiKey) {
    statusBlock = (
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {MAP_TOKEN_MISSING_GOOGLE_WEB}
      </p>
    );
  } else if (showInitialLoading) {
    statusBlock = (
      <p className="text-center text-sm text-neutral-500" role="status">
        {MAP_LOADING}
      </p>
    );
  } else if (error) {
    statusBlock = (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-800">
        <p>{MAP_ERROR}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 font-semibold text-yunicity-primary hover:underline"
        >
          {MAP_RETRY}
        </button>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-3" data-map-desktop-map-stage="">
      <MapDesktopSearchHeader
        activeCategory={portalFilters.category}
        onSelectCategory={onPortalCategoryChange}
      />

      {mapNotice ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {mapNotice}
        </p>
      ) : null}

      {statusBlock}

      {apiKey ? (
        <div className="relative min-h-[560px] h-[calc(100dvh-10rem)] overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
          {mapReady ? (
            <GoogleEventMap
              city={city}
              apiKey={apiKey}
              mapId={mapId}
              events={events}
              culturalPlaces={culturalPlaces}
              partnerMarkers={partnerMarkers}
              neighborhoodMarkers={neighborhoodMarkers}
              tribeMarkers={tribeMarkers}
              selection={selection}
              onBoundsChange={onBoundsChange}
              onSelectEvent={onSelectEvent}
              onSelectPlace={onSelectPlace}
              onSelectPartner={onSelectPartner}
              onSelectNeighborhood={onSelectNeighborhood}
              onSelectTribe={onSelectTribe}
              onClearSelection={onClearSelection}
              focusedEventId={focusedEventId}
              selectedCulturalSlug={selectedCulturalSlug}
              selectedPartnerSlug={selectedPartnerSlug}
              recenterSignal={recenterSignal}
              flyToTarget={flyToTarget}
              zoomAdjustSignal={zoomAdjustSignal}
              fullHeight
              hideRecenterButton
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-neutral-500" role="status">
              {MAP_LOADING}
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center">
            <button
              type="button"
              onClick={onSearchInZone}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-neutral-200/90 bg-white px-4 py-2 text-xs font-semibold text-neutral-800 shadow-md transition hover:border-yunicity-primary/30 hover:text-yunicity-primary"
            >
              <Crosshair className="h-3.5 w-3.5" aria-hidden />
              {MAP_DESKTOP_SEARCH_IN_ZONE}
            </button>
          </div>

          <MapDesktopMapControls
            onLocate={onLocate}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
          />

          <MapDesktopAroundBanner
            items={aroundYouItems}
            maxDistanceKm={portalFilters.maxDistanceKm}
            onSelectItem={onAroundYouSelect}
          />

          {selectedPanel && !showDetailRail ? (
            <MapDesktopSelectionPopup payload={selectedPanel} onClose={onClearSelection} />
          ) : null}
        </div>
      ) : null}

      {showEmpty && apiKey ? (
        <div className="rounded-xl border border-neutral-200/90 bg-white px-4 py-6 text-center shadow-sm">
          <p className="font-medium text-neutral-800">{MAP_EMPTY}</p>
          <p className="mt-1 text-sm text-neutral-500">{MAP_EMPTY_HINT}</p>
        </div>
      ) : null}

      {truncated && eventsCount > 0 ? (
        <p className="text-center text-xs text-neutral-500">{MAP_TRUNCATED_HINT}</p>
      ) : null}

      {loading && hasLoaded ? (
        <p className="text-center text-xs text-neutral-400" aria-live="polite">
          {MAP_LOADING}
        </p>
      ) : null}
    </div>
  );
}
