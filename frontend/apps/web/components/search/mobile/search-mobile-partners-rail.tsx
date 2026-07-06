"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PartnerPublic } from "@yunicity/types";
import {
  PLACES_PARTNERS_CTA,
  SEARCH_MOBILE_VIEW_ALL,
  SEARCH_PARTNERS_SECTION_TITLE,
  buildPartnerPlaceCards,
} from "@yunicity/utils";
import Link from "next/link";

type SearchMobilePartnersRailProps = {
  partners: PartnerPublic[];
  city: string;
};

/** Partenaires locaux — rail horizontal mobile (données desktop). */
export function SearchMobilePartnersRail({ partners, city }: SearchMobilePartnersRailProps) {
  const cards = buildPartnerPlaceCards(partners).slice(0, 6);
  if (cards.length === 0) return null;

  return (
    <section className="space-y-3" aria-label={SEARCH_PARTNERS_SECTION_TITLE}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-neutral-900">{SEARCH_PARTNERS_SECTION_TITLE}</h2>
        <Link
          href={`/places?city=${encodeURIComponent(city)}&filter=partners#places-partners`}
          className="text-sm font-semibold text-yunicity-primary"
        >
          {SEARCH_MOBILE_VIEW_ALL} →
        </Link>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex min-w-max gap-3">
          {cards.map((card) => (
            <li key={card.id} className="w-[11rem] shrink-0">
              <Link
                href={card.href}
                className="flex h-full items-center gap-2.5 rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm"
              >
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                  <CulturalImage
                    src={card.imageUrl}
                    alt=""
                    placeName={card.name}
                    className="h-full w-full"
                    sizes="44px"
                    overlay={false}
                    showFallbackCaption={false}
                  />
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-bold text-neutral-900">{card.name}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-yunicity-primary">
                    {PLACES_PARTNERS_CTA}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
