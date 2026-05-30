"use client";

import { EventDetailAppShell } from "@/components/events/event-detail-app-shell";
import { EventDetailLeftRail } from "@/components/events/event-detail-left-rail";
import { EventDetailMainTabs } from "@/components/events/event-detail-main-tabs";
import { EventDetailPortalHero } from "@/components/events/event-detail-portal-hero";
import { EventDetailRightPortalRail } from "@/components/events/event-detail-right-portal-rail";
import { TransitNearbyCarouselRail } from "@/components/map/transit-nearby-carousel-rail";
import { useEventDetailContext } from "@/hooks/use-event-detail-context";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  EVENT_DETAIL_BACK_SORTIR,
  EVENT_DETAIL_LOADING,
  EVENT_DETAIL_NOT_FOUND,
  EVENT_DETAIL_RETRY,
  EVENT_DETAIL_TRANSIT_EMPTY,
  EVENT_DETAIL_TRANSIT_TITLE,
  eventHasMapCoordinates,
  haversineMeters,
  resolveEventVenuePlace,
} from "@yunicity/utils";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export function EventDetailScreen({ eventId }: { eventId: string }) {
  const api = useYunicityApi();
  const { user } = useAuth();
  const context = useEventDetailContext(eventId);
  const [toggling, setToggling] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lon: number } | null>(null);

  const event = context.event;

  const venuePlace = useMemo(
    () => (event ? resolveEventVenuePlace(event, context.culturalPlaces) : null),
    [context.culturalPlaces, event],
  );

  const userDistanceMeters = useMemo(() => {
    if (!event || userCoords == null || event.latitude == null || event.longitude == null) {
      return null;
    }
    return haversineMeters(userCoords.lat, userCoords.lon, event.latitude, event.longitude);
  }, [event, userCoords]);

  async function handleInterest() {
    if (!context.event) return;
    setToggling(true);
    try {
      const current = context.event;
      const result = await api.events.toggleInterest(current.id);
      context.patchEvent({
        interested_by_me: result.interested,
        interest_count: result.interest_count,
      });
      await context.syncPlanningAfterInterest(result.interested, {
        ...current,
        interested_by_me: result.interested,
        interest_count: result.interest_count,
      });
    } finally {
      setToggling(false);
    }
  }

  const transitPoint =
    event &&
    eventHasMapCoordinates(event) &&
    event.latitude != null &&
    event.longitude != null
      ? { lat: event.latitude, lon: event.longitude, city: event.city }
      : null;

  useEffect(() => {
    if (!event || typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => undefined,
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 120_000 },
    );
  }, [event?.id]);

  const main = (
    <div className="space-y-6">
      <nav>
        <Link
          href="/events"
          className="inline-flex text-sm font-medium text-neutral-500 transition hover:text-yunicity-primary"
        >
          ← {EVENT_DETAIL_BACK_SORTIR}
        </Link>
      </nav>

      {context.loading ? (
        <p className="text-neutral-500" role="status">
          {EVENT_DETAIL_LOADING}
        </p>
      ) : null}

      {context.error || (!context.loading && !event) ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center">
          <p className="text-red-800">{EVENT_DETAIL_NOT_FOUND}</p>
          <button
            type="button"
            onClick={() => context.reload()}
            className="mt-3 text-sm font-semibold text-yunicity-primary hover:underline"
          >
            {EVENT_DETAIL_RETRY}
          </button>
        </div>
      ) : null}

      {event ? (
        <>
          <EventDetailPortalHero
            event={event}
            culturalPlaces={context.culturalPlaces}
            toggling={toggling}
            isAuthenticated={Boolean(user)}
            onToggleInterest={() => void handleInterest()}
          />

          <EventDetailMainTabs event={event} context={context} venuePlace={venuePlace} />

          {transitPoint ? (
            <TransitNearbyCarouselRail
              point={transitPoint}
              title={EVENT_DETAIL_TRANSIT_TITLE}
              emptyMessage={EVENT_DETAIL_TRANSIT_EMPTY}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );

  if (!event || context.loading) {
    return (
      <EventDetailAppShell>
        {main}
      </EventDetailAppShell>
    );
  }

  return (
    <EventDetailAppShell
      leftRail={<EventDetailLeftRail context={context} event={event} />}
      rightRail={
        <EventDetailRightPortalRail
          context={context}
          event={event}
          venuePlace={venuePlace}
          userDistanceMeters={userDistanceMeters}
        />
      }
    >
      {main}
    </EventDetailAppShell>
  );
}
