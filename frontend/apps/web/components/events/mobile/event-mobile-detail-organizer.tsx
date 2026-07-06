"use client";

import type { LocalEventOrganization } from "@yunicity/types";
import {
  EVENT_DETAIL_MOBILE_ORGANIZER_FOLLOW,
  EVENT_DETAIL_MOBILE_ORGANIZER_FOLLOW_SOON,
  EVENT_DETAIL_MOBILE_ORGANIZER_MESSAGE,
  EVENT_DETAIL_MOBILE_ORGANIZER_MESSAGE_SOON,
  EVENT_DETAIL_MOBILE_ORGANIZER_TAGLINE,
  EVENT_DETAIL_MOBILE_ORGANIZER_TITLE,
  EVENT_DETAIL_MOBILE_ORGANIZER_VERIFIED,
  buildSearchUrl,
} from "@yunicity/utils";
import { BadgeCheck, MessageCircle } from "lucide-react";
import Link from "next/link";

type EventMobileDetailOrganizerProps = {
  organization: LocalEventOrganization;
  city: string;
};

/** Carte organisateur mobile (MOBILE-SORTIR-02). */
export function EventMobileDetailOrganizer({ organization, city }: EventMobileDetailOrganizerProps) {
  const profileHref = buildSearchUrl({
    q: organization.name,
    city,
    tab: "organization",
  });

  return (
    <section className="space-y-3 px-4" aria-label={EVENT_DETAIL_MOBILE_ORGANIZER_TITLE}>
      <h2 className="text-base font-bold text-neutral-900">{EVENT_DETAIL_MOBILE_ORGANIZER_TITLE}</h2>

      <div className="flex items-start gap-3 rounded-2xl border border-neutral-200/80 bg-white p-4">
        {organization.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={organization.logo_url}
            alt=""
            className="h-14 w-14 shrink-0 rounded-full border border-neutral-100 object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-bold uppercase leading-tight text-white">
            {organization.name.slice(0, 2)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <Link href={profileHref} className="group block">
            <p className="flex flex-wrap items-center gap-1 text-sm font-bold text-neutral-900 group-hover:text-yunicity-primary">
              {organization.name}
              {organization.is_verified ? (
                <BadgeCheck className="h-4 w-4 text-yunicity-primary" aria-hidden />
              ) : null}
            </p>
          </Link>
          {organization.is_verified ? (
            <p className="mt-0.5 text-xs text-neutral-500">{EVENT_DETAIL_MOBILE_ORGANIZER_VERIFIED}</p>
          ) : null}
          <p className="mt-0.5 text-xs text-neutral-500">
            {EVENT_DETAIL_MOBILE_ORGANIZER_TAGLINE(organization.city || city)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled
            title={EVENT_DETAIL_MOBILE_ORGANIZER_FOLLOW_SOON}
            className="rounded-full border border-yunicity-primary px-3 py-1.5 text-xs font-semibold text-yunicity-primary opacity-50"
          >
            {EVENT_DETAIL_MOBILE_ORGANIZER_FOLLOW}
          </button>
          <button
            type="button"
            disabled
            title={EVENT_DETAIL_MOBILE_ORGANIZER_MESSAGE_SOON}
            aria-label={EVENT_DETAIL_MOBILE_ORGANIZER_MESSAGE}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200 text-yunicity-primary opacity-50"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
