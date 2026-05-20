"use client";

import { WebAppShell } from "@/components/layout";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import type { LocalEvent } from "@yunicity/types";
import {
  EVENT_INTEREST_CTA,
  EVENT_INTEREST_SAVED,
  eventTypeLabel,
  formatEventDateRange,
  formatEventLocation,
  formatTerritorialLine,
} from "@yunicity/utils";
import { NeighborhoodBadge } from "@/components/neighborhoods/neighborhood-badge";
import { useCallback, useEffect, useState } from "react";

export function EventDetailScreen({ eventId }: { eventId: string }) {
  const api = useYunicityApi();
  const [event, setEvent] = useState<LocalEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.events.getEvent(eventId);
      setEvent(data);
    } catch {
      setError("Moment introuvable.");
    } finally {
      setLoading(false);
    }
  }, [api.events, eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleInterest() {
    if (!event) return;
    setToggling(true);
    try {
      const result = await api.events.toggleInterest(event.id);
      setEvent({ ...event, interested_by_me: result.interested });
    } finally {
      setToggling(false);
    }
  }

  return (
    <WebAppShell contentWidth="readable">
      {loading ? <p className="text-neutral-500">Chargement…</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}
      {event ? (
        <article className="space-y-6">
          {event.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.cover_image_url}
              alt=""
              className="w-full rounded-xl object-cover max-h-72"
            />
          ) : null}
          {eventTypeLabel(event.event_type) ? (
            <p className="text-sm font-medium text-yunicity-primary">
              {eventTypeLabel(event.event_type)}
            </p>
          ) : null}
          <h1 className="text-2xl font-bold text-neutral-900">{event.title}</h1>
          <p className="text-neutral-600">
            {formatEventDateRange(event.starts_at, event.ends_at)}
          </p>
          <p className="text-neutral-600">
            {formatTerritorialLine(event.neighborhood_summary, event.city, event.district) ??
              formatEventLocation(event, event.city)}
          </p>
          {event.neighborhood_summary ? (
            <div className="mt-2">
              <NeighborhoodBadge summary={event.neighborhood_summary} city={event.city} />
            </div>
          ) : null}
          {event.organization ? (
            <p className="text-sm text-neutral-500">
              Organisé par <span className="font-medium">{event.organization.name}</span>
            </p>
          ) : null}
          {event.description ? (
            <p className="whitespace-pre-wrap text-neutral-700 leading-relaxed">
              {event.description}
            </p>
          ) : null}
          <button
            type="button"
            disabled={toggling}
            onClick={() => void handleInterest()}
            className="rounded-full bg-yunicity-primary px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {event.interested_by_me ? EVENT_INTEREST_SAVED : EVENT_INTEREST_CTA}
          </button>
        </article>
      ) : null}
    </WebAppShell>
  );
}
