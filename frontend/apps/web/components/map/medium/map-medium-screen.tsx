"use client";

import { GoogleEventMap } from "@/components/map/google-event-map";
import { MapAroundYouCarousel } from "@/components/map/map-around-you-carousel";
import { MapContextDrawer } from "@/components/map/map-context-drawer";
import { MapFilterRailContent } from "@/components/map/map-filter-rail-content";
import { MapSearchChips } from "@/components/map/map-search-chips";
import { MapSelectedPanel } from "@/components/map/map-selected-panel";
import type { MapDesktopMapStageProps } from "@/components/map/desktop/map-desktop-map-stage";
import type { MapFilterRailContentProps } from "@/components/map/map-filter-rail-content";
import {
  MAP_EMPTY,
  MAP_ERROR,
  MAP_LOADING,
  MAP_PORTAL_FILTERS_TITLE,
  MAP_RETRY,
  MAP_TRUNCATED_HINT,
} from "@yunicity/utils";
import { SlidersHorizontal } from "lucide-react";
import type { ReactNode } from "react";

type MapMediumScreenProps = {
  leftRail: MapFilterRailContentProps;
  mapStage: MapDesktopMapStageProps;
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  detailOpen: boolean;
  onDetailClose: () => void;
  detailRail: ReactNode | null;
};

export function MapMediumScreen({
  leftRail,
  mapStage,
  filtersOpen,
  onFiltersOpenChange,
  detailOpen,
  onDetailClose,
  detailRail,
}: MapMediumScreenProps) {
  const {
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
  } = mapStage;

  return (
    <div className="hidden min-w-0 space-y-4 sm:block lg:hidden">
      <button
        type="button"
        onClick={() => onFiltersOpenChange(true)}
        aria-haspopup="dialog"
        aria-expanded={filtersOpen}
        className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-yunicity-primary"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        {MAP_PORTAL_FILTERS_TITLE}
      </button>

      <MapContextDrawer
        open={filtersOpen}
        onClose={() => onFiltersOpenChange(false)}
        side="left"
        variant="modal"
        title={MAP_PORTAL_FILTERS_TITLE}
        closeLabel="Fermer les filtres"
      >
        <MapFilterRailContent {...leftRail} />
      </MapContextDrawer>

      <MapContextDrawer
        open={detailOpen}
        onClose={onDetailClose}
        side="right"
        variant="non-modal"
        title="Détail du lieu sélectionné"
        closeLabel="Fermer le détail"
      >
        {detailRail}
      </MapContextDrawer>

      {mapNotice ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {mapNotice}
        </p>
      ) : null}

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
            onClick={onRetry}
            className="mt-2 font-semibold text-yunicity-primary hover:underline"
          >
            {MAP_RETRY}
          </button>
        </div>
      ) : null}

      {apiKey ? (
        <div className="relative min-h-[520px] h-[calc(100dvh-9rem)] overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
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
            />
          ) : null}
          <MapSearchChips
            activeCategory={portalFilters.category}
            onSelectCategory={onPortalCategoryChange}
          />
          <MapAroundYouCarousel items={aroundYouItems} onSelectItem={onAroundYouSelect} />
          {selectedPanel && !showDetailRail ? (
            <MapSelectedPanel payload={selectedPanel} onClose={onClearSelection} />
          ) : null}
        </div>
      ) : null}

      {showEmpty && apiKey ? (
        <div className="rounded-xl border border-neutral-200/90 bg-white px-4 py-6 text-center shadow-sm">
          <p className="font-medium text-neutral-800">{MAP_EMPTY}</p>
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
