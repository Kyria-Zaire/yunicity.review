"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { NeighborhoodDetailMobileFeedItem, NeighborhoodDetailMobileNowItem } from "@yunicity/utils";
import {
  NEIGHBORHOOD_DETAIL_MOBILE_CONTRIBUTE_BODY,
  NEIGHBORHOOD_DETAIL_MOBILE_CONTRIBUTE_CTA,
  NEIGHBORHOOD_DETAIL_MOBILE_FEED_EMPTY,
  NEIGHBORHOOD_DETAIL_MOBILE_FEED_TITLE,
  NEIGHBORHOOD_DETAIL_MOBILE_LOCAL_LIFE_COUNCIL,
  NEIGHBORHOOD_DETAIL_MOBILE_LOCAL_LIFE_LIBRARY,
  NEIGHBORHOOD_DETAIL_MOBILE_LOCAL_LIFE_SERVICES,
  NEIGHBORHOOD_DETAIL_MOBILE_LOCAL_LIFE_TITLE,
  NEIGHBORHOOD_DETAIL_MOBILE_NOW_TITLE,
  NEIGHBORHOOD_DETAIL_MOBILE_SEE_AGENDA,
  NEIGHBORHOOD_DETAIL_MOBILE_VIEW_ALL_FEED,
  NEIGHBORHOOD_DETAIL_MOBILE_VIEW_POST,
} from "@yunicity/utils";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronRight,
  Lightbulb,
  Phone,
} from "lucide-react";
import Link from "next/link";

type NeighborhoodDetailMobileBottomProps = {
  neighborhoodName: string;
  nowItems: NeighborhoodDetailMobileNowItem[];
  feedItems: NeighborhoodDetailMobileFeedItem[];
  agendaHref: string;
  feedHref: string;
  mapHref: string;
  onContribute: () => void;
};

export function NeighborhoodDetailMobileBottom({
  neighborhoodName,
  nowItems,
  feedItems,
  agendaHref,
  feedHref,
  mapHref,
  onContribute,
}: NeighborhoodDetailMobileBottomProps) {
  const localLifeLinks = [
    {
      id: "council",
      label: NEIGHBORHOOD_DETAIL_MOBILE_LOCAL_LIFE_COUNCIL,
      href: mapHref,
      icon: Building2,
    },
    {
      id: "library",
      label: `${NEIGHBORHOOD_DETAIL_MOBILE_LOCAL_LIFE_LIBRARY} ${neighborhoodName}`,
      href: "#nd-mobile-places",
      icon: BookOpen,
    },
    {
      id: "services",
      label: NEIGHBORHOOD_DETAIL_MOBILE_LOCAL_LIFE_SERVICES,
      href: "#nd-mobile-practical",
      icon: Phone,
    },
  ];

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-950">{NEIGHBORHOOD_DETAIL_MOBILE_NOW_TITLE}</h2>
        {nowItems.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">Rien de programmé pour l’instant.</p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-100">
            {nowItems.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className="flex items-center gap-2.5 py-2.5">
                  <CalendarDays className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-neutral-900">{item.title}</span>
                    <span className="block text-xs text-neutral-500">{item.whenLabel}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={agendaHref}
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary"
        >
          {NEIGHBORHOOD_DETAIL_MOBILE_SEE_AGENDA}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </section>

      <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-neutral-950">
          {NEIGHBORHOOD_DETAIL_MOBILE_LOCAL_LIFE_TITLE}
        </h2>
        <ul className="mt-2 divide-y divide-neutral-100">
          {localLifeLinks.map((link) => {
            const Icon = link.icon;
            return (
              <li key={link.id}>
                <Link
                  href={link.href}
                  className="flex items-center gap-2.5 py-2.5 text-sm font-medium text-neutral-800"
                >
                  <Icon className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                  <span className="min-w-0 flex-1">{link.label}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        id="nd-mobile-feed"
        className="neighborhood-detail-section rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm"
      >
        <h2 className="text-sm font-bold text-neutral-950">{NEIGHBORHOOD_DETAIL_MOBILE_FEED_TITLE}</h2>
        {feedItems.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">{NEIGHBORHOOD_DETAIL_MOBILE_FEED_EMPTY}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {feedItems.slice(0, 2).map((item) => (
              <li key={item.id}>
                <article className="flex gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    <CulturalImage
                      src={item.imageUrl}
                      alt=""
                      placeName="Publication"
                      sizes="56px"
                      className="absolute inset-0 h-full w-full"
                      imageClassName="h-full w-full object-cover"
                      dimOverlay={false}
                      showFallbackCaption={false}
                      fallbackLabel="Fil"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="line-clamp-3 text-xs leading-relaxed text-neutral-800">{item.body}</p>
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-yunicity-primary"
                    >
                      {NEIGHBORHOOD_DETAIL_MOBILE_VIEW_POST}
                      <ArrowRight className="h-3 w-3" aria-hidden />
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
        <Link
          href={feedHref}
          className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-yunicity-primary/35 text-sm font-semibold text-yunicity-primary"
        >
          {NEIGHBORHOOD_DETAIL_MOBILE_VIEW_ALL_FEED}
        </Link>
      </section>

      <section className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
        <p className="text-sm text-neutral-700">{NEIGHBORHOOD_DETAIL_MOBILE_CONTRIBUTE_BODY}</p>
        <button
          type="button"
          onClick={onContribute}
          className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-800"
        >
          <Lightbulb className="h-4 w-4 text-amber-500" aria-hidden />
          {NEIGHBORHOOD_DETAIL_MOBILE_CONTRIBUTE_CTA}
        </button>
      </section>
    </div>
  );
}
