"use client";

import { WebAppShell } from "@/components/layout";
import { useYunicityApi } from "@/hooks/use-yunicity-api";
import { useAuth } from "@/lib/auth/auth-provider";
import type { LocalEvent } from "@yunicity/types";
import {
  EVENTS_EMPTY,
  EVENTS_PAGE_SUBTITLE,
  EVENTS_PAGE_TITLE,
  eventTypeLabel,
  formatEventDateRange,
  formatEventLocation,
} from "@yunicity/utils";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

function EventListCard({ event }: { event: LocalEvent }) {
  const typeLabel = eventTypeLabel(event.event_type);
  return (
    <Link
      href={`/events/${event.id}`}
      className="block rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-[#2A2FFF]/30"
    >
      {typeLabel ? (
        <p className="text-xs font-medium uppercase tracking-wide text-[#2A2FFF]">{typeLabel}</p>
      ) : null}
      <h2 className="mt-1 text-lg font-semibold text-neutral-900">{event.title}</h2>
      <p className="mt-2 text-sm text-neutral-600">
        {formatEventDateRange(event.starts_at, event.ends_at)}
      </p>
      <p className="text-sm text-neutral-500">{formatEventLocation(event, event.city)}</p>
      {event.organization ? (
        <p className="mt-2 text-xs text-neutral-500">Par {event.organization.name}</p>
      ) : null}
    </Link>
  );
}

export function EventsScreen() {
  const api = useYunicityApi();
  const { user } = useAuth();
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.events.listEvents({
        city: user?.city ?? undefined,
      });
      setEvents(response.items);
    } catch {
      setError("Impossible de charger les moments locaux.");
    } finally {
      setLoading(false);
    }
  }, [api.events, user?.city]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <WebAppShell
      contentWidth="wide"
      context={
        <aside className="space-y-4 text-sm text-neutral-600">
          <p className="font-semibold text-neutral-900">Cette semaine à Reims</p>
          <p>Moments locaux à découvrir, sans pression ni compteur viral.</p>
          <p className="text-neutral-500">Découvertes proches de chez vous.</p>
        </aside>
      }
    >
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">{EVENTS_PAGE_TITLE}</h1>
        <p className="mt-2 text-neutral-600">{EVENTS_PAGE_SUBTITLE}</p>
      </header>
      {loading ? <p className="text-neutral-500">Chargement…</p> : null}
      {error ? <p className="text-red-600">{error}</p> : null}
      {!loading && !error && events.length === 0 ? (
        <p className="text-neutral-500">{EVENTS_EMPTY}</p>
      ) : null}
      <ul className="space-y-4">
        {events.map((event) => (
          <li key={event.id}>
            <EventListCard event={event} />
          </li>
        ))}
      </ul>
    </WebAppShell>
  );
}
