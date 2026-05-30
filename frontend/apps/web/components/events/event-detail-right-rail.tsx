"use client";

import { EventsTribeChip } from "@/components/events/events-tribe-chip";
import { MapTransitNearby } from "@/components/map/map-transit-nearby";
import { WebContextPanel } from "@/components/layout/web-context-panel";
import type { EventDetailContextState } from "@/hooks/use-event-detail-context";
import { useAuth } from "@/lib/auth/auth-provider";
import type { LocalEvent } from "@yunicity/types";
import {
  EVENT_DETAIL_RAIL_PASSPORT_CTA,
  EVENT_DETAIL_RAIL_PASSPORT_EMPTY,
  EVENT_DETAIL_RAIL_PASSPORT_TITLE,
  EVENT_DETAIL_RAIL_PLACES_EMPTY,
  EVENT_DETAIL_RAIL_PLACES_TITLE,
  EVENT_DETAIL_RAIL_PLANNING_TITLE,
  EVENT_DETAIL_RAIL_TRANSIT_TITLE,
  EVENT_DETAIL_RAIL_TRIBES_EMPTY,
  EVENT_DETAIL_RAIL_TRIBES_TITLE,
  EVENT_DETAIL_TRANSIT_EMPTY,
  EVENTS_RAIL_PLANNING_CTA,
  EVENTS_RAIL_PLANNING_CTA_LOGIN,
  EVENTS_RAIL_PLANNING_EMPTY,
  EVENTS_RAIL_PLANNING_VISITOR,
  eventHasMapCoordinates,
  formatEventClockTime,
  formatTerritorialLine,
  formatEventLocation,
} from "@yunicity/utils";
import Link from "next/link";

function RailSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-neutral-100" />
      ))}
    </div>
  );
}

function PlanningItem({ event }: { event: LocalEvent }) {
  const place =
    formatTerritorialLine(event.neighborhood_summary, event.city, event.district) ??
    formatEventLocation(event, event.city);

  return (
    <Link
      href={`/events/${event.id}`}
      className="block rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5 transition hover:border-neutral-200 hover:bg-white"
    >
      <p className="line-clamp-1 text-sm font-semibold text-neutral-900">{event.title}</p>
      <p className="mt-0.5 text-xs font-medium text-yunicity-primary tabular-nums">
        {formatEventClockTime(event.starts_at)}
      </p>
      <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">{place}</p>
    </Link>
  );
}

type EventDetailRightRailProps = {
  context: EventDetailContextState;
  currentEventId: string;
};

export function EventDetailRightRail({ context, currentEventId }: EventDetailRightRailProps) {
  const { user } = useAuth();
  const { loading, event, savedEvents, nearbyPlaces, tribes, passportOffers, city } = context;

  if (loading) {
    return <RailSkeleton />;
  }

  const planningEvents = savedEvents
    .filter((item) => item.id !== currentEventId)
    .slice(0, 4);
  const visibleTribes = tribes.slice(0, 3);
  const visiblePlaces = nearbyPlaces.slice(0, 3);
  const visibleOffers = passportOffers.slice(0, 2);

  const transitPoint =
    event && eventHasMapCoordinates(event) && event.latitude != null && event.longitude != null
      ? { lat: event.latitude, lon: event.longitude, city: event.city }
      : null;

  return (
    <div className="space-y-4">
      <WebContextPanel title={EVENT_DETAIL_RAIL_PLANNING_TITLE}>
        {!user ? (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-neutral-600">{EVENTS_RAIL_PLANNING_VISITOR}</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/login"
                className="inline-flex rounded-full bg-yunicity-primary px-4 py-2 text-sm font-semibold text-white"
              >
                {EVENTS_RAIL_PLANNING_CTA_LOGIN}
              </Link>
              <Link
                href="/login"
                className="inline-flex rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-yunicity-primary"
              >
                {EVENTS_RAIL_PLANNING_CTA}
              </Link>
            </div>
          </div>
        ) : planningEvents.length === 0 ? (
          <p className="text-sm text-neutral-500">{EVENTS_RAIL_PLANNING_EMPTY}</p>
        ) : (
          <ul className="space-y-2">
            {planningEvents.map((item) => (
              <li key={item.id}>
                <PlanningItem event={item} />
              </li>
            ))}
          </ul>
        )}
      </WebContextPanel>

      {transitPoint ? (
        <MapTransitNearby
          point={transitPoint}
          title={EVENT_DETAIL_RAIL_TRANSIT_TITLE}
          emptyMessage={EVENT_DETAIL_TRANSIT_EMPTY}
        />
      ) : null}

      <WebContextPanel title={EVENT_DETAIL_RAIL_PLACES_TITLE}>
        {visiblePlaces.length === 0 ? (
          <p className="text-sm text-neutral-500">{EVENT_DETAIL_RAIL_PLACES_EMPTY}</p>
        ) : (
          <ul className="space-y-2">
            {visiblePlaces.map((place) => (
              <li key={place.id}>
                <Link
                  href={`/map?place=${encodeURIComponent(place.slug)}&city=${encodeURIComponent(city)}`}
                  className="block rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5 transition hover:border-neutral-200 hover:bg-white"
                >
                  <p className="line-clamp-1 text-sm font-semibold text-neutral-900">{place.name}</p>
                  {place.short_description ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">
                      {place.short_description}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </WebContextPanel>

      <WebContextPanel title={EVENT_DETAIL_RAIL_TRIBES_TITLE}>
        {visibleTribes.length === 0 ? (
          <p className="text-sm text-neutral-500">{EVENT_DETAIL_RAIL_TRIBES_EMPTY}</p>
        ) : (
          <ul className="space-y-2">
            {visibleTribes.map((tribe) => (
              <li key={tribe.slug}>
                <EventsTribeChip tribe={tribe} city={city} compact />
              </li>
            ))}
          </ul>
        )}
      </WebContextPanel>

      <WebContextPanel title={EVENT_DETAIL_RAIL_PASSPORT_TITLE}>
        {visibleOffers.length === 0 ? (
          <p className="text-sm text-neutral-500">{EVENT_DETAIL_RAIL_PASSPORT_EMPTY}</p>
        ) : (
          <ul className="space-y-2">
            {visibleOffers.map((offer) => (
              <li key={offer.id}>
                <Link
                  href="/passport"
                  className="block rounded-xl border border-neutral-100 bg-neutral-50/80 px-3 py-2.5 transition hover:border-neutral-200 hover:bg-white"
                >
                  <p className="line-clamp-2 text-sm font-semibold text-neutral-900">{offer.title}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{offer.partner.name}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href="/passport"
          className="mt-2 inline-block text-xs font-semibold text-yunicity-primary hover:underline"
        >
          {EVENT_DETAIL_RAIL_PASSPORT_CTA}
        </Link>
      </WebContextPanel>
    </div>
  );
}
