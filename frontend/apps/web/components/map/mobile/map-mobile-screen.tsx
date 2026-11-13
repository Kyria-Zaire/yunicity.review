"use client";

import { GoogleEventMap } from "@/components/map/google-event-map";
import {
  MapMobileAroundSheet,
  MapMobileCategoryPills,
  MapMobileHeader,
  MapMobileMapControls,
  MapMobileNeighborhoodBadge,
  MapMobileSearchBar,
} from "@/components/map/mobile";
import { MapSelectedPanel } from "@/components/map/map-selected-panel";
import type { MapAroundYouItem, MapMobileCategoryId, MapPortalFilters, MapTerritorySelection } from "@yunicity/utils";
import { MAP_TOKEN_MISSING_GOOGLE_WEB } from "@yunicity/utils";
import type { ReactNode } from "react";

type MapMobileScreenProps = {
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
  portalFilters: MapPortalFilters;
  onChangeFilters: (filters: MapPortalFilters) => void;
  mobileCategory: MapMobileCategoryId;
  onMobileCategorySelect: (category: MapMobileCategoryId) => void;
  nearestNeighborhoodLabel: string | null;
  onLocate: () => void;
  onNavigate: () => void;
  aroundYouItems: MapAroundYouItem[];
  onAroundYouSelect: (item: MapAroundYouItem) => void;
  selectedPanel: Parameters<typeof MapSelectedPanel>[0]["payload"] | null;
  showDetailRail: boolean;
  detailRail: ReactNode | null;
  mapNotice: string | null;
};

export function MapMobileScreen({
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
  portalFilters,
  onChangeFilters,
  mobileCategory,
  onMobileCategorySelect,
  nearestNeighborhoodLabel,
  onLocate,
  onNavigate,
  aroundYouItems,
  onAroundYouSelect,
  selectedPanel,
  showDetailRail,
  detailRail,
  mapNotice,
}: MapMobileScreenProps) {
  return (
    <div className="block w-full min-w-0 sm:hidden">
      <MapMobileHeader />
      <div className="relative h-[calc(100dvh-8.5rem)] min-h-[420px] overflow-hidden bg-white">
        {mapNotice ? (
          <p className="absolute inset-x-3 top-28 z-20 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            {mapNotice}
          </p>
        ) : null}

        {!apiKey ? (
          <p className="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {MAP_TOKEN_MISSING_GOOGLE_WEB}
          </p>
        ) : (
          <>
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
                fullHeight
                hideRecenterButton
              />
            ) : null}
            <MapMobileSearchBar filters={portalFilters} onChangeFilters={onChangeFilters} />
            <MapMobileCategoryPills
              activeCategory={mobileCategory}
              onSelectCategory={onMobileCategorySelect}
            />
            <MapMobileNeighborhoodBadge label={nearestNeighborhoodLabel} />
            <MapMobileMapControls onLocate={onLocate} onNavigate={onNavigate} />
            <MapMobileAroundSheet items={aroundYouItems} onSelectItem={onAroundYouSelect} />
            {selectedPanel && !showDetailRail ? (
              <MapSelectedPanel payload={selectedPanel} onClose={onClearSelection} />
            ) : null}
          </>
        )}
      </div>

      {showDetailRail ? <div className="px-4 py-4">{detailRail}</div> : null}
    </div>
  );
}
