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
import { Calendar, ChevronRight, Home, MapPin, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import type { FeedContextModuleFamily } from "@/lib/feed/feed-context-stream";

type FeedContextLayout = "default" | "desktop";

type FeedContextStreamItemProps = {
  family: FeedContextModuleFamily;
  city: string;
  highlights: readonly FeedHighlightEvent[];
  highlightOffer: PartnerOfferPublic | null;
  tribes: readonly FeedTribeActivityItem[];
  trends: readonly FeedTrendItem[];
  layout?: FeedContextLayout;
};

function highlightBadgeClass(tone: FeedHighlightEvent["timeBadgeTone"]): string {
  if (tone === "today") {
    return "bg-yunicity-primary-soft text-yunicity-primary";
  }
  if (tone === "tomorrow") {
    return "bg-amber-50 text-amber-800";
  }
  return "bg-neutral-100 text-neutral-600";
}

function StreamModule({
  family,
  title,
  ctaHref,
  ctaLabel,
  layout = "default",
  children,
}: {
  family: FeedContextModuleFamily;
  title: string;
  ctaHref: string;
  ctaLabel: string;
  layout?: FeedContextLayout;
  children: ReactNode;
}) {
  const surfaceClass =
    layout === "desktop"
      ? "feed-desktop-surface feed-context-stream-module p-4"
      : "feed-context-stream-module rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm";

  return (
    <li data-feed-stream-item="context-module" data-feed-context-module={family}>
      <section className={surfaceClass}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-neutral-900">{title}</h2>
          <Link
            href={ctaHref}
            className="inline-flex min-h-9 shrink-0 items-center rounded-full px-2 text-xs font-semibold text-yunicity-primary transition hover:bg-yunicity-primary-soft/60 hover:underline"
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
  layout = "default",
}: FeedContextStreamItemProps) {
  const isDesktop = layout === "desktop";

  if (family === "must-see") {
    if (highlights.length === 0) return null;
    return (
      <StreamModule
        family={family}
        title={FEED_PORTAL_HIGHLIGHTS_TITLE}
        ctaHref="/sortir"
        ctaLabel={FEED_PORTAL_HIGHLIGHTS_CTA}
        layout={layout}
      >
        <ul className={isDesktop ? "divide-y divide-neutral-100" : "space-y-4"}>
          {highlights.map((event) => (
            <li key={event.id}>
              <Link
                href={event.href}
                className={`group flex gap-3 transition ${
                  isDesktop
                    ? "-mx-1 rounded-xl px-1 py-3 hover:bg-neutral-50"
                    : "rounded-xl hover:bg-neutral-50"
                }`}
              >
                <div
                  className={`shrink-0 overflow-hidden rounded-xl bg-neutral-100 ${
                    isDesktop ? "h-[4.5rem] w-[4.5rem]" : "h-16 w-16"
                  }`}
                >
                  {event.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-neutral-400">
                      <Calendar className="h-6 w-6" aria-hidden />
                    </span>
                  )}
                </div>
                <span className="min-w-0 flex-1">
                  <span
                    className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${highlightBadgeClass(event.timeBadgeTone)}`}
                  >
                    {event.timeBadge}
                  </span>
                  <span className="mt-1.5 block text-sm font-semibold leading-snug text-neutral-900 group-hover:text-yunicity-primary">
                    {event.title}
                  </span>
                  <span className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                    <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                    <span className="truncate">{event.locationLine}</span>
                  </span>
                </span>
                {isDesktop ? (
                  <ChevronRight
                    className="mt-5 h-4 w-4 shrink-0 text-neutral-300 transition group-hover:text-yunicity-primary"
                    aria-hidden
                  />
                ) : null}
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
      <StreamModule
        family={family}
        title={HOME_PRIVILEGE_TITLE}
        ctaHref="/passport"
        ctaLabel="Voir l'avantage"
        layout={layout}
      >
        <Link
          href="/passport"
          className={`group flex gap-3 transition ${
            isDesktop ? "rounded-xl p-1 hover:bg-neutral-50" : "rounded-xl hover:bg-neutral-50"
          }`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-yunicity-primary-soft text-sm font-bold text-yunicity-primary">
            {highlightOffer.partner.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-medium text-yunicity-primary">{highlightOffer.partner.name}</span>
            <span className="block font-semibold text-neutral-900 group-hover:text-yunicity-primary">
              {highlightOffer.title}
            </span>
            {highlightOffer.description ? (
              <span className="mt-1 block line-clamp-2 text-sm text-neutral-600">{highlightOffer.description}</span>
            ) : null}
          </span>
          {isDesktop ? (
            <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-neutral-300 group-hover:text-yunicity-primary" aria-hidden />
          ) : null}
        </Link>
      </StreamModule>
    );
  }

  if (family === "tribes") {
    if (tribes.length === 0) return null;
    return (
      <StreamModule
        family={family}
        title={FEED_PORTAL_TRIBES_TITLE}
        ctaHref="/tribes"
        ctaLabel={FEED_PORTAL_TRIBES_CTA}
        layout={layout}
      >
        <ul className={isDesktop ? "divide-y divide-neutral-100" : "space-y-3"}>
          {tribes.map((tribe) => (
            <li key={tribe.id}>
              <Link
                href={tribe.href}
                className={`group flex items-center gap-3 transition ${
                  isDesktop
                    ? "-mx-1 rounded-xl px-1 py-2.5 hover:bg-neutral-50"
                    : "rounded-xl px-1 py-1 hover:bg-neutral-50"
                }`}
              >
                <div
                  className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-yunicity-primary-soft text-sm font-bold text-yunicity-primary ${
                    tribe.hasActivity ? "ring-2 ring-yunicity-primary ring-offset-1" : ""
                  }`}
                >
                  {tribe.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={tribe.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    tribe.name.slice(0, 1).toUpperCase()
                  )}
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-neutral-900 group-hover:text-yunicity-primary">
                    {tribe.name}
                  </span>
                  <span className="block truncate text-xs text-neutral-500">{tribe.subtitle}</span>
                </span>
                {isDesktop ? (
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-neutral-300 transition group-hover:text-yunicity-primary"
                    aria-hidden
                  />
                ) : null}
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
      layout={layout}
    >
      <ul className={isDesktop ? "divide-y divide-neutral-100" : "space-y-3"}>
        {trends.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={`group flex items-center gap-3 transition ${
                isDesktop
                  ? "-mx-1 rounded-xl px-1 py-2.5 hover:bg-neutral-50"
                  : "rounded-xl px-1 py-1 hover:bg-neutral-50"
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF]">
                <TrendIcon icon={item.icon} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-neutral-900 group-hover:text-yunicity-primary">
                  {item.label}
                </span>
                <span className="block truncate text-xs text-neutral-500">{item.metaLine}</span>
              </span>
              {isDesktop ? (
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-neutral-300 transition group-hover:text-yunicity-primary"
                  aria-hidden
                />
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </StreamModule>
  );
}
