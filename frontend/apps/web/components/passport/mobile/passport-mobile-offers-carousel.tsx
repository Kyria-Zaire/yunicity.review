"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PartnerOfferPublic } from "@yunicity/types";
import {
  PASSPORT_MOBILE_OFFERS_EMPTY,
  PASSPORT_MOBILE_OFFERS_TITLE,
  PASSPORT_MOBILE_OFFERS_VIEW_ALL,
  buildPartnerOfferHref,
  formatPartnerOfferDaysRemainingLabel,
  partnerDisplayCategory,
  partnerOfferBadgeLabel,
  partnerOfferValueLabel,
  resolvePartnerImage,
  resolvePartnerOfferCategoryTone,
} from "@yunicity/utils";
import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";

type PassportMobileOffersCarouselProps = {
  offers: PartnerOfferPublic[];
};

export function PassportMobileOffersCarousel({ offers }: PassportMobileOffersCarouselProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <h2 className="text-base font-bold text-neutral-900">{PASSPORT_MOBILE_OFFERS_TITLE}</h2>
        {offers.length > 0 ? (
          <Link
            href="/sortir"
            className="inline-flex items-center gap-0.5 text-sm font-semibold text-yunicity-primary"
          >
            {PASSPORT_MOBILE_OFFERS_VIEW_ALL}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
      </div>

      {offers.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-center text-sm text-neutral-600">
          {PASSPORT_MOBILE_OFFERS_EMPTY}
        </p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {offers.map((offer) => {
            const validity = formatPartnerOfferDaysRemainingLabel(offer);
            const categoryTone = resolvePartnerOfferCategoryTone(
              offer.partner.category ?? offer.offer_type,
            );

            return (
              <article
                key={offer.id}
                className="flex w-[11.5rem] shrink-0 flex-col overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-sm"
              >
                <div className="relative h-28 bg-neutral-100">
                  <CulturalImage
                    src={resolvePartnerImage(
                      {
                        cover_image_url: offer.partner.cover_image_url,
                        logo_url: offer.partner.logo_url,
                        category: offer.partner.category,
                      },
                      "card",
                    )}
                    alt=""
                    placeName={offer.partner.name}
                    className="h-full w-full object-cover"
                    sizes="184px"
                    overlay={false}
                    showFallbackCaption={false}
                  />
                  <span className="absolute left-2 top-2 rounded-lg bg-yunicity-primary px-2 py-0.5 text-[11px] font-bold text-white shadow">
                    {partnerOfferBadgeLabel(offer)}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-3">
                  <span
                    className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryTone}`}
                  >
                    {partnerDisplayCategory(offer.partner)}
                  </span>
                  <h3 className="mt-1.5 line-clamp-1 text-sm font-bold text-neutral-900">
                    {offer.partner.name}
                  </h3>
                  <p className="mt-0.5 line-clamp-2 text-xs text-neutral-600">
                    {partnerOfferValueLabel(offer)}
                  </p>

                  <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <span className="text-[11px] text-neutral-500">{validity ?? "—"}</span>
                    <Link
                      href={buildPartnerOfferHref(offer)}
                      aria-label={`Voir l'offre ${offer.partner.name}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-yunicity-primary text-white transition hover:opacity-90"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
