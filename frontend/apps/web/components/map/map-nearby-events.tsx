"use client";

import type { MapEventItem } from "@yunicity/types";
import {
  MAP_NEARBY_EMPTY,
  MAP_NEARBY_EMPTY_HINT,
  MAP_NEARBY_TITLE,
  MAP_NEARBY_VIEW_ALL,
  mapEventPopupDate,
  mapEventPopupLocation,
} from "@yunicity/utils";
import Link from "next/link";

export function MapNearbyEvents({
  events,
  onSelectEvent,
}: {
  events: MapEventItem[];
  onSelectEvent?: (eventId: string) => void;
}) {
  const visible = events.slice(0, 4);

  return (
    <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-neutral-900">{MAP_NEARBY_TITLE}</h2>
        <Link
          href="/events"
          className="shrink-0 text-xs font-semibold text-yunicity-primary hover:underline"
        >
          {MAP_NEARBY_VIEW_ALL}
        </Link>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl bg-neutral-50 px-4 py-5 text-center">
          <p className="text-sm font-medium text-neutral-700">{MAP_NEARBY_EMPTY}</p>
          <p className="mt-1 text-xs text-neutral-500">{MAP_NEARBY_EMPTY_HINT}</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((event) => (
            <li key={event.id}>
              <article className="flex flex-col gap-1 rounded-xl border border-neutral-100 px-3 py-2.5 transition hover:border-yunicity-primary/20 hover:bg-yunicity-primary/[0.03] sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-neutral-900">{event.title}</h3>
                  <p className="text-xs text-neutral-500">{mapEventPopupDate(event)}</p>
                  <p className="truncate text-xs text-neutral-400">{mapEventPopupLocation(event)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {onSelectEvent ? (
                    <button
                      type="button"
                      onClick={() => onSelectEvent(event.id)}
                      className="rounded-full px-2.5 py-1 text-xs font-medium text-yunicity-primary hover:bg-yunicity-primary/10"
                    >
                      Carte
                    </button>
                  ) : null}
                  <Link
                    href={`/events/${event.id}`}
                    className="rounded-full bg-yunicity-primary px-3 py-1 text-xs font-semibold text-white hover:bg-yunicity-primary-hover"
                  >
                    Voir
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
