"use client";

import { TransitDepartureRow } from "@/components/map/transit-departure-row";
import { WebContextPanel } from "@/components/layout/web-context-panel";
import type { MapTransitQueryPoint } from "@/hooks/use-map-transit-nearby";
import { useMapTransitNearby } from "@/hooks/use-map-transit-nearby";
import {
  MAP_RAIL_TRANSIT_TITLE,
  MAP_TRANSIT_EMPTY,
  MAP_TRANSIT_EMPTY_ALT,
  MAP_TRANSIT_ERROR,
  MAP_TRANSIT_STATUS_FLUIDE,
  MAP_TRANSIT_VIEW_SCHEDULES,
  buildTransitCarouselItems,
} from "@yunicity/utils";

function TransitSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-neutral-100" />
      ))}
    </div>
  );
}

export function MapTransitNearby({
  point,
  title = MAP_RAIL_TRANSIT_TITLE,
  emptyMessage = MAP_TRANSIT_EMPTY,
}: {
  point: MapTransitQueryPoint;
  title?: string;
  emptyMessage?: string;
}) {
  const { data, loading, error } = useMapTransitNearby(point);
  const editorialEmptyMessage =
    Math.round((point.lat + point.lon) * 10) % 2 === 0 ? MAP_TRANSIT_EMPTY : MAP_TRANSIT_EMPTY_ALT;
  const resolvedEmptyMessage =
    emptyMessage === MAP_TRANSIT_EMPTY ? editorialEmptyMessage : emptyMessage;
  const items = buildTransitCarouselItems(data?.stops);
  const showFluideBadge = items.length > 0;

  return (
    <WebContextPanel
      title={title}
      action={
        showFluideBadge ? (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
            {MAP_TRANSIT_STATUS_FLUIDE}
          </span>
        ) : undefined
      }
    >
      {loading && !data ? <TransitSkeleton /> : null}

      {error ? (
        <p className="text-sm text-neutral-500">{MAP_TRANSIT_ERROR}</p>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <p className="text-sm text-neutral-500">{resolvedEmptyMessage}</p>
      ) : null}

      {!error && items.length > 0 ? (
        <div className="space-y-2">
          {data?.disclaimer ? (
            <p className="text-[11px] leading-snug text-neutral-500">{data.disclaimer}</p>
          ) : null}
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <TransitDepartureRow item={item} />
              </li>
            ))}
          </ul>
          <a
            href="https://www.grandreims-mobilites.fr/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs font-semibold text-yunicity-primary hover:underline"
          >
            {MAP_TRANSIT_VIEW_SCHEDULES}
          </a>
        </div>
      ) : null}
    </WebContextPanel>
  );
}
