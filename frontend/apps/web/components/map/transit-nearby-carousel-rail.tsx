"use client";

import { TransitDepartureRow } from "@/components/map/transit-departure-row";
import type { MapTransitQueryPoint } from "@/hooks/use-map-transit-nearby";
import { useMapTransitNearby } from "@/hooks/use-map-transit-nearby";
import type { TransitCarouselItem } from "@yunicity/utils";
import {
  MAP_TRANSIT_EMPTY,
  MAP_TRANSIT_EMPTY_ALT,
  MAP_TRANSIT_ERROR,
  MAP_TRANSIT_STATUS_FLUIDE,
  MAP_TRANSIT_VIEW_SCHEDULES,
  buildTransitCarouselItems,
} from "@yunicity/utils";
import { useMemo, type CSSProperties } from "react";

function TransitSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-[4.5rem] w-[17rem] shrink-0 animate-pulse rounded-xl bg-neutral-100" />
      ))}
    </div>
  );
}

/** Duplique les lignes pour une boucle visuelle fluide (translate -50 %). */
function buildMarqueeLoop(items: TransitCarouselItem[]): TransitCarouselItem[] {
  if (items.length === 0) return [];
  const repeats = items.length < 4 ? 2 : 1;
  const segment = Array.from({ length: repeats }, () => items).flat();
  return [...segment, ...segment];
}

type TransitNearbyCarouselRailProps = {
  point: MapTransitQueryPoint;
  title: string;
  emptyMessage?: string;
};

export function TransitNearbyCarouselRail({
  point,
  title,
  emptyMessage = MAP_TRANSIT_EMPTY,
}: TransitNearbyCarouselRailProps) {
  const { data, loading, error } = useMapTransitNearby(point);

  const editorialEmptyMessage =
    Math.round((point.lat + point.lon) * 10) % 2 === 0 ? MAP_TRANSIT_EMPTY : MAP_TRANSIT_EMPTY_ALT;
  const resolvedEmptyMessage =
    emptyMessage === MAP_TRANSIT_EMPTY ? editorialEmptyMessage : emptyMessage;

  const items = useMemo(() => buildTransitCarouselItems(data?.stops), [data?.stops]);
  const loopItems = useMemo(() => buildMarqueeLoop(items), [items]);
  const segmentLength = loopItems.length / 2;

  const marqueeStyle = useMemo(
    () =>
      ({
        "--transit-marquee-duration": `${Math.max(28, segmentLength * 7)}s`,
      }) as CSSProperties,
    [segmentLength],
  );

  const showFluideBadge = items.length > 0;

  return (
    <section className="space-y-4" aria-labelledby="transit-carousel-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="transit-carousel-title" className="text-lg font-bold text-neutral-900">
          {title}
        </h2>
        {showFluideBadge ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-100">
            {MAP_TRANSIT_STATUS_FLUIDE}
          </span>
        ) : null}
      </div>

      {loading && !data ? <TransitSkeleton /> : null}

      {error ? <p className="text-sm text-neutral-500">{MAP_TRANSIT_ERROR}</p> : null}

      {!loading && !error && items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-6 text-center text-sm text-neutral-500">
          {resolvedEmptyMessage}
        </p>
      ) : null}

      {!error && items.length > 0 ? (
        <div className="space-y-3">
          {data?.disclaimer ? (
            <p className="text-[11px] leading-snug text-neutral-500">{data.disclaimer}</p>
          ) : null}

          <div className="relative -mx-1 px-1">
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-10 bg-gradient-to-r from-[var(--yunicity-background)] to-transparent"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-10 bg-gradient-to-l from-[var(--yunicity-background)] to-transparent"
              aria-hidden
            />

            <div className="transit-marquee-viewport pb-1">
              <ul
                className="transit-marquee-track"
                style={marqueeStyle}
                aria-label={`${title} — défilement automatique en boucle`}
              >
                {loopItems.map((item, index) => (
                  <li
                    key={`${item.id}-${index}`}
                    className="w-[17rem] shrink-0 sm:w-[18rem]"
                    aria-hidden={index >= segmentLength ? true : undefined}
                  >
                    <TransitDepartureRow item={item} className="h-full bg-white shadow-sm" />
                  </li>
                ))}
              </ul>
            </div>
          </div>

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
    </section>
  );
}
