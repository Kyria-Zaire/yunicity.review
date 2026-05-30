"use client";

import type { TransitCarouselItem } from "@yunicity/utils";
import { transitRouteLabel } from "@yunicity/utils";
import { BusFront, TrainFront, TramFront } from "lucide-react";

export function TransitModeIcon({ routeType }: { routeType: string }) {
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

type TransitDepartureRowProps = {
  item: TransitCarouselItem;
  className?: string;
};

export function TransitDepartureRow({ item, className }: TransitDepartureRowProps) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border border-neutral-100 bg-neutral-50/90 px-3 py-2.5 ${className ?? ""}`}
    >
      <span
        className="inline-flex min-w-[2rem] shrink-0 items-center justify-center rounded-md bg-white px-1.5 py-1 text-xs font-bold text-neutral-900 ring-1 ring-neutral-200"
        aria-hidden
      >
        {item.routeShortName}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline justify-between gap-2 text-sm font-semibold text-neutral-900">
          <span className="flex min-w-0 items-center gap-1.5 truncate">
            <TransitModeIcon routeType={item.routeType} />
            <span className="truncate">
              {transitRouteLabel(item.routeType, item.routeShortName)}
            </span>
          </span>
          <span className="shrink-0 tabular-nums text-yunicity-primary">{item.departureLabel}</span>
        </p>
        <p className="truncate text-[11px] text-neutral-500">
          {item.stopName}
          {item.headsign ? ` · ${item.headsign}` : ""}
        </p>
      </div>
    </div>
  );
}
