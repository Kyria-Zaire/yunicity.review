"use client";

import type { LocalEvent } from "@yunicity/types";
import type { EventDesktopBadge } from "@yunicity/utils";
import {
  EVENT_DETAIL_DESKTOP_MORE,
  EVENT_DETAIL_DESKTOP_SAVE,
  EVENT_DETAIL_DESKTOP_SAVE_ACTIVE,
  EVENT_DETAIL_DESKTOP_SHARE,
  EVENT_DETAIL_META_ORGANIZER,
  EVENT_DETAIL_SHARE_COPIED,
  buildPartnerPlaceHrefFromEvent,
  eventIsPartnerEvent,
} from "@yunicity/utils";
import { BadgeCheck, Bookmark, MoreHorizontal, Share2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const BADGE_CLASS: Record<EventDesktopBadge["tone"], string> = {
  culture: "bg-blue-100 text-blue-800",
  featured: "bg-amber-100 text-amber-900",
  music: "bg-pink-100 text-pink-800",
  food: "bg-orange-100 text-orange-800",
  local: "bg-emerald-100 text-emerald-800",
  default: "bg-neutral-100 text-neutral-700",
};

type EventDesktopMetaProps = {
  event: LocalEvent;
  badges: EventDesktopBadge[];
  subtitle: string;
  toggling: boolean;
  isAuthenticated: boolean;
  onToggleInterest: () => void;
};

export function EventDesktopMeta({
  event,
  badges,
  subtitle,
  toggling,
  isAuthenticated,
  onToggleInterest,
}: EventDesktopMetaProps) {
  const [shareHint, setShareHint] = useState<string | null>(null);
  const partnerHref = buildPartnerPlaceHrefFromEvent(event);
  const isPartner = eventIsPartnerEvent(event);
  const orgName = event.organization?.name?.trim();

  async function handleShare() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/events/${event.id}`
        : `/events/${event.id}`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: event.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareHint(EVENT_DETAIL_SHARE_COPIED);
      window.setTimeout(() => setShareHint(null), 2000);
    } catch {
      setShareHint(null);
    }
  }

  const actions = (
    <div className="flex shrink-0 flex-wrap items-center gap-1 sm:gap-2">
      <button
        type="button"
        onClick={() => void handleShare()}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-100 hover:text-yunicity-primary"
      >
        <Share2 className="h-4 w-4" aria-hidden />
        {shareHint ?? EVENT_DETAIL_DESKTOP_SHARE}
      </button>
      <button
        type="button"
        disabled={toggling || !isAuthenticated}
        onClick={onToggleInterest}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-100 hover:text-yunicity-primary disabled:opacity-50"
      >
        <Bookmark
          className={`h-4 w-4 ${event.interested_by_me ? "fill-yunicity-primary text-yunicity-primary" : ""}`}
          aria-hidden
        />
        {event.interested_by_me ? EVENT_DETAIL_DESKTOP_SAVE_ACTIVE : EVENT_DETAIL_DESKTOP_SAVE}
      </button>
      <button
        type="button"
        disabled
        title={EVENT_DETAIL_DESKTOP_MORE}
        aria-label={EVENT_DETAIL_DESKTOP_MORE}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 opacity-60"
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );

  return (
    <div className="space-y-3" data-event-desktop-meta="">
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => (
          <span
            key={badge.label}
            className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${BADGE_CLASS[badge.tone]}`}
          >
            {badge.label}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="min-w-0 max-w-3xl text-3xl font-bold tracking-tight text-neutral-900 sm:text-[2rem] sm:leading-tight">
          {event.title}
        </h1>
        {actions}
      </div>

      {subtitle ? <p className="max-w-2xl text-base text-neutral-600">{subtitle}</p> : null}

      {orgName ? (
        <p className="flex items-center gap-2 text-sm text-neutral-700">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-yunicity-primary/10 text-xs font-bold text-yunicity-primary">
            {orgName.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0">
            {EVENT_DETAIL_META_ORGANIZER}{" "}
            {partnerHref ? (
              <Link
                href={partnerHref}
                className="font-semibold text-neutral-900 hover:text-yunicity-primary"
              >
                {orgName}
              </Link>
            ) : (
              <span className="font-semibold text-neutral-900">{orgName}</span>
            )}
          </span>
          {isPartner ? (
            <BadgeCheck
              className="h-4 w-4 shrink-0 text-yunicity-primary"
              aria-label="Partenaire vérifié"
            />
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
