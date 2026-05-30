"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { EventDetailContextState } from "@/hooks/use-event-detail-context";
import type { CulturalPlaceListItem, LocalEvent } from "@yunicity/types";
import {
  EVENT_DETAIL_LOCATION_MAP,
  EVENT_DETAIL_LOCATION_ROUTE,
  EVENT_DETAIL_LOCATION_TITLE,
  EVENT_DETAIL_PRACTICAL_SECTION_TITLE,
  EVENT_DETAIL_SAVED_BODY,
  EVENT_DETAIL_SAVED_CTA,
  EVENT_DETAIL_SAVED_TITLE,
  EVENT_DETAIL_SIMILAR_SEE_ALL,
  EVENT_DETAIL_SIMILAR_TITLE,
  buildEventPracticalRows,
  buildMapEventUrl,
  buildMapboxStaticPreviewUrl,
  eventHasMapCoordinates,
  eventTypeLabel,
  formatEventClockTime,
  formatEventDateRange,
  formatMapDistanceLabel,
  resolveFeaturedCarouselEventImage,
} from "@yunicity/utils";
import { Bookmark, Navigation } from "lucide-react";
import Link from "next/link";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

type EventDetailRightPortalRailProps = {
  context: EventDetailContextState;
  event: LocalEvent;
  venuePlace: CulturalPlaceListItem | null;
  userDistanceMeters: number | null;
};

export function EventDetailRightPortalRail({
  context,
  event,
  venuePlace,
  userDistanceMeters,
}: EventDetailRightPortalRailProps) {
  const practicalRows = buildEventPracticalRows(event, eventTypeLabel(event.event_type)).slice(0, 5);
  const mapHref = buildMapEventUrl(event.id, { city: event.city });
  const routeHref = buildMapEventUrl(event.id, { city: event.city, route: true });
  const previewUrl =
    eventHasMapCoordinates(event) && event.latitude != null && event.longitude != null
      ? buildMapboxStaticPreviewUrl(event.latitude, event.longitude, MAPBOX_TOKEN, {
          width: 560,
          height: 200,
        })
      : null;
  const distanceLabel = formatMapDistanceLabel(userDistanceMeters);
  const related = context.relatedEvents.slice(0, 3);

  return (
    <>
      {eventHasMapCoordinates(event) ? (
        <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm">
          <div className="border-b border-neutral-100 px-4 py-3">
            <h2 className="text-sm font-bold text-neutral-900">{EVENT_DETAIL_LOCATION_TITLE}</h2>
          </div>
          {previewUrl ? (
            <Link href={mapHref} className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="" className="h-40 w-full object-cover" />
            </Link>
          ) : null}
          <div className="space-y-2 p-4">
            <p className="text-sm font-medium text-neutral-900">{event.location_name}</p>
            {event.address ? (
              <p className="text-xs text-neutral-500">{event.address}</p>
            ) : null}
            {distanceLabel ? (
              <p className="text-xs font-semibold text-yunicity-primary">{distanceLabel}</p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href={routeHref}
                className="inline-flex items-center gap-1.5 rounded-full bg-yunicity-primary px-3 py-1.5 text-xs font-semibold text-white"
              >
                <Navigation className="h-3.5 w-3.5" aria-hidden />
                {EVENT_DETAIL_LOCATION_ROUTE}
              </Link>
              <Link
                href={mapHref}
                className="inline-flex rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700"
              >
                {EVENT_DETAIL_LOCATION_MAP}
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{EVENT_DETAIL_PRACTICAL_SECTION_TITLE}</h2>
        <dl className="mt-3 space-y-2.5">
          {practicalRows.map((row) => (
            <div key={row.label}>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
                {row.label}
              </dt>
              <dd className="text-sm text-neutral-800">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {related.length > 0 ? (
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-neutral-900">{EVENT_DETAIL_SIMILAR_TITLE}</h2>
            <Link
              href="/events"
              className="text-xs font-semibold text-yunicity-primary hover:underline"
            >
              {EVENT_DETAIL_SIMILAR_SEE_ALL}
            </Link>
          </div>
          <ul className="mt-3 space-y-3">
            {related.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/events/${item.id}`}
                  className="flex gap-3 rounded-xl border border-neutral-100 p-2 transition hover:border-neutral-200"
                >
                  <CulturalImage
                    src={resolveFeaturedCarouselEventImage(item)}
                    alt={item.title}
                    placeName={item.title}
                    className="h-14 w-14 shrink-0 rounded-lg"
                    sizes="56px"
                    showFallbackCaption={false}
                  />
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold text-neutral-900">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">{item.location_name}</p>
                    <p className="mt-0.5 text-xs font-medium tabular-nums text-yunicity-primary">
                      {formatEventDateRange(item.starts_at, item.ends_at).split(" · ")[0]}
                      {" · "}
                      {formatEventClockTime(item.starts_at)}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {event.interested_by_me ? (
        <div className="rounded-2xl border border-violet-100 bg-violet-50/80 p-4 shadow-sm">
          <Bookmark className="h-5 w-5 fill-violet-600 text-violet-600" aria-hidden />
          <h2 className="mt-2 text-sm font-bold text-neutral-900">{EVENT_DETAIL_SAVED_TITLE}</h2>
          <p className="mt-1 text-sm text-neutral-600">{EVENT_DETAIL_SAVED_BODY}</p>
          <Link
            href="/events"
            className="mt-3 inline-flex text-xs font-semibold text-yunicity-primary hover:underline"
          >
            {EVENT_DETAIL_SAVED_CTA}
          </Link>
        </div>
      ) : null}

      {venuePlace ? (
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm 2xl:hidden">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Lieu lié</p>
          <p className="mt-1 text-sm font-bold text-neutral-900">{venuePlace.name}</p>
          <Link
            href={`/map?place=${encodeURIComponent(venuePlace.slug)}&city=${encodeURIComponent(event.city)}`}
            className="mt-2 inline-flex text-xs font-semibold text-yunicity-primary hover:underline"
          >
            Voir sur la carte
          </Link>
        </div>
      ) : null}
    </>
  );
}
