"use client";

import { EventsTribeChip } from "@/components/events/events-tribe-chip";
import type { EventDetailContextState } from "@/hooks/use-event-detail-context";
import type { LocalEvent } from "@yunicity/types";
import {
  EVENT_DETAIL_LEFT_CALENDAR_BODY,
  EVENT_DETAIL_LEFT_CALENDAR_CTA,
  EVENT_DETAIL_LEFT_CALENDAR_TITLE,
  EVENT_DETAIL_LEFT_SUBSCRIPTION_BODY,
  EVENT_DETAIL_LEFT_SUBSCRIPTION_CTA,
  EVENT_DETAIL_LEFT_SUBSCRIPTION_TITLE,
  EVENT_DETAIL_LEFT_TRIBES,
  EVENT_DETAIL_LEFT_TRIBES_SEE_ALL,
  buildGoogleCalendarUrl,
} from "@yunicity/utils";
import { CalendarPlus, Sparkles } from "lucide-react";
import Link from "next/link";

type EventDetailLeftRailProps = {
  context: EventDetailContextState;
  event: LocalEvent;
};

export function EventDetailLeftRail({ context, event }: EventDetailLeftRailProps) {
  const tribes = context.tribes.slice(0, 4);
  const calendarUrl = buildGoogleCalendarUrl(event);

  return (
    <>
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-yunicity-primary to-violet-600 p-5 text-white shadow-sm">
        <Sparkles className="h-5 w-5 opacity-90" aria-hidden />
        <h2 className="mt-2 text-base font-bold">{EVENT_DETAIL_LEFT_SUBSCRIPTION_TITLE}</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/90">
          {EVENT_DETAIL_LEFT_SUBSCRIPTION_BODY}
        </p>
        <Link
          href="/subscriptions"
          className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-yunicity-primary"
        >
          {EVENT_DETAIL_LEFT_SUBSCRIPTION_CTA}
        </Link>
      </div>

      <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-neutral-900">{EVENT_DETAIL_LEFT_TRIBES}</h2>
          <Link
            href="/tribes"
            className="text-xs font-semibold text-yunicity-primary hover:underline"
          >
            {EVENT_DETAIL_LEFT_TRIBES_SEE_ALL}
          </Link>
        </div>
        {tribes.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            Rejoignez une tribu pour enrichir vos sorties locales.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {tribes.map((tribe) => (
              <li key={tribe.slug}>
                <EventsTribeChip tribe={tribe} city={context.city} compact />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-5 shadow-sm">
        <CalendarPlus className="h-5 w-5 text-yunicity-primary" aria-hidden />
        <h2 className="mt-2 text-sm font-bold text-neutral-900">{EVENT_DETAIL_LEFT_CALENDAR_TITLE}</h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          {EVENT_DETAIL_LEFT_CALENDAR_BODY}
        </p>
        {calendarUrl ? (
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex rounded-full border border-yunicity-primary/30 bg-white px-4 py-2 text-sm font-semibold text-yunicity-primary transition hover:bg-yunicity-primary/5"
          >
            {EVENT_DETAIL_LEFT_CALENDAR_CTA}
          </a>
        ) : null}
      </div>
    </>
  );
}
