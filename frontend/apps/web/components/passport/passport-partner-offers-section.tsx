"use client";

import { CulturalImage } from "@/components/culture/cultural-image";
import type { PartnerOfferPublic } from "@yunicity/types";
import {
  PASSPORT_OFFERS_CTA_CONDITIONS,
  PASSPORT_OFFERS_CTA_PARTNER,
  PASSPORT_OFFERS_EMPTY,
  PASSPORT_OFFERS_SECTION_SUBTITLE,
  PASSPORT_OFFERS_SECTION_TITLE,
  buildPartnerOfferHref,
  formatPartnerOfferValidity,
  partnerDisplayCategory,
  partnerOfferBadgeLabel,
  partnerOfferValueLabel,
  partnerPublicHref,
  resolvePartnerImage,
} from "@yunicity/utils";
import Link from "next/link";

type PassportPartnerOffersSectionProps = {
  offers: PartnerOfferPublic[];
};

export function PassportPartnerOffersSection({ offers }: PassportPartnerOffersSectionProps) {
  if (offers.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-8 text-center">
        <p className="text-sm text-neutral-600">{PASSPORT_OFFERS_EMPTY}</p>
      </section>
    );
  }

  return (
    <section
      id="passport-partner-offers"
      className="scroll-mt-28 rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-sm"
    >
      <h2 className="text-lg font-bold text-neutral-900">{PASSPORT_OFFERS_SECTION_TITLE}</h2>
      <p className="mt-1 text-sm text-neutral-600">{PASSPORT_OFFERS_SECTION_SUBTITLE}</p>
      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {offers.map((offer) => (
          <li key={offer.id}>
            <article className="flex h-full flex-col rounded-2xl border border-neutral-100 bg-neutral-50/60 p-4">
              <div className="flex gap-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-200">
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
                    className="h-full w-full"
                    sizes="56px"
                    overlay={false}
                    showFallbackCaption={false}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="rounded-full bg-yunicity-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-yunicity-primary">
                    {partnerOfferBadgeLabel(offer)}
                  </span>
                  <p className="mt-1 line-clamp-2 text-sm font-bold text-neutral-900">{offer.title}</p>
                  <p className="text-xs font-medium text-neutral-700">
                    {partnerOfferValueLabel(offer)}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {offer.partner.name} · {partnerDisplayCategory(offer.partner)}
                  </p>
                </div>
              </div>
              {offer.conditions ? (
                <p className="mt-3 line-clamp-2 text-xs text-neutral-600">{offer.conditions}</p>
              ) : null}
              {formatPartnerOfferValidity(offer) ? (
                <p className="mt-1 text-[11px] text-neutral-400">
                  {formatPartnerOfferValidity(offer)}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={buildPartnerOfferHref(offer)}
                  className="inline-flex rounded-full bg-yunicity-primary px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                >
                  {PASSPORT_OFFERS_CTA_CONDITIONS}
                </Link>
                <Link
                  href={partnerPublicHref(offer.partner)}
                  className="inline-flex rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:border-yunicity-primary/30"
                >
                  {PASSPORT_OFFERS_CTA_PARTNER}
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
