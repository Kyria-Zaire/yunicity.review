"use client";

import type { PartnerOfferPublic } from "@yunicity/types";
import type {
  FeedHighlightEvent,
  FeedTrendItem,
  FeedTribeActivityItem,
} from "@yunicity/utils";
import {
  FEED_PORTAL_HIGHLIGHTS_CTA,
  FEED_PORTAL_HIGHLIGHTS_EMPTY,
  FEED_PORTAL_HIGHLIGHTS_TITLE,
  FEED_PORTAL_TRIBES_CTA,
  FEED_PORTAL_TRIBES_EMPTY,
  FEED_PORTAL_TRIBES_TITLE,
  FEED_PORTAL_TRENDS_CTA,
  FEED_PORTAL_TRENDS_DISCLAIMER,
  FEED_PORTAL_TRENDS_EMPTY,
  HOME_PRIVILEGE_TITLE,
} from "@yunicity/utils";
import { Calendar, Home, MapPin, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type FeedRightRailProps = {
  city: string;
  tribes: FeedTribeActivityItem[];
  highlights: FeedHighlightEvent[];
  trends: FeedTrendItem[];
  highlightOffer?: PartnerOfferPublic | null;
  loading?: boolean;
};

function RailSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-36 animate-pulse rounded-2xl bg-neutral-100" />
      ))}
    </div>
  );
}

function TrendIcon({ icon }: { icon: FeedTrendItem["icon"] }) {
  const className = "h-4 w-4 text-yunicity-primary";
  if (icon === "event") return <Calendar className={className} aria-hidden />;
  if (icon === "place") return <MapPin className={className} aria-hidden />;
  if (icon === "neighborhood") return <Home className={className} aria-hidden />;
  return <Users className={className} aria-hidden />;
}

function SectionCard({
  title,
  ctaHref,
  ctaLabel,
  tile,
  children,
}: {
  title: string;
  ctaHref: string;
  ctaLabel: string;
  /** Identité stable de tuile medium (C3-FEED-M9) — hors desktop rail. */
  tile: "tribes" | "must-see" | "local-now";
  children: ReactNode;
}) {
  return (
    <section
      data-feed-medium-surface="primary"
      data-feed-medium-context-tile={tile}
      className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-neutral-900">{title}</h2>
        <Link href={ctaHref} className="text-xs font-semibold text-yunicity-primary hover:underline">
          {ctaLabel}
        </Link>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function FeedRightRail({
  city,
  tribes,
  highlights,
  trends,
  highlightOffer,
  loading,
}: FeedRightRailProps) {
  if (loading) return <RailSkeleton />;

  const trendsTitle = `En ce moment à ${city.trim() || "Reims"}`;

  return (
    <div className="space-y-4">
      {highlightOffer ? (
        <section
          data-feed-medium-surface="primary"
          data-feed-medium-context-tile="privilege"
          className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
        >
          <h2 className="text-sm font-bold text-neutral-900">{HOME_PRIVILEGE_TITLE}</h2>
          <div className="mt-3 flex gap-3">
            {highlightOffer.partner.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={highlightOffer.partner.logo_url}
                alt=""
                className="h-10 w-10 shrink-0 rounded-full border border-neutral-100 object-cover"
              />
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yunicity-primary-soft text-sm font-bold text-yunicity-primary">
                {highlightOffer.partner.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-yunicity-primary">{highlightOffer.partner.name}</p>
              <p className="font-semibold text-neutral-900">{highlightOffer.title}</p>
              {highlightOffer.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{highlightOffer.description}</p>
              ) : null}
            </div>
          </div>
          <Link
            href="/passport"
            className="mt-3 inline-flex text-xs font-semibold text-yunicity-primary hover:underline"
          >
            Voir l&apos;avantage
          </Link>
        </section>
      ) : null}

      <SectionCard
        tile="tribes"
        title={FEED_PORTAL_TRIBES_TITLE}
        ctaHref="/tribes"
        ctaLabel={FEED_PORTAL_TRIBES_CTA}
      >        {tribes.length === 0 ? (
          <p className="text-sm text-neutral-500">{FEED_PORTAL_TRIBES_EMPTY}</p>
        ) : (
          <ul className="space-y-3">
            {tribes.map((tribe) => (
              <li key={tribe.id}>
                <Link
                  href={tribe.href}
                  className="flex items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-neutral-50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yunicity-primary-soft text-sm font-bold text-yunicity-primary">
                    {tribe.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-neutral-900">
                      {tribe.name}
                    </span>
                    <span className="block truncate text-xs text-neutral-500">{tribe.subtitle}</span>
                  </span>
                  {tribe.hasActivity ? (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-yunicity-primary"
                      aria-label="Activité récente"
                    />
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        tile="must-see"
        title={FEED_PORTAL_HIGHLIGHTS_TITLE}
        ctaHref="/sortir"
        ctaLabel={FEED_PORTAL_HIGHLIGHTS_CTA}
      >
        {highlights.length === 0 ? (
          <p className="text-sm text-neutral-500">{FEED_PORTAL_HIGHLIGHTS_EMPTY}</p>
        ) : (
          <ul className="space-y-4">
            {highlights.map((event) => (
              <li key={event.id}>
                <Link href={event.href} className="flex gap-3 rounded-xl transition hover:bg-neutral-50">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                    {event.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={event.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-neutral-400">
                        <Calendar className="h-6 w-6" aria-hidden />
                      </span>
                    )}
                  </div>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        event.timeBadgeTone === "today"
                          ? "bg-pink-100 text-pink-700"
                          : event.timeBadgeTone === "tomorrow"
                            ? "bg-neutral-100 text-neutral-600"
                            : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
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
        )}
      </SectionCard>

      <SectionCard tile="local-now" title={trendsTitle} ctaHref="/map" ctaLabel={FEED_PORTAL_TRENDS_CTA}>
        {trends.length === 0 ? (
          <p className="text-sm text-neutral-500">{FEED_PORTAL_TRENDS_EMPTY}</p>
        ) : (
          <>
            <ul className="space-y-3">
              {trends.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-neutral-50"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EEF0FF]">
                      <TrendIcon icon={item.icon} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-neutral-900">
                        {item.label}
                      </span>
                      <span className="block truncate text-xs text-neutral-500">{item.metaLine}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] leading-relaxed text-neutral-400">
              {FEED_PORTAL_TRENDS_DISCLAIMER}
            </p>
          </>
        )}
      </SectionCard>
    </div>
  );
}
