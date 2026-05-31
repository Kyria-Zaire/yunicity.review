"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import { PartnerEventBadge } from "@/components/events/partner-event-badge";
import type { LocalEvent } from "@yunicity/types";
import {
  EVENT_DETAIL_INTEREST_CTA,
  EVENT_DETAIL_INTEREST_LOGIN,
  EVENT_DETAIL_INTEREST_SAVED,
  EVENT_DETAIL_SHARE,
  EVENT_DETAIL_SHARE_COPIED,
  buildMapEventUrl,
  buildPartnerPlaceHrefFromEvent,
  eventIsPartnerEvent,
  eventTypeLabel,
  formatEventDateBadge,
  formatEventInterestSocialLine,
  formatTerritorialLine,
  resolveEventHeroImage,
} from "@yunicity/utils";
import type { CulturalPlaceListItem } from "@yunicity/types";
import { BadgeCheck, Bookmark, MapPin, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type EventDetailPortalHeroProps = {
  event: LocalEvent;
  culturalPlaces: CulturalPlaceListItem[];
  toggling: boolean;
  isAuthenticated: boolean;
  onToggleInterest: () => void;
};

export function EventDetailPortalHero({
  event,
  culturalPlaces,
  toggling,
  isAuthenticated,
  onToggleInterest,
}: EventDetailPortalHeroProps) {
  const [shareHint, setShareHint] = useState<string | null>(null);
  const imageUrl = resolveEventHeroImage(event, culturalPlaces);
  const dateBadge = formatEventDateBadge(event.starts_at);
  const typeLabel = eventTypeLabel(event.event_type);
  const socialLine = formatEventInterestSocialLine(event.interest_count, event.interested_by_me);
  const mapHref = buildMapEventUrl(event.id, { city: event.city });
  const addressLine = [event.location_name, event.address].filter(Boolean).join(" · ");
  const partnerPlaceHref = buildPartnerPlaceHrefFromEvent(event);
  const isPartner = eventIsPartnerEvent(event);

  async function handleShare() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/events/${event.id}`
        : `/events/${event.id}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: event.title,
          text: event.description?.slice(0, 120),
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareHint(EVENT_DETAIL_SHARE_COPIED);
      setTimeout(() => setShareHint(null), 2500);
    } catch {
      /* annulation */
    }
  }

  return (
    <article className="relative overflow-hidden rounded-3xl bg-neutral-900 shadow-lg ring-1 ring-neutral-900/10">
      <CulturalImage
        src={imageUrl}
        alt={event.title}
        placeName={event.title}
        className="absolute inset-0 h-full w-full"
        sizes="(max-width: 1280px) 100vw, 900px"
        priority
        showFallbackCaption={false}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/95 via-neutral-950/55 to-neutral-900/25" />

      <div className="relative flex min-h-[320px] flex-col justify-end p-5 sm:min-h-[380px] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          {dateBadge ? (
            <div className="rounded-xl bg-white px-3 py-2 text-center text-neutral-900 shadow-md">
              <p className="text-[10px] font-bold uppercase tracking-wide">{dateBadge.weekday}</p>
              <p className="text-2xl font-black leading-none tabular-nums">{dateBadge.day}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide">{dateBadge.month}</p>
            </div>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleShare()}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25"
              aria-label={EVENT_DETAIL_SHARE}
            >
              <Share2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        {typeLabel ? (
          <p className="mt-4 inline-flex w-fit rounded-full bg-violet-600/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
            {typeLabel}
          </p>
        ) : null}

        {isPartner ? (
          <div className="mt-3">
            <PartnerEventBadge event={event} variant="dark" />
          </div>
        ) : null}

        <h1 className="mt-3 max-w-3xl text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">
          {event.title}
        </h1>

        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-white/90">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          <span>{addressLine}</span>
        </p>

        {event.organization ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-white/85">
            <span>
              {isPartner ? "Organisé par " : "Par "}
              <span className="font-semibold text-white">{event.organization.name}</span>
            </span>
            {event.organization.is_verified ? (
              <BadgeCheck className="h-4 w-4 text-sky-300" aria-label="Organisateur vérifié" />
            ) : null}
            {isPartner && partnerPlaceHref ? (
              <Link
                href={partnerPlaceHref}
                className="ml-1 text-xs font-semibold text-white/70 underline underline-offset-2 hover:text-white/90"
              >
                Voir le partenaire →
              </Link>
            ) : null}
          </div>
        ) : null}

        {socialLine ? (
          <p className="mt-3 text-sm font-medium text-white/80">{socialLine}</p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {isAuthenticated ? (
            <button
              type="button"
              disabled={toggling}
              onClick={onToggleInterest}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 transition hover:bg-white/90 disabled:opacity-60"
            >
              <Bookmark
                className={`h-4 w-4 ${event.interested_by_me ? "fill-current" : ""}`}
                aria-hidden
              />
              {event.interested_by_me ? EVENT_DETAIL_INTEREST_SAVED : EVENT_DETAIL_INTEREST_CTA}
            </button>
          ) : (
            <Link
              href="/login"
              className="inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900"
            >
              {EVENT_DETAIL_INTEREST_LOGIN}
            </Link>
          )}
          <Link
            href={mapHref}
            className="inline-flex rounded-full border border-white/35 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Voir sur la carte
          </Link>
          <button
            type="button"
            onClick={() => void handleShare()}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-4 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10"
          >
            <Share2 className="h-4 w-4" aria-hidden />
            {EVENT_DETAIL_SHARE}
          </button>
        </div>
        {shareHint ? <p className="mt-2 text-xs text-white/70">{shareHint}</p> : null}
      </div>
    </article>
  );
}
