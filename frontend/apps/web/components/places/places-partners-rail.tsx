"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PartnerPlaceCard } from "@yunicity/utils";
import {
  PLACES_PARTNERS_BADGE,
  PLACES_PARTNERS_CTA,
  PLACES_PARTNERS_SECTION_SUBTITLE,
  PLACES_PARTNERS_SECTION_TITLE,
} from "@yunicity/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

type PlacesPartnersRailProps = {
  cards: PartnerPlaceCard[];
  city: string;
};

export function PlacesPartnersRail({ cards, city }: PlacesPartnersRailProps) {
  if (cards.length === 0) return null;

  return (
    <section id="places-partners" className="scroll-mt-24 space-y-4" aria-labelledby="places-partners-title">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="places-partners-title" className="text-xl font-bold text-neutral-900">
            {PLACES_PARTNERS_SECTION_TITLE}
          </h2>
          <p className="mt-1 text-sm text-neutral-600">{PLACES_PARTNERS_SECTION_SUBTITLE}</p>
        </div>
        <Link
          href={`/places?city=${encodeURIComponent(city)}&filter=partners#places-partners`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-yunicity-primary hover:underline"
        >
          Tout voir
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <li key={card.id}>
            <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm transition hover:border-yunicity-primary/25 hover:shadow-md">
              <Link href={card.href} className="relative block aspect-[16/10] overflow-hidden bg-neutral-100">
                <CulturalImage
                  src={card.imageUrl}
                  alt={card.name}
                  placeName={card.name}
                  className="h-full w-full"
                  sizes="(max-width: 768px) 100vw, 320px"
                  showFallbackCaption={false}
                  overlay={false}
                />
                <span className="absolute left-3 top-3 rounded-full bg-yunicity-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  {PLACES_PARTNERS_BADGE}
                </span>
              </Link>
              <div className="flex flex-1 flex-col p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {card.categoryLabel}
                </p>
                <h3 className="mt-1 line-clamp-1 text-base font-bold text-neutral-900">{card.name}</h3>
                <p className="mt-1 text-xs text-neutral-500">{card.badgeLabel}</p>
                <Link
                  href={card.href}
                  className="mt-3 inline-flex text-sm font-semibold text-yunicity-primary hover:underline"
                >
                  {PLACES_PARTNERS_CTA}
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
