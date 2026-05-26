"use client";

import { WebContextPanel } from "@/components/layout/web-context-panel";
import type { MapTransitQueryPoint } from "@/hooks/use-map-transit-nearby";
import { useMapTransitNearby } from "@/hooks/use-map-transit-nearby";
import {
  MAP_RAIL_TRANSIT_TITLE,
  MAP_TRANSIT_EMPTY,
  MAP_TRANSIT_ERROR,
  MAP_TRANSIT_VIEW_SCHEDULES,
  formatTransitDepartureMinutes,
  groupTransitDeparturesByRoute,
  transitRouteIcon,
  transitRouteLabel,
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

export function MapTransitNearby({ point }: { point: MapTransitQueryPoint }) {
  const { data, loading, error } = useMapTransitNearby(point);

  return (
    <WebContextPanel title={MAP_RAIL_TRANSIT_TITLE}>
      {loading && !data ? <TransitSkeleton /> : null}

      {error ? (
        <p className="text-sm text-neutral-500">{MAP_TRANSIT_ERROR}</p>
      ) : null}

      {!loading && !error && data && data.stops.length === 0 ? (
        <p className="text-sm text-neutral-500">{MAP_TRANSIT_EMPTY}</p>
      ) : null}

      {!error && data && data.stops.length > 0 ? (
        <div className="space-y-3">
          {data.disclaimer ? (
            <p className="text-xs text-neutral-500">{data.disclaimer}</p>
          ) : null}
          <ul className="space-y-3">
            {data.stops.map((stop) => {
              const byRoute = groupTransitDeparturesByRoute(stop.departures);
              return (
                <li key={stop.stop_id} className="space-y-2">
                  {Array.from(byRoute.entries()).map(([routeKey, departures]) => {
                    const sample = departures[0]!;
                    return (
                      <div
                        key={`${stop.stop_id}-${routeKey}`}
                        className="rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-base leading-none" aria-hidden>
                            {transitRouteIcon(sample.route_type)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex rounded-md bg-white px-1.5 py-0.5 text-xs font-semibold text-neutral-800 ring-1 ring-neutral-200">
                                {sample.route_short_name}
                              </span>
                              <span className="text-sm font-medium text-neutral-900">
                                {transitRouteLabel(sample.route_type, sample.route_short_name)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-neutral-700">
                              <span className="font-medium">{stop.name}</span>
                              <span className="text-neutral-400"> → </span>
                              <span>{formatTransitDepartureMinutes(departures)}</span>
                            </p>
                            {sample.headsign ? (
                              <p className="mt-0.5 text-xs text-neutral-500">
                                Direction {sample.headsign}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </li>
              );
            })}
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
