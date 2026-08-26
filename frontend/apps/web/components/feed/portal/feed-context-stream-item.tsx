"use client";

import type { PartnerOfferPublic } from "@yunicity/types";
import type { FeedHighlightEvent, FeedTrendItem, FeedTribeActivityItem } from "@yunicity/utils";
import {
  FEED_PORTAL_HIGHLIGHTS_CTA,
  FEED_PORTAL_HIGHLIGHTS_TITLE,
  FEED_PORTAL_TRIBES_CTA,
  FEED_PORTAL_TRIBES_TITLE,
  FEED_PORTAL_TRENDS_CTA,
  HOME_PRIVILEGE_TITLE,
} from "@yunicity/utils";
import { Calendar, Home, MapPin, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import type { FeedContextModuleFamily } from "@/lib/feed/feed-context-stream";

type FeedContextStreamItemProps = {
  family: FeedContextModuleFamily;
  city: string;
  highlights: readonly FeedHighlightEvent[];
  highlightOffer: PartnerOfferPublic | null;
  tribes: readonly FeedTribeActivityItem[];
  trends: readonly FeedTrendItem[];
};

function StreamModule({
  family,
  title,
  ctaHref,
  ctaLabel,
  children,
}: {
  family: FeedContextModuleFamily;
  title: string;
  ctaHref: string;
  ctaLabel: string;
  children: ReactNode;
}) {
  return (
    <li data-feed-stream-item="context-module" data-feed-context-module={family}>
      <section className="feed-context-stream-module rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-neutral-900">{title}</h2>
          <Link
            href={ctaHref}
            className="inline-flex min-h-11 shrink-0 items-center px-1 text-xs font-semibold text-yunicity-primary hover:underline"
          >
            {ctaLabel}
          </Link>
        </div>
        <div className="mt-3">{children}</div>
      </section>
    </li>
  );
}

function TrendIcon({ icon }: { icon: FeedTrendItem["icon"] }) {
  const className = "h-4 w-4 text-yunicity-primary";
  if (icon === "event") return <Calendar className={className} aria-hidden />;
  if (icon === "place") return <MapPin className={className} aria-hidden />;
  if (icon === "neighborhood") return <Home className={className} aria-hidden />;
  return <Users className={className} aria-hidden />;
}

export function FeedContextStreamItem({
  family,
  city,
  highlights,
  highlightOffer,
  tribes,
  trends,
}: FeedContextStreamItemProps) {
  if (family === "must-see") {
    if (highlights.length === 0) return null;
    return (
      <StreamModule
        family={family}
        title={FEED_PORTAL_HIGHLIGHTS_TITLE}
        ctaHref="/sortir"
        ctaLabel={FEED_PORTAL_HIGHLIGHTS_CTA}
      >
        <ul className="space-y-4">
          {highlights.map((event) => (
            <li key={event.id}>
              <Link href={event.href} className="flex gap-3 rounded-xl transition hover:bg-neutral-50">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                  {event.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-neutral-400">
                      <Calendar className="h-6 w-6" aria-hidden />
                    </span>
                  )}
                </div>
                <span className="min-w-0 flex-1">
                  <span className="inline-block rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-600">
                    {event.timeBadge}
                  </span>
                  <span className="mt-1 block text-sm font-semibold leading-snug text-neutral-900">
                    {event.title}
                  </span>
                  <span className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                    <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                    {event.locationLine}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </StreamModule>
    );
  }

  if (family === "local-privilege") {
    if (!highlightOffer) return null;
    return (
      <StreamModule family={family} title={HOME_PRIVILEGE_TITLE} ctaHref="/passport" ctaLabel="Voir l'avantage">
        <Link href="/passport" className="flex gap-3 rounded-xl transition hover:bg-neutral-50">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yunicity-primary-soft text-sm font-bold text-yunicity-primary">
            {highlightOffer.partner.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-medium text-yunicity-primary">{highlightOffer.partner.name}</span>
            <span className="block font-semibold text-neutral-900">{highlightOffer.title}</span>
            {highlightOffer.description ? (
              <span className="mt-1 block line-clamp-2 text-sm text-neutral-600">{highlightOffer.description}</span>
            ) : null}
          </span>
        </Link>
      </StreamModule>
    );
  }

  if (family === "tribes") {
    if (tribes.length === 0) return null;
    return (
      <StreamModule family={family} title={FEED_PORTAL_TRIBES_TITLE} ctaHref="/tribes" ctaLabel={FEED_PORTAL_TRIBES_CTA}>
        <ul className="space-y-3">
          {tribes.map((tribe) => (
            <li key={tribe.id}>
              <Link href={tribe.href} className="flex items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-neutral-50">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yunicity-primary-soft text-sm font-bold text-yunicity-primary">
                  {tribe.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-neutral-900">{tribe.name}</span>
                  <span className="block truncate text-xs text-neutral-500">{tribe.subtitle}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </StreamModule>
    );
  }

  if (trends.length === 0) return null;
  return (
    <StreamModule
      family={family}
      title={`En ce moment à ${city.trim() || "Reims"}`}
      ctaHref="/map"
      ctaLabel={FEED_PORTAL_TRENDS_CTA}
    >
      <ul className="space-y-3">
        {trends.map((item) => (
          <li key={item.id}>
            <Link href={item.href} className="flex items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-neutral-50">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF]">
                <TrendIcon icon={item.icon} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-neutral-900">{item.label}</span>
                <span className="block truncate text-xs text-neutral-500">{item.metaLine}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </StreamModule>
  );
}
