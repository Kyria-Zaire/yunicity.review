"use client";

import type { PartnerPublic } from "@yunicity/types";
import { CulturalImage } from "@/components/culture/cultural-image";
import {
  PLACES_PARTNERS_CTA,
  SEARCH_PARTNERS_SECTION_CTA,
  SEARCH_PARTNERS_SECTION_TITLE,
  buildPartnerPlaceCards,
} from "@yunicity/utils";
import Link from "next/link";

type SearchExplorerPartnersStripProps = {
  partners: PartnerPublic[];
  city: string;
};

export function SearchExplorerPartnersStrip({ partners, city }: SearchExplorerPartnersStripProps) {
  const cards = buildPartnerPlaceCards(partners).slice(0, 3);
  if (cards.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-lg font-bold text-neutral-900">{SEARCH_PARTNERS_SECTION_TITLE}</h2>
        <Link
          href={`/places?city=${encodeURIComponent(city)}&filter=partners#places-partners`}
          className="text-sm font-semibold text-yunicity-primary hover:underline"
        >
          {SEARCH_PARTNERS_SECTION_CTA}
        </Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <li key={card.id}>
            <Link
              href={card.href}
              className="flex items-center gap-3 rounded-xl border border-neutral-200/90 bg-white p-3 shadow-sm transition hover:border-yunicity-primary/25"
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                <CulturalImage
                  src={card.imageUrl}
                  alt=""
                  placeName={card.name}
                  className="h-full w-full"
                  sizes="48px"
                  overlay={false}
                  showFallbackCaption={false}
                />
              </div>
              <div className="min-w-0">
                <p className="line-clamp-1 text-sm font-bold text-neutral-900">{card.name}</p>
                <p className="text-xs text-yunicity-primary">{PLACES_PARTNERS_CTA}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
