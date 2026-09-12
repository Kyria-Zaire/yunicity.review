"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { EventDetailContextState } from "@/hooks/use-event-detail-context";
import type { LocalEvent } from "@yunicity/types";
import type { EventDesktopBadge } from "@yunicity/utils";
import {
  EVENT_DETAIL_DESKTOP_ADD_AGENDA,
  EVENT_DETAIL_DESKTOP_AGENDA_EMPTY,
  EVENT_DETAIL_DESKTOP_AGENDA_TITLE,
  EVENT_DETAIL_DESKTOP_CONTACT_ORG,
  EVENT_DETAIL_DESKTOP_CONTACT_ORG_BODY,
  EVENT_DETAIL_DESKTOP_FREE_BOOKING,
  EVENT_DETAIL_DESKTOP_HELP_TITLE,
  EVENT_DETAIL_DESKTOP_INTEREST,
  EVENT_DETAIL_DESKTOP_INTEREST_DONE,
  EVENT_DETAIL_DESKTOP_NEXT_SAVED,
  EVENT_DETAIL_DESKTOP_NO_CONFLICT,
  EVENT_DETAIL_DESKTOP_PARTICIPATE,
  EVENT_DETAIL_DESKTOP_PARTICIPATE_HINT,
  EVENT_DETAIL_DESKTOP_REPORT,
  EVENT_DETAIL_DESKTOP_REPORT_BODY,
  EVENT_DETAIL_DESKTOP_REPORT_SOON,
  EVENT_DETAIL_DESKTOP_SIMILAR_CTA,
  EVENT_DETAIL_DESKTOP_SIMILAR_TITLE,
  EVENT_DETAIL_DESKTOP_SIMILAR_VIEW_ALL,
  EVENT_DETAIL_DESKTOP_VIEW_AGENDA,
  MY_AGENDA_HREF,
  buildGoogleCalendarUrl,
  buildPartnerPlaceHrefFromEvent,
  eventDesktopSimilarBadgeLabel,
  eventDesktopSimilarBadgeTone,
  formatEventClockTime,
  formatEventCountdownLabel,
  formatEventDateBadge,
  formatEventDesktopAgendaWhen,
  formatEventDesktopLocationLine,
  formatEventDesktopWhenLine,
  resolveFeaturedCarouselEventImage,
} from "@yunicity/utils";
import {
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flag,
  Heart,
  Mail,
  MapPin,
  Ticket,
} from "lucide-react";
import Link from "next/link";

const SIMILAR_BADGE_CLASS: Record<EventDesktopBadge["tone"], string> = {
  culture: "bg-blue-100 text-blue-700",
  featured: "bg-amber-100 text-amber-900",
  music: "bg-pink-100 text-pink-700",
  food: "bg-orange-100 text-orange-700",
  local: "bg-emerald-100 text-emerald-700",
  default: "bg-neutral-100 text-neutral-700",
};

type EventDesktopRightRailProps = {
  event: LocalEvent;
  context: EventDetailContextState;
  toggling: boolean;
  isAuthenticated: boolean;
  onToggleInterest: () => void;
};

export function EventDesktopRightRail({
  event,
  context,
  toggling,
  isAuthenticated,
  onToggleInterest,
}: EventDesktopRightRailProps) {
  const whenLine = formatEventDesktopWhenLine(event);
  const countdown = formatEventCountdownLabel(event.starts_at, event.ends_at);
  const calendarUrl = buildGoogleCalendarUrl(event);
  const partnerHref = buildPartnerPlaceHrefFromEvent(event);
  const locationLine = formatEventDesktopLocationLine(event);
  const dateBadge = formatEventDateBadge(event.starts_at);
  const related = context.relatedEvents.filter((item) => item.id !== event.id).slice(0, 2);
  const nextSaved = context.savedEvents
    .filter((item) => item.id !== event.id)
    .slice(0, 1)[0];
  const nextSavedImage = nextSaved ? resolveFeaturedCarouselEventImage(nextSaved) : null;

  return (
    <aside className="space-y-4" data-event-desktop-sidebar="">
      <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <div className="flex gap-3">
          {dateBadge ? (
            <div className="flex w-[4.35rem] shrink-0 flex-col items-center justify-center rounded-xl bg-yunicity-primary px-1.5 py-2.5 text-center text-white">
              <span className="text-[10px] font-bold uppercase tracking-wide leading-none">
                {dateBadge.weekday.replace(/\.$/, "")}.
              </span>
              <span className="mt-0.5 text-xl font-bold leading-none tabular-nums">{dateBadge.day}</span>
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide leading-none">
                {dateBadge.month}
              </span>
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold text-neutral-900">{whenLine}</p>
          </div>
        </div>

        <ul className="mt-4 space-y-2 text-sm text-neutral-600">
          <li className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
            <span>{locationLine}</span>
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

        <div className="mt-4 space-y-2.5">
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
            <Heart
              className={`h-4 w-4 ${event.interested_by_me ? "fill-current" : ""}`}
              aria-hidden
            />
            {event.interested_by_me
              ? EVENT_DETAIL_DESKTOP_INTEREST_DONE
              : EVENT_DETAIL_DESKTOP_INTEREST}
          </button>
          {calendarUrl ? (
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 py-1 text-sm font-semibold text-yunicity-primary transition hover:underline"
            >
              <CalendarPlus className="h-4 w-4" aria-hidden />
              {EVENT_DETAIL_DESKTOP_ADD_AGENDA}
            </a>
          ) : null}
          <p className="pt-1 text-center text-[11px] leading-relaxed text-neutral-400">
            {EVENT_DETAIL_DESKTOP_PARTICIPATE_HINT}
          </p>
        </div>
      </div>

      {/* Votre agenda */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{EVENT_DETAIL_DESKTOP_AGENDA_TITLE}</h2>
        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          {EVENT_DETAIL_DESKTOP_NO_CONFLICT}
        </p>
        {nextSaved ? (
          <div className="mt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              {EVENT_DETAIL_DESKTOP_NEXT_SAVED}
            </p>
            <Link
              href={`/events/${nextSaved.id}`}
              className="mt-2 flex gap-3 rounded-xl border border-neutral-100 p-2 transition hover:border-neutral-200"
            >
              <CulturalImage
                src={nextSavedImage}
                alt=""
                placeName={nextSaved.title}
                className="h-12 w-12 shrink-0 rounded-lg"
                sizes="48px"
                showFallbackCaption={false}
              />
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-semibold text-neutral-900">
                  {nextSaved.title}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {formatEventDesktopAgendaWhen(nextSaved.starts_at)}
                </p>
              </div>
            </Link>
          </div>
        ) : (
          <p className="mt-3 text-sm text-neutral-500">{EVENT_DETAIL_DESKTOP_AGENDA_EMPTY}</p>
        )}
        <Link
          href={MY_AGENDA_HREF}
          className="mt-3 inline-flex items-center gap-0.5 text-xs font-semibold text-yunicity-primary hover:underline"
        >
          {EVENT_DETAIL_DESKTOP_VIEW_AGENDA}
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {/* Aide */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-900">{EVENT_DETAIL_DESKTOP_HELP_TITLE}</h2>
        <ul className="mt-3 divide-y divide-neutral-100">
          <li>
            {partnerHref ? (
              <Link
                href={partnerHref}
                className="flex items-center gap-3 py-2.5 transition hover:bg-neutral-50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                  <Mail className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-neutral-900">
                    {EVENT_DETAIL_DESKTOP_CONTACT_ORG}
                  </span>
                  <span className="block text-xs text-neutral-500">
                    {EVENT_DETAIL_DESKTOP_CONTACT_ORG_BODY}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
              </Link>
            ) : (
              <div className="flex items-center gap-3 py-2.5 opacity-70">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                  <Mail className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-neutral-900">
                    {EVENT_DETAIL_DESKTOP_CONTACT_ORG}
                  </span>
                  <span className="block text-xs text-neutral-500">
                    {EVENT_DETAIL_DESKTOP_CONTACT_ORG_BODY}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
              </div>
            )}
          </li>
          <li>
            <button
              type="button"
              disabled
              title={EVENT_DETAIL_DESKTOP_REPORT_SOON}
              className="flex w-full items-center gap-3 py-2.5 text-left opacity-70"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-600">
                <Flag className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-neutral-900">
                  {EVENT_DETAIL_DESKTOP_REPORT}
                </span>
                <span className="block text-xs text-neutral-500">
                  {EVENT_DETAIL_DESKTOP_REPORT_BODY}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" aria-hidden />
            </button>
          </li>
        </ul>
      </div>

      {/* Similaires — grille 2 cols */}
      {related.length > 0 ? (
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-neutral-900">
              {EVENT_DETAIL_DESKTOP_SIMILAR_TITLE}
            </h2>
            <Link
              href="/sortir"
              className="text-xs font-semibold text-yunicity-primary hover:underline"
            >
              {EVENT_DETAIL_DESKTOP_SIMILAR_VIEW_ALL}
            </Link>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-3">
            {related.map((item) => {
              const imageUrl = resolveFeaturedCarouselEventImage(item);
              const badgeLabel = eventDesktopSimilarBadgeLabel(item.event_type);
              const badgeTone = eventDesktopSimilarBadgeTone(item.event_type);
              const metaLine = `${formatEventClockTime(item.starts_at)} • ${item.district?.trim() || item.location_name}`;
              return (
                <li key={item.id}>
                  <Link
                    href={`/events/${item.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-xl border border-neutral-100 transition hover:border-neutral-200"
                  >
                    <div className="relative aspect-[4/3] bg-neutral-100">
                      <CulturalImage
                        src={imageUrl}
                        alt=""
                        placeName={item.title}
                        className="absolute inset-0 size-full"
                        sizes="160px"
                        showFallbackCaption={false}
                      />
                      <span
                        className={`absolute left-2 top-2 inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${SIMILAR_BADGE_CLASS[badgeTone]}`}
                      >
                        {badgeLabel}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-2.5">
                      <p className="line-clamp-2 text-xs font-bold leading-snug text-neutral-900 group-hover:text-yunicity-primary">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[10px] text-neutral-500">{metaLine}</p>
                      <span className="mt-2 text-[10px] font-semibold text-yunicity-primary">
                        {EVENT_DETAIL_DESKTOP_SIMILAR_CTA}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </aside>
  );
}
