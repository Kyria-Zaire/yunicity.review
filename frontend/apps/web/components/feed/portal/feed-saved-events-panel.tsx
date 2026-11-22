"use client";

import type { LocalEvent } from "@yunicity/types";
import { formatEventClockTime, formatTerritorialLine } from "@yunicity/utils";
import { Calendar, MapPin } from "lucide-react";
import Link from "next/link";

type FeedSavedEventsPanelProps = {
  events: LocalEvent[];
  city: string;
};

/**
 * Fenêtre réellement affichée : la liste reçue est filtrée en amont sur les moments qui
 * commencent dans les 30 prochains jours (`use-feed-portal-context.ts`,
 * `isEventWithinDays(starts_at, 30)`). FEED-FAVORITES-NAMING-01 la rend visible, sans
 * changer le filtre.
 * TODO(debt): la durée (30) est écrite deux fois, ici et dans le filtre ; une constante
 * partagée sortirait du périmètre de FEED-FAVORITES-NAMING-01.
 */
const SAVED_MOMENTS_WINDOW = "Dans les 30 prochains jours";

export function FeedSavedEventsPanel({ events, city }: FeedSavedEventsPanelProps) {
  if (events.length === 0) {
    return (
      <div className="mt-5 rounded-2xl border border-dashed border-yunicity-border bg-white p-10 text-center shadow-sm">
        <p className="text-lg font-semibold text-neutral-900">Aucun moment enregistré</p>
        <p className="mt-1 text-sm text-neutral-500">{SAVED_MOMENTS_WINDOW}</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">
          Enregistrez un moment depuis le fil ou la page Sortir pour le retrouver ici.
        </p>
        <Link
          href="/sortir"
          className="mt-6 inline-flex rounded-full bg-yunicity-primary px-4 py-2 text-sm font-medium text-white hover:bg-yunicity-primary-hover"
        >
          Découvrir à {city}
        </Link>
      </div>
    );
  }

  return (
    <section className="mt-5" aria-label="Moments enregistrés">
      <h2 className="text-sm font-bold text-neutral-900">Moments enregistrés</h2>
      <p className="mb-4 mt-1 text-xs text-neutral-500">{SAVED_MOMENTS_WINDOW}</p>
      <ul className="space-y-3">
        {events.map((event) => {
          const place =
            formatTerritorialLine(event.neighborhood_summary, event.city, event.district) ??
            event.location_name;
          return (
            <li key={event.id}>
              <Link
                href={`/events/${event.id}`}
                className="flex gap-3 rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm transition hover:border-neutral-300"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yunicity-primary-soft text-yunicity-primary">
                  <Calendar className="h-5 w-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-neutral-900">{event.title}</span>
                  <span className="mt-1 block text-xs font-medium text-yunicity-primary">
                    {formatEventClockTime(event.starts_at)}
                  </span>
                  {place ? (
                    <span className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                      <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                      {place}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
