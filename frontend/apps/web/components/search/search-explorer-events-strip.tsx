"use client";

import type { LocalEvent } from "@yunicity/types";
import { formatEventDateRange } from "@yunicity/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

type SearchExplorerEventsStripProps = {
  events: LocalEvent[];
  city: string;
};

export function SearchExplorerEventsStrip({ events, city }: SearchExplorerEventsStripProps) {
  if (events.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="explorer-events-strip">
      <div className="flex items-end justify-between gap-3">
        <h2 id="explorer-events-strip" className="text-lg font-bold text-neutral-900">
          Moments à venir
        </h2>
        <Link
          href={`/sortir?city=${encodeURIComponent(city)}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          Voir l&apos;agenda
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {events.slice(0, 4).map((event) => (
          <li key={event.id}>
            <Link
              href={`/events/${event.id}`}
              className="block rounded-2xl border border-neutral-200/90 bg-white px-4 py-3 transition hover:border-yunicity-primary/25 hover:bg-yunicity-primary-soft/30"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-yunicity-primary">
                Moment local
              </p>
              <p className="mt-1 font-semibold text-neutral-900">{event.title}</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {formatEventDateRange(event.starts_at, event.ends_at)}
                {event.location_name ? ` · ${event.location_name}` : null}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
