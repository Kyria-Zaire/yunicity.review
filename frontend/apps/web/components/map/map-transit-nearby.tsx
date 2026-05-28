"use client";

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
  formatTransitDepartureMinutes,
  groupTransitDeparturesByRoute,
  transitRouteLabel,
} from "@yunicity/utils";
import { BusFront, TrainFront, TramFront } from "lucide-react";

function TransitSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-neutral-100" />
      ))}
    </div>
  );
}

function TransitModeIcon({ routeType }: { routeType: string }) {
  if (routeType === "tram" || routeType === "metro") {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-violet-700 ring-1 ring-violet-200"
        aria-label="Tram"
        title="Tram"
      >
        <TramFront className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    );
  }
  if (routeType === "bus" || routeType === "trolleybus") {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
        aria-label="Bus"
        title="Bus"
      >
        <BusFront className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200"
      aria-label="Transport"
      title="Transport"
    >
      <TrainFront className="h-3.5 w-3.5" aria-hidden="true" />
    </span>
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
  const usefulStops =
    data?.stops
      .map((stop) => {
        const byRoute = groupTransitDeparturesByRoute(stop.departures);
        const entries = Array.from(byRoute.entries()).filter(([, departures]) =>
          Boolean(formatTransitDepartureMinutes(departures)),
        );
        return { stop, entries };
      })
      .filter((item) => item.entries.length > 0) ?? [];

  const showFluideBadge = usefulStops.length > 0;

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

      {!loading && !error && usefulStops.length === 0 ? (
        <p className="text-sm text-neutral-500">{resolvedEmptyMessage}</p>
      ) : null}

      {!error && usefulStops.length > 0 ? (
        <div className="space-y-2">
          {data?.disclaimer ? (
            <p className="text-[11px] leading-snug text-neutral-500">{data.disclaimer}</p>
          ) : null}
          <ul className="space-y-2">
            {usefulStops.map(({ stop, entries }) => {
              return (
                <li key={stop.stop_id} className="space-y-1.5">
                  {entries.map(([routeKey, departures]) => {
                    const sample = departures[0]!;
                    const departureLabel = formatTransitDepartureMinutes(departures);
                    if (!departureLabel) return null;
                    return (
                      <div
                        key={`${stop.stop_id}-${routeKey}`}
                        className="flex items-center gap-2.5 rounded-lg border border-neutral-100 bg-neutral-50/90 px-2.5 py-2"
                      >
                        <span
                          className="inline-flex min-w-[2rem] shrink-0 items-center justify-center rounded-md bg-white px-1.5 py-1 text-xs font-bold text-neutral-900 ring-1 ring-neutral-200"
                          aria-hidden
                        >
                          {sample.route_short_name}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="flex items-baseline justify-between gap-2 text-sm font-semibold text-neutral-900">
                            <span className="flex min-w-0 items-center gap-1.5 truncate">
                              <TransitModeIcon routeType={sample.route_type} />
                              <span className="truncate">
                                {transitRouteLabel(sample.route_type, sample.route_short_name)}
                              </span>
                            </span>
                            <span className="shrink-0 tabular-nums text-yunicity-primary">
                              {departureLabel}
                            </span>
                          </p>
                          <p className="truncate text-[11px] text-neutral-500">
                            {stop.name}
                            {sample.headsign ? ` · ${sample.headsign}` : ""}
                          </p>
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
