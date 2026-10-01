"use client";

import { MapDesktopLeftRail } from "@/components/map/desktop/map-desktop-left-rail";
import { MapDesktopMapStage } from "@/components/map/desktop/map-desktop-map-stage";
import { MapDesktopRightRail } from "@/components/map/desktop/map-desktop-right-rail";
import type { MapDesktopLeftRailProps } from "@/components/map/desktop/map-desktop-left-rail";
import type { MapDesktopMapStageProps } from "@/components/map/desktop/map-desktop-map-stage";
import type { MapPageContextState } from "@/hooks/use-map-page-context";
import type { CulturalPlaceListItem } from "@yunicity/types";
import type { ReactNode } from "react";

type MapDesktopScreenProps = {
  leftRail: MapDesktopLeftRailProps;
  mapStage: MapDesktopMapStageProps;
  context: MapPageContextState;
  culturalPlaces: CulturalPlaceListItem[];
  detailRail: ReactNode | null;
};

export function MapDesktopScreen({
  leftRail,
  mapStage,
  context,
  culturalPlaces,
  detailRail,
}: MapDesktopScreenProps) {
  return (
    <div
      className="hidden w-full lg:grid lg:grid-cols-[280px_minmax(0,1fr)_300px] lg:items-start lg:gap-4 xl:gap-5"
      data-map-desktop-root=""
    >
      <aside className="sticky top-4 max-h-[calc(100dvh-2rem)] overflow-y-auto pr-1">
        <MapDesktopLeftRail {...leftRail} />
      </aside>

      <MapDesktopMapStage {...mapStage} />

      <aside className="sticky top-4 max-h-[calc(100dvh-2rem)] overflow-y-auto pl-1">
        {detailRail ?? (
          <MapDesktopRightRail context={context} culturalPlaces={culturalPlaces} />
        )}
      </aside>
    </div>
  );
}
