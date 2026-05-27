"use client";

import { EventDetailGoThere } from "@/components/events/event-detail-go-there";
import { EventDetailHero } from "@/components/events/event-detail-hero";
import { EventDetailNeighborhood } from "@/components/events/event-detail-neighborhood";
import { EventDetailPractical } from "@/components/events/event-detail-practical";
import { EventDetailRelated } from "@/components/events/event-detail-related";
import { EventDetailRightRail } from "@/components/events/event-detail-right-rail";
import { WebAppShell } from "@/components/layout";
import { useEventDetailContext } from "@/hooks/use-event-detail-context";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import {
  EVENT_DETAIL_DESCRIPTION_TITLE,
  EVENT_DETAIL_LOADING,
  EVENT_DETAIL_NOT_FOUND,
  EVENT_DETAIL_RETRY,
} from "@yunicity/utils";
import Link from "next/link";
import { useState } from "react";

export function EventDetailScreen({ eventId }: { eventId: string }) {
  const api = useYunicityApi();
  const context = useEventDetailContext(eventId);
  const [toggling, setToggling] = useState(false);

  async function handleInterest() {
    if (!context.event) return;
    setToggling(true);
    try {
      const current = context.event;
      const result = await api.events.toggleInterest(current.id);
      const interested = result.interested;
      context.patchEvent({ interested_by_me: interested });
      await context.syncPlanningAfterInterest(interested, {
        ...current,
        interested_by_me: interested,
      });
    } finally {
      setToggling(false);
    }
  }

  const event = context.event;

  return (
    <WebAppShell
      contentWidth="wide"
      context={<EventDetailRightRail context={context} currentEventId={eventId} />}
    >
      <div className="space-y-8 pb-12">
        <nav className="text-sm text-neutral-500">
          <Link href="/events" className="font-medium text-yunicity-primary hover:underline">
            ← Agenda des moments
          </Link>
        </nav>

        {context.loading ? (
          <p className="text-neutral-500">{EVENT_DETAIL_LOADING}</p>
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
            <EventDetailHero
              event={event}
              culturalPlaces={context.culturalPlaces}
              toggling={toggling}
              onToggleInterest={() => void handleInterest()}
            />

            {event.description ? (
              <section className="rounded-2xl border border-neutral-200/90 bg-white p-5 sm:p-6">
                <h2 className="text-lg font-bold text-neutral-900">{EVENT_DETAIL_DESCRIPTION_TITLE}</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700 sm:text-base">
                  {event.description}
                </p>
              </section>
            ) : null}

            <EventDetailPractical event={event} />
            <EventDetailGoThere event={event} />

            {context.neighborhoodContext ? (
              <EventDetailNeighborhood context={context.neighborhoodContext} />
            ) : null}

            <EventDetailRelated events={context.relatedEvents} />
          </>
        ) : null}
      </div>
    </WebAppShell>
  );
}
