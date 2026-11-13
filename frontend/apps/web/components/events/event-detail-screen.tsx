"use client";

import { EventDesktopDetailView } from "@/components/events/desktop";
import { EventDetailAppShell } from "@/components/events/event-detail-app-shell";
import { EventDetailCancelledState } from "@/components/events/event-detail-cancelled-state";
import type { EventEndedRemoval, EventEndedRemovalStatus } from "@/components/events/event-ended-actions";
import { EventMediumDetailView } from "@/components/events/medium";
import { EventMobileDetailView } from "@/components/events/mobile";
import { useEventDetailContext } from "@/hooks/use-event-detail-context";
import { useEventDetailTiming } from "@/hooks/use-event-detail-timing";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";
import {
  EVENT_DETAIL_LOADING,
  EVENT_DETAIL_NOT_FOUND,
  EVENT_DETAIL_RETRY,
  resolveEventVenuePlace,
} from "@yunicity/utils";
import { useMemo, useState } from "react";

export function EventDetailScreen({ eventId }: { eventId: string }) {
  const api = useYunicityApi();
  const { user } = useAuth();
  const context = useEventDetailContext(eventId);
  const [toggling, setToggling] = useState(false);
  // Retrait d'un événement terminé, rattaché à l'événement affiché (aucune fuite d'une fiche à l'autre).
  const [removal, setRemoval] = useState<{ eventId: string; status: EventEndedRemovalStatus }>({
    eventId,
    status: "idle",
  });

  const event = context.event;
  const timing = useEventDetailTiming(event?.starts_at ?? null, event?.ends_at ?? null);

  const venuePlace = useMemo(
    () => (event ? resolveEventVenuePlace(event, context.culturalPlaces) : null),
    [context.culturalPlaces, event],
  );

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

  const removalStatus: EventEndedRemovalStatus = removal.eventId === eventId ? removal.status : "idle";

  /**
   * EVENTS-PAST-01 — retrait d'un événement terminé. Le succès n'est annoncé que si le
   * serveur confirme `interested: false` ; toute autre issue garde le bouton et affiche l'erreur.
   */
  async function handleRemoveEnded() {
    const current = context.event;
    if (!current || removalStatus === "pending") return;
    setRemoval({ eventId, status: "pending" });
    let result: Awaited<ReturnType<typeof api.events.toggleInterest>>;
    try {
      result = await api.events.toggleInterest(current.id);
    } catch {
      setRemoval({ eventId, status: "error" });
      return;
    }
    context.patchEvent({
      interested_by_me: result.interested,
      interest_count: result.interest_count,
    });
    setRemoval({ eventId, status: result.interested ? "error" : "removed" });
    await context.syncPlanningAfterInterest(result.interested, {
      ...current,
      interested_by_me: result.interested,
      interest_count: result.interest_count,
    });
  }

  const endedRemoval: EventEndedRemoval = {
    status: removalStatus,
    onRemove: () => void handleRemoveEnded(),
  };

  const desktopMain = (
    <div className="web-desktop-event-detail-only">
      {context.loading ? (
        <p className="px-1 py-12 text-neutral-500" role="status">
          {EVENT_DETAIL_LOADING}
        </p>
      ) : null}

      {context.isCancelled ? (
        <div className="px-1 py-8">
          <EventDetailCancelledState />
        </div>
      ) : null}

      {!context.isCancelled && (context.error || context.isNotFound || (!context.loading && !event)) ? (
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

      {event && !context.isCancelled ? (
        <EventDesktopDetailView
          event={event}
          context={context}
          toggling={toggling}
          isAuthenticated={Boolean(user)}
          onToggleInterest={() => void handleInterest()}
          timing={timing}
          endedRemoval={endedRemoval}
        />
      ) : null}
    </div>
  );

  const mediumMain = (
    <div className="web-medium-event-detail-only">
      {context.loading ? (
        <p className="px-1 py-12 text-neutral-500" role="status">
          {EVENT_DETAIL_LOADING}
        </p>
      ) : null}

      {context.isCancelled ? (
        <div className="px-1 py-8">
          <EventDetailCancelledState />
        </div>
      ) : null}

      {!context.isCancelled && (context.error || context.isNotFound || (!context.loading && !event)) ? (
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

      {event && !context.isCancelled ? (
        <EventMediumDetailView
          event={event}
          context={context}
          toggling={toggling}
          isAuthenticated={Boolean(user)}
          onToggleInterest={() => void handleInterest()}
          timing={timing}
          endedRemoval={endedRemoval}
        />
      ) : null}
    </div>
  );

  const mobileMain = (
    <>
      {context.loading ? (
        <p className="web-mobile-event-detail-only px-4 py-12 text-center text-sm text-neutral-500" role="status">
          {EVENT_DETAIL_LOADING}
        </p>
      ) : null}

      {context.isCancelled ? (
        <div className="web-mobile-event-detail-only px-4 py-8">
          <EventDetailCancelledState />
        </div>
      ) : null}

      {!context.isCancelled && (context.error || context.isNotFound || (!context.loading && !event)) ? (
        <div className="web-mobile-event-detail-only px-4 py-8">
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
        </div>
      ) : null}

      {event && !context.isCancelled ? (
        <EventMobileDetailView
          event={event}
          context={context}
          venuePlace={venuePlace}
          toggling={toggling}
          isAuthenticated={Boolean(user)}
          onToggleInterest={() => void handleInterest()}
          timing={timing}
          endedRemoval={endedRemoval}
        />
      ) : null}
    </>
  );

  return (
    <EventDetailAppShell>
      {mobileMain}
      {mediumMain}
      {desktopMain}
    </EventDetailAppShell>
  );
}
