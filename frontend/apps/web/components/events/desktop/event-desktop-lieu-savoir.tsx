"use client";

import type { EventKnowRow } from "@yunicity/utils";
import type { LocalEvent } from "@yunicity/types";
import {
  EVENT_DETAIL_DESKTOP_KNOW,
  EVENT_DETAIL_DESKTOP_PLACE,
  EVENT_DETAIL_LOCATION_MAP,
  EVENT_DETAIL_LOCATION_ROUTE,
  buildMapEventUrl,
  buildOpenStreetMapEmbedUrl,
  resolveEventDesktopMapPoint,
} from "@yunicity/utils";
import { CalendarDays, Clock3, Globe2, MapPin, Navigation } from "lucide-react";
import Link from "next/link";

const KNOW_ICON = {
  globe: Globe2,
  calendar: CalendarDays,
  clock: Clock3,
} as const;

type PlaceLayout = "desktop-inline" | "stacked";

type EventDesktopLieuSavoirProps = {
  event: LocalEvent;
  knowRows: EventKnowRow[];
  placeLayout?: PlaceLayout;
};

function EventDetailMapPreview({
  locationName,
  embedSrc,
  immersive = false,
}: {
  locationName: string;
  embedSrc: string;
  immersive?: boolean;
}) {
  return (
    <div
      className={
        immersive
          ? "relative h-36 w-full overflow-hidden bg-[#E8EEF8]"
          : "relative min-h-[132px] overflow-hidden rounded-xl border border-neutral-100 bg-[#E8EEF8]"
      }
    >
      <iframe
        title={`Carte — ${locationName}`}
        src={embedSrc}
        className={
          immersive
            ? "pointer-events-none absolute -left-[2%] top-[-3%] h-[calc(100%+4rem)] w-[104%] border-0"
            : "pointer-events-none absolute left-0 top-0 h-[calc(100%+3.5rem)] w-full border-0"
        }
        loading="lazy"
        tabIndex={-1}
      />
    </div>
  );
}

function EventDetailPlaceSection({
  event,
  layout,
}: {
  event: LocalEvent;
  layout: PlaceLayout;
}) {
  const mapHref = buildMapEventUrl(event.id, { city: event.city });
  const routeHref = buildMapEventUrl(event.id, { city: event.city, route: true });
  const point = resolveEventDesktopMapPoint(event);
  const embedSrc = buildOpenStreetMapEmbedUrl(point.latitude, point.longitude);
  const addressLine =
    event.address?.trim() ||
    [event.location_name, event.city].filter(Boolean).join(", ");

  const mapCta = (
    <Link
      href={mapHref}
      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-yunicity-primary px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:opacity-95"
    >
      <MapPin className="h-4 w-4 shrink-0" aria-hidden />
      {EVENT_DETAIL_LOCATION_MAP}
    </Link>
  );

  const routeCta = (
    <Link
      href={routeHref}
      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-yunicity-primary px-3 py-2.5 text-center text-sm font-semibold text-yunicity-primary transition hover:bg-[#EEF0FF]"
    >
      <Navigation className="h-4 w-4 shrink-0" aria-hidden />
      {EVENT_DETAIL_LOCATION_ROUTE}
    </Link>
  );

  if (layout === "stacked") {
    return (
      <section
        className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
        data-event-medium-lieu=""
      >
        <div className="p-5 pb-4">
          <h2 className="text-base font-bold text-neutral-900">{EVENT_DETAIL_DESKTOP_PLACE}</h2>
          <p className="mt-2 text-sm font-semibold text-neutral-900">{event.location_name}</p>
          {addressLine ? <p className="text-sm text-neutral-500">{addressLine}</p> : null}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {mapCta}
            {routeCta}
          </div>
        </div>
        <EventDetailMapPreview locationName={event.location_name} embedSrc={embedSrc} immersive />
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-neutral-900">{EVENT_DETAIL_DESKTOP_PLACE}</h2>
      <p className="mt-2 text-sm font-semibold text-neutral-900">{event.location_name}</p>
      {addressLine ? <p className="text-sm text-neutral-500">{addressLine}</p> : null}

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_9.75rem] gap-3">
        <EventDetailMapPreview locationName={event.location_name} embedSrc={embedSrc} />
        <div className="flex flex-col justify-center gap-2">
          {mapCta}
          {routeCta}
        </div>
      </div>
    </section>
  );
}

export function EventDesktopLieuSavoir({
  event,
  knowRows,
  placeLayout = "desktop-inline",
}: EventDesktopLieuSavoirProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2" data-event-desktop-lieu="">
      <EventDetailPlaceSection event={event} layout={placeLayout} />

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-neutral-900">{EVENT_DETAIL_DESKTOP_KNOW}</h2>
        <ul className="mt-4 space-y-4">
          {knowRows.map((row) => {
            const Icon = KNOW_ICON[row.icon];
            return (
              <li key={row.title} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900">{row.title}</p>
                  <p className="text-xs text-neutral-500">{row.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
