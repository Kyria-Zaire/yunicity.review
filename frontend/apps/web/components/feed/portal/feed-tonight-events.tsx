"use client";

import type { LocalEvent } from "@yunicity/types";
import Link from "next/link";

import { WebContextPanel } from "@/components/layout/web-context-panel";

/**
 * D1.2 — « Ce soir a <ville> », derive de `portal.events` (aucune requete).
 *
 * Un champ optionnel absent fait disparaitre la ligne : ni valeur par defaut,
 * ni compteur a zero, ni image de remplacement.
 */

function formatEventTime(event: LocalEvent): string | null {
  const instant = new Date(event.starts_at);
  if (Number.isNaN(instant.getTime())) return null;
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      timeZone: event.timezone || undefined,
      hour: "2-digit",
      minute: "2-digit",
    }).format(instant);
  } catch {
    return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(instant);
  }
}

export function FeedTonightEvents({ events, city }: { events: LocalEvent[]; city: string }) {
  if (events.length === 0) return null;

  return (
    <WebContextPanel
      title={`Ce soir à ${city}`}
      action={
        <Link
          href="/sortir"
          className="rounded text-xs font-semibold text-yunicity-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
        >
          Tout voir
        </Link>
      }
    >
      <ul data-feed-right-rail-module="tonight" className="space-y-3">
        {events.map((event) => {
          const time = formatEventTime(event);
          return (
            <li key={event.id}>
              <Link
                href={`/events/${event.id}`}
                className="flex gap-3 rounded-xl p-1 hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yunicity-primary"
              >
                {event.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- source distante non whitelistee
                  <img
                    src={event.cover_image_url}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    loading="lazy"
                  />
                ) : null}
                <span className="min-w-0 flex-1">
                  {time ? (
                    <span className="block text-xs font-semibold text-yunicity-primary">{time}</span>
                  ) : null}
                  <span className="block truncate text-sm font-semibold text-neutral-900">
                    {event.title}
                  </span>
                  {event.location_name ? (
                    <span className="block truncate text-xs text-neutral-500">
                      {event.location_name}
                    </span>
                  ) : null}
                  {typeof event.interest_count === "number" ? (
                    <span className="block text-xs text-neutral-500">
                      {event.interest_count} intéressé{event.interest_count > 1 ? "s" : ""}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </WebContextPanel>
  );
}
