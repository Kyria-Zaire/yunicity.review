"use client";

import type { LocalEvent } from "@yunicity/types";
import { MapTransitNearby } from "@/components/map/map-transit-nearby";
import {
  EVENT_DETAIL_GO_MAP_CTA,
  EVENT_DETAIL_GO_MAP_UNAVAILABLE,
  EVENT_DETAIL_GO_ROUTE_CTA,
  EVENT_DETAIL_GO_TITLE,
  EVENT_DETAIL_TRANSIT_EMPTY,
  EVENT_DETAIL_TRANSIT_TITLE,
  buildMapEventUrl,
  buildMapboxStaticPreviewUrl,
  eventHasMapCoordinates,
} from "@yunicity/utils";
import Link from "next/link";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type EventDetailGoThereProps = {
  event: LocalEvent;
};

export function EventDetailGoThere({ event }: EventDetailGoThereProps) {
  const hasCoords = eventHasMapCoordinates(event);
  const mapHref = buildMapEventUrl(event.id, { city: event.city });
  const routeHref = buildMapEventUrl(event.id, { city: event.city, route: true });
  const previewUrl =
    hasCoords && event.latitude != null && event.longitude != null
      ? buildMapboxStaticPreviewUrl(event.latitude, event.longitude, MAPBOX_TOKEN)
      : null;

  const transitPoint =
    hasCoords && event.latitude != null && event.longitude != null
      ? { lat: event.latitude, lon: event.longitude, city: event.city }
      : null;

  if (!hasCoords) {
    return null;
  }

  return (
    <section className="space-y-4" aria-labelledby="event-go-title">
      <h2 id="event-go-title" className="text-lg font-bold text-neutral-900">
        {EVENT_DETAIL_GO_TITLE}
      </h2>

      <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white">
        {previewUrl ? (
          <Link href={mapHref} className="block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt=""
              className="h-44 w-full object-cover sm:h-52"
            />
          </Link>
        ) : (
          <p className="border-b border-neutral-100 px-4 py-3 text-sm text-neutral-500">
            {EVENT_DETAIL_GO_MAP_UNAVAILABLE}
          </p>
        )}

        <div className="flex flex-wrap gap-2 p-4">
          <Link
            href={mapHref}
            className="rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-yunicity-primary-hover"
          >
            {EVENT_DETAIL_GO_MAP_CTA}
          </Link>
          <Link
            href={routeHref}
            className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-yunicity-primary/30 hover:text-yunicity-primary"
          >
            {EVENT_DETAIL_GO_ROUTE_CTA}
          </Link>
        </div>
      </div>

      {transitPoint ? (
        <MapTransitNearby
          point={transitPoint}
          title={EVENT_DETAIL_TRANSIT_TITLE}
          emptyMessage={EVENT_DETAIL_TRANSIT_EMPTY}
        />
      ) : null}
    </section>
  );
}
