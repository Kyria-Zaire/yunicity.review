"use client";

import type { MapTransitQueryPoint } from "@/hooks/use-map-transit-nearby";
import { useMapTransitNearby } from "@/hooks/use-map-transit-nearby";
import {
  NEIGHBORHOOD_DETAIL_PORTAL_PRACTICAL_TRANSIT_EMPTY,
  buildTransitCarouselItems,
  summarizeTransitLines,
  transitRouteIcon,
} from "@yunicity/utils";

type NeighborhoodDetailTransitCompactProps = {
  point: MapTransitQueryPoint;
};

export function NeighborhoodDetailTransitCompact({ point }: NeighborhoodDetailTransitCompactProps) {
  const { data, loading, error } = useMapTransitNearby(point);
  const summary = summarizeTransitLines(buildTransitCarouselItems(data?.stops));

  if (loading && !data) {
    return (
      <div className="space-y-2" aria-busy="true">
        <div className="h-4 w-32 animate-pulse rounded bg-neutral-100" />
        <div className="h-4 w-40 animate-pulse rounded bg-neutral-100" />
      </div>
    );
  }

  if (error || !summary) {
    return <p className="text-sm text-neutral-600">{NEIGHBORHOOD_DETAIL_PORTAL_PRACTICAL_TRANSIT_EMPTY}</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-700">
      {summary.tram ? (
        <p className="inline-flex items-center gap-1.5">
          <span aria-hidden>{transitRouteIcon("tram")}</span>
          {summary.tram}
        </p>
      ) : null}
      {summary.bus ? (
        <p className="inline-flex items-center gap-1.5">
          <span aria-hidden>{transitRouteIcon("bus")}</span>
          {summary.bus}
        </p>
      ) : null}
    </div>
  );
}
