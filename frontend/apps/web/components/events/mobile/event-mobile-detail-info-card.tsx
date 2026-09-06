"use client";

import type { LocalEvent } from "@yunicity/types";
import {
  EVENT_DETAIL_DESKTOP_ADD_AGENDA,
  EVENT_DETAIL_DESKTOP_FREE_BOOKING,
  EVENT_DETAIL_DESKTOP_INTEREST,
  EVENT_DETAIL_DESKTOP_INTEREST_DONE,
  EVENT_DETAIL_DESKTOP_PARTICIPATE,
  EVENT_DETAIL_MOBILE_RESPONSE_HINT,
  buildGoogleCalendarUrl,
  formatEventCountdownLabel,
  formatEventDateBadge,
  formatEventDesktopLocationLine,
  formatEventDesktopWhenLine,
} from "@yunicity/utils";
import { CalendarPlus, Clock3, Heart, MapPin, Ticket } from "lucide-react";

type EventMobileDetailInfoCardProps = {
  event: LocalEvent;
  toggling: boolean;
  isAuthenticated: boolean;
  onToggleInterest: () => void;
};

export function EventMobileDetailInfoCard({
  event,
  toggling,
  isAuthenticated,
  onToggleInterest,
}: EventMobileDetailInfoCardProps) {
  const whenLine = formatEventDesktopWhenLine(event);
  const countdown = formatEventCountdownLabel(event.starts_at, event.ends_at);
  const calendarUrl = buildGoogleCalendarUrl(event);
  const locationLine = formatEventDesktopLocationLine(event);
  const dateBadge = formatEventDateBadge(event.starts_at);

  return (
    <section
      className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
      data-event-mobile-participate=""
    >
      <div className="flex gap-3">
        {dateBadge ? (
          <div className="flex w-[4.35rem] shrink-0 flex-col items-center justify-center rounded-xl bg-yunicity-primary px-1.5 py-2.5 text-center text-white">
            <span className="text-[10px] font-bold uppercase leading-none tracking-wide">
              {dateBadge.weekday.replace(/\.$/, "")}.
            </span>
            <span className="mt-0.5 text-xl font-bold leading-none tabular-nums">{dateBadge.day}</span>
            <span className="mt-0.5 text-[10px] font-bold uppercase leading-none tracking-wide">
              {dateBadge.month}
            </span>
          </div>
        ) : null}
        <ul className="min-w-0 flex-1 space-y-1.5 text-sm text-neutral-600">
          <li className="text-base font-bold text-yunicity-primary">{whenLine}</li>
          <li className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            <span className="truncate">{locationLine}</span>
          </li>
          <li className="flex items-center gap-2">
            <Ticket className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            <span>{EVENT_DETAIL_DESKTOP_FREE_BOOKING}</span>
          </li>
          {countdown ? (
            <li className="flex items-center gap-2 font-medium text-amber-700">
              <Clock3 className="h-4 w-4 shrink-0" aria-hidden />
              <span>{countdown}</span>
            </li>
          ) : null}
        </ul>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          disabled={toggling || !isAuthenticated}
          onClick={onToggleInterest}
          className="flex w-full items-center justify-center rounded-xl bg-yunicity-primary px-4 py-3 text-sm font-bold text-white transition hover:opacity-95 disabled:opacity-50"
        >
          {EVENT_DETAIL_DESKTOP_PARTICIPATE}
        </button>
        <button
          type="button"
          disabled={toggling || !isAuthenticated}
          onClick={onToggleInterest}
          className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
            event.interested_by_me
              ? "border-yunicity-primary bg-[#EEF0FF] text-yunicity-primary"
              : "border-yunicity-primary/50 text-yunicity-primary hover:bg-[#EEF0FF]/60"
          }`}
        >
          <Heart className={`h-4 w-4 ${event.interested_by_me ? "fill-current" : ""}`} aria-hidden />
          {event.interested_by_me ? EVENT_DETAIL_DESKTOP_INTEREST_DONE : EVENT_DETAIL_DESKTOP_INTEREST}
        </button>
        {calendarUrl ? (
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 py-1 text-sm font-semibold text-yunicity-primary"
          >
            <CalendarPlus className="h-4 w-4" aria-hidden />
            {EVENT_DETAIL_DESKTOP_ADD_AGENDA}
          </a>
        ) : null}
        <p className="text-center text-[11px] text-neutral-400">{EVENT_DETAIL_MOBILE_RESPONSE_HINT}</p>
      </div>
    </section>
  );
}
