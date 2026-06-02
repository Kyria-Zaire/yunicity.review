"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { TribesMeetupCard } from "@yunicity/utils";
import {
  TRIBES_PORTAL_MEETUPS_CTA,
  TRIBES_PORTAL_MEETUPS_EMPTY,
  TRIBES_PORTAL_MEETUPS_TITLE,
} from "@yunicity/utils";
import { Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const CARD_WIDTH = 260;
const CARD_GAP = 16;

type TribesMeetupsRailProps = {
  meetups: TribesMeetupCard[];
  city: string;
};

export function TribesMeetupsRail({ meetups, city }: TribesMeetupsRailProps) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);

  const updateScrollState = useCallback(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const maxScroll = node.scrollWidth - node.clientWidth;
    setCanScrollPrev(node.scrollLeft > 8);
    setCanScrollNext(node.scrollLeft < maxScroll - 8);
  }, []);

  useEffect(() => {
    updateScrollState();
  }, [meetups, updateScrollState]);

  return (
    <section
      id="tribes-meetups"
      className="min-w-0 scroll-mt-24 space-y-4"
      aria-labelledby="tribes-meetups-title"
    >
      <div className="flex items-end justify-between gap-3">
        <h2 id="tribes-meetups-title" className="text-xl font-bold text-neutral-900">
          {TRIBES_PORTAL_MEETUPS_TITLE}
        </h2>
        <Link
          href={`/events?city=${encodeURIComponent(city)}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {TRIBES_PORTAL_MEETUPS_CTA}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {meetups.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-8 text-center text-sm text-neutral-600">
          {TRIBES_PORTAL_MEETUPS_EMPTY}
        </p>
      ) : (
        <div className="relative min-w-0">
          {canScrollPrev ? (
            <button
              type="button"
              aria-label="Rencontres précédentes"
              onClick={() =>
                scrollerRef.current?.scrollBy({
                  left: -(CARD_WIDTH + CARD_GAP) * 2,
                  behavior: "smooth",
                })
              }
              className="absolute -left-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-neutral-200 bg-white p-2 shadow-md transition hover:bg-neutral-50 sm:inline-flex"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
          ) : null}

          <ul
            ref={scrollerRef}
            onScroll={updateScrollState}
            className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {meetups.map((meetup) => (
              <li key={meetup.id} className="w-[260px] shrink-0">
                <Link
                  href={meetup.href}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                    <CulturalImage
                      src={meetup.imageUrl}
                      alt={meetup.title}
                      placeName={meetup.title}
                      className="absolute inset-0"
                      sizes="260px"
                      showFallbackCaption={false}
                      overlay={false}
                    />
                    <div className="absolute left-3 top-3 overflow-hidden rounded-xl bg-violet-600 text-center text-white shadow-sm">
                      <p className="px-2.5 pt-1.5 text-[10px] font-bold uppercase tracking-wide">
                        {meetup.dateBadgeDay}
                      </p>
                      <p className="px-2.5 text-xl font-bold leading-none">{meetup.dateBadgeDate}</p>
                      <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase">
                        {meetup.dateBadgeMonth}
                      </p>
                    </div>
                    <span className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-500 shadow-sm">
                      <Bookmark className="h-4 w-4" aria-hidden />
                      <span className="sr-only">Enregistrer — bientôt</span>
                    </span>
                    {meetup.timeRange ? (
                      <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-2 pt-8 text-xs font-medium text-white">
                        {meetup.timeRange}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="line-clamp-2 text-base font-bold leading-snug text-neutral-900">
                      {meetup.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{meetup.locationLabel}</p>
                    {meetup.tribeName ? (
                      <p className="mt-auto pt-3 text-xs font-medium text-yunicity-primary">
                        {meetup.tribeName}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {canScrollNext ? (
            <button
              type="button"
              aria-label="Rencontres suivantes"
              onClick={() =>
                scrollerRef.current?.scrollBy({
                  left: (CARD_WIDTH + CARD_GAP) * 2,
                  behavior: "smooth",
                })
              }
              className="absolute -right-1 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-neutral-200 bg-white p-2 shadow-md transition hover:bg-neutral-50 sm:inline-flex"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
