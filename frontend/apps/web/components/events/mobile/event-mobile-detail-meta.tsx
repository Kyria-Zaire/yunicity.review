"use client";

import type { LocalEvent } from "@yunicity/types";
import type { EventDesktopBadge } from "@yunicity/utils";
import { buildPartnerPlaceHrefFromEvent, eventIsPartnerEvent } from "@yunicity/utils";
import { BadgeCheck } from "lucide-react";
import Link from "next/link";

const BADGE_CLASS: Record<EventDesktopBadge["tone"], string> = {
  culture: "bg-blue-100 text-blue-800",
  featured: "bg-amber-100 text-amber-900",
  music: "bg-pink-100 text-pink-800",
  food: "bg-orange-100 text-orange-800",
  local: "bg-emerald-100 text-emerald-800",
  default: "bg-neutral-100 text-neutral-700",
};

type EventMobileDetailMetaProps = {
  event: LocalEvent;
  badges: EventDesktopBadge[];
  subtitle: string;
};

export function EventMobileDetailMeta({ event, badges, subtitle }: EventMobileDetailMetaProps) {
  const partnerHref = buildPartnerPlaceHrefFromEvent(event);
  const isPartner = eventIsPartnerEvent(event);
  const orgName = event.organization?.name?.trim();

  return (
    <div className="space-y-3" data-event-mobile-meta="">
      {badges.length > 0 ? (
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
      ) : null}

      <h1 className="text-[1.65rem] font-bold leading-tight tracking-tight text-neutral-900">
        {event.title}
      </h1>
      {subtitle ? <p className="text-sm leading-relaxed text-neutral-500">{subtitle}</p> : null}

      {orgName ? (
        <p className="flex items-center gap-2 text-sm text-neutral-800">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-yunicity-primary/10 text-xs font-bold text-yunicity-primary">
            {orgName.slice(0, 1).toUpperCase()}
          </span>
          {partnerHref ? (
            <Link href={partnerHref} className="font-semibold hover:text-yunicity-primary">
              {orgName}
            </Link>
          ) : (
            <span className="font-semibold">{orgName}</span>
          )}
          {isPartner ? (
            <BadgeCheck className="h-4 w-4 shrink-0 text-yunicity-primary" aria-label="Partenaire vérifié" />
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
