"use client";

import {
  MapFilterRailContent,
  type MapFilterRailContentProps,
} from "@/components/map/map-filter-rail-content";

type MapLeftFilterRailProps = MapFilterRailContentProps;

/**
 * Rail de filtres desktop (≥1280, `xl:block`) : aside sticky de 224px enveloppant le contenu
 * partagé `MapFilterRailContent`. Le même contenu est réutilisé dans le drawer medium (T6) —
 * aucune logique dupliquée.
 */
export function MapLeftFilterRail(props: MapLeftFilterRailProps) {
  return (
    <aside className="hidden w-56 shrink-0 xl:block">
      <div className="sticky top-24">
        <MapFilterRailContent {...props} />
      </div>
    </aside>
  );
}
